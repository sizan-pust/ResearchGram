"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  profile_pic_url: string | null;
};

type Conversation = {
  id: string;
  request_id: string | null;
  content_id: string | null;
  participant_one_id: string;
  participant_two_id: string;
  created_at: string | null;
  updated_at: string | null;
};

type Message = {
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

type ContentPost = {
  id: string;
  title: string | null;
  post_type: string | null;
};

type ConversationView = Conversation & {
  otherProfile: Profile | null;
  contentPost: ContentPost | null;
  lastMessage: Message | null;
  unread_count: number;
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
function getMessageTimeValue(message: Message) {
  return message.created_at ? new Date(message.created_at).getTime() : 0;
}

function dedupeMessages(messageList: Message[]) {
  const map = new Map<string, Message>();

  messageList.forEach((message) => {
    map.set(message.id, message);
  });

  return Array.from(map.values()).sort(
    (a, b) => getMessageTimeValue(a) - getMessageTimeValue(b),
  );
}

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get("conversation");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [userId, setUserId] = useState("");
  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [messageActionLoadingId, setMessageActionLoadingId] = useState<
    string | null
  >(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [typingChannelReady, setTypingChannelReady] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingChannelRef = useRef<any>(null);
  const typingSendThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const typingHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const selectedConversation = useMemo(
    () =>
      conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );
  const latestOwnMessageId = useMemo(() => {
    return (
      [...messages]
        .reverse()
        .find(
          (message) =>
            message.sender_id === userId &&
            !message.is_deleted &&
            !message.id.startsWith("temp-"),
        )?.id || null
    );
  }, [messages, userId]);

  const loadConversations = async (currentUserId: string) => {
    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .select(
        "id, request_id, content_id, participant_one_id, participant_two_id, created_at, updated_at",
      )
      .or(
        `participant_one_id.eq.${currentUserId},participant_two_id.eq.${currentUserId}`,
      )
      .order("updated_at", { ascending: false });

    if (conversationError) {
      console.log("FETCH CONVERSATIONS ERROR:", conversationError);
      setConversations([]);
      return;
    }

    const rawConversations = (conversationData || []) as Conversation[];

    if (rawConversations.length === 0) {
      setConversations([]);
      return;
    }

    const otherUserIds = Array.from(
      new Set(
        rawConversations.map((conversation) =>
          conversation.participant_one_id === currentUserId
            ? conversation.participant_two_id
            : conversation.participant_one_id,
        ),
      ),
    );

    const contentIds = Array.from(
      new Set(
        rawConversations
          .map((conversation) => conversation.content_id)
          .filter(Boolean),
      ),
    ) as string[];

    const conversationIds = rawConversations.map(
      (conversation) => conversation.id,
    );

    let profileMap: Record<string, Profile> = {};
    let contentMap: Record<string, ContentPost> = {};
    let lastMessageMap: Record<string, Message> = {};

    if (otherUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, department, profile_pic_url")
        .in("id", otherUserIds);

      if (profilesError) {
        console.log("FETCH MESSAGE PROFILES ERROR:", profilesError);
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
        .select("id, title, post_type")
        .in("id", contentIds);

      if (contentsError) {
        console.log("FETCH MESSAGE POSTS ERROR:", contentsError);
      }

      contentMap = (contentsData || []).reduce(
        (acc, post) => {
          acc[post.id] = post as ContentPost;
          return acc;
        },
        {} as Record<string, ContentPost>,
      );
    }

    if (conversationIds.length > 0) {
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, message_text, created_at, read_at, is_deleted",
        )
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      if (messagesError) {
        console.log("FETCH LAST MESSAGES ERROR:", messagesError);
      }

      (messagesData || []).forEach((message) => {
        if (!lastMessageMap[message.conversation_id]) {
          lastMessageMap[message.conversation_id] = message as Message;
        }
      });
    }
    let unreadCountMap: Record<string, number> = {};

    if (conversationIds.length > 0) {
      const { data: unreadData, error: unreadError } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .neq("sender_id", currentUserId)
        .is("read_at", null)
        .eq("is_deleted", false);

      if (unreadError) {
        console.log("FETCH UNREAD MESSAGES ERROR:", unreadError);
      }

      (unreadData || []).forEach((message: any) => {
        unreadCountMap[message.conversation_id] =
          (unreadCountMap[message.conversation_id] || 0) + 1;
      });
    }

    const normalized: ConversationView[] = rawConversations.map(
      (conversation) => {
        const otherUserId =
          conversation.participant_one_id === currentUserId
            ? conversation.participant_two_id
            : conversation.participant_one_id;

        return {
          ...conversation,
          otherProfile: profileMap[otherUserId] || null,
          contentPost: conversation.content_id
            ? contentMap[conversation.content_id] || null
            : null,
          lastMessage: lastMessageMap[conversation.id] || null,
          unread_count: unreadCountMap[conversation.id] || 0,
        };
      },
    );

    setConversations(normalized);

    if (
      requestedConversationId &&
      normalized.some(
        (conversation) => conversation.id === requestedConversationId,
      )
    ) {
      setSelectedConversationId(requestedConversationId);
      return;
    }

    if (!selectedConversationId && normalized.length > 0) {
      setSelectedConversationId(normalized[0].id);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_id, message_text, created_at, updated_at, reply_to_message_id, is_deleted, deleted_at, pinned_at, pinned_by, read_at",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.log("FETCH MESSAGES ERROR:", error);
      setMessages([]);
      return;
    }

    setMessages(dedupeMessages((data || []) as Message[]));
  };
  const markConversationAsRead = async (
    conversationId: string,
    currentUserId: string,
  ) => {
    const readTime = new Date().toISOString();

    const { error } = await supabase
      .from("messages")
      .update({ read_at: readTime, updated_at: readTime })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId)
      .is("read_at", null);

    if (error) {
      console.log("MARK MESSAGES READ ERROR:", error);
      return;
    }

    setMessages((prev) =>
      dedupeMessages(
        prev.map((message) =>
          message.conversation_id === conversationId &&
          message.sender_id !== currentUserId &&
          !message.read_at
            ? { ...message, read_at: readTime, updated_at: readTime }
            : message,
        ),
      ),
    );

    await loadConversations(currentUserId);
  };

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/auth/login");
        return;
      }

      setUserId(authData.user.id);
      await loadConversations(authData.user.id);
      setLoading(false);
    };

    load();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversationId]);

  useEffect(() => {
    const loadSelectedConversation = async () => {
      if (!selectedConversationId || !userId) return;

      await loadMessages(selectedConversationId);
      await markConversationAsRead(selectedConversationId, userId);
    };

    loadSelectedConversation();
  }, [selectedConversationId, userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`researchgram-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          console.log("REALTIME MESSAGE INSERT:", newMessage);

          await loadConversations(userId);

          if (newMessage.conversation_id === selectedConversationId) {
            setMessages((prev) => {
              const withoutDuplicate = prev.filter(
                (message) => message.id !== newMessage.id,
              );

              return dedupeMessages([...withoutDuplicate, newMessage]);
            });

            if (newMessage.sender_id !== userId) {
              await markConversationAsRead(newMessage.conversation_id, userId);
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const updatedMessage = payload.new as Message;

          console.log("REALTIME MESSAGE UPDATE:", updatedMessage);

          await loadConversations(userId);

          if (updatedMessage.conversation_id === selectedConversationId) {
            setMessages((prev) =>
              dedupeMessages(
                prev.map((message) =>
                  message.id === updatedMessage.id ? updatedMessage : message,
                ),
              ),
            );
          }
        },
      )
      .subscribe((status) => {
        console.log("MESSAGES REALTIME STATUS:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, selectedConversationId]);
  useEffect(() => {
    if (!selectedConversationId || !userId) return;

    setTypingUsers({});
    setTypingChannelReady(false);

    const channel = supabase
      .channel(`typing-${selectedConversationId}`, {
        config: {
          broadcast: {
            self: false,
          },
        },
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        console.log("TYPING EVENT RECEIVED:", payload);

        if (!payload?.user_id || payload.user_id === userId) return;

        setTypingUsers((prev) => ({
          ...prev,
          [payload.user_id]: true,
        }));

        if (typingHideTimeoutRef.current) {
          clearTimeout(typingHideTimeoutRef.current);
        }

        typingHideTimeoutRef.current = setTimeout(() => {
          setTypingUsers((prev) => ({
            ...prev,
            [payload.user_id]: false,
          }));
        }, 1800);
      })
      .subscribe((status) => {
        console.log("TYPING CHANNEL STATUS:", status);

        if (status === "SUBSCRIBED") {
          setTypingChannelReady(true);
        }
      });

    typingChannelRef.current = channel;

    return () => {
      if (typingSendThrottleRef.current) {
        clearTimeout(typingSendThrottleRef.current);
        typingSendThrottleRef.current = null;
      }

      if (typingHideTimeoutRef.current) {
        clearTimeout(typingHideTimeoutRef.current);
        typingHideTimeoutRef.current = null;
      }

      setTypingUsers({});
      setTypingChannelReady(false);
      typingChannelRef.current = null;

      supabase.removeChannel(channel);
    };
  }, [selectedConversationId, userId]);

  const sendTypingSignal = async () => {
    if (!typingChannelRef.current) return;
    if (!typingChannelReady) return;
    if (!userId || !selectedConversationId) return;

    if (typingSendThrottleRef.current) return;

    console.log("SENDING TYPING SIGNAL");

    const response = await typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: userId,
        conversation_id: selectedConversationId,
        at: new Date().toISOString(),
      },
    });

    console.log("TYPING SEND RESPONSE:", response);

    typingSendThrottleRef.current = setTimeout(() => {
      typingSendThrottleRef.current = null;
    }, 1000);
  };

  const handleSendMessage = async () => {
    const cleanMessage = messageText.trim();

    if (!cleanMessage) return;
    if (!selectedConversationId || !userId) return;

    setSending(true);

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: selectedConversationId,
      sender_id: userId,
      message_text: cleanMessage,
      created_at: new Date().toISOString(),
      reply_to_message_id: replyingTo?.id || null,
      is_deleted: false,
      deleted_at: null,
      pinned_at: null,
      pinned_by: null,
      read_at: null,
    };

    setMessages((prev) => dedupeMessages([...prev, optimisticMessage]));
    setMessageText("");
    setReplyingTo(null);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversationId,
        sender_id: userId,
        message_text: cleanMessage,
        reply_to_message_id: optimisticMessage.reply_to_message_id,
      })
      .select(
        "id, conversation_id, sender_id, message_text, created_at, updated_at, reply_to_message_id, is_deleted, deleted_at, pinned_at, pinned_by, read_at",
      )
      .single();

    if (error) {
      console.log("SEND MESSAGE ERROR:", error);
      alert(error.message);

      setMessages((prev) => prev.filter((message) => message.id !== tempId));
      setSending(false);
      return;
    }

    setMessages((prev) =>
      dedupeMessages(
        prev.map((message) =>
          message.id === tempId ? (data as Message) : message,
        ),
      ),
    );

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", selectedConversationId);

    await loadConversations(userId);
    setSending(false);
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!userId) return;

    if (message.sender_id !== userId) {
      alert("You can delete only your own messages.");
      return;
    }

    const confirmDelete = confirm("Delete this message?");
    if (!confirmDelete) return;

    setMessageActionLoadingId(message.id);

    const { error } = await supabase
      .from("messages")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        message_text: "This message was deleted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", message.id)
      .eq("sender_id", userId);

    if (error) {
      console.log("DELETE MESSAGE ERROR:", error);
      alert(error.message);
      setMessageActionLoadingId(null);
      return;
    }

    setMessageActionLoadingId(null);
  };
  const handleTogglePinMessage = async (message: Message) => {
    if (!userId || !selectedConversationId) return;

    if (message.is_deleted) {
      alert("Deleted messages cannot be pinned.");
      return;
    }

    setMessageActionLoadingId(message.id);

    if (message.pinned_at) {
      const { error } = await supabase
        .from("messages")
        .update({
          pinned_at: null,
          pinned_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", message.id)
        .eq("conversation_id", selectedConversationId);

      if (error) {
        console.log("UNPIN MESSAGE ERROR:", error);
        alert(error.message);
        setMessageActionLoadingId(null);
        return;
      }

      setMessageActionLoadingId(null);
      return;
    }

    const { error: clearError } = await supabase
      .from("messages")
      .update({
        pinned_at: null,
        pinned_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("conversation_id", selectedConversationId)
      .not("pinned_at", "is", null);

    if (clearError) {
      console.log("CLEAR PINNED MESSAGE ERROR:", clearError);
      alert(clearError.message);
      setMessageActionLoadingId(null);
      return;
    }

    const { error } = await supabase
      .from("messages")
      .update({
        pinned_at: new Date().toISOString(),
        pinned_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", message.id)
      .eq("conversation_id", selectedConversationId);

    if (error) {
      console.log("PIN MESSAGE ERROR:", error);
      alert(error.message);
      setMessageActionLoadingId(null);
      return;
    }

    setMessageActionLoadingId(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
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

                    {messages.find(
                      (message) => message.pinned_at && !message.is_deleted,
                    ) && (
                      <div className="mt-4 rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">
                          Pinned message
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-yellow-900">
                          {
                            messages.find(
                              (message) =>
                                message.pinned_at && !message.is_deleted,
                            )?.message_text
                          }
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
                        className={`group flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`min-w-0 max-w-[78%] ${
                            isMine ? "items-end" : "items-start"
                          } flex flex-col`}
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
                    className="flex-1 resize-none rounded-2xl border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
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
export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 p-6 text-gray-700">
          Loading messages...
        </main>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
