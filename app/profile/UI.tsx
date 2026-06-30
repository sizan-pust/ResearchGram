// "use client";

// import { useRef } from "react";
// import AppNav from "@/components/AppNav";

// type ProfileUIProps = {
//   loading: boolean;
//   saving: boolean;
//   uploading: boolean;
//   editMode: boolean;

//   email: string;
//   name: string;
//   dept: string;
//   skills: string;
//   interests: string;
//   bio: string;

//   profilePicUrl: string;
//   coverPhotoUrl: string;
//   previewProfileUrl: string;
//   previewCoverUrl: string;

//   profilePicFile: File | null;
//   coverPhotoFile: File | null;

//   setEditMode: (value: boolean) => void;
//   setName: (value: string) => void;
//   setDept: (value: string) => void;
//   setSkills: (value: string) => void;
//   setInterests: (value: string) => void;
//   setBio: (value: string) => void;

//   handleProfilePicSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   handleCoverPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   handleUploadProfilePic: () => void;
//   handleUploadCover: () => void;
//   handleSave: () => void;
//   handleLogout: () => void;
// };

// function splitCommaItems(value: string) {
//   return value
//     .split(",")
//     .map((item) => item.trim())
//     .filter(Boolean);
// }

// export default function ProfileUI({
//   loading,
//   saving,
//   uploading,
//   editMode,
//   email,
//   name,
//   dept,
//   skills,
//   interests,
//   bio,
//   profilePicUrl,
//   coverPhotoUrl,
//   previewProfileUrl,
//   previewCoverUrl,
//   profilePicFile,
//   coverPhotoFile,
//   setEditMode,
//   setName,
//   setDept,
//   setSkills,
//   setInterests,
//   setBio,
//   handleProfilePicSelect,
//   handleCoverPhotoSelect,
//   handleUploadProfilePic,
//   handleUploadCover,
//   handleSave,
//   handleLogout,
// }: ProfileUIProps) {
//   const profileFileInputRef = useRef<HTMLInputElement>(null);
//   const coverFileInputRef = useRef<HTMLInputElement>(null);

//   if (loading) {
//     return (
//       <main className="flex min-h-screen items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
//           <p className="text-lg text-gray-600">Loading profile...</p>
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="min-h-screen bg-gray-50">
//       <AppNav activePage="profile" />

//       <div className="relative bg-white">
//         <div className="relative h-80 w-full overflow-hidden bg-gradient-to-r from-blue-400 to-blue-600">
//           {previewCoverUrl || coverPhotoUrl ? (
//             <img
//               src={previewCoverUrl || coverPhotoUrl}
//               alt="Cover"
//               className="h-full w-full object-cover"
//             />
//           ) : (
//             <div className="h-full w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
//           )}

//           <button
//             onClick={() => coverFileInputRef.current?.click()}
//             className="absolute bottom-4 right-4 rounded-full bg-white bg-opacity-90 px-4 py-2 font-semibold text-gray-900 shadow-lg transition hover:bg-opacity-100"
//           >
//             📷 Edit
//           </button>

//           <input
//             ref={coverFileInputRef}
//             type="file"
//             accept="image/*"
//             onChange={handleCoverPhotoSelect}
//             className="hidden"
//           />

//           {coverPhotoFile && (
//             <button
//               onClick={handleUploadCover}
//               disabled={uploading}
//               className="absolute bottom-16 right-4 rounded-full bg-green-600 px-4 py-2 font-semibold text-white shadow-lg transition hover:bg-green-700 disabled:opacity-50"
//             >
//               {uploading ? "Uploading..." : "Save Cover"}
//             </button>
//           )}
//         </div>

//         <div className="relative px-4 pb-6">
//           <div className="mx-auto max-w-6xl">
//             <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-4">
//               <div className="relative -mt-24 w-fit">
//                 <div className="relative h-40 w-40 rounded-full border-4 border-white bg-white shadow-lg">
//                   {previewProfileUrl || profilePicUrl ? (
//                     <img
//                       src={previewProfileUrl || profilePicUrl}
//                       alt="Profile"
//                       className="h-full w-full rounded-full object-cover"
//                     />
//                   ) : (
//                     <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50">
//                       <span className="text-6xl">👤</span>
//                     </div>
//                   )}
//                 </div>

//                 <button
//                   onClick={() => profileFileInputRef.current?.click()}
//                   className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-3 text-white shadow-lg transition hover:bg-blue-700"
//                   title="Change profile picture"
//                 >
//                   📷
//                 </button>

//                 <input
//                   ref={profileFileInputRef}
//                   type="file"
//                   accept="image/*"
//                   onChange={handleProfilePicSelect}
//                   className="hidden"
//                 />

//                 {profilePicFile && (
//                   <button
//                     onClick={handleUploadProfilePic}
//                     disabled={uploading}
//                     className="absolute -bottom-12 right-0 rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
//                   >
//                     {uploading ? "Uploading..." : "Save"}
//                   </button>
//                 )}
//               </div>

//               <div className="flex-1">
//                 <h1 className="text-4xl font-bold text-gray-900">
//                   {name || "Your Name"}
//                 </h1>

//                 <p className="mt-1 text-lg text-gray-600">
//                   {dept || "Your Department"}
//                 </p>

//                 <p className="mt-2 text-sm text-gray-500">{email}</p>
//               </div>

//               <div className="flex gap-3">
//                 {editMode ? (
//                   <>
//                     <button
//                       onClick={handleSave}
//                       disabled={saving}
//                       className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
//                     >
//                       {saving ? "Saving..." : "Save"}
//                     </button>

//                     <button
//                       onClick={() => setEditMode(false)}
//                       className="rounded-lg border-2 border-gray-300 px-6 py-2 font-semibold text-gray-700 transition hover:bg-gray-100"
//                     >
//                       Cancel
//                     </button>
//                   </>
//                 ) : (
//                   <>
//                     <button
//                       onClick={() => setEditMode(true)}
//                       className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
//                     >
//                       ✏️ Edit Profile
//                     </button>

//                     <button
//                       onClick={handleLogout}
//                       className="rounded-lg border-2 border-red-500 px-6 py-2 font-semibold text-red-600 transition hover:bg-red-50"
//                     >
//                       Logout
//                     </button>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="mx-auto max-w-6xl px-4 py-8">
//         <div className="grid gap-6 lg:grid-cols-3">
//           {!editMode && (
//             <div className="rounded-lg bg-white p-6 shadow">
//               <h2 className="mb-4 text-xl font-bold text-gray-900">About</h2>

//               <div className="space-y-4">
//                 <div>
//                   <p className="text-sm font-semibold text-gray-600">BIO</p>
//                   <p className="mt-1 text-gray-900">
//                     {bio || "No bio added yet"}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-sm font-semibold text-gray-600">
//                     EXPERTISE
//                   </p>

//                   <div className="mt-2 flex flex-wrap gap-2">
//                     {skills ? (
//                       splitCommaItems(skills).map((skill) => (
//                         <span
//                           key={skill}
//                           className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
//                         >
//                           {skill}
//                         </span>
//                       ))
//                     ) : (
//                       <p className="text-gray-500">No skills added yet</p>
//                     )}
//                   </div>
//                 </div>

//                 <div>
//                   <p className="text-sm font-semibold text-gray-600">
//                     RESEARCH INTERESTS
//                   </p>

//                   <div className="mt-2 flex flex-wrap gap-2">
//                     {interests ? (
//                       splitCommaItems(interests).map((interest) => (
//                         <span
//                           key={interest}
//                           className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
//                         >
//                           {interest}
//                         </span>
//                       ))
//                     ) : (
//                       <p className="text-gray-500">No interests added yet</p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {editMode && (
//             <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
//               <h2 className="mb-6 text-2xl font-bold text-gray-900">
//                 Edit Profile
//               </h2>

//               <div className="space-y-5">
//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-gray-700">
//                     Full Name
//                   </label>

//                   <input
//                     type="text"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-gray-700">
//                     Email
//                   </label>

//                   <input
//                     type="email"
//                     value={email}
//                     readOnly
//                     className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-600 outline-none"
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-gray-700">
//                     Department / Institution
//                   </label>

//                   <input
//                     type="text"
//                     value={dept}
//                     onChange={(e) => setDept(e.target.value)}
//                     placeholder="e.g., Computer Science Department"
//                     className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-gray-700">
//                     Professional Bio
//                   </label>

//                   <textarea
//                     value={bio}
//                     onChange={(e) => setBio(e.target.value)}
//                     placeholder="Write a brief professional biography..."
//                     rows={4}
//                     className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-gray-700">
//                     Skills & Expertise
//                   </label>

//                   <textarea
//                     value={skills}
//                     onChange={(e) => setSkills(e.target.value)}
//                     placeholder="e.g., Machine Learning, Data Analysis, Python"
//                     rows={3}
//                     className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                   />

//                   <p className="mt-1 text-xs text-gray-500">
//                     Separate with commas
//                   </p>
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-gray-700">
//                     Research Interests
//                   </label>

//                   <textarea
//                     value={interests}
//                     onChange={(e) => setInterests(e.target.value)}
//                     placeholder="e.g., AI Ethics, NLP, Computational Linguistics"
//                     rows={3}
//                     className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                   />

//                   <p className="mt-1 text-xs text-gray-500">
//                     Separate with commas
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {!editMode && (
//             <div className="rounded-lg bg-white p-6 shadow">
//               <h2 className="mb-4 text-xl font-bold text-gray-900">
//                 Research Metrics
//               </h2>

//               <div className="space-y-3">
//                 <div className="rounded-lg bg-blue-50 p-4 text-center">
//                   <p className="text-3xl font-bold text-blue-600">—</p>
//                   <p className="text-sm font-semibold text-gray-700">h-index</p>
//                 </div>

//                 <div className="rounded-lg bg-green-50 p-4 text-center">
//                   <p className="text-3xl font-bold text-green-600">—</p>
//                   <p className="text-sm font-semibold text-gray-700">i-index</p>
//                 </div>

//                 <div className="rounded-lg bg-purple-50 p-4 text-center">
//                   <p className="text-3xl font-bold text-purple-600">—</p>
//                   <p className="text-sm font-semibold text-gray-700">
//                     Publications
//                   </p>
//                 </div>
//               </div>

//               <p className="mt-4 text-center text-xs text-gray-500">
//                 Metrics coming soon
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </main>
//   );
// }










"use client";

import { useMemo, useRef } from "react";
import ResearchGramSkeleton from "@/components/ResearchGramSkeleton";
import AppNav from "@/components/AppNav";
import {
  Camera,
  Check,
  X,
  Edit3,
  UserPlus,
  MessageSquare,
  Star,
  MapPin,
  Mail,
  Calendar,
  Globe,
  Clock,
  Zap,
  GitBranch,
  BookOpen,
  TrendingUp,
  BarChart2,
  Award,
  FileText,
  Users,
  Bookmark,
  LogOut,
  Upload,
  Plus,
  ImageIcon,
} from "lucide-react";

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

function getInitials(name: string, email: string) {
  const source = (name || email.split("@")[0] || "U").trim();
  const parts = source.split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "U";
}

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1440&h=280&fit=crop&auto=format";

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

  const initials = getInitials(name, email);
  const skillsList = useMemo(() => splitCommaItems(skills), [skills]);
  const interestsList = useMemo(() => splitCommaItems(interests), [interests]);

  // Profile completeness score — purely derived from filled fields
  const completionScore = useMemo(() => {
    const fields = [
      name,
      dept,
      bio,
      skills,
      interests,
      profilePicUrl,
      coverPhotoUrl,
    ];
    const filled = fields.filter((v) => v && v.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [name, dept, bio, skills, interests, profilePicUrl, coverPhotoUrl]);

  const displayCover = previewCoverUrl || coverPhotoUrl || DEFAULT_COVER;
  const displayProfile = previewProfileUrl || profilePicUrl;

 if (loading) {
  return <ResearchGramSkeleton activePage="profile" variant="profile" />;
}
  return (
    <main className="min-h-screen bg-background pb-24 lg:pb-12">
      <AppNav activePage="profile" />

      {/* ── Cover ────────────────────────────────────────────────────────── */}
      <div className="relative h-52 lg:h-60 overflow-hidden bg-slate-200 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayCover}
          alt="Profile cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 via-indigo-700/20 to-transparent pointer-events-none" />

        {/* Cover photo controls */}
        <div className="absolute bottom-4 right-4 lg:right-6 flex items-center gap-2">
          {previewCoverUrl && coverPhotoFile ? (
            <button
              onClick={handleUploadCover}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "Uploading…" : "Save Cover"}
            </button>
          ) : null}
          <button
            onClick={() => coverFileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-xl text-white text-sm font-semibold border border-white/20 hover:bg-black/55 transition-colors"
          >
            <Camera className="w-4 h-4" /> Change Cover
          </button>
          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverPhotoSelect}
          />
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 lg:px-6">
        {/* ── Profile header card ──────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border shadow-md -mt-10 relative z-10 p-5 lg:p-6 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 lg:gap-5">
              {/* Avatar */}
              <div className="-mt-20 flex-shrink-0 relative group">
                <div
                  className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl border-[5px] border-white shadow-lg overflow-hidden flex items-center justify-center text-white text-2xl font-extrabold"
                  style={{ backgroundColor: "#4f46e5" }}
                >
                  {displayProfile ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayProfile}
                      alt={name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                {/* Avatar overlay control */}
                <button
                  onClick={() => profileFileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-white border-2 border-white shadow-md flex items-center justify-center hover:bg-primary/90 transition-colors"
                  aria-label="Change profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={profileFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePicSelect}
                />
              </div>

              <div className="pt-2 min-w-0">
                {editMode ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="text-xl font-extrabold text-foreground bg-muted rounded-xl px-3 py-1.5 border border-border focus:border-primary focus:bg-white focus:outline-none transition-all w-full max-w-[320px]"
                  />
                ) : (
                  <h1 className="text-xl font-extrabold text-foreground break-words">
                    {name || "Unnamed researcher"}
                  </h1>
                )}

                <p className="text-sm font-semibold text-primary mt-0.5">
                  {dept || "Add your department"}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="break-all">{email}</span>
                  </span>
                  {dept && !editMode && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="w-3 h-3 flex-shrink-0" />
                      {dept}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right buttons */}
            <div className="flex flex-wrap gap-2 pt-1 flex-shrink-0">
              {editMode ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Pending profile pic upload banner */}
          {previewProfileUrl && profilePicFile && (
            <div className="mt-4 p-3 rounded-xl bg-accent border border-primary/20 flex items-center gap-3 flex-wrap">
              <ImageIcon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground flex-1 min-w-0 truncate">
                New profile photo selected:{" "}
                <span className="font-semibold">{profilePicFile.name}</span>
              </span>
              <button
                onClick={handleUploadProfilePic}
                disabled={uploading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                {uploading ? "Uploading…" : "Upload Photo"}
              </button>
            </div>
          )}

          {/* Completion bar */}
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Profile Completeness
              </span>
              <span className="text-xs font-extrabold text-primary">
                {completionScore}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${completionScore}%`,
                  background: "linear-gradient(90deg, #4f46e5, #3b82f6)",
                }}
              />
            </div>
            {completionScore < 100 && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {completionScore < 60
                  ? "Add your bio, skills, interests, and photos to complete your researcher profile."
                  : "Almost there! Fill the remaining sections to reach 100%."}
              </p>
            )}
          </div>
        </div>

        {/* ── Content grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[296px_1fr] gap-5">
          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Academic info */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Academic
                Information
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">
                    Department
                  </dt>
                  {editMode ? (
                    <input
                      type="text"
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full text-sm px-3 py-2 bg-muted rounded-xl border border-border focus:border-primary focus:bg-white focus:outline-none transition-all"
                    />
                  ) : (
                    <dd className="text-sm text-foreground font-semibold">
                      {dept || (
                        <span className="text-muted-foreground italic font-normal">
                          Not set
                        </span>
                      )}
                    </dd>
                  )}
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">
                    Email
                  </dt>
                  <dd className="text-sm text-foreground font-semibold break-all">
                    {email}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Skills */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Skills & Expertise
              </h3>
              {editMode ? (
                <>
                  <textarea
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Python, TensorFlow, PyTorch, SQL, …"
                    rows={3}
                    className="w-full text-sm px-3 py-2 bg-muted rounded-xl border border-border focus:border-primary focus:bg-white focus:outline-none resize-none transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Separate skills with commas
                  </p>
                </>
              ) : skillsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-default"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No skills added yet. Click Edit Profile to add some.
                </p>
              )}
            </div>

            {/* Research interests */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Research
                Interests
              </h3>
              {editMode ? (
                <>
                  <textarea
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="NLP, Machine Learning, IoT Security, …"
                    rows={3}
                    className="w-full text-sm px-3 py-2 bg-muted rounded-xl border border-border focus:border-primary focus:bg-white focus:outline-none resize-none transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Separate interests with commas
                  </p>
                </>
              ) : interestsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {interestsList.map((i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100 hover:bg-blue-100 transition-colors cursor-default"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No interests added yet.
                </p>
              )}
            </div>

            {/* Contact */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Contact
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-foreground font-medium break-all">
                  {email}
                </span>
              </div>
            </div>
          </div>

          {/* ── Right column ────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* About / Bio */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">
                  About / Bio
                </h3>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
              {editMode ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short bio about your research focus, current work, and what you're passionate about…"
                  rows={6}
                  className="w-full text-sm px-4 py-3 bg-muted rounded-xl border border-border focus:border-primary focus:bg-white focus:outline-none resize-none transition-all leading-relaxed"
                />
              ) : bio ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {bio}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No bio added yet. Tell other researchers about your work.
                </p>
              )}
            </div>

            {/* Research metrics — placeholders (data not in DB yet) */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" /> Research Metrics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Publications",
                    value: "—",
                    cls: "text-violet-600 bg-violet-50",
                    icon: FileText,
                  },
                  {
                    label: "Collaborations",
                    value: "—",
                    cls: "text-blue-600 bg-blue-50",
                    icon: Users,
                  },
                  {
                    label: "Citations",
                    value: "—",
                    cls: "text-amber-600 bg-amber-50",
                    icon: Award,
                  },
                  {
                    label: "Projects",
                    value: "—",
                    cls: "text-emerald-600 bg-emerald-50",
                    icon: GitBranch,
                  },
                  {
                    label: "Saved Posts",
                    value: "—",
                    cls: "text-rose-600 bg-rose-50",
                    icon: Bookmark,
                  },
                  {
                    label: "h-index",
                    value: "—",
                    cls: "text-slate-600 bg-slate-100",
                    icon: BarChart2,
                  },
                ].map(({ label, value, cls, icon: Icon }) => (
                  <div
                    key={label}
                    className="bg-muted/40 rounded-2xl p-4 text-center border border-border hover:border-primary/20 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${cls} flex items-center justify-center mx-auto mb-2.5`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-extrabold text-foreground leading-none">
                      {value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 italic">
                These metrics will populate as your activity grows on
                ResearchGram.
              </p>
            </div>

            {/* Mentorship — soft promo card */}
            <div
              className="rounded-2xl border border-indigo-100 p-5"
              style={{
                background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-indigo-600" /> Mentorship
                </h3>
              </div>
              <p className="text-sm text-indigo-700 mb-4 leading-relaxed">
                Connect with senior researchers for thesis guidance, paper
                writing, or career advice — or become a mentor yourself.
              </p>
              <a
                href="/mentorship"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                <Star className="w-4 h-4" /> Find Mentors
              </a>
            </div>

            {/* Account section */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Account
              </h3>
              <div className="space-y-2">
                <a
                  href="/auth/forgot-password"
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                >
                  Change password
                  <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  Logout from ResearchGram
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
