
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Profile = {
  full_name: string | null
  email: string | null
}

type Attachment = {
  id: string
  content_id: string
  file_url: string
  storage_path: string
  original_name: string
  mime_type: string | null
  file_ext: string | null
  file_size: number | null
  attachment_type: string
  created_at: string
}

type Post = {
  id: string
  title: string
  content: string
  post_type: string
  created_at: string
  profiles?: Profile | null
  attachments: Attachment[]
}

const BUCKET_NAME = 'content-files'

const POST_TYPE_OPTIONS = [
  { label: 'Research Note', value: 'research_note' },
  { label: 'Paper Draft', value: 'paper_draft' },
  { label: 'Published Paper', value: 'published_paper' },
  { label: 'Dataset', value: 'dataset' },
  { label: 'Presentation', value: 'presentation' },
  { label: 'Code / Project', value: 'code_project' },
  { label: 'Question', value: 'question' },
  { label: 'Announcement', value: 'announcement' },
]

function formatPostTime(dateString: string) {
  try {
    // Parse UTC date from ISO string
    const utcDate = new Date(dateString)
    
    // Convert UTC to local time by getting timezone offset
    const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000
    const localDate = new Date(utcDate.getTime() - timezoneOffsetMs)
    
    // Format with explicit options
    const formatted = localDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    
    console.log(`[TIME] UTC: ${dateString} → Local: ${formatted}`)
    return formatted
  } catch (error) {
    console.error(`[TIME ERROR] Failed to parse: ${dateString}`, error)
    return dateString
  }
}

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return 'Unknown size'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function detectAttachmentType(file: File) {
  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()

  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf'
  if (
    name.endsWith('.doc') ||
    name.endsWith('.docx') ||
    mime.includes('word')
  ) return 'document'
  if (name.endsWith('.txt') || name.endsWith('.md') || mime.startsWith('text/')) return 'text'
  if (
    name.endsWith('.ppt') ||
    name.endsWith('.pptx') ||
    mime.includes('presentation')
  ) return 'presentation'
  if (
    name.endsWith('.xls') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.csv') ||
    mime.includes('spreadsheet')
  ) return 'spreadsheet'
  if (mime.startsWith('image/')) return 'image'
  if (
    name.endsWith('.py') ||
    name.endsWith('.js') ||
    name.endsWith('.ts') ||
    name.endsWith('.java') ||
    name.endsWith('.cpp') ||
    name.endsWith('.c') ||
    name.endsWith('.cs') ||
    name.endsWith('.php') ||
    name.endsWith('.rb') ||
    name.endsWith('.go') ||
    name.endsWith('.rs')
  ) return 'code'
  if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) return 'archive'

  return 'other'
}

function attachmentEmoji(type: string) {
  switch (type) {
    case 'pdf':
      return '📄'
    case 'document':
      return '📝'
    case 'text':
      return '📃'
    case 'presentation':
      return '📊'
    case 'spreadsheet':
      return '📈'
    case 'image':
      return '🖼️'
    case 'code':
      return '💻'
    case 'archive':
      return '🗜️'
    default:
      return '📎'
  }
}

export default function FeedPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [userId, setUserId] = useState('')
  const [fullName, setFullName] = useState('')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('research_note')
  const [files, setFiles] = useState<File[]>([])

  const [posts, setPosts] = useState<Post[]>([])

  const selectedFileNames = useMemo(() => files.map((f) => f.name), [files])

  const fetchPosts = async () => {
    const { data: contents, error: contentError } = await supabase
      .from('contents')
      .select('id, title, content, post_type, created_at, user_id, profiles:profiles(full_name, email)')
      .order('created_at', { ascending: false })

    if (contentError) {
      console.log('FETCH CONTENTS ERROR:', contentError)
      return
    }

    if (!contents || contents.length === 0) {
      setPosts([])
      return
    }

    const contentIds = contents.map((item) => item.id)

    const { data: attachments, error: attachmentError } = await supabase
      .from('content_attachments')
      .select('*')
      .in('content_id', contentIds)
      .order('created_at', { ascending: true })

    if (attachmentError) {
      console.log('FETCH ATTACHMENTS ERROR:', attachmentError)
      return
    }

    const attachmentMap: Record<string, Attachment[]> = {}

    ;(attachments || []).forEach((attachment) => {
      if (!attachmentMap[attachment.content_id]) {
        attachmentMap[attachment.content_id] = []
      }
      attachmentMap[attachment.content_id].push(attachment as Attachment)
    })

    const normalized = (contents as any[]).map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      post_type: d.post_type,
      created_at: d.created_at,
      profiles: Array.isArray(d.profiles) ? d.profiles[0] ?? null : d.profiles ?? null,
      attachments: attachmentMap[d.id] || [],
    })) as Post[]

    setPosts(normalized)
  }

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser()

      if (!authData.user) {
        router.push('/login')
        return
      }

      setUserId(authData.user.id)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', authData.user.id)
        .single()

      if (profileData) {
        setFullName(profileData.full_name || '')
      }

      await fetchPosts()
      setLoading(false)
    }

    load()
  }, [router])

  

  const handleCreatePost = async () => {
    if (!title.trim()) {
      alert('Add a title first')
      return
    }

    if (!content.trim()) {
      alert('Write something first')
      return
    }

    setUploading(true)

    const { data: insertedContent, error: insertError } = await supabase
      .from('contents')
      .insert({
        user_id: userId,
        title,
        content,
        post_type: postType,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !insertedContent) {
      console.log('INSERT CONTENT ERROR:', insertError)
      alert(insertError?.message || 'Could not create post')
      setUploading(false)
      return
    }

    const contentId = insertedContent.id

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
        const attachmentType = detectAttachmentType(file)
        const storagePath = `uploads/${userId}/${contentId}/${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          console.log('UPLOAD ERROR:', uploadError)
          alert(uploadError.message)
          setUploading(false)
          return
        }

        const { data: publicData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath)

        const { error: attachmentInsertError } = await supabase
          .from('content_attachments')
          .insert({
            content_id: contentId,
            file_url: publicData.publicUrl,
            storage_path: storagePath,
            original_name: file.name,
            mime_type: file.type || null,
            file_ext: ext,
            file_size: file.size,
            attachment_type: attachmentType,
            created_at: new Date().toISOString(),
          })

        if (attachmentInsertError) {
          console.log('ATTACHMENT INSERT ERROR:', attachmentInsertError)
          alert(attachmentInsertError.message)
          setUploading(false)
          return
        }
      }
    }

    setTitle('')
    setContent('')
    setPostType('research_note')
    setFiles([])
    await fetchPosts()
    setUploading(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading feed...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-6">
        <aside className="col-span-12 hidden rounded-2xl bg-white p-5 shadow-sm lg:col-span-3 lg:block">
          <h2 className="text-xl font-bold text-gray-900">ResearchGram</h2>
          <p className="mt-2 text-sm text-gray-600">
            Share research ideas, papers, datasets, code, and updates.
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-800">{fullName || 'No name set'}</p>
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
                className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-black"
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <select
                className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-black"
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
                className="min-h-[140px] w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-black"
                placeholder="Write your research update, abstract, or note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.rar,.7z,image/*,.py,.js,.ts,.java,.cpp,.c,.cs,.php,.rb,.go,.rs"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full rounded-xl border border-gray-200 p-3"
              />

              {selectedFileNames.length > 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Selected files</p>
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
                {uploading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {post.profiles?.full_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPostTime(post.created_at)}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {(post.post_type ?? 'unknown').replaceAll('_', ' ')}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-gray-800">{post.content}</p>

                {post.attachments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Attachments ({post.attachments.length})
                    </p>

                    <div className="grid gap-3">
                      {post.attachments.map((att) => {
                        const publicUrl =
                          supabase.storage.from(BUCKET_NAME).getPublicUrl(att.storage_path)
                            .data?.publicUrl || att.file_url

                        return (
                          <a
                            key={att.id}
                            href={publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:bg-gray-100"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{attachmentEmoji(att.attachment_type)}</span>
                                <p className="truncate font-medium text-gray-900">
                                  {att.original_name}
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-gray-500">
                                {att.attachment_type} • {formatFileSize(att.file_size)}
                              </p>
                            </div>

                            <span className="ml-4 shrink-0 text-sm font-medium text-blue-600">
                              Open
                            </span>
                          </a>
                        )
                      })}
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
  )
}