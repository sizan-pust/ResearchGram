"use client";

import type { RefObject } from "react";
import AppNav from "@/components/AppNav";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  profile_pic_url: string | null;
};

export type Conversation = {
  id: string;
  request_id: string | null;
  content_id: string | null;
  participant_one_id: string;
  participant_two_id: string;
  created_at: string | null;
  updated_at: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  created_at: string | null;
  updated_at?: string | null;
  reply_to_message_id?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  pinned_at?: string | null;
  pinned_by?: string | null;
  read_at?: string | null;
};

export type ContentPost = {
  id: string;
  title: string | null;
  post_type: string | null;
};

export type ConversationView = Conversation & {
  otherProfile: Profile | null;
  contentPost: ContentPost | null;
  lastMessage: Message | null;
  unread_count: number;
};

type MessagesUIProps = {
  loading: boolean;
  sending: boolean;

  userId: string;
  conversations: ConversationView[];
  selectedConversationId: string | null;
  selectedConversation: ConversationView | null;

  messages: Message[];
  messageText: string;
  replyingTo: Message | null;
  messageActionLoadingId: string | null;
  typingUsers: Record<string, boolean>;
  latestOwnMessageId: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;

  setSelectedConversationId: (conversationId: string) => void;
  setMessageText: (value: string) => void;
  setReplyingTo: (message: Message | null) => void;

  sendTypingSignal: () => void;
  handleSendMessage: () => void;
  handleDeleteMessage: (message: Message) => void;
  handleTogglePinMessage: (message: Message) => void;
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

export default function MessagesUI({
  loading,
  sending,
  userId,
  conversations,
  selectedConversationId,
  selectedConversation,
  messages,
  messageText,
  replyingTo,
  messageActionLoadingId,
  typingUsers,
  latestOwnMessageId,
  messagesEndRef,
  setSelectedConversationId,
  setMessageText,
  setReplyingTo,
  sendTypingSignal,
  handleSendMessage,
  handleDeleteMessage,
  handleTogglePinMessage,
}: MessagesUIProps) {
  const pinnedMessage = messages.find(
    (message) => message.pinned_at && !message.is_deleted,
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading messages...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <AppNav activePage="messages" />

      <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-6">
        <aside className="col-span-12 rounded-3xl bg-white p-4 shadow-sm lg:col-span-4">
          <div className="border-b border-gray-100 pb-4">
            <h1 className="text-2xl font-bold text-gray-950">Messages</h1>
            <p className="mt-1 text-sm text-gray-500">
              Direct conversations from accepted collaboration requests.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {conversations.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                  💬
                </div>

                <h2 className="font-bold text-gray-900">
                  No conversations yet
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Accept collaboration requests or message your network
                  connections to start a research conversation.
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full rounded-2xl p-3 text-left transition ${
                    selectedConversationId === conversation.id
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                      {conversation.otherProfile?.profile_pic_url ? (
                        <img
                          src={conversation.otherProfile.profile_pic_url}
                          alt={
                            conversation.otherProfile.full_name ||
                            "Profile photo"
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-blue-700">
                          {(conversation.otherProfile?.full_name || "R")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-gray-950">
                          {conversation.otherProfile?.full_name ||
                            "ResearchGram User"}
                        </p>

                        <span className="shrink-0 text-xs text-gray-400">
                          {formatTime(
                            conversation.lastMessage?.created_at ||
                              conversation.updated_at,
                          )}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-sm ${
                            conversation.unread_count > 0
                              ? "font-semibold text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {conversation.lastMessage?.is_deleted
                            ? "This message was deleted"
                            : conversation.lastMessage?.message_text ||
                              conversation.contentPost?.title ||
                              "Direct academic conversation"}
                        </p>

                        {conversation.unread_count > 0 && (
                          <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="col-span-12 rounded-3xl bg-white shadow-sm lg:col-span-8">
          {!selectedConversation ? (
            <div className="flex min-h-[600px] items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
                  🤝
                </div>

                <h2 className="text-xl font-bold text-gray-950">
                  Select a conversation
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Choose an accepted collaboration conversation to start
                  messaging.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[600px] flex-col">
              <div className="border-b border-gray-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                    {selectedConversation.otherProfile?.profile_pic_url ? (
                      <img
                        src={selectedConversation.otherProfile.profile_pic_url}
                        alt={
                          selectedConversation.otherProfile.full_name ||
                          "Profile photo"
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-blue-700">
                        {(selectedConversation.otherProfile?.full_name || "R")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-950">
                      {selectedConversation.otherProfile?.full_name ||
                        "ResearchGram User"}
                    </h2>

                    <p className="text-sm text-gray-500">
                      {selectedConversation.otherProfile?.department ||
                        "Research community"}
                    </p>
                  </div>
                </div>

                {selectedConversation.contentPost && (
                  <>
                    <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Collaboration topic
                      </p>

                      <p className="mt-1 font-semibold text-gray-950">
                        {selectedConversation.contentPost.title ||
                          "Untitled research post"}
                      </p>

                      <p className="mt-1 text-xs font-semibold capitalize text-blue-700">
                        {(
                          selectedConversation.contentPost.post_type ||
                          "research_update"
                        ).replaceAll("_", " ")}
                      </p>
                    </div>

                    {pinnedMessage && (
                      <div className="mt-4 rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">
                          Pinned message
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-yellow-900">
                          {pinnedMessage.message_text}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-5">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <p className="font-semibold text-gray-900">
                        No messages yet
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Start the conversation by sending a short research
                        message.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender_id === userId;
                    const repliedMessage = message.reply_to_message_id
                      ? messages.find(
                          (item) => item.id === message.reply_to_message_id,
                        )
                      : null;

                    return (
                      <div
                        key={message.id}
                        className={`group flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex min-w-0 max-w-[78%] flex-col ${
                            isMine ? "items-end" : "items-start"
                          }`}
                        >
                          {message.pinned_at && !message.is_deleted && (
                            <span className="mb-1 text-xs font-semibold text-yellow-600">
                              📌 Pinned
                            </span>
                          )}

                          <div
                            className={`max-w-full overflow-hidden rounded-2xl px-4 py-3 ${
                              message.is_deleted
                                ? "bg-gray-100 text-gray-400 italic"
                                : isMine
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {repliedMessage && (
                              <div
                                className={`mb-2 max-w-full overflow-hidden rounded-xl border-l-4 px-3 py-2 text-xs ${
                                  isMine
                                    ? "border-blue-200 bg-blue-500 text-blue-50"
                                    : "border-gray-300 bg-white text-gray-600"
                                }`}
                              >
                                <p className="font-semibold">
                                  Replying to{" "}
                                  {repliedMessage.sender_id === userId
                                    ? "you"
                                    : "message"}
                                </p>

                                <p className="line-clamp-2 break-words [overflow-wrap:anywhere]">
                                  {repliedMessage.is_deleted
                                    ? "This message was deleted"
                                    : repliedMessage.message_text}
                                </p>
                              </div>
                            )}

                            <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">
                              {message.is_deleted
                                ? "This message was deleted"
                                : message.message_text}
                            </p>

                            <p
                              className={`mt-1 text-[11px] ${
                                message.is_deleted
                                  ? "text-gray-400"
                                  : isMine
                                    ? "text-blue-100"
                                    : "text-gray-400"
                              }`}
                            >
                              {formatTime(message.created_at)}

                              {isMine &&
                                message.id === latestOwnMessageId &&
                                !message.is_deleted && (
                                  <span>
                                    {" "}
                                    · {message.read_at ? "Seen" : "Sent"}
                                  </span>
                                )}
                            </p>
                          </div>

                          {!message.is_deleted &&
                            !message.id.startsWith("temp-") && (
                              <div className="mt-1 hidden gap-2 text-xs group-hover:flex">
                                <button
                                  onClick={() => setReplyingTo(message)}
                                  className="text-gray-500 hover:text-blue-600"
                                >
                                  Reply
                                </button>

                                <button
                                  onClick={() =>
                                    handleTogglePinMessage(message)
                                  }
                                  disabled={
                                    messageActionLoadingId === message.id
                                  }
                                  className="text-gray-500 hover:text-yellow-600 disabled:opacity-50"
                                >
                                  {message.pinned_at ? "Unpin" : "Pin"}
                                </button>

                                {isMine && (
                                  <button
                                    onClick={() => handleDeleteMessage(message)}
                                    disabled={
                                      messageActionLoadingId === message.id
                                    }
                                    className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })
                )}

                {Object.values(typingUsers).some(Boolean) && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-500">
                      Typing...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-100 p-4">
                {replyingTo && (
                  <div className="mb-3 flex items-start justify-between rounded-2xl bg-blue-50 p-3">
                    <div>
                      <p className="text-xs font-semibold text-blue-700">
                        Replying to{" "}
                        {replyingTo.sender_id === userId
                          ? "your message"
                          : "message"}
                      </p>

                      <p className="mt-1 line-clamp-2 text-sm text-blue-900">
                        {replyingTo.is_deleted
                          ? "This message was deleted"
                          : replyingTo.message_text}
                      </p>
                    </div>

                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-sm font-semibold text-blue-700 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <textarea
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      sendTypingSignal();
                    }}
                    placeholder="Write a message about the research collaboration..."
                    rows={2}
                    className="flex-1 resize-none rounded-2xl border border-gray-200 p-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !messageText.trim()}
                    className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}