"use client";

import { useRef } from "react";
import AppNav from "@/components/AppNav";

type ProfileUIProps = {
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  editMode: boolean;

  email: string;
  name: string;
  dept: string;
  skills: string;
  interests: string;
  bio: string;

  profilePicUrl: string;
  coverPhotoUrl: string;
  previewProfileUrl: string;
  previewCoverUrl: string;

  profilePicFile: File | null;
  coverPhotoFile: File | null;

  setEditMode: (value: boolean) => void;
  setName: (value: string) => void;
  setDept: (value: string) => void;
  setSkills: (value: string) => void;
  setInterests: (value: string) => void;
  setBio: (value: string) => void;

  handleProfilePicSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCoverPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUploadProfilePic: () => void;
  handleUploadCover: () => void;
  handleSave: () => void;
  handleLogout: () => void;
};

function splitCommaItems(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProfileUI({
  loading,
  saving,
  uploading,
  editMode,
  email,
  name,
  dept,
  skills,
  interests,
  bio,
  profilePicUrl,
  coverPhotoUrl,
  previewProfileUrl,
  previewCoverUrl,
  profilePicFile,
  coverPhotoFile,
  setEditMode,
  setName,
  setDept,
  setSkills,
  setInterests,
  setBio,
  handleProfilePicSelect,
  handleCoverPhotoSelect,
  handleUploadProfilePic,
  handleUploadCover,
  handleSave,
  handleLogout,
}: ProfileUIProps) {
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-lg text-gray-600">Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNav activePage="profile" />

      <div className="relative bg-white">
        <div className="relative h-80 w-full overflow-hidden bg-gradient-to-r from-blue-400 to-blue-600">
          {previewCoverUrl || coverPhotoUrl ? (
            <img
              src={previewCoverUrl || coverPhotoUrl}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
          )}

          <button
            onClick={() => coverFileInputRef.current?.click()}
            className="absolute bottom-4 right-4 rounded-full bg-white bg-opacity-90 px-4 py-2 font-semibold text-gray-900 shadow-lg transition hover:bg-opacity-100"
          >
            📷 Edit
          </button>

          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverPhotoSelect}
            className="hidden"
          />

          {coverPhotoFile && (
            <button
              onClick={handleUploadCover}
              disabled={uploading}
              className="absolute bottom-16 right-4 rounded-full bg-green-600 px-4 py-2 font-semibold text-white shadow-lg transition hover:bg-green-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Save Cover"}
            </button>
          )}
        </div>

        <div className="relative px-4 pb-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-4">
              <div className="relative -mt-24 w-fit">
                <div className="relative h-40 w-40 rounded-full border-4 border-white bg-white shadow-lg">
                  {previewProfileUrl || profilePicUrl ? (
                    <img
                      src={previewProfileUrl || profilePicUrl}
                      alt="Profile"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50">
                      <span className="text-6xl">👤</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => profileFileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-3 text-white shadow-lg transition hover:bg-blue-700"
                  title="Change profile picture"
                >
                  📷
                </button>

                <input
                  ref={profileFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicSelect}
                  className="hidden"
                />

                {profilePicFile && (
                  <button
                    onClick={handleUploadProfilePic}
                    disabled={uploading}
                    className="absolute -bottom-12 right-0 rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Save"}
                  </button>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900">
                  {name || "Your Name"}
                </h1>

                <p className="mt-1 text-lg text-gray-600">
                  {dept || "Your Department"}
                </p>

                <p className="mt-2 text-sm text-gray-500">{email}</p>
              </div>

              <div className="flex gap-3">
                {editMode ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>

                    <button
                      onClick={() => setEditMode(false)}
                      className="rounded-lg border-2 border-gray-300 px-6 py-2 font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditMode(true)}
                      className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
                    >
                      ✏️ Edit Profile
                    </button>

                    <button
                      onClick={handleLogout}
                      className="rounded-lg border-2 border-red-500 px-6 py-2 font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {!editMode && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">About</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">BIO</p>
                  <p className="mt-1 text-gray-900">
                    {bio || "No bio added yet"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    EXPERTISE
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills ? (
                      splitCommaItems(skills).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No skills added yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    RESEARCH INTERESTS
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {interests ? (
                      splitCommaItems(interests).map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No interests added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {editMode && (
            <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Edit Profile
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-600 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Department / Institution
                  </label>

                  <input
                    type="text"
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    placeholder="e.g., Computer Science Department"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Professional Bio
                  </label>

                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a brief professional biography..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Skills & Expertise
                  </label>

                  <textarea
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g., Machine Learning, Data Analysis, Python"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Separate with commas
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Research Interests
                  </label>

                  <textarea
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g., AI Ethics, NLP, Computational Linguistics"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Separate with commas
                  </p>
                </div>
              </div>
            </div>
          )}

          {!editMode && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Research Metrics
              </h2>

              <div className="space-y-3">
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">—</p>
                  <p className="text-sm font-semibold text-gray-700">h-index</p>
                </div>

                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">—</p>
                  <p className="text-sm font-semibold text-gray-700">i-index</p>
                </div>

                <div className="rounded-lg bg-purple-50 p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">—</p>
                  <p className="text-sm font-semibold text-gray-700">
                    Publications
                  </p>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-gray-500">
                Metrics coming soon
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}