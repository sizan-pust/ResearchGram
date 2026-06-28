import { supabase } from "@/lib/supabase";

export type NotificationType =
  | "collaboration_request"
  | "profile_request"
  | "paper_access_request"
  | "request_accepted"
  | "request_declined"
  | "paper_access_approved"
  | "paper_access_rejected"
  | "comment"
  | "system";

type CreateNotificationInput = {
  recipientId: string | null | undefined;
  actorId: string | null | undefined;
  notificationType: NotificationType;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
  contentId?: string | null;
  requestId?: string | null;
  requestKind?: string | null;
  metadata?: Record<string, unknown>;
};

export async function createNotification({
  recipientId,
  actorId,
  notificationType,
  title,
  body = null,
  linkUrl = null,
  contentId = null,
  requestId = null,
  requestKind = null,
  metadata = {},
}: CreateNotificationInput) {
  if (!recipientId || !actorId) {
    return { error: null };
  }

  if (recipientId === actorId) {
    return { error: null };
  }

  const { error } = await supabase.from("notifications").insert({
    recipient_id: recipientId,
    actor_id: actorId,
    notification_type: notificationType,
    title,
    body,
    link_url: linkUrl,
    content_id: contentId,
    request_id: requestId,
    request_kind: requestKind,
    is_read: false,
    metadata,
  });

  if (error) {
    console.log("CREATE NOTIFICATION ERROR:", error);
  }

  return { error };
}