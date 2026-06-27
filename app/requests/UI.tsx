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
  user_id: string | null;
  title: string | null;
  content: string | null;
  abstract: string | null;
  post_type: string | null;
  content_category: string | null;
  visibility_mode: string | null;
  full_paper_access_mode: string | null;
  allow_full_paper_request: boolean | null;
  created_at: string | null;
};

export type RequestKind = "research" | "profile" | "paper_access";
export type RequestDirection = "received" | "sent";

export type RequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "approved"
  | "rejected";

export type UnifiedRequestView = {
  id: string;
  kind: RequestKind;
  direction: RequestDirection;
  request_type: string;
  status: RequestStatus;
  message: string | null;
  created_at: string | null;
  updated_at: string | null;

  requester_id: string | null;
  receiver_id: string | null;
  owner_id: string | null;
  content_id: string | null;

  otherProfile: Profile | null;
  requesterProfile: Profile | null;
  receiverProfile: Profile | null;
  contentPost: ContentPost | null;
};

type RequestsUIProps = {
  loading: boolean;
  userId: string;
  activeTab: "received" | "sent";
  receivedRequests: UnifiedRequestView[];
  sentRequests: UnifiedRequestView[];
  updatingId: string | null;
  openingConversationId: string | null;

  setActiveTab: (tab: "received" | "sent") => void;
  handleUpdateStatus: (
    request: UnifiedRequestView,
    nextStatus: RequestStatus,
  ) => void;
  handleOpenMessages: (request: UnifiedRequestView) => void;
  handleGoToFeed: () => void;
  handleGoToProfile: (profileId: string) => void;
  getProfileName: (profile: Profile | null | undefined) => string;
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

function formatLabel(value: string | null | undefined) {
  return (value || "").replaceAll("_", " ");
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const className =
    status === "pending"
      ? "bg-yellow-50 text-yellow-700"
      : status === "accepted" || status === "approved"
        ? "bg-green-50 text-green-700"
        : "bg-red-50 text-red-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${className}`}
    >
      {status}
    </span>
  );
}

function RequestTypeBadge({ request }: { request: UnifiedRequestView }) {
  if (request.kind === "paper_access") {
    return (
      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
        Full Paper Access
      </span>
    );
  }

  if (request.kind === "research") {
    return (
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
        Research Collaboration
      </span>
    );
  }

  if (request.request_type === "mentorship") {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        Mentorship
      </span>
    );
  }

  return (
    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
      Connection
    </span>
  );
}

function EmptyState({
  activeTab,
  handleGoToFeed,
}: {
  activeTab: "received" | "sent";
  handleGoToFeed: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
        📩
      </div>

      <h2 className="text-lg font-bold text-gray-900">
        No {activeTab} requests
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        {activeTab === "received"
          ? "When someone sends you a collaboration, connection, mentorship, or full paper access request, it will appear here."
          : "Requests you send to other researchers will appear here."}
      </p>

      <button
        onClick={handleGoToFeed}
        className="mt-6 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Go to Feed
      </button>
    </div>
  );
}

function RequestCard({
  request,
  activeTab,
  updatingId,
  openingConversationId,
  handleUpdateStatus,
  handleOpenMessages,
  handleGoToFeed,
  handleGoToProfile,
  getProfileName,
}: {
  request: UnifiedRequestView;
  activeTab: "received" | "sent";
  updatingId: string | null;
  openingConversationId: string | null;
  handleUpdateStatus: (
    request: UnifiedRequestView,
    nextStatus: RequestStatus,
  ) => void;
  handleOpenMessages: (request: UnifiedRequestView) => void;
  handleGoToFeed: () => void;
  handleGoToProfile: (profileId: string) => void;
  getProfileName: (profile: Profile | null | undefined) => string;
}) {
  const otherProfile = request.otherProfile;
  const otherProfileName = getProfileName(otherProfile);
  const isUpdating = updatingId === request.id;
  const isOpeningConversation = openingConversationId === request.id;

  const canRespond = activeTab === "received" && request.status === "pending";
  const isAcceptedResearch =
    request.kind === "research" && request.status === "accepted";
  const isApprovedPaperAccess =
    request.kind === "paper_access" && request.status === "approved";

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100">
            {otherProfile?.profile_pic_url ? (
              <img
                src={otherProfile.profile_pic_url}
                alt={otherProfileName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-blue-700">
                {otherProfileName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-gray-950">
                {otherProfileName}
              </h2>

              <RequestTypeBadge request={request} />
              <StatusBadge status={request.status} />
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {otherProfile?.department || "Research community"} ·{" "}
              {formatTime(request.created_at)}
            </p>
          </div>
        </div>

        {otherProfile?.id && (
          <button
            onClick={() => handleGoToProfile(otherProfile.id)}
            className="rounded-full bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            View Profile
          </button>
        )}
      </div>

      <div className="mt-5 rounded-2xl bg-gray-50 p-4">
        {request.kind === "paper_access" ? (
          <>
            <p className="text-sm font-semibold text-gray-900">
              {activeTab === "received"
                ? `${otherProfileName} requested full paper access.`
                : `You requested full paper access from ${otherProfileName}.`}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Paper:{" "}
              <span className="font-semibold text-gray-900">
                {request.contentPost?.title || "Untitled research paper"}
              </span>
            </p>

            {request.contentPost?.abstract && (
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                {request.contentPost.abstract}
              </p>
            )}

            {request.message && (
              <div className="mt-3 rounded-2xl bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Reason
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {request.message}
                </p>
              </div>
            )}
          </>
        ) : request.kind === "research" ? (
          <>
            <p className="text-sm font-semibold text-gray-900">
              {activeTab === "received"
                ? `${otherProfileName} wants to collaborate on your research post.`
                : `You sent a collaboration request to ${otherProfileName}.`}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Post:{" "}
              <span className="font-semibold text-gray-900">
                {request.contentPost?.title || "Untitled research post"}
              </span>
            </p>

            {request.message && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {request.message}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-900">
              {request.request_type === "mentorship"
                ? activeTab === "received"
                  ? `${otherProfileName} requested mentorship from you.`
                  : `You requested mentorship from ${otherProfileName}.`
                : activeTab === "received"
                  ? `${otherProfileName} wants to connect with you.`
                  : `You sent a connection request to ${otherProfileName}.`}
            </p>

            {request.message && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {request.message}
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {canRespond && request.kind === "paper_access" && (
          <>
            <button
              onClick={() => handleUpdateStatus(request, "approved")}
              disabled={isUpdating}
              className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdating ? "Updating..." : "Approve Access"}
            </button>

            <button
              onClick={() => handleUpdateStatus(request, "rejected")}
              disabled={isUpdating}
              className="rounded-full bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reject
            </button>
          </>
        )}

        {canRespond && request.kind !== "paper_access" && (
          <>
            <button
              onClick={() => handleUpdateStatus(request, "accepted")}
              disabled={isUpdating}
              className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdating ? "Updating..." : "Accept"}
            </button>

            <button
              onClick={() => handleUpdateStatus(request, "declined")}
              disabled={isUpdating}
              className="rounded-full bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Decline
            </button>
          </>
        )}

        {isAcceptedResearch && (
          <button
            onClick={() => handleOpenMessages(request)}
            disabled={isOpeningConversation}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isOpeningConversation ? "Opening..." : "Open Messages"}
          </button>
        )}

        {request.contentPost && (
          <button
            onClick={handleGoToFeed}
            className="rounded-full bg-gray-50 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            View in Feed
          </button>
        )}

        {activeTab === "sent" && isApprovedPaperAccess && (
          <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            Approved — open Feed to access the full paper
          </span>
        )}

        {activeTab === "sent" && request.status === "pending" && (
          <span className="rounded-full bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700">
            Waiting for response
          </span>
        )}

        {activeTab === "sent" &&
          (request.status === "declined" || request.status === "rejected") && (
            <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
              Request was not approved
            </span>
          )}
      </div>
    </div>
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
  getProfileName,
}: RequestsUIProps) {
  const activeRequests =
    activeTab === "received" ? receivedRequests : sentRequests;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading requests...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <AppNav activePage="requests" />

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-950">Requests</h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Manage collaboration, connection, mentorship, and full paper
                access requests.
              </p>
            </div>

            <button
              onClick={handleGoToFeed}
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Feed
            </button>
          </div>

          <div className="mt-6 flex rounded-2xl bg-gray-50 p-1">
            <button
              onClick={() => setActiveTab("received")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "received"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Received ({receivedRequests.length})
            </button>

            <button
              onClick={() => setActiveTab("sent")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "sent"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Sent ({sentRequests.length})
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {activeRequests.length === 0 ? (
            <EmptyState activeTab={activeTab} handleGoToFeed={handleGoToFeed} />
          ) : (
            activeRequests.map((request) => (
              <RequestCard
                key={`${request.kind}-${request.id}`}
                request={request}
                activeTab={activeTab}
                updatingId={updatingId}
                openingConversationId={openingConversationId}
                handleUpdateStatus={handleUpdateStatus}
                handleOpenMessages={handleOpenMessages}
                handleGoToFeed={handleGoToFeed}
                handleGoToProfile={handleGoToProfile}
                getProfileName={getProfileName}
              />
            ))
          )}
        </div>
      </section>
    </main>
  );
}