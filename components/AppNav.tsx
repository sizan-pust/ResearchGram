"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ActivePage = "feed" | "researchers" | "requests" | "messages" | "profile";

type AppNavProps = {
  activePage: ActivePage;
};

export default function AppNav({ activePage }: AppNavProps) {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const loadCounts = async (currentUserId: string) => {
    if (!currentUserId) return;

    const { count: requestCount, error: requestError } = await supabase
      .from("research_requests")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", currentUserId)
      .eq("status", "pending");

    if (requestError) {
      console.log("NAV REQUEST COUNT ERROR:", requestError);
    } else {
      setPendingRequestCount(requestCount || 0);
    }

    const { data: conversations, error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `participant_one_id.eq.${currentUserId},participant_two_id.eq.${currentUserId}`,
      );

    if (conversationError) {
      console.log("NAV CONVERSATION COUNT ERROR:", conversationError);
      setUnreadMessageCount(0);
      return;
    }

    const conversationIds = (conversations || []).map((item) => item.id);

    if (conversationIds.length === 0) {
      setUnreadMessageCount(0);
      return;
    }

    const { count: unreadCount, error: unreadError } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .neq("sender_id", currentUserId)
      .is("read_at", null)
      .eq("is_deleted", false);

    if (unreadError) {
      console.log("NAV UNREAD MESSAGE COUNT ERROR:", unreadError);
    } else {
      setUnreadMessageCount(unreadCount || 0);
    }
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setUserId("");
        setPendingRequestCount(0);
        setUnreadMessageCount(0);
        return;
      }

      setUserId(data.user.id);
      await loadCounts(data.user.id);
    };

    load();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`app-nav-live-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        async () => {
          await loadCounts(userId);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "research_requests",
        },
        async () => {
          await loadCounts(userId);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        async () => {
          await loadCounts(userId);
        },
      )
      .subscribe((status) => {
        console.log("APP NAV REALTIME STATUS:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const navButtonClass = (page: ActivePage) =>
    page === activePage
      ? "rounded-full bg-blue-50 px-4 py-2 font-semibold text-blue-700"
      : "rounded-full px-4 py-2 font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-950";

  const Badge = ({ count }: { count: number }) => {
    if (count <= 0) return null;

    return (
      <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <button
          onClick={() => router.push("/")}
          className="text-xl font-bold text-gray-950"
        >
          ResearchGram
        </button>

        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push("/feed")}
            className={navButtonClass("feed")}
          >
            Feed
          </button>
          <button
            onClick={() => router.push("/researchers")}
            className={navButtonClass("researchers")}
          >
            Researchers
          </button>

          <button
            onClick={() => router.push("/requests")}
            className={navButtonClass("requests")}
          >
            Requests
            <Badge count={pendingRequestCount} />
          </button>

          <button
            onClick={() => router.push("/messages")}
            className={navButtonClass("messages")}
          >
            Messages
            <Badge count={unreadMessageCount} />
          </button>

          <button
            onClick={() => router.push("/profile")}
            className={navButtonClass("profile")}
          >
            Profile
          </button>

          <button
            onClick={handleLogout}
            className="rounded-full px-4 py-2 font-medium text-red-600 transition hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
