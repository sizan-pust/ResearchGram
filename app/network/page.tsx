"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  skills: string | null;
  interests: string | null;
  bio: string | null;
  profile_pic_url: string | null;
};

type UserConnection = {
  id: string;
  user_one_id: string;
  user_two_id: string;
  created_at: string | null;
};

type NetworkPerson = {
  connection: UserConnection;
  profile: Profile | null;
};

function splitTags(value: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function formatTime(dateString: string | null) {
  if (!dateString) return "Unknown time";

  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  } catch {
    return "Unknown time";
  }
}

export default function NetworkPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [startingConversationId, setStartingConversationId] = useState<
    string | null
  >(null);

  const [currentUserId, setCurrentUserId] = useState("");
  const [connections, setConnections] = useState<NetworkPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadNetwork = async () => {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push("/auth/login");
      return;
    }

    const userId = authData.user.id;
    setCurrentUserId(userId);

    const { data: connectionData, error: connectionError } = await supabase
      .from("user_connections")
      .select("id, user_one_id, user_two_id, created_at")
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (connectionError) {
      console.log("FETCH NETWORK CONNECTIONS ERROR:", connectionError);
      setConnections([]);
      setLoading(false);
      return;
    }

    const rawConnections = (connectionData || []) as UserConnection[];

    if (rawConnections.length === 0) {
      setConnections([]);
      setLoading(false);
      return;
    }

    const otherUserIds = Array.from(
      new Set(
        rawConnections.map((connection) =>
          connection.user_one_id === userId
            ? connection.user_two_id
            : connection.user_one_id,
        ),
      ),
    );

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, department, skills, interests, bio, profile_pic_url",
      )
      .in("id", otherUserIds);

    if (profilesError) {
      console.log("FETCH NETWORK PROFILES ERROR:", profilesError);
    }

    const profileMap = (profilesData || []).reduce(
      (acc, profile) => {
        acc[profile.id] = profile as Profile;
        return acc;
      },
      {} as Record<string, Profile>,
    );

    const normalized: NetworkPerson[] = rawConnections.map((connection) => {
      const otherUserId =
        connection.user_one_id === userId
          ? connection.user_two_id
          : connection.user_one_id;

      return {
        connection,
        profile: profileMap[otherUserId] || null,
      };
    });

    setConnections(normalized);
    setLoading(false);
  };

  useEffect(() => {
    loadNetwork();
  }, []);

  const filteredConnections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return connections;

    return connections.filter((item) => {
      const profile = item.profile;

      const searchableText = [
        profile?.full_name,
        profile?.email,
        profile?.department,
        profile?.skills,
        profile?.interests,
        profile?.bio,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [connections, searchQuery]);

  const handleStartDirectMessage = async (targetUserId: string) => {
    if (!currentUserId) {
      alert("You must be logged in to send messages.");
      return;
    }

    if (targetUserId === currentUserId) {
      alert("You cannot message yourself.");
      return;
    }

    setStartingConversationId(targetUserId);

    const { data: existingConversation, error: existingError } = await supabase
      .from("conversations")
      .select("id")
      .is("request_id", null)
      .is("content_id", null)
      .or(
        `and(participant_one_id.eq.${currentUserId},participant_two_id.eq.${targetUserId}),and(participant_one_id.eq.${targetUserId},participant_two_id.eq.${currentUserId})`,
      )
      .maybeSingle();

    if (existingError) {
      console.log("CHECK DIRECT CONVERSATION ERROR:", existingError);
      alert(existingError.message);
      setStartingConversationId(null);
      return;
    }

    if (existingConversation) {
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", existingConversation.id);

      router.push(`/messages?conversation=${existingConversation.id}`);
      return;
    }

    const [participantOneId, participantTwoId] =
      currentUserId < targetUserId
        ? [currentUserId, targetUserId]
        : [targetUserId, currentUserId];

    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert({
        request_id: null,
        content_id: null,
        participant_one_id: participantOneId,
        participant_two_id: participantTwoId,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError || !newConversation) {
      console.log("CREATE DIRECT CONVERSATION ERROR:", createError);
      alert(createError?.message || "Could not start conversation.");
      setStartingConversationId(null);
      return;
    }

    router.push(`/messages?conversation=${newConversation.id}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading your network...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <AppNav activePage="network" />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 border-b border-gray-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-950">
                My Network
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                View your accepted academic connections and start direct
                research conversations.
              </p>
            </div>

            <div className="w-full lg:max-w-md">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your network by name, department, skill..."
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredConnections.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
                  🌐
                </div>

                <h2 className="text-lg font-bold text-gray-900">
                  No connections found
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {connections.length === 0
                    ? "Start connecting with researchers from the Discover Researchers page."
                    : "Try searching by another name, department, or research skill."}
                </p>

                {connections.length === 0 && (
                  <button
                    onClick={() => router.push("/researchers")}
                    className="mt-5 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Discover Researchers
                  </button>
                )}
              </div>
            ) : (
              filteredConnections.map((item) => {
                const profile = item.profile;
                const skillTags = splitTags(profile?.skills || null);
                const interestTags = splitTags(profile?.interests || null);

                return (
                  <div
                    key={item.connection.id}
                    className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100">
                        {profile?.profile_pic_url ? (
                          <img
                            src={profile.profile_pic_url}
                            alt={profile.full_name || "Profile photo"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-bold text-blue-700">
                            {(profile?.full_name || "R")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-bold text-gray-950">
                          {profile?.full_name || "ResearchGram User"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          {profile?.department || "Research community"}
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                          Connected since {formatTime(item.connection.created_at)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
                      {profile?.bio ||
                        "No bio added yet. This researcher has not completed their academic introduction."}
                    </p>

                    {skillTags.length > 0 && (
                      <div className="mt-4">
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
                      <button
                        onClick={() =>
                          profile && router.push(`/researchers/${profile.id}`)
                        }
                        className="rounded-full bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                      >
                        View Profile
                      </button>

                      <button
                        onClick={() =>
                          profile && handleStartDirectMessage(profile.id)
                        }
                        disabled={
                          !profile || startingConversationId === profile.id
                        }
                        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {profile && startingConversationId === profile.id
                          ? "Opening..."
                          : "Message"}
                      </button>
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