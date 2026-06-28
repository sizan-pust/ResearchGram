"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SearchUI, {
  type ContentSearchResult,
  type ProfileSearchResult,
  type SuggestedResearcher,
} from "./UI";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  profile_pic_url: string | null;
  bio: string | null;
  skills: string | null;
  interests: string | null;
  user_role: string | null;
  academic_level: string | null;
  batch: string | null;
  session: string | null;
  graduation_year: number | null;
  current_position: string | null;
  company_or_institution: string | null;
  research_area: string | null;
  expertise: string | null;
  mentorship_available: boolean | null;
  profile_completion_score: number | null;
};

type ContentRow = {
  id: string;
  user_id: string | null;
  title: string | null;
  content: string | null;
  abstract: string | null;
  post_type: string | null;
  content_category: string | null;
  keywords: string | null;
  created_at: string | null;
};

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTokens(...values: Array<string | null | undefined>) {
  const text = normalizeText(values.filter(Boolean).join(" "));

  return new Set(
    text
      .split(" ")
      .map((item) => item.trim())
      .filter((item) => item.length >= 2),
  );
}

function includesQuery(query: string, ...values: Array<string | null | undefined>) {
  const q = normalizeText(query);

  if (!q) return false;

  const text = normalizeText(values.filter(Boolean).join(" "));

  return text.includes(q);
}

function overlapCount(a: Set<string>, b: Set<string>) {
  let count = 0;

  a.forEach((item) => {
    if (b.has(item)) count += 1;
  });

  return count;
}

function profileDisplayName(profile: ProfileRow | ProfileSearchResult) {
  return (
    profile.full_name ||
    profile.email?.split("@")[0] ||
    "ResearchGram User"
  );
}

function calculateSuggestionReason(
  profile: ProfileRow,
  currentProfile: ProfileRow | null,
  searchTokens: Set<string>,
) {
  const reasons: string[] = [];

  if (
    currentProfile?.department &&
    profile.department &&
    currentProfile.department.toLowerCase() === profile.department.toLowerCase()
  ) {
    reasons.push("same department");
  }

  if (profile.user_role === "alumni") {
    reasons.push("alumni");
  }

  if (profile.user_role === "faculty") {
    reasons.push("faculty");
  }

  if (profile.mentorship_available) {
    reasons.push("available for mentorship");
  }

  const currentTokens = getTokens(
    currentProfile?.skills,
    currentProfile?.interests,
    currentProfile?.research_area,
    currentProfile?.expertise,
  );

  const profileTokens = getTokens(
    profile.skills,
    profile.interests,
    profile.research_area,
    profile.expertise,
    profile.bio,
  );

  const shared = overlapCount(currentTokens, profileTokens);
  const searchMatch = overlapCount(searchTokens, profileTokens);

  if (shared > 0) {
    reasons.push(`${shared} shared academic interest${shared > 1 ? "s" : ""}`);
  }

  if (searchMatch > 0) {
    reasons.push("matches your recent searches");
  }

  if (reasons.length === 0) {
    reasons.push("active research profile");
  }

  return reasons.slice(0, 3).join(" · ");
}

function scoreSuggestion(
  profile: ProfileRow,
  currentProfile: ProfileRow | null,
  searchTokens: Set<string>,
) {
  let score = 0;

  if (!currentProfile) return score;

  const currentTokens = getTokens(
    currentProfile.skills,
    currentProfile.interests,
    currentProfile.research_area,
    currentProfile.expertise,
  );

  const profileTokens = getTokens(
    profile.skills,
    profile.interests,
    profile.research_area,
    profile.expertise,
    profile.bio,
  );

  const sharedInterestCount = overlapCount(currentTokens, profileTokens);
  const recentSearchMatchCount = overlapCount(searchTokens, profileTokens);

  score += sharedInterestCount * 12;
  score += recentSearchMatchCount * 8;

  if (
    currentProfile.department &&
    profile.department &&
    currentProfile.department.toLowerCase() === profile.department.toLowerCase()
  ) {
    score += 20;
  }

  if (currentProfile.user_role === "student" && profile.user_role === "alumni") {
    score += 18;
  }

  if (currentProfile.user_role === "student" && profile.user_role === "faculty") {
    score += 18;
  }

  if (profile.mentorship_available) {
    score += 12;
  }

  if ((profile.profile_completion_score || 0) >= 70) {
    score += 8;
  }

  if (profile.current_position || profile.company_or_institution) {
    score += 5;
  }

  return score;
}

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") || "";

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [query, setQuery] = useState(urlQuery);

  const [profiles, setProfiles] = useState<ProfileSearchResult[]>([]);
  const [contents, setContents] = useState<ContentSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedResearcher[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const loadSearch = async (currentQuery: string) => {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push("/auth/login");
      return;
    }

    const currentUserId = authData.user.id;
    setUserId(currentUserId);

    const profileSelect =
      "id, full_name, email, department, profile_pic_url, bio, skills, interests, user_role, academic_level, batch, session, graduation_year, current_position, company_or_institution, research_area, expertise, mentorship_available, profile_completion_score";

    const [
      currentProfileResult,
      allProfilesResult,
      recentSearchResult,
      hiddenPostsResult,
      contentResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(profileSelect)
        .eq("id", currentUserId)
        .maybeSingle(),

      supabase
        .from("profiles")
        .select(profileSelect)
        .neq("id", currentUserId)
        .limit(300),

      supabase
        .from("search_events")
        .select("query")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("hidden_posts")
        .select("content_id")
        .eq("user_id", currentUserId),

      supabase
        .from("contents")
        .select(
          "id, user_id, title, content, abstract, post_type, content_category, keywords, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    if (currentProfileResult.error) {
      console.log("SEARCH CURRENT PROFILE ERROR:", currentProfileResult.error);
    }

    if (allProfilesResult.error) {
      console.log("SEARCH ALL PROFILES ERROR:", allProfilesResult.error);
    }

    if (recentSearchResult.error) {
      console.log("SEARCH HISTORY ERROR:", recentSearchResult.error);
    }

    if (hiddenPostsResult.error) {
      console.log("SEARCH HIDDEN POSTS ERROR:", hiddenPostsResult.error);
    }

    if (contentResult.error) {
      console.log("SEARCH CONTENT ERROR:", contentResult.error);
    }

    const currentProfile = (currentProfileResult.data || null) as ProfileRow | null;
    const allProfiles = (allProfilesResult.data || []) as ProfileRow[];
    const allContents = (contentResult.data || []) as ContentRow[];

    const hiddenPostIds = new Set(
      (hiddenPostsResult.data || []).map((row: any) => row.content_id),
    );

    const searchHistory = (recentSearchResult.data || [])
      .map((item: any) => item.query)
      .filter(Boolean);

    setRecentSearches(searchHistory);

    const recentSearchTokens = getTokens(...searchHistory);

    const scoredSuggestions = allProfiles
      .map((profile) => {
        const score = scoreSuggestion(profile, currentProfile, recentSearchTokens);

        return {
          ...profile,
          suggestion_score: score,
          suggestion_reason: calculateSuggestionReason(
            profile,
            currentProfile,
            recentSearchTokens,
          ),
        };
      })
      .filter((profile) => profile.suggestion_score > 0)
      .sort((a, b) => b.suggestion_score - a.suggestion_score)
      .slice(0, 8);

    setSuggestions(scoredSuggestions as SuggestedResearcher[]);

    const q = currentQuery.trim();

    if (!q) {
      setProfiles([]);
      setContents([]);
      setLoading(false);
      return;
    }

    await supabase.from("search_events").insert({
      user_id: currentUserId,
      query: q,
      search_type: "global",
    });

    const matchedProfiles = allProfiles
      .filter((profile) =>
        includesQuery(
          q,
          profile.full_name,
          profile.email,
          profile.department,
          profile.skills,
          profile.interests,
          profile.user_role,
          profile.academic_level,
          profile.batch,
          profile.session,
          profile.current_position,
          profile.company_or_institution,
          profile.research_area,
          profile.expertise,
          profile.bio,
        ),
      )
      .slice(0, 40);

    const contentOwnerIds = Array.from(
      new Set(
        allContents
          .map((item) => item.user_id)
          .filter((item): item is string => Boolean(item)),
      ),
    );

    const ownerMap: Record<string, ProfileRow> = {};

    if (contentOwnerIds.length > 0) {
      const { data: ownerProfiles, error: ownerError } = await supabase
        .from("profiles")
        .select(profileSelect)
        .in("id", contentOwnerIds);

      if (ownerError) {
        console.log("SEARCH CONTENT OWNER ERROR:", ownerError);
      }

      (ownerProfiles || []).forEach((profile: any) => {
        ownerMap[profile.id] = profile as ProfileRow;
      });
    }

    const matchedContents = allContents
      .filter((item) => !hiddenPostIds.has(item.id))
      .filter((item) =>
        includesQuery(
          q,
          item.title,
          item.content,
          item.abstract,
          item.keywords,
          item.post_type,
          item.content_category,
        ),
      )
      .map((item) => ({
        ...item,
        owner: item.user_id ? ownerMap[item.user_id] || null : null,
      }))
      .slice(0, 40);

    setProfiles(matchedProfiles as ProfileSearchResult[]);
    setContents(matchedContents as ContentSearchResult[]);
    setLoading(false);
  };

  useEffect(() => {
    setQuery(urlQuery);
    loadSearch(urlQuery);
  }, [urlQuery]);

  const handleSearchSubmit = () => {
    const nextQuery = trimmedQuery;

    if (!nextQuery) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
  };

  const handleOpenProfile = async (profileId: string, source = "search") => {
    if (userId && profileId !== userId) {
      await supabase.from("profile_view_events").insert({
        viewer_id: userId,
        viewed_profile_id: profileId,
        source,
      });
    }

    router.push(`/researchers/${profileId}`);
  };

  const handleOpenPost = (postId: string) => {
    router.push(`/feed?post=${postId}`);
  };

  return (
    <SearchUI
      loading={loading}
      query={query}
      profiles={profiles}
      contents={contents}
      suggestions={suggestions}
      recentSearches={recentSearches}
      setQuery={setQuery}
      handleSearchSubmit={handleSearchSubmit}
      handleOpenProfile={handleOpenProfile}
      handleOpenPost={handleOpenPost}
    />
  );
}