"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

type Post = {
  id: string;
  title: string | null;
  content: string | null;
  post_type: string | null;
  created_at: string | null;
  profiles?: Profile | null;
  attachments: Attachment[];
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
  if (!dateString) return 'Unknown time'

  try {
    const date = new Date(dateString)
    const now = new Date()

    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} min ago`
    if (diffHours < 24) return `${diffHours} hr ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  } catch (error) {
    console.error('Time format error:', error)
    return 'Unknown time'
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

  const selectedFileNames = useMemo(() => files.map((f) => f.name), [files]);

  const fetchPosts = async () => {
    const { data: contents, error: contentError } = await supabase
      .from("contents")
      .select('id, title, content, post_type, created_at, user_id, profiles:profiles(full_name, email, department, profile_pic_url)')
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

    const attachmentMap: Record<string, Attachment[]> = {};

    (attachments || []).forEach((attachment) => {
      if (!attachmentMap[attachment.content_id]) {
        attachmentMap[attachment.content_id] = [];
      }
      attachmentMap[attachment.content_id].push(attachment as Attachment);
    });

    const normalized = (contents as any[]).map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      post_type: d.post_type,
      created_at: d.created_at,
      profiles: Array.isArray(d.profiles)
        ? (d.profiles[0] ?? null)
        : (d.profiles ?? null),
      attachments: attachmentMap[d.id] || [],
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

      await fetchPosts();
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
    await fetchPosts();
    setUploading(false);
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
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <button
          onClick={() => router.push('/')}
          className="text-xl font-bold text-gray-950"
        >
          ResearchGram
        </button>

        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push('/feed')}
            className="rounded-full bg-blue-50 px-4 py-2 font-semibold text-blue-700"
          >
            Feed
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="rounded-full px-4 py-2 font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
          >
            Profile
          </button>

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/auth/login')
            }}
            className="rounded-full px-4 py-2 font-medium text-red-600 transition hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
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
      alt={post.profiles?.full_name || 'Profile photo'}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-blue-700">
      {(post.profiles?.full_name || 'R').charAt(0).toUpperCase()}
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
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Attachments ({post.attachments.length})
                    </p>

                    <div className="grid gap-3">
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
                                  .getPublicUrl(att.storage_path).data
                                  ?.publicUrl || att.file_url;

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
  <button className="rounded-full bg-gray-50 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100">
    Save
  </button>

  <button className="rounded-full bg-gray-50 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100">
    Discuss
  </button>

  <button className="rounded-full bg-gray-50 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100">
    Request Collaboration
  </button>
</div>
                    </div>
                  </div>
                )}
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
