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
  user_role: string | null;
  academic_level: string | null;
  expertise: string | null;
  mentorship_available: boolean | null;
  office_hours: string | null;
};

type ExistingMentorshipRequest = {
  id: string;
  receiver_id: string;
  status: string;
};

type MentorRecommendation = {
  profile: Profile;
  score: number;
  reasons: string[];
  matchedKeywords: string[];
  existingRequest?: ExistingMentorshipRequest | null;
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

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty Mentor" },
  { value: "alumni", label: "Alumni Mentor" },
];

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

function getSharedKeywords(a: string[], b: string[]) {
  const bSet = new Set(b);
  return a.filter((keyword) => bSet.has(keyword));
}

function getDisplayName(profile: Profile | null) {
  return profile?.full_name || profile?.email?.split("@")[0] || "ResearchGram User";
}

function getInitial(profile: Profile | null) {
  return getDisplayName(profile).charAt(0).toUpperCase();
}

function roleLabel(role: string | null) {
  if (role === "faculty") return "Faculty Mentor";
  if (role === "alumni") return "Alumni Mentor";
  return "Student Researcher";
}

function calculateMentorMatch(
  currentProfile: Profile | null,
  mentor: Profile,
  searchQuery: string,
  existingRequest?: ExistingMentorshipRequest | null,
): MentorRecommendation {
  const studentKeywords = extractKeywords(
    currentProfile?.skills,
    currentProfile?.interests,
    currentProfile?.bio,
    currentProfile?.department,
    searchQuery,
  );

  const mentorKeywords = extractKeywords(
    mentor.skills,
    mentor.interests,
    mentor.expertise,
    mentor.bio,
    mentor.department,
    mentor.academic_level,
  );

  const matchedKeywords = getSharedKeywords(studentKeywords, mentorKeywords);

  let score = 25;
  const reasons: string[] = [];

  if (mentor.mentorship_available) {
    score += 20;
    reasons.push("Currently available for mentorship");
  }

  if (mentor.user_role === "faculty") {
    score += 18;
    reasons.push("Faculty-level academic mentor");
  }

  if (mentor.user_role === "alumni") {
    score += 15;
    reasons.push("Alumni mentor with practical experience");
  }

  if (matchedKeywords.length > 0) {
    score += Math.min(matchedKeywords.length * 10, 35);
    reasons.push(`Shared research areas: ${matchedKeywords.slice(0, 5).join(", ")}`);
  }

  const sameDepartment =
    normalizeText(currentProfile?.department) &&
    normalizeText(currentProfile?.department) === normalizeText(mentor.department);

  if (sameDepartment) {
    score += 8;
    reasons.push(`Same department: ${mentor.department}`);
  }

  if (mentor.expertise && mentor.expertise.trim().length > 0) {
    score += 7;
    reasons.push("Expertise details added");
  }

  if (mentor.office_hours && mentor.office_hours.trim().length > 0) {
    score += 5;
    reasons.push("Mentorship timing/office hours available");
  }

  if (reasons.length === 0) {
    reasons.push("General academic profile match");
  }

  return {
    profile: mentor,
    score: Math.min(score, 98),
    reasons,
    matchedKeywords,
    existingRequest,
  };
}

export default function MentorshipPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [existingRequests, setExistingRequests] = useState<
    ExistingMentorshipRequest[]
  >([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [myRole, setMyRole] = useState("student");
  const [myAcademicLevel, setMyAcademicLevel] = useState("");
  const [myExpertise, setMyExpertise] = useState("");
  const [myOfficeHours, setMyOfficeHours] = useState("");
  const [myMentorshipAvailable, setMyMentorshipAvailable] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const existingRequestMap = useMemo(() => {
    const map = new Map<string, ExistingMentorshipRequest>();
    existingRequests.forEach((request) => {
      map.set(request.receiver_id, request);
    });
    return map;
  }, [existingRequests]);

  const mentorCandidates = useMemo(() => {
    return profiles.filter((profile) => {
      if (profile.id === userId) return false;

      const isMentor =
        profile.mentorship_available ||
        profile.user_role === "faculty" ||
        profile.user_role === "alumni";

      if (!isMentor) return false;

      if (roleFilter !== "all" && profile.user_role !== roleFilter) {
        return false;
      }

      if (!searchQuery.trim()) return true;

      const searchableText = normalizeText(
        [
          profile.full_name,
          profile.department,
          profile.skills,
          profile.interests,
          profile.expertise,
          profile.bio,
          profile.academic_level,
        ].join(" "),
      );

      const searchWords = extractKeywords(searchQuery);

      return searchWords.some((word) => searchableText.includes(word));
    });
  }, [profiles, userId, roleFilter, searchQuery]);

  const mentorRecommendations = useMemo(() => {
    return mentorCandidates
      .map((profile) =>
        calculateMentorMatch(
          currentProfile,
          profile,
          searchQuery,
          existingRequestMap.get(profile.id) || null,
        ),
      )
      .sort((a, b) => b.score - a.score);
  }, [mentorCandidates, currentProfile, searchQuery, existingRequestMap]);

  const loadPage = async () => {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push("/auth/login");
      return;
    }

    const activeUserId = authData.user.id;
    setUserId(activeUserId);

    const { data: myProfileData, error: myProfileError } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, department, skills, interests, bio, profile_pic_url, user_role, academic_level, expertise, mentorship_available, office_hours",
      )
      .eq("id", activeUserId)
      .single();

    if (myProfileError) {
      console.log("MY PROFILE ERROR:", myProfileError);
    }

    const safeProfile = (myProfileData || null) as Profile | null;
    setCurrentProfile(safeProfile);

    if (safeProfile) {
      setMyRole(safeProfile.user_role || "student");
      setMyAcademicLevel(safeProfile.academic_level || "");
      setMyExpertise(safeProfile.expertise || "");
      setMyOfficeHours(safeProfile.office_hours || "");
      setMyMentorshipAvailable(Boolean(safeProfile.mentorship_available));
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, department, skills, interests, bio, profile_pic_url, user_role, academic_level, expertise, mentorship_available, office_hours",
      )
      .neq("id", activeUserId);

    if (profilesError) {
      console.log("MENTOR PROFILES ERROR:", profilesError);
      alert(profilesError.message);
      setProfiles([]);
    } else {
      setProfiles((profilesData || []) as Profile[]);
    }

    const { data: requestData, error: requestError } = await supabase
      .from("profile_requests")
      .select("id, receiver_id, status")
      .eq("requester_id", activeUserId)
      .eq("request_type", "mentorship");

    if (requestError) {
      console.log("MENTORSHIP REQUESTS ERROR:", requestError);
    }

    setExistingRequests((requestData || []) as ExistingMentorshipRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    loadPage();
  }, []);

  const handleSaveMentorProfile = async () => {
    if (!userId) {
      alert("You must be logged in.");
      return;
    }

    setSavingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        user_role: myRole,
        academic_level: myAcademicLevel.trim() || null,
        expertise: myExpertise.trim() || null,
        office_hours: myOfficeHours.trim() || null,
        mentorship_available: myMentorshipAvailable,
      })
      .eq("id", userId);

    if (error) {
      console.log("SAVE MENTOR PROFILE ERROR:", error);
      alert(error.message);
      setSavingProfile(false);
      return;
    }

    await loadPage();
    setSavingProfile(false);
    alert("Mentorship profile updated.");
  };

  const handleSendMentorshipRequest = async (mentor: Profile) => {
    if (!userId) {
      alert("You must be logged in.");
      return;
    }

    const existing = existingRequestMap.get(mentor.id);
    if (existing) {
      alert(`Mentorship request already ${existing.status}.`);
      return;
    }

    setRequestingId(mentor.id);

    const message = `Hello ${getDisplayName(
      mentor,
    )}, I am interested in your mentorship guidance. My research interests are related to ${
      currentProfile?.interests || searchQuery || "your expertise"
    }. I would like to discuss research direction, resources, and possible supervision/support.`;

    const { error } = await supabase.from("profile_requests").insert({
      requester_id: userId,
      receiver_id: mentor.id,
      request_type: "mentorship",
      message,
      status: "pending",
    });

    if (error) {
      console.log("SEND MENTORSHIP REQUEST ERROR:", error);
      alert(error.message);
      setRequestingId(null);
      return;
    }

    const { data } = await supabase
      .from("profile_requests")
      .select("id, receiver_id, status")
      .eq("requester_id", userId)
      .eq("request_type", "mentorship");

    setExistingRequests((data || []) as ExistingMentorshipRequest[]);
    setRequestingId(null);
    alert("Mentorship request sent.");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <AppNav activePage="researchers" />
        <div className="mx-auto max-w-7xl px-6 py-10 text-slate-600">
          Loading mentorship system...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppNav activePage="researchers" />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-8 text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-200">
            Mentorship matching
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Find faculty and alumni mentors for research guidance
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100">
            ResearchGram compares research interests, skills, expertise,
            department, and mentor availability to help students request
            academic mentorship.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">{profiles.length}</p>
              <p className="text-sm text-blue-100">Profiles scanned</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">{mentorCandidates.length}</p>
              <p className="text-sm text-blue-100">Mentor candidates</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">
                {
                  profiles.filter(
                    (profile) => profile.mentorship_available === true,
                  ).length
                }
              </p>
              <p className="text-sm text-blue-100">Available mentors</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">{existingRequests.length}</p>
              <p className="text-sm text-blue-100">Requests sent</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                My mentorship profile
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                For demo, you can make one account a Faculty/Alumni mentor and
                another account a student.
              </p>

              <div className="mt-5 space-y-3">
                <select
                  value={myRole}
                  onChange={(e) => setMyRole(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>

                <input
                  value={myAcademicLevel}
                  onChange={(e) => setMyAcademicLevel(e.target.value)}
                  placeholder="Academic level, e.g. Lecturer, Alumni, 3rd Year Student"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                />

                <textarea
                  value={myExpertise}
                  onChange={(e) => setMyExpertise(e.target.value)}
                  placeholder="Expertise, e.g. Machine Learning, IoT, Data Mining, Cybersecurity"
                  className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                />

                <input
                  value={myOfficeHours}
                  onChange={(e) => setMyOfficeHours(e.target.value)}
                  placeholder="Office hours / available time"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                />

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={myMentorshipAvailable}
                    onChange={(e) => setMyMentorshipAvailable(e.target.checked)}
                    className="h-5 w-5"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    Available for mentorship
                  </span>
                </label>

                <button
                  onClick={handleSaveMentorProfile}
                  disabled={savingProfile}
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? "Saving..." : "Update Mentorship Profile"}
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Search mentors
              </h2>

              <div className="mt-5 space-y-3">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topic, e.g. AI, IoT, Networking"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                />

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                >
                  <option value="all">All mentor types</option>
                  <option value="faculty">Faculty mentors</option>
                  <option value="alumni">Alumni mentors</option>
                </select>

                <button
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("all");
                  }}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    Recommended mentors
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Sorted by mentorship match score.
                  </p>
                </div>

                <button
                  onClick={() => router.push("/requests")}
                  className="rounded-2xl bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  View Requests
                </button>
              </div>

              <div className="mt-6 space-y-5">
                {mentorRecommendations.length === 0 ? (
                  <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
                    <h3 className="text-lg font-black text-amber-900">
                      No mentors found yet
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      Use another account and update its role as Faculty Mentor
                      or Alumni Mentor, then enable mentorship availability.
                    </p>
                  </div>
                ) : (
                  mentorRecommendations.map((item) => {
                    const mentor = item.profile;
                    const existing = item.existingRequest;

                    return (
                      <div
                        key={mentor.id}
                        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                          <div className="flex gap-4">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-blue-100">
                              {mentor.profile_pic_url ? (
                                <img
                                  src={mentor.profile_pic_url}
                                  alt={getDisplayName(mentor)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xl font-black text-blue-700">
                                  {getInitial(mentor)}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-black text-slate-950">
                                  {getDisplayName(mentor)}
                                </h3>

                                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                                  {roleLabel(mentor.user_role)}
                                </span>

                                {mentor.mentorship_available && (
                                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                                    Available
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-sm text-slate-500">
                                {mentor.department || "Research community"}
                                {mentor.academic_level
                                  ? ` · ${mentor.academic_level}`
                                  : ""}
                              </p>

                              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                {mentor.bio ||
                                  mentor.expertise ||
                                  "No mentor bio added yet."}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-white">
                            <p className="text-2xl font-black">{item.score}%</p>
                            <p className="text-[10px] font-bold uppercase">
                              Mentor Match
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {item.matchedKeywords.length > 0 ? (
                            item.matchedKeywords.slice(0, 8).map((keyword) => (
                              <span
                                key={keyword}
                                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                              >
                                {keyword}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              General mentorship match
                            </span>
                          )}
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase text-slate-400">
                              Expertise
                            </p>
                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                              {mentor.expertise || mentor.skills || "Not added yet"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase text-slate-400">
                              Office Hours
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {mentor.office_hours || "Not specified"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <p className="text-sm font-bold text-slate-800">
                            Why recommended
                          </p>
                          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                            {item.reasons.map((reason) => (
                              <li key={reason}>• {reason}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                          <button
                            onClick={() => router.push(`/researchers/${mentor.id}`)}
                            className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                          >
                            View Profile
                          </button>

                          <button
                            onClick={() => handleSendMentorshipRequest(mentor)}
                            disabled={Boolean(existing) || requestingId === mentor.id}
                            className={`rounded-2xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                              existing
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-950 text-white hover:bg-slate-800"
                            }`}
                          >
                            {requestingId === mentor.id
                              ? "Sending..."
                              : existing
                                ? `Request ${existing.status}`
                                : "Request Mentorship"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}