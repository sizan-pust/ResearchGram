"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import FeedUI, {
  type Attachment,
  type Comment,
  type Post,
} from "./UI";

const BUCKET_NAME = "content-files";

function detectAttachmentType(file: File) {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".doc") || name.endsWith(".docx") || mime.includes("word")) {
    return "document";
  }
  if (name.endsWith(".txt") || name.endsWith(".md") || mime.startsWith("text/")) {
    return "text";
  }
  if (
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    mime.includes("presentation")
  ) {
    return "presentation";
  }
  if (
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".csv") ||
    mime.includes("spreadsheet")
  ) {
    return "spreadsheet";
  }
  if (mime.startsWith("image/")) return "image";
  if (
    name.endsWith(".py") ||
    name.endsWith(".js") ||
    name.endsWith(".ts") ||
    name.endsWith(".java") ||
    name.endsWith(".cpp") ||
    name.endsWith(".c") ||
    name.endsWith(".cs") ||
    name.endsWith(".php") ||
    name.endsWith(".rb") ||
    name.endsWith(".go") ||
    name.endsWith(".rs")
  ) {
    return "code";
  }
  if (name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".7z")) {
    return "archive";
  }

  return "other";
}

export default function FeedClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("research_note");
  const [files, setFiles] = useState<File[]>([]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);

  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const [openRequestPostId, setOpenRequestPostId] = useState<string | null>(
    null,
  );
  const [requestDrafts, setRequestDrafts] = useState<Record<string, string>>({});
  const [requestingPostId, setRequestingPostId] = useState<string | null>(null);

  const selectedFileNames = useMemo(() => files.map((file) => file.name), [
    files,
  ]);

  const fetchPosts = async (activeUserId?: string) => {
    const { data: contents, error: contentError } = await supabase
      .from("contents")
      .select(
        "id, title, content, post_type, created_at, user_id, profiles:profiles(full_name, email, department, profile_pic_url)",
      )
      .order("created_at", { ascending: false });

    if (contentError) {
      console.log("FETCH CONTENTS ERROR:", contentError);
      return;
    }

    if (!contents || contents.length === 0) {
      setPosts([]);
      return;
    }

    const contentIds = contents.map((item) => item.id);

    const { data: attachments, error: attachmentError } = await supabase
      .from("content_attachments")
      .select("*")
      .in("content_id", contentIds)
      .order("created_at", { ascending: true });

    if (attachmentError) {
      console.log("FETCH ATTACHMENTS ERROR:", attachmentError);
      return;
    }

    const { data: comments, error: commentError } = await supabase
      .from("comments")
      .select(
        "id, content_id, user_id, comment_text, created_at, profiles:profiles(full_name, email, department, profile_pic_url)",
      )
      .in("content_id", contentIds)
      .order("created_at", { ascending: true });

    if (commentError) {
      console.log("FETCH COMMENTS ERROR:", commentError);
    }

    const { data: savedRows, error: savedError } = await supabase
      .from("saved_posts")
      .select("content_id, user_id")
      .in("content_id", contentIds);

    if (savedError) {
      console.log("FETCH SAVED POSTS ERROR:", savedError);
    }

    const { data: requestRows, error: requestError } = await supabase
      .from("research_requests")
      .select("content_id, requester_id, request_type")
      .in("content_id", contentIds)
      .eq("request_type", "collaboration");

    if (requestError) {
      console.log("FETCH REQUESTS ERROR:", requestError);
    }

    const attachmentMap: Record<string, Attachment[]> = {};

    (attachments || []).forEach((attachmentItem: any) => {
      const attachment = attachmentItem as Attachment;

      const publicUrl =
        supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(attachment.storage_path).data?.publicUrl ||
        attachment.file_url;

      if (!attachmentMap[attachment.content_id]) {
        attachmentMap[attachment.content_id] = [];
      }

      attachmentMap[attachment.content_id].push({
        ...attachment,
        file_url: publicUrl,
      });
    });

    const commentMap: Record<string, Comment[]> = {};

    (comments || []).forEach((comment: any) => {
      if (!commentMap[comment.content_id]) {
        commentMap[comment.content_id] = [];
      }

      commentMap[comment.content_id].push({
        id: comment.id,
        content_id: comment.content_id,
        user_id: comment.user_id,
        comment_text: comment.comment_text,
        created_at: comment.created_at,
        profiles: Array.isArray(comment.profiles)
          ? (comment.profiles[0] ?? null)
          : (comment.profiles ?? null),
      });
    });

    const saveCountMap: Record<string, number> = {};
    const userSavedSet = new Set<string>();

    (savedRows || []).forEach((save: any) => {
      saveCountMap[save.content_id] = (saveCountMap[save.content_id] || 0) + 1;

      if (activeUserId && save.user_id === activeUserId) {
        userSavedSet.add(save.content_id);
      }
    });

    const requestCountMap: Record<string, number> = {};
    const userRequestedSet = new Set<string>();

    (requestRows || []).forEach((request: any) => {
      requestCountMap[request.content_id] =
        (requestCountMap[request.content_id] || 0) + 1;

      if (activeUserId && request.requester_id === activeUserId) {
        userRequestedSet.add(request.content_id);
      }
    });

    const normalized = (contents as any[]).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      title: item.title,
      content: item.content,
      post_type: item.post_type,
      created_at: item.created_at,
      profiles: Array.isArray(item.profiles)
        ? (item.profiles[0] ?? null)
        : (item.profiles ?? null),
      attachments: attachmentMap[item.id] || [],
      comments: commentMap[item.id] || [],
      save_count: saveCountMap[item.id] || 0,
      is_saved: userSavedSet.has(item.id),
      request_count: requestCountMap[item.id] || 0,
      has_requested: userRequestedSet.has(item.id),
    })) as Post[];

    setPosts(normalized);
  };

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/auth/login");
        return;
      }

      setUserId(authData.user.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authData.user.id)
        .single();

      if (profileData) {
        setFullName(profileData.full_name || "");
      }

      await fetchPosts(authData.user.id);
      setLoading(false);
    };

    load();
  }, [router]);

  const handleCreatePost = async () => {
    if (!title.trim()) {
      alert("Add a title first");
      return;
    }

    if (!content.trim()) {
      alert("Write something first");
      return;
    }

    setUploading(true);

    const { data: insertedContent, error: insertError } = await supabase
      .from("contents")
      .insert({
        user_id: userId,
        title,
        content,
        post_type: postType,
      })
      .select("id")
      .single();

    if (insertError || !insertedContent) {
      console.log("INSERT CONTENT ERROR:", insertError);
      alert(insertError?.message || "Could not create post");
      setUploading(false);
      return;
    }

    const contentId = insertedContent.id;

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const attachmentType = detectAttachmentType(file);
        const storagePath = `uploads/${userId}/${contentId}/${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.log("UPLOAD ERROR:", uploadError);
          alert(uploadError.message);
          setUploading(false);
          return;
        }

        const { data: publicData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);

        const { error: attachmentInsertError } = await supabase
          .from("content_attachments")
          .insert({
            content_id: contentId,
            file_url: publicData.publicUrl,
            storage_path: storagePath,
            original_name: file.name,
            mime_type: file.type || null,
            file_ext: ext,
            file_size: file.size,
            attachment_type: attachmentType,
          });

        if (attachmentInsertError) {
          console.log("ATTACHMENT INSERT ERROR:", attachmentInsertError);
          alert(attachmentInsertError.message);
          setUploading(false);
          return;
        }
      }
    }

    setTitle("");
    setContent("");
    setPostType("research_note");
    setFiles([]);

    await fetchPosts(userId);
    setUploading(false);
  };

  const handleCreateComment = async (contentId: string) => {
    const commentText = commentDrafts[contentId]?.trim();

    if (!commentText) {
      alert("Write a comment first.");
      return;
    }

    if (!userId) {
      alert("You must be logged in to comment.");
      return;
    }

    setCommentingPostId(contentId);

    const { error } = await supabase.from("comments").insert({
      content_id: contentId,
      user_id: userId,
      comment_text: commentText,
    });

    if (error) {
      console.log("COMMENT INSERT ERROR:", error);
      alert(error.message);
      setCommentingPostId(null);
      return;
    }

    setCommentDrafts((prev) => ({
      ...prev,
      [contentId]: "",
    }));

    await fetchPosts(userId);
    setCommentingPostId(null);
  };

  const handleToggleSave = async (post: Post) => {
    if (!userId) {
      alert("You must be logged in to save posts.");
      return;
    }

    setSavingPostId(post.id);

    if (post.is_saved) {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", userId)
        .eq("content_id", post.id);

      if (error) {
        console.log("UNSAVE POST ERROR:", error);
        alert(error.message);
        setSavingPostId(null);
        return;
      }
    } else {
      const { error } = await supabase.from("saved_posts").insert({
        user_id: userId,
        content_id: post.id,
      });

      if (error) {
        console.log("SAVE POST ERROR:", error);
        alert(error.message);
        setSavingPostId(null);
        return;
      }
    }

    await fetchPosts(userId);
    setSavingPostId(null);
  };

  const handleSendCollaborationRequest = async (post: Post) => {
    if (!userId) {
      alert("You must be logged in to request collaboration.");
      return;
    }

    if (!post.user_id) {
      alert("This post does not have a valid author.");
      return;
    }

    if (post.user_id === userId) {
      alert("You cannot request collaboration on your own post.");
      return;
    }

    const message =
      requestDrafts[post.id]?.trim() ||
      "I am interested in collaborating on this research work.";

    setRequestingPostId(post.id);

    const { error } = await supabase.from("research_requests").insert({
      content_id: post.id,
      requester_id: userId,
      receiver_id: post.user_id,
      request_type: "collaboration",
      message,
      status: "pending",
    });

    if (error) {
      console.log("COLLABORATION REQUEST ERROR:", error);
      alert(error.message);
      setRequestingPostId(null);
      return;
    }

    setRequestDrafts((prev) => ({
      ...prev,
      [post.id]: "",
    }));

    setOpenRequestPostId(null);

    await fetchPosts(userId);
    setRequestingPostId(null);
  };

  return (
    <FeedUI
      loading={loading}
      uploading={uploading}
      userId={userId}
      fullName={fullName}
      title={title}
      content={content}
      postType={postType}
      files={files}
      posts={posts}
      selectedFileNames={selectedFileNames}
      commentDrafts={commentDrafts}
      commentingPostId={commentingPostId}
      savingPostId={savingPostId}
      openRequestPostId={openRequestPostId}
      requestDrafts={requestDrafts}
      requestingPostId={requestingPostId}
      setTitle={setTitle}
      setContent={setContent}
      setPostType={setPostType}
      setFiles={setFiles}
      setCommentDrafts={setCommentDrafts}
      setOpenRequestPostId={setOpenRequestPostId}
      setRequestDrafts={setRequestDrafts}
      handleCreatePost={handleCreatePost}
      handleCreateComment={handleCreateComment}
      handleToggleSave={handleToggleSave}
      handleSendCollaborationRequest={handleSendCollaborationRequest}
      handleGoToWorkspace={() => router.push("/workspace")}
      handleGoToMentorship={() => router.push("/mentorship")}
      handleGoToRecommendations={(postId) =>
        router.push(`/recommendations?postId=${postId}`)
      }
    />
  );
}