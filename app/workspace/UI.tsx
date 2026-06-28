"use client";

import AppNav from "@/components/AppNav";
import LocalRecorder from "./LocalRecorder";

export type WorkspaceType = "personal" | "shared";

export type WorkspaceTab =
  | "overview"
  | "tasks"
  | "milestones"
  | "files"
  | "members"
  | "meetings"
  | "recordings"
  | "updates";

export type Workspace = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  research_area: string | null;
  workspace_type: WorkspaceType | null;
  status: string;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type WorkspaceTask = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type WorkspaceFile = {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  file_url: string | null;
  storage_path: string;
  original_name: string;
  mime_type: string | null;
  file_ext: string | null;
  file_size: number | null;
  file_category: string;
  created_at: string | null;
};

export type WorkspaceMilestone = {
  id: string;
  workspace_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type WorkspaceMeeting = {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  provider: string;
  room_name: string;
  meeting_url: string;
  starts_at: string | null;
  created_at: string | null;
};

export type WorkspaceRecording = {
  id: string;
  workspace_id: string;
  meeting_id: string | null;
  recorded_by: string;
  title: string;
  file_name: string;
  file_type: string | null;
  duration_seconds: number | null;
  saved_location_note: string | null;
  created_at: string | null;
};

export type WorkspaceUpdate = {
  id: string;
  workspace_id: string;
  author_id: string;
  update_type: string;
  body: string;
  created_at: string | null;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  profile_pic_url: string | null;
  skills: string | null;
  interests: string | null;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string | null;
  profile: Profile | null;
};

type StatusCounts = {
  todo: number;
  in_progress: number;
  review: number;
  completed: number;
};

type WorkspaceUIProps = {
  loading: boolean;
  userId: string;

  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;

  workspaces: Workspace[];
  selectedWorkspaceId: string;
  selectedWorkspace: Workspace | null;

  tasks: WorkspaceTask[];
  workspaceFiles: WorkspaceFile[];
  members: WorkspaceMember[];
  milestones: WorkspaceMilestone[];
  meetings: WorkspaceMeeting[];
  recordings: WorkspaceRecording[];
  updates: WorkspaceUpdate[];

  collaboratorOptions: Profile[];
  selectedCollaboratorId: string;

  creatingWorkspace: boolean;
  addingTask: boolean;
  uploadingFile: boolean;
  addingMember: boolean;
  savingMilestone: boolean;
  savingMeeting: boolean;
  savingUpdate: boolean;

  workspaceType: WorkspaceType;
  workspaceTitle: string;
  workspaceDescription: string;
  workspaceResearchArea: string;
  workspaceDueDate: string;

  taskTitle: string;
  taskDescription: string;
  taskPriority: string;
  taskDueDate: string;
  taskAssignedTo: string;

  milestoneTitle: string;
  milestoneDescription: string;
  milestoneDueDate: string;

  meetingTitle: string;
  meetingStart: string;
  activeMeeting: WorkspaceMeeting | null;

  updateText: string;
  selectedFiles: File[];

  progress: number;
  statusCounts: StatusCounts;

  setWorkspaceType: (value: WorkspaceType) => void;
  setWorkspaceTitle: (value: string) => void;
  setWorkspaceDescription: (value: string) => void;
  setWorkspaceResearchArea: (value: string) => void;
  setWorkspaceDueDate: (value: string) => void;

  setTaskTitle: (value: string) => void;
  setTaskDescription: (value: string) => void;
  setTaskPriority: (value: string) => void;
  setTaskDueDate: (value: string) => void;
  setTaskAssignedTo: (value: string) => void;

  setMilestoneTitle: (value: string) => void;
  setMilestoneDescription: (value: string) => void;
  setMilestoneDueDate: (value: string) => void;

  setMeetingTitle: (value: string) => void;
  setMeetingStart: (value: string) => void;
  setActiveMeeting: (meeting: WorkspaceMeeting | null) => void;

  setUpdateText: (value: string) => void;
  setSelectedFiles: (files: File[]) => void;
  setSelectedCollaboratorId: (value: string) => void;

  handleSelectWorkspace: (workspaceId: string) => void;
  handleCreateWorkspace: () => void;
  handleConvertToShared: () => void;
  handleAddWorkspaceMember: () => void;
  handleRemoveWorkspaceMember: (member: WorkspaceMember) => void;
  handleAddTask: () => void;
  handleUpdateTaskStatus: (taskId: string, nextStatus: string) => void;
  handleUploadFiles: () => void;
  handleAddMilestone: () => void;
  handleUpdateMilestoneStatus: (milestoneId: string, nextStatus: string) => void;
  handleCreateMeeting: () => void;
  handleAddUpdate: () => void;
  handleReloadCurrentWorkspace: () => void;
};

const TABS: { value: WorkspaceTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "tasks", label: "Tasks" },
  { value: "milestones", label: "Milestones" },
  { value: "files", label: "Files" },
  { value: "members", label: "Members" },
  { value: "meetings", label: "Meetings" },
  { value: "recordings", label: "Recordings" },
  { value: "updates", label: "Updates" },
];

const TASK_STATUS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
];

const MILESTONE_STATUS = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function formatDate(dateString: string | null) {
  if (!dateString) return "No deadline";

  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  } catch {
    return "Invalid date";
  }
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return "Instant meeting";

  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateString));
  } catch {
    return "Invalid time";
  }
}

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "Unknown size";

  const kb = bytes / 1024;

  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "Unknown duration";

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  if (minutes <= 0) return `${rest}s`;

  return `${minutes}m ${rest}s`;
}

function fileIcon(category: string) {
  if (category === "image") return "🖼️";
  if (category === "paper") return "📄";
  if (category === "dataset") return "📊";
  if (category === "code") return "💻";

  return "📎";
}

function statusStyle(status: string) {
  if (status === "completed") return "bg-green-50 text-green-700";
  if (status === "in_progress") return "bg-blue-50 text-blue-700";
  if (status === "review") return "bg-purple-50 text-purple-700";
  if (status === "planned") return "bg-slate-100 text-slate-700";

  return "bg-slate-100 text-slate-700";
}

function priorityStyle(priority: string) {
  if (priority === "high") return "bg-red-50 text-red-700";
  if (priority === "medium") return "bg-amber-50 text-amber-700";

  return "bg-green-50 text-green-700";
}

function getMemberName(memberId: string | null, members: WorkspaceMember[]) {
  if (!memberId) return "Unassigned";

  const member = members.find((item) => item.user_id === memberId);

  return (
    member?.profile?.full_name ||
    member?.profile?.email?.split("@")[0] ||
    "Workspace member"
  );
}

function getMemberInitial(member: WorkspaceMember) {
  return (member.profile?.full_name || member.profile?.email || "R")
    .charAt(0)
    .toUpperCase();
}

function getProfileName(profile: Profile | null) {
  return profile?.full_name || profile?.email?.split("@")[0] || "Researcher";
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function WorkspaceTypeBadge({ type }: { type: WorkspaceType | null }) {
  const safeType = type || "personal";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        safeType === "personal"
          ? "bg-purple-50 text-purple-700"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {safeType === "personal" ? "Personal" : "Shared"}
    </span>
  );
}

function ProfileMini({ member }: { member: WorkspaceMember }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-blue-100">
        {member.profile?.profile_pic_url ? (
          <img
            src={member.profile.profile_pic_url}
            alt={member.profile.full_name || "Workspace member"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-black text-blue-700">
            {getMemberInitial(member)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-950">
          {member.profile?.full_name ||
            member.profile?.email ||
            "Workspace member"}
        </p>

        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {member.profile?.department || "Research community"} · {member.role}
        </p>
      </div>
    </div>
  );
}

export default function WorkspaceUI({
  loading,
  userId,
  activeTab,
  setActiveTab,
  workspaces,
  selectedWorkspaceId,
  selectedWorkspace,
  tasks,
  workspaceFiles,
  members,
  milestones,
  meetings,
  recordings,
  updates,
  collaboratorOptions,
  selectedCollaboratorId,
  creatingWorkspace,
  addingTask,
  uploadingFile,
  addingMember,
  savingMilestone,
  savingMeeting,
  savingUpdate,
  workspaceType,
  workspaceTitle,
  workspaceDescription,
  workspaceResearchArea,
  workspaceDueDate,
  taskTitle,
  taskDescription,
  taskPriority,
  taskDueDate,
  taskAssignedTo,
  milestoneTitle,
  milestoneDescription,
  milestoneDueDate,
  meetingTitle,
  meetingStart,
  activeMeeting,
  updateText,
  selectedFiles,
  progress,
  statusCounts,
  setWorkspaceType,
  setWorkspaceTitle,
  setWorkspaceDescription,
  setWorkspaceResearchArea,
  setWorkspaceDueDate,
  setTaskTitle,
  setTaskDescription,
  setTaskPriority,
  setTaskDueDate,
  setTaskAssignedTo,
  setMilestoneTitle,
  setMilestoneDescription,
  setMilestoneDueDate,
  setMeetingTitle,
  setMeetingStart,
  setActiveMeeting,
  setUpdateText,
  setSelectedFiles,
  setSelectedCollaboratorId,
  handleSelectWorkspace,
  handleCreateWorkspace,
  handleConvertToShared,
  handleAddWorkspaceMember,
  handleRemoveWorkspaceMember,
  handleAddTask,
  handleUpdateTaskStatus,
  handleUploadFiles,
  handleAddMilestone,
  handleUpdateMilestoneStatus,
  handleCreateMeeting,
  handleAddUpdate,
  handleReloadCurrentWorkspace,
}: WorkspaceUIProps) {
  const isOwner = Boolean(
    selectedWorkspace && selectedWorkspace.owner_id === userId,
  );

  const isPersonal = selectedWorkspace?.workspace_type === "personal";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <AppNav activePage="feed" />
        <div className="mx-auto max-w-7xl px-6 py-10 text-slate-600">
          Loading research workspace...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppNav activePage="feed" />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-8 text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-200">
            Research workspace
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Personal and collaborative research management
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100">
            Create private personal workspaces or shared team workspaces with
            tasks, milestones, files, updates, meetings, and local recording.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">{workspaces.length}</p>
              <p className="text-sm text-blue-100">Workspaces</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">{tasks.length}</p>
              <p className="text-sm text-blue-100">Tasks</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">{meetings.length}</p>
              <p className="text-sm text-blue-100">Meetings</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">{progress}%</p>
              <p className="text-sm text-blue-100">Progress</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <aside className="space-y-6 lg:col-span-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Create workspace
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose whether this workspace is for private personal work or
                shared team collaboration.
              </p>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => setWorkspaceType("personal")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    workspaceType === "personal"
                      ? "border-purple-300 bg-purple-50"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <p className="font-black text-slate-950">
                    Personal Workspace
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Private notes, files, tasks, milestones, and planning for
                    your own research.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspaceType("shared")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    workspaceType === "shared"
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <p className="font-black text-slate-950">
                    Shared Workspace
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Team collaboration with members, assigned tasks, files,
                    meetings, and recordings.
                  </p>
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <input
                  value={workspaceTitle}
                  onChange={(e) => setWorkspaceTitle(e.target.value)}
                  placeholder="Project title"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                />

                <input
                  value={workspaceResearchArea}
                  onChange={(e) => setWorkspaceResearchArea(e.target.value)}
                  placeholder="Research area, e.g. AI, IoT, NLP"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                />

                <textarea
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  placeholder="Short project description"
                  className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                />

                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={workspaceDueDate}
                    onChange={(e) => setWorkspaceDueDate(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                  />
                </div>

                <button
                  onClick={handleCreateWorkspace}
                  disabled={creatingWorkspace}
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingWorkspace
                    ? "Creating..."
                    : `Create ${
                        workspaceType === "personal" ? "Personal" : "Shared"
                      } Workspace`}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                My workspaces
              </h2>

              <div className="mt-4 space-y-3">
                {workspaces.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    No workspaces yet. Create one to start tracking research
                    progress.
                  </p>
                ) : (
                  workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => handleSelectWorkspace(workspace.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedWorkspaceId === workspace.id
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-1 font-black text-slate-950">
                          {workspace.title}
                        </p>
                        <WorkspaceTypeBadge type={workspace.workspace_type} />
                      </div>

                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {workspace.research_area || "General research"} ·{" "}
                        {formatDate(workspace.due_date)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-8">
            {!selectedWorkspace ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">
                  Select or create a workspace
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Your project dashboard will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <WorkspaceTypeBadge
                          type={selectedWorkspace.workspace_type}
                        />

                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold capitalize text-green-700">
                          {selectedWorkspace.status}
                        </span>

                        {isOwner && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            Owner
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 text-3xl font-black text-slate-950">
                        {selectedWorkspace.title}
                      </h2>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        {selectedWorkspace.description ||
                          "No description provided."}
                      </p>

                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Area:{" "}
                        {selectedWorkspace.research_area || "General research"}{" "}
                        · Deadline: {formatDate(selectedWorkspace.due_date)}
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab("meetings")}
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      Start / Join Meeting
                    </button>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-2">
                    {TABS.map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                          activeTab === tab.value
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-xl font-black text-slate-950">
                            Workspace overview
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Track progress, team activity, meetings, files, and
                            research updates from one place.
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-50 px-5 py-4 text-center">
                          <p className="text-3xl font-black text-blue-700">
                            {progress}%
                          </p>
                          <p className="text-xs font-bold uppercase text-blue-500">
                            Complete
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-2xl font-black text-slate-950">
                            {statusCounts.todo}
                          </p>
                          <p className="text-xs font-bold text-slate-500">
                            To Do
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-50 p-4">
                          <p className="text-2xl font-black text-blue-700">
                            {statusCounts.in_progress}
                          </p>
                          <p className="text-xs font-bold text-blue-500">
                            In Progress
                          </p>
                        </div>

                        <div className="rounded-2xl bg-purple-50 p-4">
                          <p className="text-2xl font-black text-purple-700">
                            {statusCounts.review}
                          </p>
                          <p className="text-xs font-bold text-purple-500">
                            Review
                          </p>
                        </div>

                        <div className="rounded-2xl bg-green-50 p-4">
                          <p className="text-2xl font-black text-green-700">
                            {statusCounts.completed}
                          </p>
                          <p className="text-xs font-bold text-green-500">
                            Completed
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <button
                        onClick={() => setActiveTab("members")}
                        className="rounded-3xl bg-white p-5 text-left shadow-sm transition hover:shadow-md"
                      >
                        <p className="text-2xl font-black text-slate-950">
                          {members.length}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          Members
                        </p>
                      </button>

                      <button
                        onClick={() => setActiveTab("milestones")}
                        className="rounded-3xl bg-white p-5 text-left shadow-sm transition hover:shadow-md"
                      >
                        <p className="text-2xl font-black text-slate-950">
                          {milestones.length}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          Milestones
                        </p>
                      </button>

                      <button
                        onClick={() => setActiveTab("meetings")}
                        className="rounded-3xl bg-white p-5 text-left shadow-sm transition hover:shadow-md"
                      >
                        <p className="text-2xl font-black text-slate-950">
                          {meetings.length}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          Meetings
                        </p>
                      </button>

                      <button
                        onClick={() => setActiveTab("recordings")}
                        className="rounded-3xl bg-white p-5 text-left shadow-sm transition hover:shadow-md"
                      >
                        <p className="text-2xl font-black text-slate-950">
                          {recordings.length}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          Recordings
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "members" && (
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-black text-slate-950">
                          Members
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Personal workspaces are private. Shared workspaces can
                          have collaborators and assigned task members.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-5 py-4 text-center">
                        <p className="text-3xl font-black text-slate-950">
                          {members.length}
                        </p>
                        <p className="text-xs font-bold uppercase text-slate-500">
                          Members
                        </p>
                      </div>
                    </div>

                    {isPersonal ? (
                      <div className="mt-5 rounded-2xl bg-purple-50 p-5">
                        <p className="text-sm font-semibold leading-6 text-purple-900">
                          This is a personal workspace. Only you can access it.
                          Convert it to shared when you want to add teammates.
                        </p>

                        {isOwner && (
                          <button
                            onClick={handleConvertToShared}
                            className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                          >
                            Convert to Shared Workspace
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                        <select
                          key={`${selectedWorkspaceId}-${collaboratorOptions.length}`}
                          value={selectedCollaboratorId}
                          onChange={(e) =>
                            setSelectedCollaboratorId(e.target.value)
                          }
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                        >
                          <option value="">
                            -- Select collaborator for this workspace --
                          </option>

                          {collaboratorOptions.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.full_name ||
                                profile.email ||
                                "ResearchGram User"}
                              {profile.department
                                ? ` — ${profile.department}`
                                : ""}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={handleAddWorkspaceMember}
                          disabled={
                            addingMember ||
                            selectedCollaboratorId.trim() === "" ||
                            !isOwner
                          }
                          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {addingMember ? "Adding..." : "Add Member"}
                        </button>
                      </div>
                    )}

                    {!isPersonal && collaboratorOptions.length === 0 && (
                      <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                        No accepted collaborators available. Accept a
                        collaboration/profile request first, then you can add
                        that person to a workspace.
                      </p>
                    )}

                    {!isOwner && !isPersonal && (
                      <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                        Only the workspace owner can add or remove members.
                      </p>
                    )}

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {members.length === 0 ? (
                        <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 md:col-span-2">
                          No members yet.
                        </p>
                      ) : (
                        members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                          >
                            <ProfileMini member={member} />

                            {member.role !== "owner" && isOwner && (
                              <button
                                onClick={() =>
                                  handleRemoveWorkspaceMember(member)
                                }
                                className="rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "tasks" && (
                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">
                        Add task
                      </h3>

                      <div className="mt-5 space-y-3">
                        <input
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          placeholder="Task title"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                        />

                        <textarea
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          placeholder="Task details"
                          className="min-h-[90px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                        />

                        <div className="grid gap-3 sm:grid-cols-2">
                          <select
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value)}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                          >
                            {PRIORITY_OPTIONS.map((priority) => (
                              <option
                                key={priority.value}
                                value={priority.value}
                              >
                                {priority.label} priority
                              </option>
                            ))}
                          </select>

                          <input
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                          />
                        </div>

                        <select
                          value={taskAssignedTo}
                          onChange={(e) => setTaskAssignedTo(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                        >
                          <option value="">Unassigned task</option>
                          {members.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                              Assign to{" "}
                              {member.profile?.full_name ||
                                member.profile?.email ||
                                "Workspace member"}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={handleAddTask}
                          disabled={addingTask}
                          className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {addingTask ? "Adding..." : "Add Task"}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">
                        Project tasks
                      </h3>

                      <div className="mt-5 space-y-4">
                        {tasks.length === 0 ? (
                          <EmptyState message="No tasks yet. Add literature review, dataset preparation, model development, writing, or final presentation tasks." />
                        ) : (
                          tasks.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <h4 className="text-lg font-black text-slate-950">
                                    {task.title}
                                  </h4>

                                  <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {task.description ||
                                      "No task description."}
                                  </p>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(
                                        task.status,
                                      )}`}
                                    >
                                      {task.status.replaceAll("_", " ")}
                                    </span>

                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${priorityStyle(
                                        task.priority,
                                      )}`}
                                    >
                                      {task.priority} priority
                                    </span>

                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                                      Due: {formatDate(task.due_date)}
                                    </span>

                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                                      Assigned:{" "}
                                      {getMemberName(
                                        task.assigned_to,
                                        members,
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <select
                                  value={task.status}
                                  onChange={(e) =>
                                    handleUpdateTaskStatus(
                                      task.id,
                                      e.target.value,
                                    )
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                                >
                                  {TASK_STATUS.map((status) => (
                                    <option
                                      key={status.value}
                                      value={status.value}
                                    >
                                      {status.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "milestones" && (
                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">
                        Add milestone
                      </h3>

                      <div className="mt-5 space-y-3">
                        <input
                          value={milestoneTitle}
                          onChange={(e) => setMilestoneTitle(e.target.value)}
                          placeholder="Milestone title"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                        />

                        <textarea
                          value={milestoneDescription}
                          onChange={(e) =>
                            setMilestoneDescription(e.target.value)
                          }
                          placeholder="Milestone details"
                          className="min-h-[90px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                        />

                        <input
                          type="date"
                          value={milestoneDueDate}
                          onChange={(e) => setMilestoneDueDate(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                        />

                        <button
                          onClick={handleAddMilestone}
                          disabled={savingMilestone}
                          className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingMilestone ? "Adding..." : "Add Milestone"}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">
                        Milestones
                      </h3>

                      <div className="mt-5 space-y-4">
                        {milestones.length === 0 ? (
                          <EmptyState message="No milestones yet. Add major checkpoints like proposal, dataset, implementation, result analysis, or final report." />
                        ) : (
                          milestones.map((milestone) => (
                            <div
                              key={milestone.id}
                              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <h4 className="text-lg font-black text-slate-950">
                                    {milestone.title}
                                  </h4>

                                  <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {milestone.description ||
                                      "No milestone description."}
                                  </p>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(
                                        milestone.status,
                                      )}`}
                                    >
                                      {milestone.status.replaceAll("_", " ")}
                                    </span>

                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                                      Due: {formatDate(milestone.due_date)}
                                    </span>
                                  </div>
                                </div>

                                <select
                                  value={milestone.status}
                                  onChange={(e) =>
                                    handleUpdateMilestoneStatus(
                                      milestone.id,
                                      e.target.value,
                                    )
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                                >
                                  {MILESTONE_STATUS.map((status) => (
                                    <option
                                      key={status.value}
                                      value={status.value}
                                    >
                                      {status.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "files" && (
                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">
                        Upload research files
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Upload papers, datasets, figures, reports, or code
                        files to this workspace. Meeting recordings are
                        downloaded locally instead.
                      </p>

                      <input
                        type="file"
                        multiple
                        onChange={(e) =>
                          setSelectedFiles(Array.from(e.target.files || []))
                        }
                        className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                      />

                      {selectedFiles.length > 0 && (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-bold text-slate-700">
                            Selected files
                          </p>
                          <ul className="mt-2 space-y-1 text-sm text-slate-500">
                            {selectedFiles.map((file) => (
                              <li key={`${file.name}-${file.size}`}>
                                • {file.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        onClick={handleUploadFiles}
                        disabled={uploadingFile}
                        className="mt-4 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploadingFile ? "Uploading..." : "Upload Files"}
                      </button>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">
                        Shared research files
                      </h3>

                      <div className="mt-5 grid gap-4">
                        {workspaceFiles.length === 0 ? (
                          <EmptyState message="No shared files yet. Upload research documents, datasets, code, or results." />
                        ) : (
                          workspaceFiles.map((file) => (
                            <a
                              key={file.id}
                              href={file.file_url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                                {fileIcon(file.file_category)}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-slate-950">
                                  {file.original_name}
                                </p>
                                <p className="mt-1 text-xs font-semibold capitalize text-slate-500">
                                  {file.file_category.replaceAll("_", " ")} ·{" "}
                                  {formatFileSize(file.file_size)}
                                </p>
                              </div>

                              <span className="text-sm font-bold text-blue-700">
                                Open
                              </span>
                            </a>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "meetings" && (
                  <div className="space-y-6">
                    {activeMeeting && (
                      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-xl font-black text-slate-950">
                              {activeMeeting.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Jitsi video conference inside ResearchGram
                            </p>
                          </div>

                          <button
                            onClick={() => setActiveMeeting(null)}
                            className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                          >
                            Close Meeting
                          </button>
                        </div>

                        <iframe
                          src={activeMeeting.meeting_url}
                          title={activeMeeting.title}
                          allow="camera; microphone; fullscreen; display-capture"
                          className="h-[680px] w-full border-0"
                        />

                        <div className="p-5">
                          <LocalRecorder
                            workspaceId={selectedWorkspaceId}
                            meeting={activeMeeting}
                            userId={userId}
                            onSaved={handleReloadCurrentWorkspace}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-xl font-black text-slate-950">
                          Create video meeting
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Create a Google Meet/Zoom-like room using Jitsi. The
                          recording system saves videos locally to the
                          recorder’s computer.
                        </p>

                        <div className="mt-5 space-y-3">
                          <input
                            value={meetingTitle}
                            onChange={(e) => setMeetingTitle(e.target.value)}
                            placeholder="Meeting title"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                          />

                          <input
                            type="datetime-local"
                            value={meetingStart}
                            onChange={(e) => setMeetingStart(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                          />

                          <button
                            onClick={handleCreateMeeting}
                            disabled={savingMeeting}
                            className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                          >
                            {savingMeeting
                              ? "Creating..."
                              : "Create Video Room"}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-xl font-black text-slate-950">
                          Meeting rooms
                        </h3>

                        <div className="mt-5 space-y-4">
                          {meetings.length === 0 ? (
                            <EmptyState message="No meetings created yet." />
                          ) : (
                            meetings.map((meeting) => (
                              <div
                                key={meeting.id}
                                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                              >
                                <h4 className="font-black text-slate-950">
                                  {meeting.title}
                                </h4>

                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  {formatDateTime(meeting.starts_at)}
                                </p>

                                <p className="mt-2 break-all text-xs text-slate-400">
                                  {meeting.meeting_url}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    onClick={() => setActiveMeeting(meeting)}
                                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                                  >
                                    Join Inside
                                  </button>

                                  <a
                                    href={meeting.meeting_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                                  >
                                    Open New Tab
                                  </a>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "recordings" && (
                  <div className="space-y-4">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">
                        Meeting recordings
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        The actual video file is downloaded to the recorder’s
                        local PC. ResearchGram stores only metadata such as file
                        name, duration, recorder ID, and meeting reference.
                      </p>
                    </div>

                    {recordings.length === 0 ? (
                      <EmptyState message="No recording metadata yet. Join a meeting, start local recording, stop recording, and the metadata will appear here." />
                    ) : (
                      recordings.map((recording) => (
                        <div
                          key={recording.id}
                          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <h4 className="text-lg font-black text-slate-950">
                                {recording.title}
                              </h4>

                              <p className="mt-2 text-sm text-slate-500">
                                File: {recording.file_name}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                Duration:{" "}
                                {formatDuration(recording.duration_seconds)}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                Recorded by: {recording.recorded_by}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {formatDateTime(recording.created_at)}
                              </p>

                              {recording.saved_location_note && (
                                <p className="mt-3 rounded-2xl bg-yellow-50 p-3 text-sm leading-6 text-yellow-800">
                                  {recording.saved_location_note}
                                </p>
                              )}
                            </div>

                            <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
                              Local file only
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "updates" && (
                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">
                        Add update
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Add progress notes, meeting decisions, research
                        findings, or next-step updates.
                      </p>

                      <div className="mt-5 space-y-3">
                        <textarea
                          value={updateText}
                          onChange={(e) => setUpdateText(e.target.value)}
                          placeholder="Write a project update..."
                          className="min-h-[150px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
                        />

                        <button
                          onClick={handleAddUpdate}
                          disabled={savingUpdate}
                          className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                          {savingUpdate ? "Posting..." : "Post Update"}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">
                        Project updates
                      </h3>

                      <div className="mt-5 space-y-4">
                        {updates.length === 0 ? (
                          <EmptyState message="No project updates yet." />
                        ) : (
                          updates.map((update) => (
                            <div
                              key={update.id}
                              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-black text-slate-950">
                                  Update
                                </p>

                                <p className="text-xs font-semibold text-slate-400">
                                  {formatDateTime(update.created_at)}
                                </p>
                              </div>

                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {update.body}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}