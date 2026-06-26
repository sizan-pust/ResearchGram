"use client";

import type { Dispatch, SetStateAction } from "react";
import AppNav from "@/components/AppNav";

export type Profile = {
  full_name: string | null;
  email: string | null;
  department?: string | null;
  profile_pic_url?: string | null;
};

export type Attachment = {
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

export type Comment = {
  id: string;
  content_id: string;
  user_id: string;
  comment_text: string;
  created_at: string | null;
  profiles?: Profile | null;
};

export type Post = {
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

type FeedUIProps = {
  loading: boolean;
  uploading: boolean;

  userId: string;
  fullName: string;

  title: string;
  content: string;
  postType: string;
  files: File[];

  posts: Post[];
  selectedFileNames: string[];

  commentDrafts: Record<string, string>;
  commentingPostId: string | null;

  savingPostId: string | null;
  openRequestPostId: string | null;
  requestDrafts: Record<string, string>;
  requestingPostId: string | null;

  setTitle: (value: string) => void;
  setContent: (value: string) => void;
  setPostType: (value: string) => void;
  setFiles: (files: File[]) => void;

  setCommentDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  setOpenRequestPostId: Dispatch<SetStateAction<string | null>>;
  setRequestDrafts: Dispatch<SetStateAction<Record<string, string>>>;

  handleCreatePost: () => void;
  handleCreateComment: (contentId: string) => void;
  handleToggleSave: (post: Post) => void;
  handleSendCollaborationRequest: (post: Post) => void;

  handleGoToWorkspace: () => void;
  handleGoToMentorship: () => void;
  handleGoToRecommendations: (postId: string) => void;
};

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

function AttachmentPreview({ att }: { att: Attachment }) {
  const publicUrl = att.file_url;

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

export default function FeedUI({
  loading,
  uploading,
  userId,
  fullName,
  title,
  content,
  postType,
  posts,
  selectedFileNames,
  commentDrafts,
  commentingPostId,
  savingPostId,
  openRequestPostId,
  requestDrafts,
  requestingPostId,
  setTitle,
  setContent,
  setPostType,
  setFiles,
  setCommentDrafts,
  setOpenRequestPostId,
  setRequestDrafts,
  handleCreatePost,
  handleCreateComment,
  handleToggleSave,
  handleSendCollaborationRequest,
  handleGoToWorkspace,
  handleGoToMentorship,
  handleGoToRecommendations,
}: FeedUIProps) {
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
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

            <p className="break-all text-xs text-gray-500">{userId}</p>
          </div>

          <button
            onClick={handleGoToWorkspace}
            className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open Project Workspace
          </button>

          <button
            onClick={handleGoToMentorship}
            className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Find Mentors
          </button>

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
                className="w-full rounded-2xl border border-gray-200 p-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <select
                className="w-full rounded-2xl border border-gray-200 p-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
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
                className="min-h-[140px] w-full rounded-2xl border border-gray-200 p-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
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
                      {post.attachments.map((att) => (
                        <AttachmentPreview key={att.id} att={att} />
                      ))}
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
                        ? `Saved${
                            post.save_count > 0 ? ` (${post.save_count})` : ""
                          }`
                        : `Save${
                            post.save_count > 0 ? ` (${post.save_count})` : ""
                          }`}
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
                        ? `Requested${
                            post.request_count > 0
                              ? ` (${post.request_count})`
                              : ""
                          }`
                        : `Request Collaboration${
                            post.request_count > 0
                              ? ` (${post.request_count})`
                              : ""
                          }`}
                  </button>

                  {post.user_id === userId && (
                    <button
                      onClick={() => handleGoToRecommendations(post.id)}
                      className="rounded-full bg-purple-50 px-4 py-2 font-medium text-purple-700 transition hover:bg-purple-100"
                    >
                      Find Collaborators
                    </button>
                  )}
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
                        className="mt-3 min-h-[90px] w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
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
                      className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
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