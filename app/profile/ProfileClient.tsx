"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProfileUI from "./UI";

const PROFILE_BUCKET = "profile-avatars";

export default function ProfileClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [bio, setBio] = useState("");

  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [previewProfileUrl, setPreviewProfileUrl] = useState("");
  const [previewCoverUrl, setPreviewCoverUrl] = useState("");

  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          router.push("/auth/login");
          return;
        }

        const user = authData.user;

        setUserId(user.id);
        setEmail(user.email ?? "");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setName(profileData.full_name ?? "");
          setDept(profileData.department ?? "");
          setSkills(profileData.skills ?? "");
          setInterests(profileData.interests ?? "");
          setBio(profileData.bio ?? "");
          setProfilePicUrl(profileData.profile_pic_url ?? "");
          setCoverPhotoUrl(profileData.cover_photo_url ?? "");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading profile:", error);
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleProfilePicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setProfilePicFile(file);

    const reader = new FileReader();

    reader.onload = (event) => {
      setPreviewProfileUrl(event.target?.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleCoverPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setCoverPhotoFile(file);

    const reader = new FileReader();

    reader.onload = (event) => {
      setPreviewCoverUrl(event.target?.result as string);
    };

    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File, folder: string, fileName: string) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${folder}/${fileName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from(PROFILE_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleUploadProfilePic = async () => {
    if (!profilePicFile || !userId) return;

    setUploading(true);

    try {
      const url = await uploadFile(
        profilePicFile,
        userId,
        `profile-${Date.now()}`,
      );

      setProfilePicUrl(url);
      setProfilePicFile(null);
      setPreviewProfileUrl("");

      const { error } = await supabase
        .from("profiles")
        .update({
          profile_pic_url: url,
        })
        .eq("id", userId);

      if (error) throw error;

      alert("Profile picture updated!");
    } catch (error) {
      alert(
        "Error: " + (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleUploadCover = async () => {
    if (!coverPhotoFile || !userId) return;

    setUploading(true);

    try {
      const url = await uploadFile(
        coverPhotoFile,
        userId,
        `cover-${Date.now()}`,
      );

      setCoverPhotoUrl(url);
      setCoverPhotoFile(null);
      setPreviewCoverUrl("");

      const { error } = await supabase
        .from("profiles")
        .update({
          cover_photo_url: url,
        })
        .eq("id", userId);

      if (error) throw error;

      alert("Cover photo updated!");
    } catch (error) {
      alert(
        "Error: " + (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      alert("You must be logged in.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        email,
        full_name: name,
        department: dept,
        skills,
        interests,
        bio,
      });

      if (error) throw error;

      alert("Profile saved!");
      setEditMode(false);
    } catch (error) {
      alert(
        "Error: " + (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <ProfileUI
      loading={loading}
      saving={saving}
      uploading={uploading}
      editMode={editMode}
      email={email}
      name={name}
      dept={dept}
      skills={skills}
      interests={interests}
      bio={bio}
      profilePicUrl={profilePicUrl}
      coverPhotoUrl={coverPhotoUrl}
      previewProfileUrl={previewProfileUrl}
      previewCoverUrl={previewCoverUrl}
      profilePicFile={profilePicFile}
      coverPhotoFile={coverPhotoFile}
      setEditMode={setEditMode}
      setName={setName}
      setDept={setDept}
      setSkills={setSkills}
      setInterests={setInterests}
      setBio={setBio}
      handleProfilePicSelect={handleProfilePicSelect}
      handleCoverPhotoSelect={handleCoverPhotoSelect}
      handleUploadProfilePic={handleUploadProfilePic}
      handleUploadCover={handleUploadCover}
      handleSave={handleSave}
      handleLogout={handleLogout}
    />
  );
}