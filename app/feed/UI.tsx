"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import AppNav from "@/components/AppNav";
import FileViewerModal, { type ViewerFile } from "@/components/FileViewerModal";
import ProfileHoverCard from "@/components/ProfileHoverCard";

export type Profile = {
  full_name: string | null;
  email: string | null;
  department?: string | null;
  profile_pic_url?: string | null;
};

export type PlatformAuthor = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  profile_pic_url: string | null;
};

export type ContentAuthor = {
  id: string;
  content_id: string;
  profile_id: string | null;
  manual_name: string | null;
  author_order: number;
  author_role: string;
  profile: PlatformAuthor | null;
};

export type PaperAccessRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | null;

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

  bucket_name?: string | null;
  access_level?: string | null;
  file_role?: string | null;
  is_full_paper?: boolean | null;
  is_preview_file?: boolean | null;
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
  abstract: string | null;
  content_category: string | null;
  visibility_mode: string | null;
  full_paper_access_mode: string | null;
  allow_full_paper_request: boolean;
  doi: string | null;
  keywords: string | null;
  publication_status: string | null;
  publisher_name: string | null;
  publication_date: string | null;
  post_type: string | null;
  created_at: string | null;
  profiles?: Profile | null;
  attachments: Attachment[];
  authors: ContentAuthor[];
  comments: Comment[];
  save_count: number;
  is_saved: boolean;
  request_count: number;
  has_requested: boolean;
  paper_access_request_status: PaperAccessRequestStatus;
  has_full_paper_access: boolean;
};

type FeedUIProps = {
  loading: boolean;
  uploading: boolean;

  userId: string;
  fullName: string;

  title: string;
  content: string;
  abstract: string;
  postType: string;
  contentCategory: string;
  visibilityMode: string;
  fullPaperAccessMode: string;
  doi: string;
  keywords: string;
  fullPaperFile: File | null;

  posts: Post[];
  selectedFileNames: string[];

  coAuthorSearch: string;
  authorSuggestions: PlatformAuthor[];
  selectedPlatformAuthors: PlatformAuthor[];
  manualAuthorName: string;
  manualAuthors: string[];

  commentDrafts: Record<string, string>;
  commentingPostId: string | null;

  savingPostId: string | null;
  openRequestPostId: string | null;
  requestDrafts: Record<string, string>;
  requestingPostId: string | null;

  openPaperAccessPostId: string | null;
  paperAccessRequestDrafts: Record<string, string>;
  paperAccessRequestingPostId: string | null;

  setTitle: (value: string) => void;
  setContent: (value: string) => void;
  setAbstract: (value: string) => void;
  setPostType: (value: string) => void;
  setContentCategory: (value: string) => void;
  setVisibilityMode: (value: string) => void;
  setFullPaperAccessMode: (value: string) => void;
  setDoi: (value: string) => void;
  setKeywords: (value: string) => void;
  setFiles: (files: File[]) => void;
  setFullPaperFile: (file: File | null) => void;

  setCoAuthorSearch: (value: string) => void;
  setManualAuthorName: (value: string) => void;

  setCommentDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  setOpenRequestPostId: Dispatch<SetStateAction<string | null>>;
  setRequestDrafts: Dispatch<SetStateAction<Record<string, string>>>;

  setOpenPaperAccessPostId: Dispatch<SetStateAction<string | null>>;
  setPaperAccessRequestDrafts: Dispatch<SetStateAction<Record<string, string>>>;

  handleAddPlatformAuthor: (profile: PlatformAuthor) => void;
  handleRemovePlatformAuthor: (profileId: string) => void;
  handleAddManualAuthor: () => void;
  handleRemoveManualAuthor: (name: string) => void;

  handleCreatePost: () => void;
  handleCreateComment: (contentId: string) => void;
  handleToggleSave: (post: Post) => void;
  handleSendCollaborationRequest: (post: Post) => void;
  handleRequestFullPaperAccess: (post: Post) => void;
  handleCopyPostLink: (post: Post) => void;
  handleHidePost: (post: Post) => void;
  handleReportPost: (
    post: Post,
    reason: string,
    details: string,
  ) => Promise<void> | void;

  handleGoToWorkspace: () => void;
  handleGoToMentorship: () => void;
  handleGoToResearcher: (profileId: string) => void;
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

const CONTENT_CATEGORY_OPTIONS = [
  { label: "General Post", value: "general_post" },
  { label: "Research Paper", value: "research_paper" },
  { label: "Article", value: "article" },
  { label: "Dataset", value: "dataset" },
  { label: "Presentation", value: "presentation" },
  { label: "Code Project", value: "code_project" },
  { label: "Question", value: "question" },
  { label: "Announcement", value: "announcement" },
];

const VISIBILITY_OPTIONS = [
  {
    label: "Public - everyone can view full post",
    value: "public",
  },
  {
    label: "Abstract only - public sees abstract first",
    value: "abstract_only",
  },
  {
    label: "Private - limited visibility",
    value: "private",
  },
];

const PAPER_ACCESS_OPTIONS = [
  {
    label: "Public full paper",
    value: "public",
  },
  {
    label: "Request required for full paper",
    value: "request_required",
  },
  {
    label: "Private full paper",
    value: "private",
  },
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

function formatLabel(value: string | null | undefined) {
  return (value || "general_post").replaceAll("_", " ");
}

function getAuthorName(author: ContentAuthor) {
  return (
    author.profile?.full_name ||
    author.profile?.email?.split("@")[0] ||
    author.manual_name ||
    "Unnamed author"
  );
}

function getAuthorInitial(author: ContentAuthor) {
  return getAuthorName(author).charAt(0).toUpperCase();
}

function getPlatformAuthorName(author: PlatformAuthor) {
  return author.full_name || author.email?.split("@")[0] || "ResearchGram User";
}
function attachmentToViewerFile(att: Attachment): ViewerFile {
  return {
    id: att.id,
    url: att.file_url,
    name: att.original_name || "Research file",
    mime_type: att.mime_type,
    file_ext: att.file_ext,
    attachment_type: att.attachment_type,
    file_size: att.file_size,
  };
}

function AttachmentPreview({
  att,
  onOpen,
}: {
  att: Attachment;
  onOpen: () => void;
}) {
  const publicUrl = att.file_url;
  const isRestricted = att.access_level === "restricted";
  const isFullPaper = Boolean(att.is_full_paper);

  const isImage =
    att.attachment_type === "image" || att.mime_type?.startsWith("image/");

  const isPdf =
    att.attachment_type === "pdf" ||
    att.mime_type === "application/pdf" ||
    att.file_ext === "pdf";

  if (isRestricted && !publicUrl) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
            🔒
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-amber-900">
              {att.original_name || "Restricted full paper"}
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Full paper access is restricted. Request access to view or
              download this file.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isImage) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 text-left"
      >
        <img
          src={publicUrl}
          alt={att.original_name || "Research attachment"}
          className="max-h-[420px] w-full object-cover transition hover:opacity-95"
        />

        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {att.original_name || "Image attachment"}
            </p>

            <p className="text-xs text-gray-500">
              Image • {formatFileSize(att.file_size)}
            </p>
          </div>

          <span className="text-sm font-semibold text-blue-600">Open</span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
        isFullPaper
          ? "border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
          : "border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
          {isFullPaper ? "📘" : attachmentEmoji(att.attachment_type)}
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">
            {att.original_name || "Research attachment"}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {isFullPaper
              ? "Full paper"
              : isPdf
                ? "PDF document"
                : att.attachment_type || "File"}{" "}
            • {formatFileSize(att.file_size)}
          </p>
        </div>
      </div>

      <span className="ml-4 shrink-0 text-sm font-semibold text-blue-600">
        Open
      </span>
    </button>
  );
}

export default function FeedUI({
  loading,
  uploading,
  userId,
  fullName,
  title,
  content,
  abstract,
  postType,
  contentCategory,
  visibilityMode,
  fullPaperAccessMode,
  doi,
  keywords,
  fullPaperFile,
  posts,
  selectedFileNames,
  coAuthorSearch,
  authorSuggestions,
  selectedPlatformAuthors,
  manualAuthorName,
  manualAuthors,
  commentDrafts,
  commentingPostId,
  savingPostId,
  openRequestPostId,
  requestDrafts,
  requestingPostId,
  openPaperAccessPostId,
  paperAccessRequestDrafts,
  paperAccessRequestingPostId,
  setTitle,
  setContent,
  setAbstract,
  setPostType,
  setContentCategory,
  setVisibilityMode,
  setFullPaperAccessMode,
  setDoi,
  setKeywords,
  setFiles,
  setFullPaperFile,
  setCoAuthorSearch,
  setManualAuthorName,
  setCommentDrafts,
  setOpenRequestPostId,
  setRequestDrafts,
  setOpenPaperAccessPostId,
  setPaperAccessRequestDrafts,
  handleAddPlatformAuthor,
  handleRemovePlatformAuthor,
  handleAddManualAuthor,
  handleRemoveManualAuthor,
  handleCreatePost,
  handleCreateComment,
  handleToggleSave,
  handleSendCollaborationRequest,
  handleRequestFullPaperAccess,
  handleCopyPostLink,
  handleHidePost,
  handleReportPost,
  handleGoToWorkspace,
  handleGoToMentorship,
  handleGoToResearcher,
  handleGoToRecommendations,
}: FeedUIProps) {
  const isPaperPost = contentCategory === "research_paper";
  const [linkedPostId, setLinkedPostId] = useState<string | null>(null);
  const [viewerFiles, setViewerFiles] = useState<ViewerFile[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);

  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");

  const openFileViewer = (attachments: Attachment[], attachmentId: string) => {
    const files = attachments
      .filter((att) => Boolean(att.file_url))
      .map(attachmentToViewerFile);

    const index = files.findIndex((file) => file.id === attachmentId);

    if (files.length === 0 || index < 0) return;

    setViewerFiles(files);
    setViewerIndex(index);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get("post");

    if (!postId) return;

    setLinkedPostId(postId);

    const timeout = window.setTimeout(() => {
      const element = document.getElementById(`post-${postId}`);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [posts.length]);

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
            Share research papers, articles, datasets, code, and academic
            updates.
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
            <p>• Research paper publishing</p>
            <p>• Controlled full paper access</p>
            <p>• Co-author support</p>
            <p>• Dataset and code sharing</p>
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">News Feed</h1>

            <p className="mt-1 text-sm text-gray-500">
              Publish research content with controlled access and co-author
              information.
            </p>

            <div className="mt-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Content Category
                  </label>
                  <select
                    className="w-full rounded-2xl border border-gray-200 p-4 text-gray-900 outline-none focus:border-black"
                    value={contentCategory}
                    onChange={(e) => {
                      const value = e.target.value;
                      setContentCategory(value);

                      if (value === "research_paper") {
                        setPostType("paper_draft");
                        setVisibilityMode("abstract_only");
                        setFullPaperAccessMode("request_required");
                      }

                      if (value !== "research_paper") {
                        setVisibilityMode("public");
                        setFullPaperAccessMode("public");
                        setFullPaperFile(null);
                      }
                    }}
                  >
                    {CONTENT_CATEGORY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Post Type
                  </label>
                  <select
                    className="w-full rounded-2xl border border-gray-200 p-4 text-gray-900 outline-none focus:border-black"
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                  >
                    {POST_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <input
                className="w-full rounded-2xl border border-gray-200 p-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
                placeholder={isPaperPost ? "Paper title" : "Post title"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              {isPaperPost && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-bold text-blue-900">
                    Research paper publishing mode
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    You can publish the abstract publicly and keep the full
                    paper protected. Readers can request full paper access.
                  </p>

                  <div className="mt-4 grid gap-3">
                    <textarea
                      className="min-h-[130px] w-full rounded-2xl border border-blue-100 bg-white p-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
                      placeholder="Write the paper abstract. This will be publicly visible."
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        value={visibilityMode}
                        onChange={(e) => setVisibilityMode(e.target.value)}
                        className="w-full rounded-2xl border border-blue-100 bg-white p-4 text-sm text-gray-900 outline-none focus:border-blue-500"
                      >
                        {VISIBILITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={fullPaperAccessMode}
                        onChange={(e) => setFullPaperAccessMode(e.target.value)}
                        className="w-full rounded-2xl border border-blue-100 bg-white p-4 text-sm text-gray-900 outline-none focus:border-blue-500"
                      >
                        {PAPER_ACCESS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={doi}
                        onChange={(e) => setDoi(e.target.value)}
                        placeholder="DOI / paper link optional"
                        className="w-full rounded-2xl border border-blue-100 bg-white p-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
                      />

                      <input
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="Keywords, e.g. AI, NLP, IoT"
                        className="w-full rounded-2xl border border-blue-100 bg-white p-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-blue-800">
                        Full paper file
                      </label>

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) =>
                          setFullPaperFile(e.target.files?.[0] || null)
                        }
                        className="w-full rounded-xl border border-blue-100 bg-white p-3 text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
                      />

                      {fullPaperFile && (
                        <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-blue-800">
                          Selected full paper: {fullPaperFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <textarea
                className="min-h-[140px] w-full rounded-2xl border border-gray-200 p-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
                placeholder={
                  isPaperPost
                    ? "Optional: write additional notes, summary, contribution, or publication details..."
                    : "Write your research update, article, dataset description, or note..."
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-bold text-gray-800">Co-authors</p>

                <p className="mt-1 text-xs text-gray-500">
                  Add co-authors by searching existing ResearchGram profiles or
                  manually typing external author names.
                </p>

                <div className="mt-4">
                  <input
                    value={coAuthorSearch}
                    onChange={(e) => setCoAuthorSearch(e.target.value)}
                    placeholder="Search co-author by name, email, or department"
                    className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
                  />

                  {authorSuggestions.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                      {authorSuggestions.map((author) => (
                        <button
                          key={author.id}
                          onClick={() => handleAddPlatformAuthor(author)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
                        >
                          <div className="h-9 w-9 overflow-hidden rounded-full bg-blue-100">
                            {author.profile_pic_url ? (
                              <img
                                src={author.profile_pic_url}
                                alt={getPlatformAuthorName(author)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-blue-700">
                                {getPlatformAuthorName(author)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {getPlatformAuthorName(author)}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {author.department || author.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={manualAuthorName}
                    onChange={(e) => setManualAuthorName(e.target.value)}
                    placeholder="Type external co-author name"
                    className="flex-1 rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
                  />

                  <button
                    onClick={handleAddManualAuthor}
                    className="rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
                  >
                    Add
                  </button>
                </div>

                {(selectedPlatformAuthors.length > 0 ||
                  manualAuthors.length > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedPlatformAuthors.map((author) => (
                      <span
                        key={author.id}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                      >
                        {getPlatformAuthorName(author)}
                        <button
                          onClick={() => handleRemovePlatformAuthor(author.id)}
                          className="text-blue-500 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {manualAuthors.map((authorName) => (
                      <span
                        key={authorName}
                        className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700"
                      >
                        {authorName}
                        <button
                          onClick={() => handleRemoveManualAuthor(authorName)}
                          className="text-purple-500 hover:text-purple-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {!isPaperPost && (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Upload files
                    </label>

                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.rar,.7z,image/*,.py,.js,.ts,.java,.cpp,.c,.cs,.php,.rb,.go,.rs"
                      onChange={(e) =>
                        setFiles(Array.from(e.target.files || []))
                      }
                      className="w-full rounded-xl border border-gray-200 p-3 text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-700"
                    />
                  </div>

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
                </>
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
            {posts.map((post) => {
              const isOwner = post.user_id === userId;
              const isResearchPaper =
                post.content_category === "research_paper";
              const isAbstractOnly =
                post.visibility_mode === "abstract_only" &&
                isResearchPaper &&
                !post.has_full_paper_access &&
                !isOwner;

              const publicAttachments = post.attachments.filter(
                (att) => !att.is_full_paper,
              );

              const fullPaperAttachments = post.attachments.filter(
                (att) => att.is_full_paper,
              );
              const allViewableAttachments = [
                ...publicAttachments,
                ...fullPaperAttachments,
              ].filter((att) => Boolean(att.file_url));
              const shouldShowPaperAccessButton =
                isResearchPaper &&
                post.allow_full_paper_request &&
                !isOwner &&
                !post.has_full_paper_access;

              return (
                <div
                  id={`post-${post.id}`}
                  key={post.id}
                  className={`rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                    linkedPostId === post.id
                      ? "border-blue-300 ring-4 ring-blue-100"
                      : "border-gray-100"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <ProfileHoverCard
                        profileId={post.user_id}
                        fullName={post.profiles?.full_name}
                        email={post.profiles?.email}
                        department={post.profiles?.department}
                        profilePicUrl={post.profiles?.profile_pic_url}
                        subtitle={
                          isResearchPaper
                            ? "This researcher published a research paper. View profile for skills, interests, and recent academic activity."
                            : "View this researcher's academic profile, skills, interests, and recent posts."
                        }
                        onViewProfile={handleGoToResearcher}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            post.user_id && handleGoToResearcher(post.user_id)
                          }
                          className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100"
                        >
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
                        </button>
                      </ProfileHoverCard>

                      <div>
                        <ProfileHoverCard
                          profileId={post.user_id}
                          fullName={post.profiles?.full_name}
                          email={post.profiles?.email}
                          department={post.profiles?.department}
                          profilePicUrl={post.profiles?.profile_pic_url}
                          subtitle={
                            isResearchPaper
                              ? "This researcher published a research paper. View profile for skills, interests, and recent academic activity."
                              : "View this researcher's academic profile, skills, interests, and recent posts."
                          }
                          onViewProfile={handleGoToResearcher}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              post.user_id && handleGoToResearcher(post.user_id)
                            }
                            className="font-semibold text-gray-900 hover:text-blue-700 hover:underline"
                          >
                            {post.profiles?.full_name || "ResearchGram User"}
                          </button>
                        </ProfileHoverCard>

                        <p className="text-xs text-gray-500">
                          {post.profiles?.department || "Research community"} ·{" "}
                          {formatPostTime(post.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="relative flex flex-wrap justify-end gap-2">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-700">
                        {formatLabel(post.content_category)}
                      </span>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                        {formatLabel(post.post_type)}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenPostMenuId((current) =>
                            current === post.id ? null : post.id,
                          )
                        }
                        className="rounded-full bg-gray-50 px-3 py-1 text-sm font-bold text-gray-600 transition hover:bg-gray-100"
                      >
                        ⋯
                      </button>

                      {openPostMenuId === post.id && (
                        <div className="absolute right-0 top-9 z-20 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              handleCopyPostLink(post);
                              setOpenPostMenuId(null);
                            }}
                            className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            Copy post link
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReportingPost(post);
                              setReportReason("spam");
                              setReportDetails("");
                              setOpenPostMenuId(null);
                            }}
                            className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            Report post
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleHidePost(post);
                              setOpenPostMenuId(null);
                            }}
                            className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            Hide post
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold leading-snug text-gray-950">
                    {post.title || "Untitled research post"}
                  </h3>

                  {post.authors.length > 0 && (
                    <div className="mt-3 rounded-2xl bg-gray-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Co-authors
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {post.authors.map((author) => (
                          <span
                            key={author.id}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm"
                          >
                            {author.profile ? (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                                {getAuthorInitial(author)}
                              </span>
                            ) : (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">
                                {getAuthorInitial(author)}
                              </span>
                            )}
                            {getAuthorName(author)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isResearchPaper && (
                    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-blue-700">
                          {formatLabel(post.visibility_mode)}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-indigo-700">
                          Full paper: {formatLabel(post.full_paper_access_mode)}
                        </span>

                        {post.paper_access_request_status && (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold capitalize text-yellow-700">
                            Access request {post.paper_access_request_status}
                          </span>
                        )}

                        {post.has_full_paper_access && !isOwner && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            Full access approved
                          </span>
                        )}
                      </div>

                      {post.abstract && (
                        <div className="mt-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                            Abstract
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-blue-950">
                            {post.abstract}
                          </p>
                        </div>
                      )}

                      {(post.doi || post.keywords) && (
                        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                          {post.doi && (
                            <p className="rounded-xl bg-white px-3 py-2 text-blue-900">
                              <span className="font-bold">DOI/Link:</span>{" "}
                              {post.doi}
                            </p>
                          )}

                          {post.keywords && (
                            <p className="rounded-xl bg-white px-3 py-2 text-blue-900">
                              <span className="font-bold">Keywords:</span>{" "}
                              {post.keywords}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!isAbstractOnly && (
                    <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
                      {post.content || "No description provided."}
                    </p>
                  )}

                  {isAbstractOnly && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-semibold text-amber-900">
                        Full paper details are protected
                      </p>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        Only the abstract is public. Request full paper access
                        to view the full file and additional details.
                      </p>
                    </div>
                  )}

                  {publicAttachments.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">
                          Preview files ({publicAttachments.length})
                        </p>

                        <p className="text-xs text-gray-400">
                          PDF · images · datasets · code
                        </p>
                      </div>

                      <div className="grid gap-3">
                        {publicAttachments.map((att) => (
                          <AttachmentPreview
                            key={att.id}
                            att={att}
                            onOpen={() =>
                              openFileViewer(allViewableAttachments, att.id)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {fullPaperAttachments.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">
                          Full paper file
                        </p>

                        <p className="text-xs text-gray-400">
                          {post.has_full_paper_access || isOwner
                            ? "Accessible"
                            : "Restricted"}
                        </p>
                      </div>

                      <div className="grid gap-3">
                        {fullPaperAttachments.map((att) => (
                          <AttachmentPreview
                            key={att.id}
                            att={att}
                            onOpen={() =>
                              openFileViewer(allViewableAttachments, att.id)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {shouldShowPaperAccessButton && (
                    <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-indigo-950">
                            Need the full paper?
                          </p>
                          <p className="mt-1 text-sm text-indigo-700">
                            Send an access request to the author.
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            if (post.paper_access_request_status) return;

                            setOpenPaperAccessPostId((current) =>
                              current === post.id ? null : post.id,
                            );
                          }}
                          disabled={Boolean(post.paper_access_request_status)}
                          className={`rounded-full px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                            post.paper_access_request_status
                              ? "bg-green-50 text-green-700"
                              : "bg-indigo-700 text-white hover:bg-indigo-800"
                          }`}
                        >
                          {post.paper_access_request_status
                            ? `Request ${post.paper_access_request_status}`
                            : "Request Full Paper Access"}
                        </button>
                      </div>

                      {openPaperAccessPostId === post.id &&
                        !post.paper_access_request_status && (
                          <div className="mt-4">
                            <textarea
                              value={paperAccessRequestDrafts[post.id] || ""}
                              onChange={(e) =>
                                setPaperAccessRequestDrafts((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder="Explain why you need full paper access..."
                              className="min-h-[90px] w-full rounded-2xl border border-indigo-100 bg-white p-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-indigo-500"
                            />

                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                onClick={() => setOpenPaperAccessPostId(null)}
                                className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-white"
                              >
                                Cancel
                              </button>

                              <button
                                onClick={() =>
                                  handleRequestFullPaperAccess(post)
                                }
                                disabled={
                                  paperAccessRequestingPostId === post.id
                                }
                                className="rounded-full bg-indigo-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {paperAccessRequestingPostId === post.id
                                  ? "Sending..."
                                  : "Send Access Request"}
                              </button>
                            </div>
                          </div>
                        )}
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
                        {commentingPostId === post.id
                          ? "Posting..."
                          : "Comment"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
      <FileViewerModal
        open={viewerFiles.length > 0}
        files={viewerFiles}
        currentIndex={viewerIndex}
        onChangeIndex={setViewerIndex}
        onClose={() => {
          setViewerFiles([]);
          setViewerIndex(0);
        }}
      />

      {reportingPost && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-950">Report post</h2>

            <p className="mt-2 text-sm text-gray-500">
              Tell us why this post should be reviewed.
            </p>

            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-5 w-full rounded-2xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-blue-500"
            >
              <option value="spam">Spam or misleading</option>
              <option value="abuse">Abuse or harassment</option>
              <option value="copyright">Copyright concern</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="other">Other</option>
            </select>

            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Add optional details..."
              className="mt-3 min-h-[120px] w-full rounded-2xl border border-gray-200 p-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setReportingPost(null);
                  setReportReason("spam");
                  setReportDetails("");
                }}
                className="rounded-full px-5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  await handleReportPost(
                    reportingPost,
                    reportReason,
                    reportDetails,
                  );

                  setReportingPost(null);
                  setReportReason("spam");
                  setReportDetails("");
                }}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Submit report
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
