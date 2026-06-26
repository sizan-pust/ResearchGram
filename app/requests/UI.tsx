"use client";

import AppNav from "@/components/AppNav";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  profile_pic_url: string | null;
};

export type ContentPost = {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  post_type: string | null;
  created_at: string | null;
};

export type RequestKind = "research" | "profile";

export type UnifiedRequestView = {
  id: string;
  kind: RequestKind;
  content_id: string | null;
  requester_id: string;
  receiver_id: string;
  request_type: string;
  message: string | null;
  status: string;
  created_at: string | null;
  otherProfile: Profile | null;
  contentPost: ContentPost | null;
};

type RequestsUIProps = {
  loading: boolean;
  activeTab: "received" | "sent";
  receivedRequests: UnifiedRequestView[];
  sentRequests: UnifiedRequestView[];
  updatingId: string | null;
  openingConversationId: string | null;

  setActiveTab: (tab: "received" | "sent") => void;
  handleUpdateStatus: (
    request: UnifiedRequestView,
    status: "accepted" | "declined",
  ) => void;
  handleOpenMessages: (request: UnifiedRequestView) => void;
  handleGoToFeed: () => void;
  handleGoToProfile: (profileId: string | null | undefined) => void;
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
      : normalizedStatus === "declined" || normalizedStatus === "rejected"
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

function RequestTypeBadge({ request }: { request: UnifiedRequestView }) {
  const label =
    request.kind === "profile" && request.request_type === "mentorship"
      ? "Mentorship Request"
      : request.kind === "profile"
        ? "Profile Connection"
        : (request.request_type || "Collaboration").replaceAll("_", " ");

  const className =
    request.kind === "profile" && request.request_type === "mentorship"
      ? "bg-emerald-50 text-emerald-700"
      : request.kind === "profile"
        ? "bg-purple-50 text-purple-700"
        : "bg-blue-50 text-blue-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${className}`}
    >
      {label}
    </span>
  );
}

export default function RequestsUI({
  loading,
  activeTab,
  receivedRequests,
  sentRequests,
  updatingId,
  openingConversationId,
  setActiveTab,
  handleUpdateStatus,
  handleOpenMessages,
  handleGoToFeed,
  handleGoToProfile,
}: RequestsUIProps) {
  const shownRequests =
    activeTab === "received" ? receivedRequests : sentRequests;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading requests...</p>
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
              <h1 className="text-3xl font-bold text-gray-950">Requests</h1>
              <p className="mt-2 text-sm text-gray-500">
                Manage collaboration invitations, profile connections, and
                academic networking requests.
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
                  ? "When researchers contact you for collaboration or connection, requests will appear here."
                  : "Requests you send to other researchers will appear here."}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {shownRequests.map((request) => (
                <div
                  key={`${request.kind}-${request.id}`}
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

                    <div className="flex flex-wrap gap-2">
                      <RequestTypeBadge request={request} />
                      <StatusBadge status={request.status} />
                    </div>
                  </div>

                  {request.kind === "research" && (
                    <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Related research post
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
                          onClick={handleGoToFeed}
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                        >
                          View in Feed
                        </button>
                      </div>
                    </div>
                  )}

                  {request.kind === "profile" && (
                    <div
                      className={`mt-5 rounded-2xl p-4 ${
                        request.request_type === "mentorship"
                          ? "bg-emerald-50"
                          : "bg-purple-50"
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          request.request_type === "mentorship"
                            ? "text-emerald-700"
                            : "text-purple-700"
                        }`}
                      >
                        {request.request_type === "mentorship"
                          ? "Mentorship request"
                          : "Profile connection request"}
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-gray-950">
                        {request.request_type === "mentorship"
                          ? activeTab === "received"
                            ? "This researcher wants mentorship from you"
                            : "You requested mentorship from this researcher"
                          : activeTab === "received"
                            ? "This researcher wants to connect with you"
                            : "You requested to connect with this researcher"}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {request.request_type === "mentorship"
                          ? "Mentorship helps students get research direction, academic feedback, resource suggestions, and supervision support from faculty or alumni."
                          : "Connections help researchers discover each other, build academic networks, and collaborate beyond individual posts."}
                      </p>

                      <button
                        onClick={() => handleGoToProfile(request.otherProfile?.id)}
                        className={`mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold transition ${
                          request.request_type === "mentorship"
                            ? "text-emerald-700 hover:bg-emerald-100"
                            : "text-purple-700 hover:bg-purple-100"
                        }`}
                      >
                        View Profile
                      </button>
                    </div>
                  )}

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
                        onClick={() => handleUpdateStatus(request, "declined")}
                        disabled={updatingId === request.id}
                        className="rounded-full bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Decline
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(request, "accepted")}
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

                  {request.kind === "research" &&
                    request.status === "accepted" && (
                      <div className="mt-5 flex justify-end border-t border-gray-100 pt-4">
                        <button
                          onClick={() => handleOpenMessages(request)}
                          disabled={openingConversationId === request.id}
                          className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {openingConversationId === request.id
                            ? "Opening..."
                            : "Open Messages"}
                        </button>
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