"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ResearcherDetailUI, {
  type ConnectionStatus,
  type ResearcherProfile,
  type ResearchPost,
} from "./UI";

export default function ResearcherDetailClient() {
  const router = useRouter();
  const params = useParams();

  const researcherId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [profile, setProfile] = useState<ResearcherProfile | null>(null);
  const [posts, setPosts] = useState<ResearchPost[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("none");
  const [connecting, setConnecting] = useState(false);

  const loadConnectionStatus = async (
    currentUserId: string,
    targetUserId: string,
  ) => {
    if (currentUserId === targetUserId) {
      setConnectionStatus("self");
      return;
    }

    const { data: connections } = await supabase
      .from("user_connections")
      .select("id")
      .or(
        `and(user_one_id.eq.${currentUserId},user_two_id.eq.${targetUserId}),and(user_one_id.eq.${targetUserId},user_two_id.eq.${currentUserId})`,
      )
      .maybeSingle();

    if (connections) {
      setConnectionStatus("connected");
      return;
    }

    const { data: requestData } = await supabase
      .from("profile_requests")
      .select("requester_id, receiver_id, status")
      .eq("request_type", "connection")
      .eq("status", "pending")
      .or(
        `and(requester_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`,
      )
      .maybeSingle();

    if (requestData) {
      if (requestData.requester_id === currentUserId) {
        setConnectionStatus("requested");
      } else {
        setConnectionStatus("received");
      }

      return;
    }

    setConnectionStatus("none");
  };

  useEffect(() => {
    const loadResearcherProfile = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/auth/login");
        return;
      }

      setCurrentUserId(authData.user.id);
      await loadConnectionStatus(authData.user.id, researcherId);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, department, skills, interests, bio, profile_pic_url, cover_photo_url",
        )
        .eq("id", researcherId)
        .single();

      if (profileError) {
        console.log("FETCH RESEARCHER PROFILE ERROR:", profileError);
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(profileData as ResearcherProfile);

      const { data: postData, error: postError } = await supabase
        .from("contents")
        .select("id, title, content, post_type, created_at")
        .eq("user_id", researcherId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (postError) {
        console.log("FETCH RESEARCHER POSTS ERROR:", postError);
        setPosts([]);
      } else {
        setPosts((postData || []) as ResearchPost[]);
      }

      setLoading(false);
    };

    if (researcherId) {
      loadResearcherProfile();
    }
  }, [researcherId, router]);

  const handleSendConnectionRequest = async () => {
    if (!currentUserId || !profile) return;

    if (currentUserId === profile.id) {
      alert("You cannot connect with yourself.");
      return;
    }

    setConnecting(true);

    const { error } = await supabase.from("profile_requests").insert({
      requester_id: currentUserId,
      receiver_id: profile.id,
      request_type: "connection",
      message: "I would like to connect with you on ResearchGram.",
      status: "pending",
    });

    if (error) {
      console.log("SEND PROFILE CONNECTION REQUEST ERROR:", error);
      alert(error.message);
      setConnecting(false);
      return;
    }

    setConnectionStatus("requested");
    setConnecting(false);
  };

  return (
    <ResearcherDetailUI
      loading={loading}
      currentUserId={currentUserId}
      profile={profile}
      posts={posts}
      connectionStatus={connectionStatus}
      connecting={connecting}
      handleSendConnectionRequest={handleSendConnectionRequest}
      handleBackToResearchers={() => router.push("/researchers")}
      handleGoToProfile={() => router.push("/profile")}
      handleGoToFeed={() => router.push("/feed")}
    />
  );
}