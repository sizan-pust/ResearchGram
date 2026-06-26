"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ResearchersUI, {
  type ConnectionStatus,
  type ResearcherProfile,
} from "./UI";

export default function ResearchersClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [profiles, setProfiles] = useState<ResearcherProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [connectionStatusMap, setConnectionStatusMap] = useState<
    Record<string, ConnectionStatus>
  >({});
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const loadConnectionStatuses = async (
    currentUserId: string,
    researcherProfiles: ResearcherProfile[],
  ) => {
    const otherUserIds = researcherProfiles
      .map((profile) => profile.id)
      .filter((id) => id !== currentUserId);

    const statusMap: Record<string, ConnectionStatus> = {};

    researcherProfiles.forEach((profile) => {
      statusMap[profile.id] = profile.id === currentUserId ? "self" : "none";
    });

    if (otherUserIds.length === 0) {
      setConnectionStatusMap(statusMap);
      return;
    }

    const { data: connections, error: connectionError } = await supabase
      .from("user_connections")
      .select("user_one_id, user_two_id")
      .or(`user_one_id.eq.${currentUserId},user_two_id.eq.${currentUserId}`);

    if (connectionError) {
      console.log("FETCH CONNECTIONS ERROR:", connectionError);
    }

    (connections || []).forEach((connection: any) => {
      const otherId =
        connection.user_one_id === currentUserId
          ? connection.user_two_id
          : connection.user_one_id;

      statusMap[otherId] = "connected";
    });

    const { data: requests, error: requestError } = await supabase
      .from("profile_requests")
      .select("requester_id, receiver_id, status")
      .eq("request_type", "connection")
      .eq("status", "pending")
      .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (requestError) {
      console.log("FETCH PROFILE REQUESTS ERROR:", requestError);
    }

    (requests || []).forEach((request: any) => {
      if (request.requester_id === currentUserId) {
        statusMap[request.receiver_id] = "requested";
      }

      if (request.receiver_id === currentUserId) {
        statusMap[request.requester_id] = "received";
      }
    });

    setConnectionStatusMap(statusMap);
  };

  useEffect(() => {
    const loadResearchers = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/auth/login");
        return;
      }

      setCurrentUserId(authData.user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, department, skills, interests, bio, profile_pic_url",
        )
        .order("full_name", { ascending: true });

      if (error) {
        console.log("FETCH RESEARCHERS ERROR:", error);
        setProfiles([]);
        setLoading(false);
        return;
      }

      const loadedProfiles = (data || []) as ResearcherProfile[];

      setProfiles(loadedProfiles);
      await loadConnectionStatuses(authData.user.id, loadedProfiles);

      setLoading(false);
    };

    loadResearchers();
  }, [router]);

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return profiles;

    return profiles.filter((profile) => {
      const searchableText = [
        profile.full_name,
        profile.email,
        profile.department,
        profile.skills,
        profile.interests,
        profile.bio,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [profiles, searchQuery]);

  const handleSendConnectionRequest = async (receiverId: string) => {
    if (!currentUserId) {
      alert("You must be logged in to connect.");
      return;
    }

    if (receiverId === currentUserId) {
      alert("You cannot connect with yourself.");
      return;
    }

    setConnectingId(receiverId);

    const { error } = await supabase.from("profile_requests").insert({
      requester_id: currentUserId,
      receiver_id: receiverId,
      request_type: "connection",
      message: "I would like to connect with you on ResearchGram.",
      status: "pending",
    });

    if (error) {
      console.log("SEND CONNECTION REQUEST ERROR:", error);
      alert(error.message);
      setConnectingId(null);
      return;
    }

    setConnectionStatusMap((prev) => ({
      ...prev,
      [receiverId]: "requested",
    }));

    setConnectingId(null);
  };

  return (
    <ResearchersUI
      loading={loading}
      currentUserId={currentUserId}
      searchQuery={searchQuery}
      filteredProfiles={filteredProfiles}
      connectionStatusMap={connectionStatusMap}
      connectingId={connectingId}
      setSearchQuery={setSearchQuery}
      handleSendConnectionRequest={handleSendConnectionRequest}
      handleGoToProfile={() => router.push("/profile")}
      handleGoToResearcher={(profileId) => router.push(`/researchers/${profileId}`)}
    />
  );
}