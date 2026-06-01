"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  profile_pic_url: string | null;
};

type ContentPost = {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  post_type: string | null;
  created_at: string | null;
};

type ResearchRequest = {
  id: string;
  content_id: string;
  requester_id: string;
  receiver_id: string;
  request_type: string;
  message: string | null;
  status: string;
  created_at: string | null;
};

type RequestView = ResearchRequest & {
  otherProfile: Profile | null;
  contentPost: ContentPost | null;
};

function formatTime(dateString: string | null) {
  if (!dateString) return "Unknown time";

  try {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "Unknown time";
  }
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status || "pending";

  const className =
    normalizedStatus === "accepted"
      ? "bg-green-50 text-green-700 border-green-100"
      : normalizedStatus === "declined"
        ? "bg-red-50 text-red-700 border-red-100"
        : "bg-yellow-50 text-yellow-700 border-yellow-100";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${className}`}
    >
      {normalizedStatus}
    </span>
  );
}

export default function RequestsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  const [receivedRequests, setReceivedRequests] = useState<RequestView[]>([]);
  const [sentRequests, setSentRequests] = useState<RequestView[]>([]);

  const loadRequests = async () => {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push("/auth/login");
      return;
    }

    const currentUserId = authData.user.id;
    setUserId(currentUserId);

    const { data: receivedData, error: receivedError } = await supabase
      .from("research_requests")
      .select(
        "id, content_id, requester_id, receiver_id, request_type, message, status, created_at",
      )
      .eq("receiver_id", currentUserId)
      .order("created_at", { ascending: false });

    if (receivedError) {
      console.log("FETCH RECEIVED REQUESTS ERROR:", receivedError);
    }

    const { data: sentData, error: sentError } = await supabase
      .from("research_requests")
      .select(
        "id, content_id, requester_id, receiver_id, request_type, message, status, created_at",
      )
      .eq("requester_id", currentUserId)
      .order("created_at", { ascending: false });

    if (sentError) {
      console.log("FETCH SENT REQUESTS ERROR:", sentError);
    }

    const received = (receivedData || []) as ResearchRequest[];
    const sent = (sentData || []) as ResearchRequest[];

    const profileIds = Array.from(
      new Set([
        ...received.map((item) => item.requester_id),
        ...sent.map((item) => item.receiver_id),
      ]),
    ).filter(Boolean);

    const contentIds = Array.from(
      new Set([
        ...received.map((item) => item.content_id),
        ...sent.map((item) => item.content_id),
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

    const normalizedReceived: RequestView[] = received.map((request) => ({
      ...request,
      otherProfile: profileMap[request.requester_id] || null,
      contentPost: contentMap[request.content_id] || null,
    }));

    const normalizedSent: RequestView[] = sent.map((request) => ({
      ...request,
      otherProfile: profileMap[request.receiver_id] || null,
      contentPost: contentMap[request.content_id] || null,
    }));

    setReceivedRequests(normalizedReceived);
    setSentRequests(normalizedSent);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleUpdateStatus = async (
    requestId: string,
    status: "accepted" | "declined",
  ) => {
    setUpdatingId(requestId);

    const request = receivedRequests.find((item) => item.id === requestId);

    const { error } = await supabase
      .from("research_requests")
      .update({ status })
      .eq("id", requestId)
      .eq("receiver_id", userId);

    if (error) {
      console.log("UPDATE REQUEST STATUS ERROR:", error);
      alert(error.message);
      setUpdatingId(null);
      return;
    }

    if (status === "accepted" && request) {
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

    await loadRequests();
    setUpdatingId(null);
  };

  const shownRequests =
    activeTab === "received" ? receivedRequests : sentRequests;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">
          Loading collaboration requests...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <AppNav activePage="requests" />

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-950">
                Collaboration Requests
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Manage research collaboration invitations, peer support, and
                project interest.
              </p>
            </div>

            <div className="flex rounded-full bg-gray-100 p-1 text-sm">
              <button
                onClick={() => setActiveTab("received")}
                className={`rounded-full px-4 py-2 font-semibold transition ${
                  activeTab === "received"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                Received ({receivedRequests.length})
              </button>

              <button
                onClick={() => setActiveTab("sent")}
                className={`rounded-full px-4 py-2 font-semibold transition ${
                  activeTab === "sent"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                Sent ({sentRequests.length})
              </button>
            </div>
          </div>

          {shownRequests.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
                🤝
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                No {activeTab} requests yet
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {activeTab === "received"
                  ? "When researchers request collaboration on your posts, they will appear here."
                  : "Requests you send to other researchers will appear here."}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {shownRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                        {request.otherProfile?.profile_pic_url ? (
                          <img
                            src={request.otherProfile.profile_pic_url}
                            alt={
                              request.otherProfile.full_name || "Profile photo"
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-blue-700">
                            {(request.otherProfile?.full_name || "R")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-950">
                          {request.otherProfile?.full_name ||
                            "ResearchGram User"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {request.otherProfile?.department ||
                            "Research community"}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatTime(request.created_at)}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={request.status} />
                  </div>

                  <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Related post
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-gray-950">
                      {request.contentPost?.title || "Untitled research post"}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                      {request.contentPost?.content ||
                        "No post description available."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                        {(
                          request.contentPost?.post_type || "research_update"
                        ).replaceAll("_", " ")}
                      </span>

                      <button
                        onClick={() => router.push("/feed")}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                      >
                        View in Feed
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Request message
                    </p>

                    <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-gray-100 bg-white p-4 text-sm leading-6 text-gray-700">
                      {request.message || "No message provided."}
                    </p>
                  </div>

                  {activeTab === "received" && request.status === "pending" && (
                    <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
                      <button
                        onClick={() =>
                          handleUpdateStatus(request.id, "declined")
                        }
                        disabled={updatingId === request.id}
                        className="rounded-full bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Decline
                      </button>

                      <button
                        onClick={() =>
                          handleUpdateStatus(request.id, "accepted")
                        }
                        disabled={updatingId === request.id}
                        className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingId === request.id ? "Updating..." : "Accept"}
                      </button>
                    </div>
                  )}

                  {activeTab === "sent" && (
                    <div className="mt-5 border-t border-gray-100 pt-4 text-sm text-gray-500">
                      Sent to{" "}
                      <span className="font-semibold text-gray-800">
                        {request.otherProfile?.full_name || "ResearchGram User"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
