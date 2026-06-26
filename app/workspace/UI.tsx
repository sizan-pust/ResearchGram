"use client";

import AppNav from "@/components/AppNav";

export type Workspace = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  research_area: string | null;
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
  file_url: string;
  storage_path: string;
  original_name: string;
  mime_type: string | null;
  file_ext: string | null;
  file_size: number | null;
  file_category: string;
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

  workspaces: Workspace[];
  selectedWorkspaceId: string;
  selectedWorkspace: Workspace | null;

  tasks: WorkspaceTask[];
  workspaceFiles: WorkspaceFile[];
  members: WorkspaceMember[];
  collaboratorOptions: Profile[];
  selectedCollaboratorId: string;

  creatingWorkspace: boolean;
  addingTask: boolean;
  uploadingFile: boolean;
  addingMember: boolean;

  workspaceTitle: string;
  workspaceDescription: string;
  workspaceResearchArea: string;
  workspaceDueDate: string;

  taskTitle: string;
  taskDescription: string;
  taskPriority: string;
  taskDueDate: string;
  taskAssignedTo: string;

  selectedFiles: File[];

  progress: number;
  statusCounts: StatusCounts;

  setWorkspaceTitle: (value: string) => void;
  setWorkspaceDescription: (value: string) => void;
  setWorkspaceResearchArea: (value: string) => void;
  setWorkspaceDueDate: (value: string) => void;

  setTaskTitle: (value: string) => void;
  setTaskDescription: (value: string) => void;
  setTaskPriority: (value: string) => void;
  setTaskDueDate: (value: string) => void;
  setTaskAssignedTo: (value: string) => void;

  setSelectedFiles: (files: File[]) => void;
  setSelectedCollaboratorId: (value: string) => void;

  handleSelectWorkspace: (workspaceId: string) => void;
  handleCreateWorkspace: () => void;
  handleAddWorkspaceMember: () => void;
  handleRemoveWorkspaceMember: (member: WorkspaceMember) => void;
  handleAddTask: () => void;
  handleUpdateTaskStatus: (taskId: string, nextStatus: string) => void;
  handleUploadFiles: () => void;
};

const TASK_STATUS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function formatDate(dateString: string | null) {
  if (!dateString) return "No deadline";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "Unknown size";

  const kb = bytes / 1024;

  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
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

export default function WorkspaceUI({
  loading,
  userId,
  workspaces,
  selectedWorkspaceId,
  selectedWorkspace,
  tasks,
  workspaceFiles,
  members,
  collaboratorOptions,
  selectedCollaboratorId,
  creatingWorkspace,
  addingTask,
  uploadingFile,
  addingMember,
  workspaceTitle,
  workspaceDescription,
  workspaceResearchArea,
  workspaceDueDate,
  taskTitle,
  taskDescription,
  taskPriority,
  taskDueDate,
  taskAssignedTo,
  selectedFiles,
  progress,
  statusCounts,
  setWorkspaceTitle,
  setWorkspaceDescription,
  setWorkspaceResearchArea,
  setWorkspaceDueDate,
  setTaskTitle,
  setTaskDescription,
  setTaskPriority,
  setTaskDueDate,
  setTaskAssignedTo,
  setSelectedFiles,
  setSelectedCollaboratorId,
  handleSelectWorkspace,
  handleCreateWorkspace,
  handleAddWorkspaceMember,
  handleRemoveWorkspaceMember,
  handleAddTask,
  handleUpdateTaskStatus,
  handleUploadFiles,
}: WorkspaceUIProps) {
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
            Research project workspace
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Manage tasks, files, deadlines, and progress
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100">
            Turn accepted research collaboration into a structured project
            workspace with task tracking, document sharing, and visible progress.
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
              <p className="text-2xl font-black">{workspaceFiles.length}</p>
              <p className="text-sm text-blue-100">Shared files</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black">{progress}%</p>
              <p className="text-sm text-blue-100">Progress</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Create workspace
              </h2>

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
                  {creatingWorkspace ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
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
                      <p className="font-black text-slate-950">
                        {workspace.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
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
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                        Active workspace
                      </p>
                      <h2 className="mt-2 text-3xl font-black text-slate-950">
                        {selectedWorkspace.title}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        {selectedWorkspace.description ||
                          "No description provided."}
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
                      <p className="text-xs font-bold text-slate-500">To Do</p>
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

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">
                        Team members & collaborators
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Add accepted collaborators or connected researchers into
                        this workspace. After adding them, you can assign tasks
                        to them.
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
                          {profile.department ? ` — ${profile.department}` : ""}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAddWorkspaceMember}
                      disabled={
                        addingMember || selectedCollaboratorId.trim() === ""
                      }
                      className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingMember ? "Adding..." : "Add Member"}
                    </button>
                  </div>

                  {collaboratorOptions.length === 0 && (
                    <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                      No accepted collaborators available. Accept a
                      collaboration/profile request first, then you can add that
                      person to a workspace.
                    </p>
                  )}

                  {collaboratorOptions.length > 0 &&
                    !selectedCollaboratorId && (
                      <p className="mt-3 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">
                        Please choose one collaborator from the dropdown before
                        clicking Add Member.
                      </p>
                    )}

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {members.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 md:col-span-2">
                        No members yet. The workspace owner should appear after
                        workspace creation. Add collaborators after accepting
                        requests.
                      </p>
                    ) : (
                      members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-blue-100">
                            {member.profile?.profile_pic_url ? (
                              <img
                                src={member.profile.profile_pic_url}
                                alt={
                                  member.profile.full_name || "Workspace member"
                                }
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
                              {member.profile?.department ||
                                "Research community"}{" "}
                              · {member.role}
                            </p>
                          </div>

                          {member.role !== "owner" &&
                            selectedWorkspace.owner_id === userId && (
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
                            <option key={priority.value} value={priority.value}>
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
                      Upload research files
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Upload papers, datasets, figures, reports, or code files
                      to this workspace.
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
                            <li key={file.name}>• {file.name}</li>
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
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">
                    Project tasks
                  </h3>

                  <div className="mt-5 space-y-4">
                    {tasks.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                        No tasks yet. Add milestones like literature review,
                        dataset preparation, model development, writing, and
                        final presentation.
                      </p>
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
                                {task.description || "No task description."}
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
                                  {getMemberName(task.assigned_to, members)}
                                </span>
                              </div>
                            </div>

                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleUpdateTaskStatus(task.id, e.target.value)
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                            >
                              {TASK_STATUS.map((status) => (
                                <option key={status.value} value={status.value}>
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

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">
                    Shared research files
                  </h3>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {workspaceFiles.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 md:col-span-2">
                        No shared files yet. Upload research documents,
                        datasets, code, or results.
                      </p>
                    ) : (
                      workspaceFiles.map((file) => (
                        <a
                          key={file.id}
                          href={file.file_url}
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
          </section>
        </div>
      </section>
    </main>
  );
}