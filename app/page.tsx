import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            ResearchGram
          </Link>

          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/feed"
              className="hidden rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white sm:inline-block"
            >
              Feed
            </Link>

            <Link
              href="/profile"
              className="hidden rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white sm:inline-block"
            >
              Profile
            </Link>

            <Link
              href="/auth/login"
              className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Login
            </Link>

            <Link
              href="/auth/signup"
              className="rounded-full bg-white px-5 py-2 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-200">
            Academic collaboration for modern research communities
          </div>

          <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Build, share, and collaborate on research in one professional network.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            ResearchGram connects students, faculty, researchers, and alumni through
            academic profiles, research posts, document sharing, collaboration requests,
            and future mentorship tools.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/auth/signup"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Create Account
            </Link>

            <Link
              href="/auth/login"
              className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Login
            </Link>

            <Link
              href="/feed"
              className="rounded-xl border border-blue-400/40 px-6 py-3 font-semibold text-blue-200 transition hover:bg-blue-400/10"
            >
              View Feed
            </Link>
          </div>
        </div>

        {/* Platform Preview Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">Research Feed</p>
                <h2 className="text-xl font-bold">Latest academic updates</h2>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Live
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                    R
                  </div>
                  <div>
                    <p className="font-semibold">Research Student</p>
                    <p className="text-xs text-slate-500">Computer Science · Paper Draft</p>
                  </div>
                </div>

                <h3 className="font-bold text-slate-950">
                  Deep Learning Based Disease Detection
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sharing our latest draft and dataset notes for peer feedback and
                  potential collaboration.
                </p>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  📄 research-draft.pdf
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="font-bold text-blue-700">Papers</p>
                  <p className="text-xs text-slate-500">Share drafts</p>
                </div>
                <div className="rounded-xl bg-green-50 p-3">
                  <p className="font-bold text-green-700">Datasets</p>
                  <p className="text-xs text-slate-500">Upload files</p>
                </div>
                <div className="rounded-xl bg-purple-50 p-3">
                  <p className="font-bold text-purple-700">Mentors</p>
                  <p className="text-xs text-slate-500">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="border-t border-white/10 bg-slate-900/60 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold">Designed for research communities</h2>
            <p className="mt-3 text-slate-300">
              ResearchGram is not just a social feed. It is being built as an academic
              network for research sharing, collaboration, mentorship, and peer review.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-bold">Research Posts</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Share paper drafts, datasets, code, presentations, questions, and
                announcements through a modern academic feed.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-bold">Academic Profiles</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Build a professional profile with department, skills, research interests,
                bio, profile photo, and cover photo.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-bold">Collaboration Ready</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Future modules will support mentorship requests, reviewer requests,
                direct messaging, and alumni networking.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}