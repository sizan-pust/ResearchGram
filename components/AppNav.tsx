"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NotificationBell from "@/components/NotificationBell";

type ActivePage =
  | "feed"
  | "researchers"
  | "network"
  | "requests"
  | "messages"
  | "profile"
  | "notifications";

type AppNavProps = {
  activePage: ActivePage;
};

export default function AppNav({ activePage }: AppNavProps) {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [searchText, setSearchText] = useState("");

  const loadCounts = useCallback(async (currentUserId: string) => {
    if (!currentUserId) {
      setPendingRequestCount(0);
      setUnreadMessageCount(0);
      return;
    }

    const [researchResult, profileResult, paperAccessResult] =
      await Promise.all([
        supabase
          .from("research_requests")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", currentUserId)
          .eq("status", "pending"),

        supabase
          .from("profile_requests")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", currentUserId)
          .eq("status", "pending"),

        supabase
          .from("paper_access_requests")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", currentUserId)
          .eq("status", "pending"),
      ]);

    if (researchResult.error) {
      console.log("NAV RESEARCH REQUEST COUNT ERROR:", researchResult.error);
    }

    if (profileResult.error) {
      console.log("NAV PROFILE REQUEST COUNT ERROR:", profileResult.error);
    }

    if (paperAccessResult.error) {
      console.log(
        "NAV PAPER ACCESS REQUEST COUNT ERROR:",
        paperAccessResult.error,
      );
    }

    const totalPendingRequests =
      (researchResult.count || 0) +
      (profileResult.count || 0) +
      (paperAccessResult.count || 0);

    setPendingRequestCount(totalPendingRequests);

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
      setUnreadMessageCount(0);
      return;
    }

    setUnreadMessageCount(unreadCount || 0);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
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

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUserId = session?.user?.id || "";

      setUserId(nextUserId);

      if (nextUserId) {
        await loadCounts(nextUserId);
      } else {
        setPendingRequestCount(0);
        setUnreadMessageCount(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadCounts]);

  useEffect(() => {
    if (!userId) return;

    const refreshCounts = async () => {
      await loadCounts(userId);
    };

    window.addEventListener("focus", refreshCounts);
    window.addEventListener("researchgram:refresh-nav-counts", refreshCounts);

    const channel = supabase
      .channel(`app-nav-live-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        refreshCounts,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "research_requests",
          filter: `receiver_id=eq.${userId}`,
        },
        refreshCounts,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profile_requests",
          filter: `receiver_id=eq.${userId}`,
        },
        refreshCounts,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "paper_access_requests",
          filter: `owner_id=eq.${userId}`,
        },
        refreshCounts,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        refreshCounts,
      )
      .subscribe();

    refreshCounts();

    return () => {
      window.removeEventListener("focus", refreshCounts);
      window.removeEventListener(
        "researchgram:refresh-nav-counts",
        refreshCounts,
      );

      supabase.removeChannel(channel);
    };
  }, [userId, loadCounts]);

  const handleGlobalSearch = () => {
    const value = searchText.trim();

    if (!value) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGlobalSearch();
          }}
          className="mx-4 hidden max-w-md flex-1 md:block"
        >
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search researchers, papers..."
            className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:bg-white"
          />
        </form>

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
            onClick={() => router.push("/network")}
            className={navButtonClass("network")}
          >
            Network
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

          <NotificationBell />

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
