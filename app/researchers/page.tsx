"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";

type ResearcherProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  skills: string | null;
  interests: string | null;
  bio: string | null;
  profile_pic_url: string | null;
};
type ConnectionStatus =
  | "self"
  | "connected"
  | "requested"
  | "received"
  | "none";
function splitTags(value: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export default function ResearchersPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [profiles, setProfiles] = useState<ResearcherProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [connectionStatusMap, setConnectionStatusMap] = useState<
    Record<string, ConnectionStatus>
  >({});
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const loadConnectionStatuses = async (
    currentUserId: string,
    researcherProfiles: ResearcherProfile[],
  ) => {
    const otherUserIds = researcherProfiles
      .map((profile) => profile.id)
      .filter((id) => id !== currentUserId);

    const statusMap: Record<string, ConnectionStatus> = {};

    researcherProfiles.forEach((profile) => {
      statusMap[profile.id] = profile.id === currentUserId ? "self" : "none";
    });

    if (otherUserIds.length === 0) {
      setConnectionStatusMap(statusMap);
      return;
    }

    const { data: connections, error: connectionError } = await supabase
      .from("user_connections")
      .select("user_one_id, user_two_id")
      .or(`user_one_id.eq.${currentUserId},user_two_id.eq.${currentUserId}`);

    if (connectionError) {
      console.log("FETCH CONNECTIONS ERROR:", connectionError);
    }

    (connections || []).forEach((connection: any) => {
      const otherId =
        connection.user_one_id === currentUserId
          ? connection.user_two_id
          : connection.user_one_id;

      statusMap[otherId] = "connected";
    });

    const { data: requests, error: requestError } = await supabase
      .from("profile_requests")
      .select("requester_id, receiver_id, status")
      .eq("request_type", "connection")
      .eq("status", "pending")
      .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (requestError) {
      console.log("FETCH PROFILE REQUESTS ERROR:", requestError);
    }

    (requests || []).forEach((request: any) => {
      if (request.requester_id === currentUserId) {
        statusMap[request.receiver_id] = "requested";
      }

      if (request.receiver_id === currentUserId) {
        statusMap[request.requester_id] = "received";
      }
    });

    setConnectionStatusMap(statusMap);
  };

  useEffect(() => {
    const loadResearchers = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/auth/login");
        return;
      }

      setCurrentUserId(authData.user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, department, skills, interests, bio, profile_pic_url",
        )
        .order("full_name", { ascending: true });

      if (error) {
        console.log("FETCH RESEARCHERS ERROR:", error);
        setProfiles([]);
        setLoading(false);
        return;
      }

      const loadedProfiles = (data || []) as ResearcherProfile[];

      setProfiles(loadedProfiles);
      await loadConnectionStatuses(authData.user.id, loadedProfiles);

      setLoading(false);
    };

    loadResearchers();
  }, [router]);

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return profiles;

    return profiles.filter((profile) => {
      const searchableText = [
        profile.full_name,
        profile.email,
        profile.department,
        profile.skills,
        profile.interests,
        profile.bio,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [profiles, searchQuery]);

  const handleSendConnectionRequest = async (receiverId: string) => {
    if (!currentUserId) {
      alert("You must be logged in to connect.");
      return;
    }

    if (receiverId === currentUserId) {
      alert("You cannot connect with yourself.");
      return;
    }

    setConnectingId(receiverId);

    const { error } = await supabase.from("profile_requests").insert({
      requester_id: currentUserId,
      receiver_id: receiverId,
      request_type: "connection",
      message: "I would like to connect with you on ResearchGram.",
      status: "pending",
    });

    if (error) {
      console.log("SEND CONNECTION REQUEST ERROR:", error);
      alert(error.message);
      setConnectingId(null);
      return;
    }

    setConnectionStatusMap((prev) => ({
      ...prev,
      [receiverId]: "requested",
    }));

    setConnectingId(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading researchers...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <AppNav activePage="researchers" />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 border-b border-gray-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-950">
                Discover Researchers
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Find students, faculty, alumni, and researchers by department,
                skills, interests, and academic background.
              </p>
            </div>

            <div className="w-full lg:max-w-md">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, department, AI, NLP, Java..."
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProfiles.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
                  🔎
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  No researchers found
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Try searching by another department, skill, or research topic.
                </p>
              </div>
            ) : (
              filteredProfiles.map((profile) => {
                const skillTags = splitTags(profile.skills);
                const interestTags = splitTags(profile.interests);
                const isCurrentUser = profile.id === currentUserId;

                return (
                  <div
                    key={profile.id}
                    className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100">
                        {profile.profile_pic_url ? (
                          <img
                            src={profile.profile_pic_url}
                            alt={profile.full_name || "Researcher profile"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-bold text-blue-700">
                            {(profile.full_name || "R").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-bold text-gray-950">
                              {profile.full_name || "ResearchGram User"}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                              {profile.department || "Research community"}
                            </p>
                          </div>

                          {isCurrentUser && (
                            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              You
                            </span>
                          )}
                        </div>

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                          {profile.bio ||
                            "No bio added yet. This researcher has not completed their academic introduction."}
                        </p>
                      </div>
                    </div>

                    {skillTags.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Skills
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {skillTags.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {interestTags.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Research interests
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {interestTags.map((interest) => (
                            <span
                              key={interest}
                              className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                      {isCurrentUser ? (
                        <button
                          onClick={() => router.push("/profile")}
                          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Edit Profile
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              router.push(`/researchers/${profile.id}`)
                            }
                            className="rounded-full bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                          >
                            View Profile
                          </button>

                          <button
                            onClick={() =>
                              alert(
                                "Mentorship and direct profile connection requests will be added soon.",
                              )
                            }
                            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Connect
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
