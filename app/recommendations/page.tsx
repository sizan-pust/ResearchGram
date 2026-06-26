"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  skills: string | null;
  interests: string | null;
  bio: string | null;
  profile_pic_url: string | null;
};

type ResearchPost = {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  post_type: string | null;
  created_at: string | null;
};

type ExistingRequest = {
  id: string;
  receiver_id: string;
  status: string;
};

type Recommendation = {
  profile: Profile;
  score: number;
  reasons: string[];
  matchedKeywords: string[];
  existingRequest?: ExistingRequest | null;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with",
  "we",
  "will",
  "research",
  "project",
  "paper",
  "study",
  "work",
]);

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[_/,-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(...values: Array<string | null | undefined>) {
  const text = values.map(normalizeText).join(" ");

  return Array.from(
    new Set(
      text
        .split(" ")
        .map((word) => word.trim())
        .filter((word) => word.length >= 3 && !STOP_WORDS.has(word)),
    ),
  );
}

function getSharedKeywords(postKeywords: string[], profileKeywords: string[]) {
  const profileSet = new Set(profileKeywords);
  return postKeywords.filter((keyword) => profileSet.has(keyword));
}

function calculateRecommendation(
  post: ResearchPost,
  candidate: Profile,
  currentProfile: Profile | null,
  existingRequest?: ExistingRequest | null,
): Recommendation {
  const postKeywords = extractKeywords(
    post.title,
    post.content,
    post.post_type,
  );

  const candidateKeywords = extractKeywords(
    candidate.full_name,
    candidate.department,
    candidate.skills,
    candidate.interests,
    candidate.bio,
  );

  const matchedKeywords = getSharedKeywords(postKeywords, candidateKeywords);

  let score = 20;
  const reasons: string[] = [];

  if (matchedKeywords.length > 0) {
    score += Math.min(matchedKeywords.length * 12, 45);
    reasons.push(
      `Matches research keywords: ${matchedKeywords.slice(0, 5).join(", ")}`,
    );
  }

  const candidateSkills = extractKeywords(candidate.skills);
  const candidateInterests = extractKeywords(candidate.interests);
  const postSkillMatches = getSharedKeywords(postKeywords, [
    ...candidateSkills,
    ...candidateInterests,
  ]);

  if (postSkillMatches.length > 0) {
    score += Math.min(postSkillMatches.length * 10, 25);
    reasons.push(
      `Relevant skills/interests: ${postSkillMatches.slice(0, 4).join(", ")}`,
    );
  }

  const currentDepartment = normalizeText(currentProfile?.department);
  const candidateDepartment = normalizeText(candidate.department);

  if (
    currentDepartment &&
    candidateDepartment &&
    currentDepartment === candidateDepartment
  ) {
    score += 8;
    reasons.push(`Same department: ${candidate.department}`);
  }

  if (candidate.bio && candidate.bio.trim().length > 20) {
    score += 5;
    reasons.push("Has a detailed research profile");
  }

  if (candidate.skills && candidate.skills.trim().length > 0) {
    score += 5;
  }

  if (candidate.interests && candidate.interests.trim().length > 0) {
    score += 5;
  }

  if (reasons.length === 0) {
    reasons.push("General researcher profile; add more skills/interests for better matching");
  }

  return {
    profile: candidate,
    score: Math.min(score, 96),
    reasons,
    matchedKeywords,
    existingRequest,
  };
}

function formatPostType(value: string | null) {
  return (value || "research_post").replaceAll("_", " ");
}

export default function RecommendationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [myPosts, setMyPosts] = useState<ResearchPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [existingRequests, setExistingRequests] = useState<ExistingRequest[]>(
    [],
  );
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const selectedPost = useMemo(
    () => myPosts.find((post) => post.id === selectedPostId) || null,
    [myPosts, selectedPostId],
  );

  const existingRequestMap = useMemo(() => {
    const map = new Map<string, ExistingRequest>();
    existingRequests.forEach((request) => {
      map.set(request.receiver_id, request);
    });
    return map;
  }, [existingRequests]);

  const recommendations = useMemo(() => {
    if (!selectedPost) return [];

    return profiles
      .filter((profile) => profile.id !== userId)
      .map((profile) =>
        calculateRecommendation(
          selectedPost,
          profile,
          currentProfile,
          existingRequestMap.get(profile.id) || null,
        ),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [profiles, selectedPost, currentProfile, userId, existingRequestMap]);

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/auth/login");
        return;
      }

      const activeUserId = authData.user.id;
      setUserId(activeUserId);

      const urlPostId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("postId")
          : null;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, department, skills, interests, bio, profile_pic_url",
        )
        .eq("id", activeUserId)
        .single();

      if (profileError) {
        console.log("CURRENT PROFILE ERROR:", profileError);
      }

      setCurrentProfile((profileData as Profile) || null);

      const { data: postData, error: postError } = await supabase
        .from("contents")
        .select("id, user_id, title, content, post_type, created_at")
        .eq("user_id", activeUserId)
        .order("created_at", { ascending: false });

      if (postError) {
        console.log("MY POSTS ERROR:", postError);
        alert(postError.message);
        setLoading(false);
        return;
      }

      const safePosts = (postData || []) as ResearchPost[];
      setMyPosts(safePosts);

      if (safePosts.length > 0) {
        const matchingPost = urlPostId
          ? safePosts.find((post) => post.id === urlPostId)
          : null;

        setSelectedPostId(matchingPost?.id || safePosts[0].id);
      }

      const { data: allProfiles, error: allProfilesError } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, department, skills, interests, bio, profile_pic_url",
        )
        .neq("id", activeUserId);

      if (allProfilesError) {
        console.log("ALL PROFILES ERROR:", allProfilesError);
        alert(allProfilesError.message);
        setLoading(false);
        return;
      }

      setProfiles((allProfiles || []) as Profile[]);

      setLoading(false);
    };

    load();
  }, [router]);

  useEffect(() => {
    const loadRequests = async () => {
      if (!userId || !selectedPostId) {
        setExistingRequests([]);
        return;
      }

      const { data, error } = await supabase
        .from("research_requests")
        .select("id, receiver_id, status")
        .eq("content_id", selectedPostId)
        .eq("requester_id", userId)
        .eq("request_type", "collaboration");

      if (error) {
        console.log("REQUEST LOAD ERROR:", error);
        return;
      }

      setExistingRequests((data || []) as ExistingRequest[]);
    };

    loadRequests();
  }, [userId, selectedPostId]);

  const handleSendCollaborationRequest = async (receiver: Profile) => {
    if (!selectedPost) {
      alert("Select a research idea first.");
      return;
    }

    if (!userId) {
      alert("You must be logged in.");
      return;
    }

    const existing = existingRequestMap.get(receiver.id);
    if (existing) {
      alert(`Request already ${existing.status}.`);
      return;
    }

    setRequestingId(receiver.id);

    const postTitle = selectedPost.title || "your research idea";

    const message = `Hi ${
      receiver.full_name || "Researcher"
    }, I found your profile relevant to my research post "${postTitle}". I would like to collaborate or discuss possible contribution areas.`;

    const { error } = await supabase.from("research_requests").insert({
      content_id: selectedPost.id,
      requester_id: userId,
      receiver_id: receiver.id,
      request_type: "collaboration",
      message,
      status: "pending",
    });

    if (error) {
      console.log("SEND REQUEST ERROR:", error);
      alert(error.message);
      setRequestingId(null);
      return;
    }

    const { data } = await supabase
      .from("research_requests")
      .select("id, receiver_id, status")
      .eq("content_id", selectedPost.id)
      .eq("requester_id", userId)
      .eq("request_type", "collaboration");

    setExistingRequests((data || []) as ExistingRequest[]);

    setRequestingId(null);
    alert("Collaboration request sent.");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
    <AppNav activePage="feed" />
        <div className="mx-auto max-w-6xl px-6 py-10 text-slate-600">
          Loading collaborator recommendations...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppNav activePage="feed" />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-8 text-white shadow-xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
              AI-style collaborator matching
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Find the right collaborators for your research idea
            </h1>

            <p className="mt-4 text-sm leading-7 text-blue-100">
              ResearchGram compares your post topic with researcher profiles,
              skills, interests, bio, and department to suggest suitable
              collaborators.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">{profiles.length}</p>
              <p className="text-sm text-blue-100">Researcher profiles scanned</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">{myPosts.length}</p>
              <p className="text-sm text-blue-100">Your research posts</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">{recommendations.length}</p>
              <p className="text-sm text-blue-100">Top recommendations</p>
            </div>
          </div>
        </div>

        {myPosts.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-bold text-amber-900">
              Post a research idea first
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              The recommendation system needs one of your research posts to
              calculate collaborator matches.
            </p>

            <button
              onClick={() => router.push("/feed")}
              className="mt-4 rounded-xl bg-amber-900 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-800"
            >
              Go to Feed and Post Idea
            </button>
          </div>
        ) : (
          <>
            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <label className="text-sm font-bold text-slate-800">
                Select your research idea
              </label>

              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                {myPosts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title || "Untitled research post"} —{" "}
                    {formatPostType(post.post_type)}
                  </option>
                ))}
              </select>

              {selectedPost && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                    Selected idea
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-950">
                    {selectedPost.title || "Untitled research post"}
                  </h2>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {selectedPost.content || "No description provided."}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {recommendations.map((item, index) => {
                const profile = item.profile;
                const status = item.existingRequest?.status;
                const isRequested = Boolean(item.existingRequest);

                return (
                  <div
                    key={profile.id}
                    className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100">
                        {profile.profile_pic_url ? (
                          <img
                            src={profile.profile_pic_url}
                            alt={profile.full_name || "Researcher"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-black text-blue-700">
                            {(profile.full_name || profile.email || "R")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="truncate text-lg font-black text-slate-950">
                              {profile.full_name || "ResearchGram User"}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {profile.department || "Research community"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-blue-600 px-3 py-2 text-center text-white">
                            <p className="text-lg font-black">{item.score}%</p>
                            <p className="text-[10px] font-bold uppercase">
                              Match
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.matchedKeywords.length > 0 ? (
                            item.matchedKeywords.slice(0, 6).map((keyword) => (
                              <span
                                key={keyword}
                                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                              >
                                {keyword}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              General match
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-bold text-slate-800">
                        Why recommended
                      </p>

                      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                        {item.reasons.map((reason) => (
                          <li key={reason}>• {reason}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 p-4">
                        <p className="text-xs font-bold uppercase text-slate-400">
                          Skills
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-700">
                          {profile.skills || "Not added yet"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 p-4">
                        <p className="text-xs font-bold uppercase text-slate-400">
                          Interests
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-700">
                          {profile.interests || "Not added yet"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-400">
                        Recommendation #{index + 1}
                      </p>

                      <button
                        onClick={() => handleSendCollaborationRequest(profile)}
                        disabled={isRequested || requestingId === profile.id}
                        className={`rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                          isRequested
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-950 text-white hover:bg-slate-800"
                        }`}
                      >
                        {requestingId === profile.id
                          ? "Sending..."
                          : isRequested
                            ? `Request ${status}`
                            : "Send Request"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}