// "use client";

// import { useMemo, useState } from "react";
// import AppNav from "@/components/AppNav";
// import {
//   ArrowRight,
//   Bell,
//   Check,
//   Clock,
//   ExternalLink,
//   FileText,
//   Filter,
//   GitBranch,
//   Inbox,
//   Lock,
//   MessageSquare,
//   Search,
//   Send,
//   ShieldCheck,
//   UserPlus,
//   Users,
//   X,
// } from "lucide-react";

// export type Profile = {
//   id: string;
//   full_name: string | null;
//   email: string | null;
//   department: string | null;
//   profile_pic_url: string | null;
// };

// export type ContentPost = {
//   id: string;
//   user_id: string | null;
//   title: string | null;
//   content: string | null;
//   abstract: string | null;
//   post_type: string | null;
//   content_category: string | null;
//   visibility_mode: string | null;
//   full_paper_access_mode: string | null;
//   allow_full_paper_request: boolean | null;
//   created_at: string | null;
// };

// export type RequestKind = "research" | "profile" | "paper_access";
// export type RequestDirection = "received" | "sent";

// export type RequestStatus =
//   | "pending"
//   | "accepted"
//   | "declined"
//   | "approved"
//   | "rejected";

// export type UnifiedRequestView = {
//   id: string;
//   kind: RequestKind;
//   direction: RequestDirection;
//   request_type: string;
//   status: RequestStatus;
//   message: string | null;
//   created_at: string | null;
//   updated_at: string | null;

//   requester_id: string | null;
//   receiver_id: string | null;
//   owner_id: string | null;
//   content_id: string | null;

//   otherProfile: Profile | null;
//   requesterProfile: Profile | null;
//   receiverProfile: Profile | null;
//   contentPost: ContentPost | null;
// };

// type RequestsUIProps = {
//   loading: boolean;
//   userId: string;
//   activeTab: "received" | "sent";
//   receivedRequests: UnifiedRequestView[];
//   sentRequests: UnifiedRequestView[];
//   updatingId: string | null;
//   openingConversationId: string | null;

//   setActiveTab: (tab: "received" | "sent") => void;
//   handleUpdateStatus: (
//     request: UnifiedRequestView,
//     nextStatus: RequestStatus,
//   ) => void;
//   handleOpenMessages: (request: UnifiedRequestView) => void;
//   handleGoToFeed: () => void;
//   handleGoToProfile: (profileId: string) => void;
//   getProfileName: (profile: Profile | null | undefined) => string;
// };

// type RequestFilter =
//   | "all"
//   | "pending"
//   | "collaboration"
//   | "connection"
//   | "paper_access"
//   | "approved";

// function formatTime(dateString: string | null) {
//   if (!dateString) return "Unknown time";

//   try {
//     const date = new Date(dateString);
//     const now = new Date();

//     const diffMs = now.getTime() - date.getTime();
//     const diffMinutes = Math.floor(diffMs / 60000);
//     const diffHours = Math.floor(diffMinutes / 60);
//     const diffDays = Math.floor(diffHours / 24);

//     if (diffMinutes < 1) return "Just now";
//     if (diffMinutes < 60) return `${diffMinutes}m ago`;
//     if (diffHours < 24) return `${diffHours}h ago`;
//     if (diffDays < 7) return `${diffDays}d ago`;

//     return new Intl.DateTimeFormat(undefined, {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     }).format(date);
//   } catch {
//     return "Unknown time";
//   }
// }

// function getInitials(name: string) {
//   const parts = name.trim().split(/\s+/);

//   return (
//     ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "RG"
//   );
// }

// function formatLabel(value: string | null | undefined) {
//   return (value || "").replaceAll("_", " ");
// }

// function getStatusStyle(status: RequestStatus) {
//   if (status === "pending") {
//     return {
//       label: "Pending",
//       className: "border-amber-200 bg-amber-50 text-amber-700",
//       Icon: Clock,
//     };
//   }

//   if (status === "accepted" || status === "approved") {
//     return {
//       label: status === "approved" ? "Approved" : "Accepted",
//       className: "border-emerald-200 bg-emerald-50 text-emerald-700",
//       Icon: ShieldCheck,
//     };
//   }

//   return {
//     label: status === "rejected" ? "Rejected" : "Declined",
//     className: "border-red-200 bg-red-50 text-red-700",
//     Icon: X,
//   };
// }

// function getKindStyle(request: UnifiedRequestView) {
//   if (request.kind === "paper_access") {
//     return {
//       label: "Paper Access",
//       className: "border-indigo-200 bg-indigo-50 text-indigo-700",
//       Icon: Lock,
//     };
//   }

//   if (request.kind === "research") {
//     return {
//       label: "Collaboration",
//       className: "border-blue-200 bg-blue-50 text-blue-700",
//       Icon: GitBranch,
//     };
//   }

//   if (request.request_type === "mentorship") {
//     return {
//       label: "Mentorship",
//       className: "border-emerald-200 bg-emerald-50 text-emerald-700",
//       Icon: Users,
//     };
//   }

//   return {
//     label: "Connection",
//     className: "border-violet-200 bg-violet-50 text-violet-700",
//     Icon: UserPlus,
//   };
// }

// function getRequestTitle(
//   request: UnifiedRequestView,
//   activeTab: "received" | "sent",
//   otherProfileName: string,
// ) {
//   if (request.kind === "paper_access") {
//     return activeTab === "received"
//       ? `${otherProfileName} requested full paper access`
//       : `You requested full paper access from ${otherProfileName}`;
//   }

//   if (request.kind === "research") {
//     return activeTab === "received"
//       ? `${otherProfileName} wants to collaborate`
//       : `You sent a collaboration request to ${otherProfileName}`;
//   }

//   if (request.request_type === "mentorship") {
//     return activeTab === "received"
//       ? `${otherProfileName} requested mentorship`
//       : `You requested mentorship from ${otherProfileName}`;
//   }

//   return activeTab === "received"
//     ? `${otherProfileName} wants to connect`
//     : `You sent a connection request to ${otherProfileName}`;
// }

// function requestMatchesFilter(request: UnifiedRequestView, filter: RequestFilter) {
//   if (filter === "all") return true;
//   if (filter === "pending") return request.status === "pending";
//   if (filter === "collaboration") return request.kind === "research";
//   if (filter === "connection") return request.kind === "profile";
//   if (filter === "paper_access") return request.kind === "paper_access";

//   if (filter === "approved") {
//     return request.status === "accepted" || request.status === "approved";
//   }

//   return true;
// }

// function AvatarBlock({
//   profile,
//   name,
// }: {
//   profile: Profile | null;
//   name: string;
// }) {
//   return (
//     <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
//       {profile?.profile_pic_url ? (
//         <img
//           src={profile.profile_pic_url}
//           alt={name}
//           className="h-full w-full object-cover"
//         />
//       ) : (
//         <div className="flex h-full w-full items-center justify-center text-sm font-extrabold">
//           {getInitials(name)}
//         </div>
//       )}
//     </div>
//   );
// }

// function StatCard({
//   label,
//   value,
//   helper,
//   Icon,
//   tone,
// }: {
//   label: string;
//   value: number;
//   helper: string;
//   Icon: React.ComponentType<{ className?: string }>;
//   tone: "indigo" | "emerald" | "amber" | "violet";
// }) {
//   const toneClass =
//     tone === "emerald"
//       ? "bg-emerald-50 text-emerald-700"
//       : tone === "amber"
//         ? "bg-amber-50 text-amber-700"
//         : tone === "violet"
//           ? "bg-violet-50 text-violet-700"
//           : "bg-indigo-50 text-indigo-700";

//   return (
//     <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
//             {label}
//           </p>
//           <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
//           <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>
//         </div>

//         <div className={`rounded-2xl p-3 ${toneClass}`}>
//           <Icon className="h-5 w-5" />
//         </div>
//       </div>
//     </div>
//   );
// }

// function RequestCard({
//   request,
//   activeTab,
//   updatingId,
//   openingConversationId,
//   handleUpdateStatus,
//   handleOpenMessages,
//   handleGoToFeed,
//   handleGoToProfile,
//   getProfileName,
// }: {
//   request: UnifiedRequestView;
//   activeTab: "received" | "sent";
//   updatingId: string | null;
//   openingConversationId: string | null;
//   handleUpdateStatus: (
//     request: UnifiedRequestView,
//     nextStatus: RequestStatus,
//   ) => void;
//   handleOpenMessages: (request: UnifiedRequestView) => void;
//   handleGoToFeed: () => void;
//   handleGoToProfile: (profileId: string) => void;
//   getProfileName: (profile: Profile | null | undefined) => string;
// }) {
//   const otherProfile = request.otherProfile;
//   const otherProfileName = getProfileName(otherProfile);

//   const kindStyle = getKindStyle(request);
//   const statusStyle = getStatusStyle(request.status);

//   const KindIcon = kindStyle.Icon;
//   const StatusIcon = statusStyle.Icon;

//   const isUpdating = updatingId === request.id;
//   const isOpeningConversation = openingConversationId === request.id;

//   const canRespond = activeTab === "received" && request.status === "pending";
//   const isAcceptedResearch =
//     request.kind === "research" && request.status === "accepted";
//   const isApprovedPaperAccess =
//     request.kind === "paper_access" && request.status === "approved";

//   return (
//     <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//         <div className="flex min-w-0 items-start gap-3">
//           <AvatarBlock profile={otherProfile} name={otherProfileName} />

//           <div className="min-w-0">
//             <div className="flex flex-wrap items-center gap-2">
//               <span
//                 className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold ${kindStyle.className}`}
//               >
//                 <KindIcon className="h-3.5 w-3.5" />
//                 {kindStyle.label}
//               </span>

//               <span
//                 className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold ${statusStyle.className}`}
//               >
//                 <StatusIcon className="h-3.5 w-3.5" />
//                 {statusStyle.label}
//               </span>
//             </div>

//             <h2 className="mt-3 text-lg font-black leading-snug text-slate-950">
//               {getRequestTitle(request, activeTab, otherProfileName)}
//             </h2>

//             <button
//               type="button"
//               onClick={() =>
//                 otherProfile?.id && handleGoToProfile(otherProfile.id)
//               }
//               className="mt-1 text-left text-sm font-bold text-indigo-600 transition hover:text-indigo-800 hover:underline"
//             >
//               {otherProfileName}
//               <span className="font-medium text-slate-500">
//                 {" "}
//                 · {otherProfile?.department || "Research community"}
//               </span>
//             </button>

//             <p className="mt-1 text-xs font-medium text-slate-400">
//               {formatTime(request.created_at)}
//             </p>
//           </div>
//         </div>

//         {otherProfile?.id && (
//           <button
//             type="button"
//             onClick={() => handleGoToProfile(otherProfile.id)}
//             className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
//           >
//             View Profile
//             <ArrowRight className="h-4 w-4" />
//           </button>
//         )}
//       </div>

//       <div className="mt-5 rounded-3xl bg-slate-50 p-4">
//         {request.contentPost && (
//           <div className="rounded-2xl border border-slate-200 bg-white p-4">
//             <div className="flex items-start gap-3">
//               <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
//                 {request.kind === "paper_access" ? (
//                   <FileText className="h-5 w-5" />
//                 ) : (
//                   <GitBranch className="h-5 w-5" />
//                 )}
//               </div>

//               <div className="min-w-0 flex-1">
//                 <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
//                   Related research
//                 </p>

//                 <p className="mt-1 line-clamp-2 text-sm font-black text-slate-950">
//                   {request.contentPost.title || "Untitled research post"}
//                 </p>

//                 {(request.contentPost.abstract || request.contentPost.content) && (
//                   <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
//                     {request.contentPost.abstract || request.contentPost.content}
//                   </p>
//                 )}

//                 <div className="mt-3 flex flex-wrap gap-2">
//                   {request.contentPost.content_category && (
//                     <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-600">
//                       {formatLabel(request.contentPost.content_category)}
//                     </span>
//                   )}

//                   {request.contentPost.post_type && (
//                     <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-600">
//                       {formatLabel(request.contentPost.post_type)}
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {request.message && (
//           <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
//             <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
//               {request.kind === "paper_access" ? "Reason" : "Message"}
//             </p>

//             <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
//               {request.message}
//             </p>
//           </div>
//         )}

//         {!request.contentPost && !request.message && (
//           <p className="text-sm leading-6 text-slate-600">
//             No extra message was included with this request.
//           </p>
//         )}
//       </div>

//       <div className="mt-5 flex flex-wrap items-center gap-2">
//         {canRespond && request.kind === "paper_access" && (
//           <>
//             <button
//               type="button"
//               onClick={() => handleUpdateStatus(request, "approved")}
//               disabled={isUpdating}
//               className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               <Check className="h-4 w-4" />
//               {isUpdating ? "Updating..." : "Approve Access"}
//             </button>

//             <button
//               type="button"
//               onClick={() => handleUpdateStatus(request, "rejected")}
//               disabled={isUpdating}
//               className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-extrabold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               <X className="h-4 w-4" />
//               Reject
//             </button>
//           </>
//         )}

//         {canRespond && request.kind !== "paper_access" && (
//           <>
//             <button
//               type="button"
//               onClick={() => handleUpdateStatus(request, "accepted")}
//               disabled={isUpdating}
//               className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               <Check className="h-4 w-4" />
//               {isUpdating ? "Updating..." : "Accept"}
//             </button>

//             <button
//               type="button"
//               onClick={() => handleUpdateStatus(request, "declined")}
//               disabled={isUpdating}
//               className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               <X className="h-4 w-4" />
//               Decline
//             </button>
//           </>
//         )}

//         {isAcceptedResearch && (
//           <button
//             type="button"
//             onClick={() => handleOpenMessages(request)}
//             disabled={isOpeningConversation}
//             className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             <MessageSquare className="h-4 w-4" />
//             {isOpeningConversation ? "Opening..." : "Open Messages"}
//           </button>
//         )}

//         {request.contentPost && (
//           <button
//             type="button"
//             onClick={handleGoToFeed}
//             className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
//           >
//             <ExternalLink className="h-4 w-4" />
//             Open Post
//           </button>
//         )}

//         {activeTab === "sent" && request.status === "pending" && (
//           <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
//             <Clock className="h-4 w-4" />
//             Waiting for response
//           </span>
//         )}

//         {activeTab === "sent" && isApprovedPaperAccess && (
//           <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
//             <ShieldCheck className="h-4 w-4" />
//             Approved — open Feed to access
//           </span>
//         )}
//       </div>
//     </article>
//   );
// }

// function EmptyState({
//   activeTab,
//   filter,
//   handleGoToFeed,
// }: {
//   activeTab: "received" | "sent";
//   filter: RequestFilter;
//   handleGoToFeed: () => void;
// }) {
//   return (
//     <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
//       <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
//         <Inbox className="h-8 w-8" />
//       </div>

//       <h2 className="mt-5 text-xl font-black text-slate-950">
//         No {filter === "all" ? activeTab : filter.replaceAll("_", " ")} requests
//       </h2>

//       <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
//         {activeTab === "received"
//           ? "When someone sends you a collaboration, connection, mentorship, or paper access request, it will appear here."
//           : "Requests you send to other researchers will appear here with their current status."}
//       </p>

//       <button
//         type="button"
//         onClick={handleGoToFeed}
//         className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-700"
//       >
//         Go to Feed
//         <ArrowRight className="h-4 w-4" />
//       </button>
//     </div>
//   );
// }

// export default function RequestsUI({
//   loading,
//   activeTab,
//   receivedRequests,
//   sentRequests,
//   updatingId,
//   openingConversationId,
//   setActiveTab,
//   handleUpdateStatus,
//   handleOpenMessages,
//   handleGoToFeed,
//   handleGoToProfile,
//   getProfileName,
// }: RequestsUIProps) {
//   const [filter, setFilter] = useState<RequestFilter>("all");
//   const [searchText, setSearchText] = useState("");

//   const activeRequests =
//     activeTab === "received" ? receivedRequests : sentRequests;

//   const summary = useMemo(() => {
//     const all = [...receivedRequests, ...sentRequests];

//     return {
//       pendingReceived: receivedRequests.filter(
//         (request) => request.status === "pending",
//       ).length,
//       accepted: all.filter(
//         (request) =>
//           request.status === "accepted" || request.status === "approved",
//       ).length,
//       sent: sentRequests.length,
//       paperAccess: all.filter((request) => request.kind === "paper_access")
//         .length,
//     };
//   }, [receivedRequests, sentRequests]);

//   const filteredRequests = useMemo(() => {
//     const query = searchText.trim().toLowerCase();

//     return activeRequests.filter((request) => {
//       if (!requestMatchesFilter(request, filter)) return false;

//       if (!query) return true;

//       const profileName = getProfileName(request.otherProfile).toLowerCase();
//       const department = (request.otherProfile?.department || "").toLowerCase();
//       const title = (request.contentPost?.title || "").toLowerCase();
//       const message = (request.message || "").toLowerCase();
//       const kind = request.kind.toLowerCase();
//       const status = request.status.toLowerCase();

//       return (
//         profileName.includes(query) ||
//         department.includes(query) ||
//         title.includes(query) ||
//         message.includes(query) ||
//         kind.includes(query) ||
//         status.includes(query)
//       );
//     });
//   }, [activeRequests, filter, searchText, getProfileName]);

//   const filterOptions: {
//     value: RequestFilter;
//     label: string;
//     Icon: React.ComponentType<{ className?: string }>;
//   }[] = [
//     { value: "all", label: "All", Icon: Filter },
//     { value: "pending", label: "Pending", Icon: Clock },
//     { value: "collaboration", label: "Collaboration", Icon: GitBranch },
//     { value: "connection", label: "Connection", Icon: UserPlus },
//     { value: "paper_access", label: "Paper Access", Icon: Lock },
//     { value: "approved", label: "Accepted", Icon: ShieldCheck },
//   ];

//   if (loading) {
//     return (
//       <main className="min-h-screen bg-slate-50">
//         <AppNav activePage="requests" />

//         <div className="flex min-h-[70vh] items-center justify-center">
//           <div className="text-center">
//             <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
//             <p className="mt-4 text-sm font-bold text-slate-500">
//               Loading requests...
//             </p>
//           </div>
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="min-h-screen bg-slate-50">
//       <AppNav activePage="requests" />

//       <section className="mx-auto max-w-6xl px-4 py-6 pb-24 lg:px-6 lg:pb-8">
//         <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
//           <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 p-6 text-white sm:p-8">
//             <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full bg-white/10 blur-2xl sm:block" />

//             <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
//               <div>
//                 <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold ring-1 ring-white/20">
//                   <Bell className="h-3.5 w-3.5" />
//                   ResearchGram Requests
//                 </div>

//                 <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
//                   Requests
//                 </h1>

//                 <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-50">
//                   Manage collaboration invitations, researcher connections, and
//                   full paper access requests in one focused dashboard.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={handleGoToFeed}
//                 className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
//               >
//                 Go to Feed
//                 <ExternalLink className="h-4 w-4" />
//               </button>
//             </div>
//           </div>

//           <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
//             <StatCard
//               label="Pending Received"
//               value={summary.pendingReceived}
//               helper="Needs your response"
//               Icon={Clock}
//               tone="amber"
//             />

//             <StatCard
//               label="Accepted"
//               value={summary.accepted}
//               helper="Approved collaboration/access"
//               Icon={ShieldCheck}
//               tone="emerald"
//             />

//             <StatCard
//               label="Sent"
//               value={summary.sent}
//               helper="Requests sent by you"
//               Icon={Send}
//               tone="indigo"
//             />

//             <StatCard
//               label="Paper Access"
//               value={summary.paperAccess}
//               helper="Restricted paper requests"
//               Icon={Lock}
//               tone="violet"
//             />
//           </div>

//           <div className="space-y-4 p-4 sm:p-5">
//             <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//               <div className="inline-flex rounded-2xl bg-slate-100 p-1">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setActiveTab("received");
//                     setFilter("all");
//                   }}
//                   className={`rounded-xl px-5 py-2.5 text-sm font-extrabold transition ${
//                     activeTab === "received"
//                       ? "bg-white text-indigo-700 shadow-sm"
//                       : "text-slate-500 hover:text-slate-950"
//                   }`}
//                 >
//                   Received ({receivedRequests.length})
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => {
//                     setActiveTab("sent");
//                     setFilter("all");
//                   }}
//                   className={`rounded-xl px-5 py-2.5 text-sm font-extrabold transition ${
//                     activeTab === "sent"
//                       ? "bg-white text-indigo-700 shadow-sm"
//                       : "text-slate-500 hover:text-slate-950"
//                   }`}
//                 >
//                   Sent ({sentRequests.length})
//                 </button>
//               </div>

//               <div className="relative w-full lg:max-w-sm">
//                 <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

//                 <input
//                   value={searchText}
//                   onChange={(event) => setSearchText(event.target.value)}
//                   placeholder="Search requests..."
//                   className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
//                 />
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               {filterOptions.map((option) => {
//                 const Icon = option.Icon;
//                 const active = filter === option.value;

//                 return (
//                   <button
//                     key={option.value}
//                     type="button"
//                     onClick={() => setFilter(option.value)}
//                     className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition ${
//                       active
//                         ? "border-indigo-200 bg-indigo-600 text-white shadow-sm"
//                         : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950"
//                     }`}
//                   >
//                     <Icon className="h-3.5 w-3.5" />
//                     {option.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         <div className="mt-5 space-y-4">
//           {filteredRequests.length === 0 ? (
//             <EmptyState
//               activeTab={activeTab}
//               filter={filter}
//               handleGoToFeed={handleGoToFeed}
//             />
//           ) : (
//             filteredRequests.map((request) => (
//               <RequestCard
//                 key={`${request.kind}-${request.id}`}
//                 request={request}
//                 activeTab={activeTab}
//                 updatingId={updatingId}
//                 openingConversationId={openingConversationId}
//                 handleUpdateStatus={handleUpdateStatus}
//                 handleOpenMessages={handleOpenMessages}
//                 handleGoToFeed={handleGoToFeed}
//                 handleGoToProfile={handleGoToProfile}
//                 getProfileName={getProfileName}
//               />
//             ))
//           )}
//         </div>
//       </section>
//     </main>
//   );
// }
"use client";

import { useState } from "react";
import ResearchGramSkeleton from "@/components/ResearchGramSkeleton";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  UserPlus,
  Lock,
  Check,
  X,
  MessageSquare,
  ExternalLink,
  Clock,
} from "lucide-react";
import AppNav from "@/components/AppNav";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  profile_pic_url: string | null;
};

export type ContentPost = {
  id: string;
  user_id: string | null;
  title: string | null;
  content: string | null;
  abstract: string | null;
  post_type: string | null;
  content_category: string | null;
  visibility_mode: string | null;
  full_paper_access_mode: string | null;
  allow_full_paper_request: boolean | null;
  created_at: string | null;
};

export type RequestKind = "research" | "profile" | "paper_access";
export type RequestDirection = "received" | "sent";

export type RequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "approved"
  | "rejected";

export type UnifiedRequestView = {
  id: string;
  kind: RequestKind;
  direction: RequestDirection;
  request_type: string;
  status: RequestStatus;
  message: string | null;
  created_at: string | null;
  updated_at: string | null;

  requester_id: string | null;
  receiver_id: string | null;
  owner_id: string | null;
  content_id: string | null;

  otherProfile: Profile | null;
  requesterProfile: Profile | null;
  receiverProfile: Profile | null;
  contentPost: ContentPost | null;
};

type RequestsUIProps = {
  loading: boolean;
  userId: string;
  activeTab: "received" | "sent";
  receivedRequests: UnifiedRequestView[];
  sentRequests: UnifiedRequestView[];
  updatingId: string | null;
  openingConversationId: string | null;

  setActiveTab: (tab: "received" | "sent") => void;
  handleUpdateStatus: (
    request: UnifiedRequestView,
    nextStatus: RequestStatus,
  ) => void;
  handleOpenMessages: (request: UnifiedRequestView) => void;
  handleGoToFeed: () => void;
  handleGoToProfile: (profileId: string) => void;
  getProfileName: (profile: Profile | null | undefined) => string;
};

type FilterChip =
  | "all"
  | "pending"
  | "accepted"
  | "research"
  | "profile"
  | "paper_access";

function formatTime(dateString: string | null) {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function getInitials(name: string) {
  return (name || "R").charAt(0).toUpperCase();
}

function Avatar({
  name,
  url,
}: {
  name: string;
  url?: string | null;
}) {
  const colors = [
    "#4f46e5",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
    "#059669",
    "#d97706",
  ];

  const safeName = name || "Researcher";
  const color = colors[safeName.charCodeAt(0) % colors.length];

  if (url) {
    return (
      <img
        src={url}
        alt={safeName}
        className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {getInitials(safeName)}
    </div>
  );
}

function statusStyle(status: RequestStatus) {
  if (status === "pending") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "accepted" || status === "approved") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border border-red-200 bg-red-50 text-red-700";
}

function kindMeta(request: UnifiedRequestView): {
  icon: any;
  label: string;
  color: string;
} {
  if (request.kind === "paper_access") {
    return {
      icon: Lock,
      label: "PAPER ACCESS",
      color: "text-amber-600",
    };
  }

  if (request.kind === "research") {
    return {
      icon: GitBranch,
      label: "COLLABORATION",
      color: "text-indigo-600",
    };
  }

  if (request.request_type === "mentorship") {
    return {
      icon: UserPlus,
      label: "MENTORSHIP",
      color: "text-emerald-600",
    };
  }

  return {
    icon: UserPlus,
    label: "CONNECTION",
    color: "text-blue-600",
  };
}

function requestTitle(request: UnifiedRequestView) {
  if (request.kind === "paper_access") {
    return request.contentPost?.title
      ? `Paper Access: ${request.contentPost.title}`
      : "Full Paper Access Request";
  }

  if (request.kind === "research") {
    return request.contentPost?.title || "Research Collaboration";
  }

  if (request.request_type === "mentorship") {
    return "Mentorship Request";
  }

  return "Research Connection Request";
}

function requestBody(
  request: UnifiedRequestView,
  otherName: string,
  activeTab: "received" | "sent",
) {
  if (request.message) return request.message;

  if (request.kind === "paper_access") {
    return activeTab === "received"
      ? `${otherName} requested full paper access.`
      : `You requested full paper access from ${otherName}.`;
  }

  if (request.kind === "research") {
    return activeTab === "received"
      ? `${otherName} wants to collaborate on your research post.`
      : `You sent a collaboration request to ${otherName}.`;
  }

  if (request.request_type === "mentorship") {
    return activeTab === "received"
      ? `${otherName} requested mentorship from you.`
      : `You requested mentorship from ${otherName}.`;
  }

  return activeTab === "received"
    ? `${otherName} wants to connect with you.`
    : `You sent a connection request to ${otherName}.`;
}

function filterRequests(request: UnifiedRequestView, filterChip: FilterChip) {
  if (filterChip === "all") return true;

  if (filterChip === "pending") {
    return request.status === "pending";
  }

  if (filterChip === "accepted") {
    return request.status === "accepted" || request.status === "approved";
  }

  return request.kind === filterChip;
}

function EmptyState({
  activeTab,
  filterChip,
  handleGoToFeed,
}: {
  activeTab: "received" | "sent";
  filterChip: FilterChip;
  handleGoToFeed: () => void;
}) {
  const label =
    filterChip === "all" ? activeTab : filterChip.replaceAll("_", " ");

  return (
    <div className="rounded-2xl border border-border bg-card py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl">
        📩
      </div>

      <p className="text-sm font-bold capitalize text-foreground">
        No {label} requests
      </p>

      <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
        {activeTab === "received"
          ? "When someone sends you a collaboration, connection, mentorship, or full paper access request, it will appear here."
          : "Requests you send to other researchers will appear here."}
      </p>

      <button
        type="button"
        onClick={handleGoToFeed}
        className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        Go to Feed
      </button>
    </div>
  );
}

function RequestCard({
  request,
  activeTab,
  updatingId,
  openingConversationId,
  handleUpdateStatus,
  handleOpenMessages,
  handleGoToFeed,
  handleGoToProfile,
  getProfileName,
}: {
  request: UnifiedRequestView;
  activeTab: "received" | "sent";
  updatingId: string | null;
  openingConversationId: string | null;
  handleUpdateStatus: (
    request: UnifiedRequestView,
    nextStatus: RequestStatus,
  ) => void;
  handleOpenMessages: (request: UnifiedRequestView) => void;
  handleGoToFeed: () => void;
  handleGoToProfile: (profileId: string) => void;
  getProfileName: (profile: Profile | null | undefined) => string;
}) {
  const router = useRouter();

  const otherProfile = request.otherProfile;
  const otherName = getProfileName(otherProfile);
  const isUpdating = updatingId === request.id;
  const isOpeningConversation = openingConversationId === request.id;

  const canRespond = activeTab === "received" && request.status === "pending";

  const isAcceptedResearch =
    request.kind === "research" && request.status === "accepted";

  const isApprovedPaperAccess =
    request.kind === "paper_access" && request.status === "approved";

  const meta = kindMeta(request);
  const Icon = meta.icon;

  const openSpecificPost = () => {
    if (request.content_id) {
      router.push(`/feed?post=${request.content_id}`);
      return;
    }

    handleGoToFeed();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <Avatar name={otherName} url={otherProfile?.profile_pic_url} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Icon className={`h-3.5 w-3.5 ${meta.color}`} />

              <span
                className={`text-[11px] font-bold tracking-wide ${meta.color}`}
              >
                {meta.label}
              </span>

              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${statusStyle(
                  request.status,
                )}`}
              >
                {request.status}
              </span>
            </div>

            <span className="flex flex-shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTime(request.created_at)}
            </span>
          </div>

          <h3 className="mt-2 text-[15px] font-bold text-foreground">
            {requestTitle(request)}
          </h3>

          {otherProfile?.id ? (
            <button
              type="button"
              onClick={() => handleGoToProfile(otherProfile.id)}
              className="mt-0.5 text-sm font-semibold text-primary hover:underline"
            >
              {otherName}
              {otherProfile?.department ? ` · ${otherProfile.department}` : ""}
            </button>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {otherName}
              {otherProfile?.department ? ` · ${otherProfile.department}` : ""}
            </p>
          )}

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {requestBody(request, otherName, activeTab)}
          </p>

          {request.contentPost && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3.5 py-2.5">
              <GitBranch className="h-3.5 w-3.5 flex-shrink-0 text-primary" />

              <span className="truncate text-sm font-semibold text-foreground">
                {request.contentPost.title || "Untitled post"}
              </span>

              <button
                type="button"
                onClick={openSpecificPost}
                className="ml-auto whitespace-nowrap text-xs font-semibold text-primary hover:underline"
              >
                Open Post
              </button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {canRespond && request.kind === "paper_access" && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(request, "approved")}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {isUpdating ? "Updating…" : "Approve"}
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(request, "rejected")}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Decline
                </button>
              </>
            )}

            {canRespond && request.kind !== "paper_access" && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(request, "accepted")}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {isUpdating ? "Updating…" : "Accept"}
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(request, "declined")}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Decline
                </button>
              </>
            )}

            {canRespond && request.kind === "research" && (
              <button
                type="button"
                onClick={() => handleOpenMessages(request)}
                disabled={isOpeningConversation}
                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {isOpeningConversation ? "Opening…" : "Message"}
              </button>
            )}

            {isAcceptedResearch && (
              <button
                type="button"
                onClick={() => handleOpenMessages(request)}
                disabled={isOpeningConversation}
                className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-accent px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-indigo-100 disabled:opacity-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {isOpeningConversation ? "Opening…" : "Open Messages"}
              </button>
            )}

            {request.contentPost && (
              <button
                type="button"
                onClick={openSpecificPost}
                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Post
              </button>
            )}

            {activeTab === "sent" && isApprovedPaperAccess && (
              <button
                type="button"
                onClick={openSpecificPost}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Approved — open Feed to access the full paper
              </button>
            )}

            {activeTab === "sent" && request.status === "pending" && (
              <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                Waiting for response
              </span>
            )}

            {activeTab === "sent" &&
              (request.status === "declined" ||
                request.status === "rejected") && (
                <span className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                  Request was not approved
                </span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RequestsUI({
  loading,
  activeTab,
  receivedRequests,
  sentRequests,
  updatingId,
  openingConversationId,
  setActiveTab,
  handleUpdateStatus,
  handleOpenMessages,
  handleGoToFeed,
  handleGoToProfile,
  getProfileName,
}: RequestsUIProps) {
  const [filterChip, setFilterChip] = useState<FilterChip>("all");

  const activeRequests =
    activeTab === "received" ? receivedRequests : sentRequests;

  const filteredRequests = activeRequests.filter((request) =>
    filterRequests(request, filterChip),
  );

  const pendingCount = receivedRequests.filter(
    (request) => request.status === "pending",
  ).length;

  const chipOptions: {
    value: FilterChip;
    label: string;
    count: number;
  }[] = [
    {
      value: "all",
      label: "All",
      count: activeRequests.length,
    },
    {
      value: "pending",
      label: "Pending",
      count: activeRequests.filter((request) => request.status === "pending")
        .length,
    },
    {
      value: "accepted",
      label: "Accepted",
      count: activeRequests.filter(
        (request) =>
          request.status === "accepted" || request.status === "approved",
      ).length,
    },
    {
      value: "research",
      label: "Collaboration",
      count: activeRequests.filter((request) => request.kind === "research")
        .length,
    },
    {
      value: "profile",
      label: "Connection",
      count: activeRequests.filter((request) => request.kind === "profile")
        .length,
    },
    {
      value: "paper_access",
      label: "Paper Access",
      count: activeRequests.filter(
        (request) => request.kind === "paper_access",
      ).length,
    },
  ];

if (loading) {
  return <ResearchGramSkeleton activePage="requests" variant="requests" />;
}

  return (
    <main className="min-h-screen bg-background">
      <AppNav activePage="requests" />

      <div className="mx-auto max-w-[800px] px-4 py-6 pb-24 lg:px-6 lg:pb-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">
              Requests
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage collaboration, connection, and paper access requests
            </p>
          </div>

          {pendingCount > 0 && (
            <span className="mt-1 flex-shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white">
              {pendingCount} pending
            </span>
          )}
        </div>

        <div className="mb-4 inline-flex rounded-2xl border border-border bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setActiveTab("received");
              setFilterChip("all");
            }}
            className={`rounded-xl px-5 py-2 text-sm font-bold transition-all ${
              activeTab === "received"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Received ({receivedRequests.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("sent");
              setFilterChip("all");
            }}
            className={`rounded-xl px-5 py-2 text-sm font-bold transition-all ${
              activeTab === "sent"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {chipOptions.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilterChip(chip.value)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                filterChip === chip.value
                  ? "bg-primary text-white"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {chip.label}
              <span className="ml-1 text-xs opacity-80">({chip.count})</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <EmptyState
              activeTab={activeTab}
              filterChip={filterChip}
              handleGoToFeed={handleGoToFeed}
            />
          ) : (
            filteredRequests.map((request) => (
              <RequestCard
                key={`${request.kind}-${request.id}`}
                request={request}
                activeTab={activeTab}
                updatingId={updatingId}
                openingConversationId={openingConversationId}
                handleUpdateStatus={handleUpdateStatus}
                handleOpenMessages={handleOpenMessages}
                handleGoToFeed={handleGoToFeed}
                handleGoToProfile={handleGoToProfile}
                getProfileName={getProfileName}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}