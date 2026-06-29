"use client";

import AppNav from "@/components/AppNav";

export type ConversationDivision =
  | "direct"
  | "collaboration"
  | "workspace_group";

export type ProfileLite = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  profile_pic_url: string | null;
};

export type ConversationMemberView = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  last_read_at: string | null;
  muted: boolean | null;
  joined_at: string | null;
  profile: ProfileLite | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  read_at: string | null;
  is_deleted: boolean | null;
  created_at: string | null;
};

export type ConversationView = {
  id: string;
  participant_one_id: string | null;
  participant_two_id: string | null;
  conversation_type: ConversationDivision;
  title: string | null;
  content_id: string | null;
  request_id: string | null;
  workspace_id: string | null;
  created_by: string | null;
  last_message_at: string | null;
  created_at: string | null;
  display_title: string;
  members: ConversationMemberView[];
  workspace: {
    id: string;
    title: string | null;
    workspace_type: string | null;
  } | null;
  content: {
    id: string;
    title: string | null;
  } | null;
  last_message: MessageRow | null;
  unread_count: number;
};

export type TypingUser = {
  user_id: string;
  name: string;
};

type MessagesUIProps = {
  loading: boolean;
  userId: string;

  activeDivision: ConversationDivision;
  setActiveDivision: (division: ConversationDivision) => void;

  conversations: ConversationView[];
  filteredConversations: ConversationView[];
  selectedConversationId: string;
  selectedConversation: ConversationView | null;

  messages: MessageRow[];
  messageText: string;
  sending: boolean;

  connectedProfiles: ProfileLite[];
  selectedDirectUserId: string;
  creatingDirect: boolean;

  typingUsers: TypingUser[];

  setSelectedDirectUserId: (value: string) => void;
  handleCreateDirectChat: () => void;
  handleSelectConversation: (conversationId: string) => void;
  handleChangeMessageText: (value: string) => void;
  handleSendMessage: () => void;
  handleOpenWorkspace: (workspaceId: string) => void;
  handleOpenPost: (contentId: string) => void;
};

const DIVISIONS: {
  label: string;
  value: ConversationDivision;
  description: string;
}[] = [
  {
    label: "Direct",
    value: "direct",
    description: "Personal chat with connected researchers",
  },
  {
    label: "Collaborations",
    value: "collaboration",
    description: "Research-request based collaboration chats",
  },
  {
    label: "Workspaces",
    value: "workspace_group",
    description: "Group chats for shared workspace members",
  },
];

function formatTime(dateString: string | null) {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const now = new Date();

    const sameDay = date.toDateString() === now.toDateString();

    if (sameDay) {
      return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    }

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function getMemberName(member: ConversationMemberView | undefined | null) {
  return (
    member?.profile?.full_name ||
    member?.profile?.email?.split("@")[0] ||
    "Researcher"
  );
}

function getSenderName(
  senderId: string,
  members: ConversationMemberView[],
  currentUserId: string,
) {
  if (senderId === currentUserId) return "You";

  const member = members.find((item) => item.user_id === senderId);

  return getMemberName(member);
}

function getAvatarInitial(title: string) {
  return title.charAt(0).toUpperCase();
}

function typeLabel(type: ConversationDivision) {
  if (type === "direct") return "Direct";
  if (type === "collaboration") return "Collaboration";
  return "Workspace";
}

function typeStyle(type: ConversationDivision) {
  if (type === "direct") return "bg-blue-50 text-blue-700";
  if (type === "collaboration") return "bg-purple-50 text-purple-700";
  return "bg-green-50 text-green-700";
}

function lastMessagePreview(conversation: ConversationView) {
  const body = conversation.last_message?.body?.trim();

  if (!body) {
    if (conversation.conversation_type === "workspace_group") {
      return "Workspace group chat is ready.";
    }

    if (conversation.conversation_type === "collaboration") {
      return "Collaboration chat is ready.";
    }

    return "No messages yet.";
  }

  return body;
}

export default function MessagesUI({
  loading,
  userId,
  activeDivision,
  setActiveDivision,
  conversations,
  filteredConversations,
  selectedConversationId,
  selectedConversation,
  messages,
  messageText,
  sending,
  connectedProfiles,
  selectedDirectUserId,
  creatingDirect,
  typingUsers,
  setSelectedDirectUserId,
  handleCreateDirectChat,
  handleSelectConversation,
  handleChangeMessageText,
  handleSendMessage,
  handleOpenWorkspace,
  handleOpenPost,
}: MessagesUIProps) {
  const unreadDirect = conversations
    .filter((item) => item.conversation_type === "direct")
    .reduce((sum, item) => sum + item.unread_count, 0);

  const unreadCollaboration = conversations
    .filter((item) => item.conversation_type === "collaboration")
    .reduce((sum, item) => sum + item.unread_count, 0);

  const unreadWorkspace = conversations
    .filter((item) => item.conversation_type === "workspace_group")
    .reduce((sum, item) => sum + item.unread_count, 0);

  const divisionUnreadMap: Record<ConversationDivision, number> = {
    direct: unreadDirect,
    collaboration: unreadCollaboration,
    workspace_group: unreadWorkspace,
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <AppNav activePage="messages" />
        <div className="mx-auto max-w-7xl px-6 py-10 text-slate-600">
          Loading messages...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppNav activePage="messages" />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-slate-950">Messages</h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage personal chats, collaboration discussions, and workspace
            group messages in one place.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {DIVISIONS.map((division) => (
              <button
                key={division.value}
                onClick={() => setActiveDivision(division.value)}
                className={`rounded-2xl border p-4 text-left transition ${
                  activeDivision === division.value
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-slate-950">{division.label}</p>

                  {divisionUnreadMap[division.value] > 0 && (
                    <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                      {divisionUnreadMap[division.value]}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {division.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid min-h-[680px] gap-6 lg:grid-cols-12">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4">
            {activeDivision === "direct" && (
              <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                <p className="font-black text-slate-950">Start Direct Chat</p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  You can start a personal chat with connected researchers or
                  accepted collaborators.
                </p>

                <div className="mt-3 grid gap-2">
                  <select
                    value={selectedDirectUserId}
                    onChange={(e) => setSelectedDirectUserId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
                  >
                    <option value="">-- Select researcher --</option>

                    {connectedProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.full_name ||
                          profile.email ||
                          "ResearchGram User"}
                        {profile.department ? ` — ${profile.department}` : ""}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleCreateDirectChat}
                    disabled={!selectedDirectUserId || creatingDirect}
                    className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {creatingDirect ? "Opening..." : "Open Direct Chat"}
                  </button>
                </div>

                {connectedProfiles.length === 0 && (
                  <p className="mt-3 text-xs font-semibold text-amber-700">
                    No connected people found yet.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              {filteredConversations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    No conversations in this division yet.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedConversationId === conversation.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-blue-700 shadow-sm">
                        {getAvatarInitial(conversation.display_title)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 font-black text-slate-950">
                            {conversation.display_title}
                          </p>

                          {conversation.last_message_at && (
                            <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                              {formatTime(conversation.last_message_at)}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${typeStyle(
                              conversation.conversation_type,
                            )}`}
                          >
                            {typeLabel(conversation.conversation_type)}
                          </span>

                          {conversation.unread_count > 0 && (
                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              {conversation.unread_count} new
                            </span>
                          )}
                        </div>

                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                          {lastMessagePreview(conversation)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="flex min-h-[680px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:col-span-8">
            {!selectedConversation ? (
              <div className="flex flex-1 items-center justify-center p-10 text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
                    💬
                  </div>

                  <h2 className="text-2xl font-black text-slate-950">
                    Select a conversation
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Choose a direct, collaboration, or workspace chat from the
                    left side.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <header className="border-b border-slate-100 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${typeStyle(
                            selectedConversation.conversation_type,
                          )}`}
                        >
                          {typeLabel(selectedConversation.conversation_type)}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {selectedConversation.members.length} member
                          {selectedConversation.members.length === 1
                            ? ""
                            : "s"}
                        </span>
                      </div>

                      <h2 className="mt-3 text-2xl font-black text-slate-950">
                        {selectedConversation.display_title}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {selectedConversation.members
                          .map((member) => getMemberName(member))
                          .join(", ")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedConversation.content_id && (
                        <button
                          onClick={() =>
                            handleOpenPost(selectedConversation.content_id!)
                          }
                          className="rounded-full bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 transition hover:bg-purple-100"
                        >
                          Open Post
                        </button>
                      )}

                      {selectedConversation.workspace_id && (
                        <button
                          onClick={() =>
                            handleOpenWorkspace(
                              selectedConversation.workspace_id!,
                            )
                          }
                          className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700 transition hover:bg-green-100"
                        >
                          Open Workspace
                        </button>
                      )}
                    </div>
                  </div>
                </header>

                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5">
                  {messages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                      <p className="text-sm text-slate-500">
                        No messages yet. Start the conversation.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const mine = message.sender_id === userId;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-3xl px-5 py-3 shadow-sm ${
                              mine
                                ? "bg-blue-600 text-white"
                                : "bg-white text-slate-800"
                            }`}
                          >
                            {!mine && (
                              <p className="mb-1 text-xs font-black text-blue-700">
                                {getSenderName(
                                  message.sender_id,
                                  selectedConversation.members,
                                  userId,
                                )}
                              </p>
                            )}

                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {message.body}
                            </p>

                            <p
                              className={`mt-2 text-[10px] font-semibold ${
                                mine ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
                        {typingUsers.map((user) => user.name).join(", ")}{" "}
                        {typingUsers.length === 1 ? "is" : "are"} typing...
                      </div>
                    </div>
                  )}
                </div>

                <footer className="border-t border-slate-100 p-4">
                  <div className="flex gap-3">
                    <textarea
                      value={messageText}
                      onChange={(e) =>
                        handleChangeMessageText(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Write a message..."
                      className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !messageText.trim()}
                      className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}