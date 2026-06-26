"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import RecommendationsUI, {
  type ExistingRequest,
  type Profile,
  type Recommendation,
  type ResearchPost,
} from "./UI";

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
    reasons.push(
      "General researcher profile; add more skills/interests for better matching",
    );
  }

  return {
    profile: candidate,
    score: Math.min(score, 96),
    reasons,
    matchedKeywords,
    existingRequest,
  };
}

export default function RecommendationsClient() {
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

  return (
    <RecommendationsUI
      loading={loading}
      myPosts={myPosts}
      profiles={profiles}
      selectedPostId={selectedPostId}
      selectedPost={selectedPost}
      recommendations={recommendations}
      requestingId={requestingId}
      setSelectedPostId={setSelectedPostId}
      handleSendCollaborationRequest={handleSendCollaborationRequest}
      handleGoToFeed={() => router.push("/feed")}
    />
  );
}