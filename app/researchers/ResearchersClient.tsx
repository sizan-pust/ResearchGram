"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUserSafe, isAuthLockError } from "@/lib/authSafe";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ResearchersUI, {
  type ConnectionStatus,
  type ResearcherProfile,
} from "./UI";

export default function ResearchersClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [profiles, setProfiles] = useState<ResearcherProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [connectionStatusMap, setConnectionStatusMap] = useState<
    Record<string, ConnectionStatus>
  >({});
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const loadConnectionStatuses = useCallback(
    async (
      activeUserId: string,
      researcherProfiles: ResearcherProfile[],
    ) => {
      const otherUserIds = researcherProfiles
        .map((profile) => profile.id)
        .filter((id) => id !== activeUserId);

      const statusMap: Record<string, ConnectionStatus> = {};

      researcherProfiles.forEach((profile) => {
        statusMap[profile.id] =
          profile.id === activeUserId ? "self" : "none";
      });

      if (otherUserIds.length === 0) {
        setConnectionStatusMap(statusMap);
        return;
      }

      const { data: connections, error: connectionError } = await supabase
        .from("user_connections")
        .select("user_one_id, user_two_id")
        .or(`user_one_id.eq.${activeUserId},user_two_id.eq.${activeUserId}`);

      if (connectionError) {
        console.log("FETCH CONNECTIONS ERROR:", connectionError);
      }

      (connections || []).forEach((connection: any) => {
        const otherId =
          connection.user_one_id === activeUserId
            ? connection.user_two_id
            : connection.user_one_id;

        statusMap[otherId] = "connected";
      });

      const { data: requests, error: requestError } = await supabase
        .from("profile_requests")
        .select("requester_id, receiver_id, status")
        .eq("request_type", "connection")
        .eq("status", "pending")
        .or(`requester_id.eq.${activeUserId},receiver_id.eq.${activeUserId}`);

      if (requestError) {
        console.log("FETCH PROFILE REQUESTS ERROR:", requestError);
      }

      (requests || []).forEach((request: any) => {
        if (request.requester_id === activeUserId) {
          statusMap[request.receiver_id] = "requested";
        }

        if (request.receiver_id === activeUserId) {
          statusMap[request.requester_id] = "received";
        }
      });

      setConnectionStatusMap(statusMap);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const loadResearchers = async () => {
      setLoading(true);

      try {
        const authUser = await getCurrentUserSafe();

        if (!authUser) {
          router.push("/auth/login");
          return;
        }

        if (cancelled) return;

        const activeUserId = authUser.id;
        setCurrentUserId(activeUserId);

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, email, full_name, department, skills, interests, bio, profile_pic_url",
          )
          .order("full_name", { ascending: true });

        if (error) {
          console.log("FETCH RESEARCHERS ERROR:", error);

          if (!cancelled) {
            setProfiles([]);
          }

          return;
        }

        const loadedProfiles = (data || []) as ResearcherProfile[];

        if (cancelled) return;

        setProfiles(loadedProfiles);

        await loadConnectionStatuses(activeUserId, loadedProfiles);
      } catch (error) {
        if (isAuthLockError(error)) {
          console.log("RESEARCHERS AUTH LOCK ERROR:", error);
          return;
        }

        console.log("RESEARCHERS LOAD ERROR:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadResearchers();

    return () => {
      cancelled = true;
    };
  }, [router, loadConnectionStatuses]);

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

  return (
    <ResearchersUI
      loading={loading}
      currentUserId={currentUserId}
      searchQuery={searchQuery}
      filteredProfiles={filteredProfiles}
      connectionStatusMap={connectionStatusMap}
      connectingId={connectingId}
      setSearchQuery={setSearchQuery}
      handleSendConnectionRequest={handleSendConnectionRequest}
      handleGoToProfile={() => router.push("/profile")}
      handleGoToResearcher={(profileId) =>
        router.push(`/researchers/${profileId}`)
      }
    />
  );
}