"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MessagesUI, {
  type Conversation,
  type ConversationView,
  type ContentPost,
  type Message,
  type Profile,
} from "./UI";

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

export default function MessagesClient() {
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

  return (
    <MessagesUI
      loading={loading}
      sending={sending}
      userId={userId}
      conversations={conversations}
      selectedConversationId={selectedConversationId}
      selectedConversation={selectedConversation}
      messages={messages}
      messageText={messageText}
      replyingTo={replyingTo}
      messageActionLoadingId={messageActionLoadingId}
      typingUsers={typingUsers}
      latestOwnMessageId={latestOwnMessageId}
      messagesEndRef={messagesEndRef}
      setSelectedConversationId={setSelectedConversationId}
      setMessageText={setMessageText}
      setReplyingTo={setReplyingTo}
      sendTypingSignal={sendTypingSignal}
      handleSendMessage={handleSendMessage}
      handleDeleteMessage={handleDeleteMessage}
      handleTogglePinMessage={handleTogglePinMessage}
    />
  );
}