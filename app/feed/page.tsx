"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";

type Profile = {
  full_name: string | null;
  email: string | null;
  department?: string | null;
  profile_pic_url?: string | null;
};

type Attachment = {
  id: string;
  content_id: string;
  file_url: string;
  storage_path: string;
  original_name: string;
  mime_type: string | null;
  file_ext: string | null;
  file_size: number | null;
  attachment_type: string;
  created_at: string;
};

type Comment = {
  id: string;
  content_id: string;
  user_id: string;
  comment_text: string;
  created_at: string | null;
  profiles?: Profile | null;
};

type Post = {
  id: string;
  user_id: string | null;
  title: string | null;
  content: string | null;
  post_type: string | null;
  created_at: string | null;
  profiles?: Profile | null;
  attachments: Attachment[];
  comments: Comment[];
  save_count: number;
  is_saved: boolean;
  request_count: number;
  has_requested: boolean;
};

const BUCKET_NAME = "content-files";

const POST_TYPE_OPTIONS = [
  { label: "Research Note", value: "research_note" },
  { label: "Paper Draft", value: "paper_draft" },
  { label: "Published Paper", value: "published_paper" },
  { label: "Dataset", value: "dataset" },
  { label: "Presentation", value: "presentation" },
  { label: "Code / Project", value: "code_project" },
  { label: "Question", value: "question" },
  { label: "Announcement", value: "announcement" },
];

function formatPostTime(dateString: string | null) {
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
  } catch (error) {
    console.error("Time format error:", error);
    return "Unknown time";
  }
}
function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "Unknown size";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function detectAttachmentType(file: File) {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".doc") || name.endsWith(".docx") || mime.includes("word"))
    return "document";
  if (name.endsWith(".txt") || name.endsWith(".md") || mime.startsWith("text/"))
    return "text";
  if (
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    mime.includes("presentation")
  )
    return "presentation";
  if (
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".csv") ||
    mime.includes("spreadsheet")
  )
    return "spreadsheet";
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
  )
    return "code";
  if (name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".7z"))
    return "archive";

  return "other";
}

function attachmentEmoji(type: string) {
  switch (type) {
    case "pdf":
      return "📄";
    case "document":
      return "📝";
    case "text":
      return "📃";
    case "presentation":
      return "📊";
    case "spreadsheet":
      return "📈";
    case "image":
      return "🖼️";
    case "code":
      return "💻";
    case "archive":
      return "🗜️";
    default:
      return "📎";
  }
}
function AttachmentPreview({
  att,
  publicUrl,
}: {
  att: Attachment;
  publicUrl: string;
}) {
  const isImage =
    att.attachment_type === "image" || att.mime_type?.startsWith("image/");

  const isPdf =
    att.attachment_type === "pdf" ||
    att.mime_type === "application/pdf" ||
    att.file_ext === "pdf";

  if (isImage) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        <a href={publicUrl} target="_blank" rel="noreferrer">
          <img
            src={publicUrl}
            alt={att.original_name || "Research attachment"}
            className="max-h-[420px] w-full object-cover transition hover:opacity-95"
          />
        </a>

        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {att.original_name || "Image attachment"}
            </p>
            <p className="text-xs text-gray-500">
              Image • {formatFileSize(att.file_size)}
            </p>
          </div>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            Open
          </a>
        </div>
      </div>
    );
  }

  return (
    <a
      href={publicUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
          {attachmentEmoji(att.attachment_type)}
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">
            {att.original_name || "Research attachment"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isPdf ? "PDF document" : att.attachment_type || "File"} •{" "}
            {formatFileSize(att.file_size)}
          </p>
        </div>
      </div>

      <span className="ml-4 shrink-0 text-sm font-semibold text-blue-600">
        Open
      </span>
    </a>
  );
}

export default function FeedPage() {
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
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const [openRequestPostId, setOpenRequestPostId] = useState<string | null>(
    null,
  );
  const [requestDrafts, setRequestDrafts] = useState<Record<string, string>>(
    {},
  );
  const [requestingPostId, setRequestingPostId] = useState<string | null>(null);

  const selectedFileNames = useMemo(() => files.map((f) => f.name), [files]);

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

    (attachments || []).forEach((attachment) => {
      if (!attachmentMap[attachment.content_id]) {
        attachmentMap[attachment.content_id] = [];
      }
      attachmentMap[attachment.content_id].push(attachment as Attachment);
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

    const normalized = (contents as any[]).map((d) => ({
      id: d.id,
      user_id: d.user_id,
      title: d.title,
      content: d.content,
      post_type: d.post_type,
      created_at: d.created_at,
      profiles: Array.isArray(d.profiles)
        ? (d.profiles[0] ?? null)
        : (d.profiles ?? null),
      attachments: attachmentMap[d.id] || [],
      comments: commentMap[d.id] || [],
      save_count: saveCountMap[d.id] || 0,
      is_saved: userSavedSet.has(d.id),
      request_count: requestCountMap[d.id] || 0,
      has_requested: userRequestedSet.has(d.id),
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading feed...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <AppNav activePage="feed" />
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-6">
        <aside className="col-span-12 hidden rounded-2xl bg-white p-5 shadow-sm lg:col-span-3 lg:block">
          <h2 className="text-xl font-bold text-gray-900">ResearchGram</h2>
          <p className="mt-2 text-sm text-gray-600">
            Share research ideas, papers, datasets, code, and updates.
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-800">
              {fullName || "No name set"}
            </p>
            <p className="text-xs text-gray-500 break-all">{userId}</p>
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>• Research paper posts</p>
            <p>• Dataset uploads</p>
            <p>• Manuscript sharing</p>
            <p>• Code and figures</p>
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">News Feed</h1>
            <p className="mt-1 text-sm text-gray-500">
              Post a research update with documents, data, or code attachments.
            </p>

            <div className="mt-5 space-y-4">
              <input
                className="w-full rounded-2xl border border-gray-200 p-4 text-gray-900 placeholder:text-gray-400 outline-none focus:border-black"
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <select
                className="w-full rounded-2xl border border-gray-200 p-4 text-gray-900 placeholder:text-gray-400 outline-none focus:border-black"
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
              >
                {POST_TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <textarea
                className="min-h-[140px] w-full rounded-2xl border border-gray-200 p-4 text-gray-900 placeholder:text-gray-400 outline-none focus:border-black"
                placeholder="Write your research update, abstract, or note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.rar,.7z,image/*,.py,.js,.ts,.java,.cpp,.c,.cs,.php,.rb,.go,.rs"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full rounded-xl border border-gray-200 p-3 text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-700"
              />

              {selectedFileNames.length > 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Selected files
                  </p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {selectedFileNames.map((name) => (
                      <li key={name}>• {name}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleCreatePost}
                disabled={uploading}
                className="rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                      {post.profiles?.profile_pic_url ? (
                        <img
                          src={post.profiles.profile_pic_url}
                          alt={post.profiles?.full_name || "Profile photo"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-blue-700">
                          {(post.profiles?.full_name || "R")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {post.profiles?.full_name || "ResearchGram User"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {post.profiles?.department || "Research community"} ·{" "}
                        {formatPostTime(post.created_at)}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                    {(post.post_type ?? "research_update").replaceAll("_", " ")}
                  </span>
                </div>

                <h3 className="text-xl font-bold leading-snug text-gray-950">
                  {post.title || "Untitled research post"}
                </h3>

                <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
                  {post.content || "No description provided."}
                </p>

                {post.attachments.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">
                        Research files ({post.attachments.length})
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF · images · datasets · code
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {post.attachments.map((att) => {
                        const publicUrl =
                          supabase.storage
                            .from(BUCKET_NAME)
                            .getPublicUrl(att.storage_path).data?.publicUrl ||
                          att.file_url;

                        return (
                          <AttachmentPreview
                            key={att.id}
                            att={att}
                            publicUrl={publicUrl}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4 text-sm">
                  <button
                    onClick={() => handleToggleSave(post)}
                    disabled={savingPostId === post.id}
                    className={`rounded-full px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      post.is_saved
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {savingPostId === post.id
                      ? "Saving..."
                      : post.is_saved
                        ? `Saved${post.save_count > 0 ? ` (${post.save_count})` : ""}`
                        : `Save${post.save_count > 0 ? ` (${post.save_count})` : ""}`}
                  </button>

                  <button className="rounded-full bg-blue-50 px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-100">
                    Discuss
                  </button>

                  <button
                    onClick={() => {
                      if (post.user_id === userId) {
                        alert("This is your own post.");
                        return;
                      }

                      if (post.has_requested) {
                        return;
                      }

                      setOpenRequestPostId((current) =>
                        current === post.id ? null : post.id,
                      );
                    }}
                    disabled={post.user_id === userId || post.has_requested}
                    className={`rounded-full px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      post.has_requested
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {post.user_id === userId
                      ? "Your Post"
                      : post.has_requested
                        ? `Requested${post.request_count > 0 ? ` (${post.request_count})` : ""}`
                        : `Request Collaboration${post.request_count > 0 ? ` (${post.request_count})` : ""}`}
                  </button>
                </div>
                {openRequestPostId === post.id &&
                  !post.has_requested &&
                  post.user_id !== userId && (
                    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-sm font-semibold text-blue-900">
                        Send a collaboration request
                      </p>

                      <p className="mt-1 text-xs text-blue-700">
                        Introduce your interest, skills, or how you want to
                        contribute.
                      </p>

                      <textarea
                        value={requestDrafts[post.id] || ""}
                        onChange={(e) =>
                          setRequestDrafts((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        placeholder="Example: I am interested in your dataset and would like to collaborate on model evaluation..."
                        className="mt-3 min-h-[90px] w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
                      />

                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => setOpenRequestPostId(null)}
                          className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-white"
                        >
                          Cancel
                        </button>

                        <button
                          onClick={() => handleSendCollaborationRequest(post)}
                          disabled={requestingPostId === post.id}
                          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {requestingPostId === post.id
                            ? "Sending..."
                            : "Send Request"}
                        </button>
                      </div>
                    </div>
                  )}
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Discussion ({post.comments.length})
                    </h4>
                    <span className="text-xs text-gray-400">
                      Ask questions, share feedback, or suggest collaboration
                    </span>
                  </div>

                  {post.comments.length > 0 && (
                    <div className="mb-4 space-y-3">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                            {comment.profiles?.profile_pic_url ? (
                              <img
                                src={comment.profiles.profile_pic_url}
                                alt={
                                  comment.profiles?.full_name ||
                                  "Comment author"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-blue-700">
                                {(comment.profiles?.full_name || "R")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 rounded-2xl bg-gray-50 px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {comment.profiles?.full_name ||
                                  "ResearchGram User"}
                              </p>
                              <span className="text-xs text-gray-400">
                                {formatPostTime(comment.created_at)}
                              </span>
                            </div>

                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                              {comment.comment_text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <input
                      value={commentDrafts[post.id] || ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      placeholder="Write a research discussion comment..."
                      className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
                    />

                    <button
                      onClick={() => handleCreateComment(post.id)}
                      disabled={commentingPostId === post.id}
                      className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {commentingPostId === post.id ? "Posting..." : "Comment"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="col-span-12 rounded-2xl bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="text-lg font-bold text-gray-900">Trending</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p>#AI</p>
            <p>#MachineLearning</p>
            <p>#IoT</p>
            <p>#FinalYearProject</p>
            <p>#ResearchPaper</p>
            <p>#Dataset</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
