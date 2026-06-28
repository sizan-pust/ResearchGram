"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  notification_type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  content_id: string | null;
  request_id: string | null;
  request_kind: string | null;
  is_read: boolean;
  created_at: string | null;
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
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return "Unknown time";
  }
}

function typeEmoji(type: string) {
  switch (type) {
    case "collaboration_request":
      return "🤝";
    case "profile_request":
      return "👤";
    case "paper_access_request":
      return "📘";
    case "paper_access_approved":
      return "✅";
    case "paper_access_rejected":
      return "🚫";
    case "request_accepted":
      return "✅";
    case "request_declined":
      return "❌";
    case "comment":
      return "💬";
    default:
      return "🔔";
  }
}

export default function NotificationBell() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async (currentUserId: string) => {
    if (!currentUserId) {
      setUnreadCount(0);
      return;
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", currentUserId)
      .eq("is_read", false);

    if (error) {
      console.log("NOTIFICATION COUNT ERROR:", error);
      setUnreadCount(0);
      return;
    }

    setUnreadCount(count || 0);
  }, []);

  const loadLatestNotifications = useCallback(async (currentUserId: string) => {
    if (!currentUserId) return;

    setLoadingList(true);

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, recipient_id, actor_id, notification_type, title, body, link_url, content_id, request_id, request_kind, is_read, created_at",
      )
      .eq("recipient_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.log("NOTIFICATION LIST ERROR:", error);
      setLoadingList(false);
      return;
    }

    setNotifications((data || []) as NotificationRow[]);
    setLoadingList(false);
  }, []);

  const refreshNotificationData = useCallback(
    async (currentUserId: string) => {
      await loadUnreadCount(currentUserId);

      if (open) {
        await loadLatestNotifications(currentUserId);
      }
    },
    [loadUnreadCount, loadLatestNotifications, open],
  );

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setUserId("");
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      setUserId(data.user.id);
      await loadUnreadCount(data.user.id);
    };

    loadUser();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notification-bell-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        async () => {
          await refreshNotificationData(userId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshNotificationData]);

  useEffect(() => {
    if (!open || !userId) return;

    loadLatestNotifications(userId);
  }, [open, userId, loadLatestNotifications]);

  const markOneRead = async (notificationId: string) => {
    if (!userId || updating) return;

    setUpdating(true);

    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    const target = notifications.find((item) => item.id === notificationId);
    const wasUnread = target ? !target.is_read : false;

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              is_read: true,
            }
          : item,
      ),
    );

    if (wasUnread) {
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("recipient_id", userId);

    if (error) {
      console.log("MARK NOTIFICATION READ ERROR:", error);
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }

    setUpdating(false);
  };

  const markAllRead = async () => {
    if (!userId || updating) return;

    setUpdating(true);

    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        is_read: true,
      })),
    );

    setUnreadCount(0);

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    if (error) {
      console.log("MARK ALL NOTIFICATIONS READ ERROR:", error);
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }

    setUpdating(false);
  };

  const handleOpenNotification = async (notification: NotificationRow) => {
    if (!notification.is_read) {
      await markOneRead(notification.id);
    }

    setOpen(false);
    router.push(notification.link_url || "/notifications");
  };

  if (!userId) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-full px-3 py-2 text-lg transition hover:bg-gray-100"
        aria-label="Notifications"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[90] w-[360px] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-gray-950">Notifications</h2>
              <p className="text-xs text-gray-500">
                {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={updating}
                className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loadingList ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleOpenNotification(notification)}
                  className={`block w-full border-b border-gray-50 px-5 py-4 text-left transition hover:bg-gray-50 ${
                    !notification.is_read ? "bg-blue-50/60" : "bg-white"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                      {typeEmoji(notification.notification_type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-gray-950">
                          {notification.title}
                        </p>

                        <span className="shrink-0 text-xs text-gray-400">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>

                      {notification.body && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600">
                          {notification.body}
                        </p>
                      )}

                      {!notification.is_read && (
                        <span className="mt-2 inline-flex rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/notifications");
            }}
            className="block w-full bg-gray-50 px-5 py-3 text-center text-sm font-bold text-blue-600 transition hover:bg-blue-100"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}