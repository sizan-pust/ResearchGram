"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import RequestsUI, {
  type ContentPost,
  type Profile,
  type UnifiedRequestView,
} from "./UI";

function sortByNewest(requests: UnifiedRequestView[]) {
  return [...requests].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

export default function RequestsClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openingConversationId, setOpeningConversationId] = useState<
    string | null
  >(null);

  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  const [receivedRequests, setReceivedRequests] = useState<
    UnifiedRequestView[]
  >([]);
  const [sentRequests, setSentRequests] = useState<UnifiedRequestView[]>([]);

  const loadRequests = async () => {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push("/auth/login");
      return;
    }

    const currentUserId = authData.user.id;
    setUserId(currentUserId);

    const { data: researchReceivedData, error: researchReceivedError } =
      await supabase
        .from("research_requests")
        .select(
          "id, content_id, requester_id, receiver_id, request_type, message, status, created_at",
        )
        .eq("receiver_id", currentUserId)
        .order("created_at", { ascending: false });

    if (researchReceivedError) {
      console.log(
        "FETCH RECEIVED RESEARCH REQUESTS ERROR:",
        researchReceivedError,
      );
    }

    const { data: researchSentData, error: researchSentError } = await supabase
      .from("research_requests")
      .select(
        "id, content_id, requester_id, receiver_id, request_type, message, status, created_at",
      )
      .eq("requester_id", currentUserId)
      .order("created_at", { ascending: false });

    if (researchSentError) {
      console.log("FETCH SENT RESEARCH REQUESTS ERROR:", researchSentError);
    }

    const { data: profileReceivedData, error: profileReceivedError } =
      await supabase
        .from("profile_requests")
        .select(
          "id, requester_id, receiver_id, request_type, message, status, created_at",
        )
        .eq("receiver_id", currentUserId)
        .order("created_at", { ascending: false });

    if (profileReceivedError) {
      console.log(
        "FETCH RECEIVED PROFILE REQUESTS ERROR:",
        profileReceivedError,
      );
    }

    const { data: profileSentData, error: profileSentError } = await supabase
      .from("profile_requests")
      .select(
        "id, requester_id, receiver_id, request_type, message, status, created_at",
      )
      .eq("requester_id", currentUserId)
      .order("created_at", { ascending: false });

    if (profileSentError) {
      console.log("FETCH SENT PROFILE REQUESTS ERROR:", profileSentError);
    }

    const researchReceived = (researchReceivedData || []) as any[];
    const researchSent = (researchSentData || []) as any[];
    const profileReceived = (profileReceivedData || []) as any[];
    const profileSent = (profileSentData || []) as any[];

    const profileIds = Array.from(
      new Set([
        ...researchReceived.map((item) => item.requester_id),
        ...researchSent.map((item) => item.receiver_id),
        ...profileReceived.map((item) => item.requester_id),
        ...profileSent.map((item) => item.receiver_id),
      ]),
    ).filter(Boolean);

    const contentIds = Array.from(
      new Set([
        ...researchReceived.map((item) => item.content_id),
        ...researchSent.map((item) => item.content_id),
      ]),
    ).filter(Boolean);

    let profileMap: Record<string, Profile> = {};
    let contentMap: Record<string, ContentPost> = {};

    if (profileIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, department, profile_pic_url")
        .in("id", profileIds);

      if (profilesError) {
        console.log("FETCH REQUEST PROFILES ERROR:", profilesError);
      }

      profileMap = (profilesData || []).reduce(
        (acc, profile) => {
          acc[profile.id] = profile as Profile;
          return acc;
        },
        {} as Record<string, Profile>,
      );
    }

    if (contentIds.length > 0) {
      const { data: contentsData, error: contentsError } = await supabase
        .from("contents")
        .select("id, user_id, title, content, post_type, created_at")
        .in("id", contentIds);

      if (contentsError) {
        console.log("FETCH REQUEST POSTS ERROR:", contentsError);
      }

      contentMap = (contentsData || []).reduce(
        (acc, post) => {
          acc[post.id] = post as ContentPost;
          return acc;
        },
        {} as Record<string, ContentPost>,
      );
    }

    const normalizedResearchReceived: UnifiedRequestView[] =
      researchReceived.map((request) => ({
        ...request,
        kind: "research",
        otherProfile: profileMap[request.requester_id] || null,
        contentPost: contentMap[request.content_id] || null,
      }));

    const normalizedResearchSent: UnifiedRequestView[] = researchSent.map(
      (request) => ({
        ...request,
        kind: "research",
        otherProfile: profileMap[request.receiver_id] || null,
        contentPost: contentMap[request.content_id] || null,
      }),
    );

    const normalizedProfileReceived: UnifiedRequestView[] = profileReceived.map(
      (request) => ({
        id: request.id,
        kind: "profile",
        content_id: null,
        requester_id: request.requester_id,
        receiver_id: request.receiver_id,
        request_type: request.request_type || "connection",
        message: request.message,
        status: request.status,
        created_at: request.created_at,
        otherProfile: profileMap[request.requester_id] || null,
        contentPost: null,
      }),
    );

    const normalizedProfileSent: UnifiedRequestView[] = profileSent.map(
      (request) => ({
        id: request.id,
        kind: "profile",
        content_id: null,
        requester_id: request.requester_id,
        receiver_id: request.receiver_id,
        request_type: request.request_type || "connection",
        message: request.message,
        status: request.status,
        created_at: request.created_at,
        otherProfile: profileMap[request.receiver_id] || null,
        contentPost: null,
      }),
    );

    setReceivedRequests(
      sortByNewest([
        ...normalizedResearchReceived,
        ...normalizedProfileReceived,
      ]),
    );

    setSentRequests(
      sortByNewest([...normalizedResearchSent, ...normalizedProfileSent]),
    );

    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const ensureResearchConversation = async (request: UnifiedRequestView) => {
    if (request.kind !== "research") {
      throw new Error(
        "Only research collaboration requests can open messages.",
      );
    }

    if (!request.content_id) {
      throw new Error("This research request has no related content.");
    }

    const { data: existingConversation, error: existingError } = await supabase
      .from("conversations")
      .select("id")
      .eq("request_id", request.id)
      .maybeSingle();

    if (existingError) {
      console.log("CHECK EXISTING CONVERSATION ERROR:", existingError);
    }

    if (existingConversation?.id) {
      return existingConversation.id as string;
    }

    const { data: newConversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        request_id: request.id,
        content_id: request.content_id,
        participant_one_id: request.requester_id,
        participant_two_id: request.receiver_id,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (conversationError || !newConversation) {
      throw new Error(
        conversationError?.message || "Could not create conversation.",
      );
    }

    return newConversation.id as string;
  };

  const handleUpdateStatus = async (
    request: UnifiedRequestView,
    status: "accepted" | "declined",
  ) => {
    setUpdatingId(request.id);

    if (request.kind === "research") {
      const { error } = await supabase
        .from("research_requests")
        .update({ status })
        .eq("id", request.id)
        .eq("receiver_id", userId);

      if (error) {
        console.log("UPDATE RESEARCH REQUEST STATUS ERROR:", error);
        alert(error.message);
        setUpdatingId(null);
        return;
      }

      if (status === "accepted") {
        const { error: conversationError } = await supabase
          .from("conversations")
          .upsert(
            {
              request_id: request.id,
              content_id: request.content_id,
              participant_one_id: request.requester_id,
              participant_two_id: request.receiver_id,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "request_id",
            },
          );

        if (conversationError) {
          console.log("CREATE CONVERSATION ERROR:", conversationError);
          alert(
            `Request accepted, but conversation was not created: ${conversationError.message}`,
          );
          setUpdatingId(null);
          await loadRequests();
          return;
        }
      }
    }

    if (request.kind === "profile") {
      const { error } = await supabase
        .from("profile_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", request.id)
        .eq("receiver_id", userId);

      if (error) {
        console.log("UPDATE PROFILE REQUEST STATUS ERROR:", error);
        alert(error.message);
        setUpdatingId(null);
        return;
      }

      if (status === "accepted") {
        const [userOneId, userTwoId] =
          request.requester_id < request.receiver_id
            ? [request.requester_id, request.receiver_id]
            : [request.receiver_id, request.requester_id];

        const { error: connectionError } = await supabase
          .from("user_connections")
          .upsert(
            {
              user_one_id: userOneId,
              user_two_id: userTwoId,
            },
            {
              onConflict: "user_one_id,user_two_id",
            },
          );

        if (connectionError) {
          console.log("CREATE USER CONNECTION ERROR:", connectionError);
          alert(
            `Request accepted, but connection was not created: ${connectionError.message}`,
          );
          setUpdatingId(null);
          await loadRequests();
          return;
        }
      }
    }

    await loadRequests();
    setUpdatingId(null);
  };

  const handleOpenMessages = async (request: UnifiedRequestView) => {
    if (request.kind !== "research") {
      alert(
        "Messages are available for accepted research collaboration requests.",
      );
      return;
    }

    if (request.status !== "accepted") {
      alert("Accept the request first to start messaging.");
      return;
    }

    setOpeningConversationId(request.id);

    try {
      const conversationId = await ensureResearchConversation(request);
      router.push(`/messages?conversation=${conversationId}`);
    } catch (error: any) {
      console.log("OPEN CONVERSATION ERROR:", error);
      alert(error?.message || "Could not open messages.");
    }

    setOpeningConversationId(null);
  };

  return (
    <RequestsUI
      loading={loading}
      activeTab={activeTab}
      receivedRequests={receivedRequests}
      sentRequests={sentRequests}
      updatingId={updatingId}
      openingConversationId={openingConversationId}
      setActiveTab={setActiveTab}
      handleUpdateStatus={handleUpdateStatus}
      handleOpenMessages={handleOpenMessages}
      handleGoToFeed={() => router.push("/feed")}
      handleGoToProfile={(profileId) => {
        if (!profileId) {
          alert("Profile not found.");
          return;
        }

        router.push(`/researchers/${profileId}`);
      }}
    />
  );
}