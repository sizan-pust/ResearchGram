"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import WorkspaceUI, {
  type Profile,
  type Workspace,
  type WorkspaceFile,
  type WorkspaceMember,
  type WorkspaceTask,
} from "./UI";

const BUCKET_NAME = "content-files";

function getFileExt(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "bin";
}

function getFileCategory(file: File) {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  if (mime.startsWith("image/")) return "image";
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "paper";
  if (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return "dataset";
  }

  if (
    name.endsWith(".py") ||
    name.endsWith(".js") ||
    name.endsWith(".ts") ||
    name.endsWith(".java") ||
    name.endsWith(".cpp") ||
    name.endsWith(".c")
  ) {
    return "code";
  }

  return "research_file";
}

export default function WorkspaceClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");

  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [collaboratorOptions, setCollaboratorOptions] = useState<Profile[]>([]);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState("");

  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const [workspaceTitle, setWorkspaceTitle] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [workspaceResearchArea, setWorkspaceResearchArea] = useState("");
  const [workspaceDueDate, setWorkspaceDueDate] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const selectedWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ||
      null,
    [workspaces, selectedWorkspaceId],
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "completed").length,
    [tasks],
  );

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((completedTasks / tasks.length) * 100);
  }, [tasks.length, completedTasks]);

  const statusCounts = useMemo(() => {
    return {
      todo: tasks.filter((task) => task.status === "todo").length,
      in_progress: tasks.filter((task) => task.status === "in_progress").length,
      review: tasks.filter((task) => task.status === "review").length,
      completed: tasks.filter((task) => task.status === "completed").length,
    };
  }, [tasks]);

  const loadTeamAndCollaborators = async (workspaceId: string) => {
    const { data: authData } = await supabase.auth.getUser();
    const activeUserId = authData.user?.id || userId;

    if (!activeUserId) return;

    const { data: memberRows, error: memberError } = await supabase
      .from("workspace_members")
      .select("id, workspace_id, user_id, role, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (memberError) {
      console.log("LOAD WORKSPACE MEMBERS ERROR:", memberError);
      setMembers([]);
      return;
    }

    const safeMemberRows = (memberRows || []) as Array<{
      id: string;
      workspace_id: string;
      user_id: string;
      role: string;
      created_at: string | null;
    }>;

    const memberIds = safeMemberRows.map((member) => member.user_id);
    const memberIdSet = new Set(memberIds);

    let profileMap: Record<string, Profile> = {};

    if (memberIds.length > 0) {
      const { data: memberProfiles, error: memberProfileError } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, department, profile_pic_url, skills, interests",
        )
        .in("id", memberIds);

      if (memberProfileError) {
        console.log("LOAD MEMBER PROFILES ERROR:", memberProfileError);
      }

      profileMap = (memberProfiles || []).reduce(
        (acc, profile) => {
          acc[profile.id] = profile as Profile;
          return acc;
        },
        {} as Record<string, Profile>,
      );
    }

    const normalizedMembers: WorkspaceMember[] = safeMemberRows.map(
      (member) => ({
        ...member,
        profile: profileMap[member.user_id] || null,
      }),
    );

    setMembers(normalizedMembers);

    const candidateIds = new Set<string>();

    const addCandidatePair = (
      firstUserId: string | null | undefined,
      secondUserId: string | null | undefined,
    ) => {
      if (!firstUserId || !secondUserId) return;

      const otherUserId =
        firstUserId === activeUserId
          ? secondUserId
          : secondUserId === activeUserId
            ? firstUserId
            : null;

      if (!otherUserId) return;
      if (otherUserId === activeUserId) return;
      if (memberIdSet.has(otherUserId)) return;

      candidateIds.add(otherUserId);
    };

    const { data: connectionRows, error: connectionError } = await supabase
      .from("user_connections")
      .select("user_one_id, user_two_id")
      .or(`user_one_id.eq.${activeUserId},user_two_id.eq.${activeUserId}`);

    if (connectionError) {
      console.log("LOAD USER CONNECTIONS ERROR:", connectionError);
    }

    (connectionRows || []).forEach((connection: any) => {
      addCandidatePair(connection.user_one_id, connection.user_two_id);
    });

    const { data: acceptedResearchRows, error: acceptedResearchError } =
      await supabase
        .from("research_requests")
        .select("requester_id, receiver_id, status")
        .eq("status", "accepted")
        .or(`requester_id.eq.${activeUserId},receiver_id.eq.${activeUserId}`);

    if (acceptedResearchError) {
      console.log(
        "LOAD ACCEPTED RESEARCH REQUESTS ERROR:",
        acceptedResearchError,
      );
    }

    (acceptedResearchRows || []).forEach((request: any) => {
      addCandidatePair(request.requester_id, request.receiver_id);
    });

    const { data: acceptedProfileRows, error: acceptedProfileError } =
      await supabase
        .from("profile_requests")
        .select("requester_id, receiver_id, status")
        .eq("status", "accepted")
        .or(`requester_id.eq.${activeUserId},receiver_id.eq.${activeUserId}`);

    if (acceptedProfileError) {
      console.log(
        "LOAD ACCEPTED PROFILE REQUESTS ERROR:",
        acceptedProfileError,
      );
    }

    (acceptedProfileRows || []).forEach((request: any) => {
      addCandidatePair(request.requester_id, request.receiver_id);
    });

    const candidateIdList = Array.from(candidateIds);

    if (candidateIdList.length === 0) {
      setCollaboratorOptions([]);
      setSelectedCollaboratorId("");
      return;
    }

    const { data: candidateProfiles, error: candidateProfileError } =
      await supabase
        .from("profiles")
        .select(
          "id, email, full_name, department, profile_pic_url, skills, interests",
        )
        .in("id", candidateIdList);

    if (candidateProfileError) {
      console.log("LOAD COLLABORATOR OPTIONS ERROR:", candidateProfileError);
      setCollaboratorOptions([]);
      setSelectedCollaboratorId("");
      return;
    }

    setCollaboratorOptions((candidateProfiles || []) as Profile[]);
    setSelectedCollaboratorId("");
  };

  const loadWorkspaceDetails = async (workspaceId: string) => {
    const { data: taskData, error: taskError } = await supabase
      .from("workspace_tasks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (taskError) {
      console.log("LOAD TASKS ERROR:", taskError);
      alert(taskError.message);
      setTasks([]);
    } else {
      setTasks((taskData || []) as WorkspaceTask[]);
    }

    const { data: fileData, error: fileError } = await supabase
      .from("workspace_files")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (fileError) {
      console.log("LOAD FILES ERROR:", fileError);
      alert(fileError.message);
      setWorkspaceFiles([]);
    } else {
      setWorkspaceFiles((fileData || []) as WorkspaceFile[]);
    }

    await loadTeamAndCollaborators(workspaceId);
  };

  const loadWorkspaces = async () => {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("LOAD WORKSPACES ERROR:", error);
      alert(error.message);
      setWorkspaces([]);
      return;
    }

    const safeWorkspaces = (data || []) as Workspace[];
    setWorkspaces(safeWorkspaces);

    if (safeWorkspaces.length > 0) {
      const nextSelected =
        selectedWorkspaceId &&
        safeWorkspaces.some((workspace) => workspace.id === selectedWorkspaceId)
          ? selectedWorkspaceId
          : safeWorkspaces[0].id;

      setSelectedWorkspaceId(nextSelected);
      await loadWorkspaceDetails(nextSelected);
    } else {
      setSelectedWorkspaceId("");
      setTasks([]);
      setWorkspaceFiles([]);
      setMembers([]);
      setCollaboratorOptions([]);
      setSelectedCollaboratorId("");
    }
  };

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/auth/login");
        return;
      }

      setUserId(authData.user.id);
      await loadWorkspaces();
      setLoading(false);
    };

    load();
  }, [router]);

  const handleSelectWorkspace = async (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    await loadWorkspaceDetails(workspaceId);
  };

  const handleCreateWorkspace = async () => {
    if (!userId) {
      alert("You must be logged in.");
      return;
    }

    if (!workspaceTitle.trim()) {
      alert("Add a workspace title.");
      return;
    }

    setCreatingWorkspace(true);

    const { data: workspaceData, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        owner_id: userId,
        title: workspaceTitle.trim(),
        description: workspaceDescription.trim() || null,
        research_area: workspaceResearchArea.trim() || null,
        due_date: workspaceDueDate || null,
        status: "active",
      })
      .select("id")
      .single();

    if (workspaceError || !workspaceData) {
      console.log("CREATE WORKSPACE ERROR:", workspaceError);
      alert(workspaceError?.message || "Could not create workspace.");
      setCreatingWorkspace(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspaceData.id,
        user_id: userId,
        role: "owner",
      });

    if (memberError) {
      console.log("CREATE WORKSPACE MEMBER ERROR:", memberError);
      alert(
        `Workspace created, but owner member row failed: ${memberError.message}`,
      );
    }

    setWorkspaceTitle("");
    setWorkspaceDescription("");
    setWorkspaceResearchArea("");
    setWorkspaceDueDate("");

    await loadWorkspaces();
    setSelectedWorkspaceId(workspaceData.id);
    await loadWorkspaceDetails(workspaceData.id);

    setCreatingWorkspace(false);
  };

  const handleAddWorkspaceMember = async () => {
    if (!selectedWorkspaceId) {
      alert("Select a workspace first.");
      return;
    }

    const memberIdToAdd = selectedCollaboratorId.trim();

    if (!memberIdToAdd) {
      alert("Please select a collaborator first.");
      return;
    }

    const selectedProfile = collaboratorOptions.find(
      (profile) => profile.id === memberIdToAdd,
    );

    if (!selectedProfile) {
      alert("Selected collaborator was not found. Please select again.");
      setSelectedCollaboratorId("");
      return;
    }

    const confirmAdd = window.confirm(
      `Add ${
        selectedProfile.full_name || selectedProfile.email || "this collaborator"
      } to this workspace?`,
    );

    if (!confirmAdd) return;

    setAddingMember(true);

    const { error } = await supabase.from("workspace_members").insert({
      workspace_id: selectedWorkspaceId,
      user_id: memberIdToAdd,
      role: "collaborator",
    });

    if (error) {
      console.log("ADD WORKSPACE MEMBER ERROR:", error);
      alert(error.message);
      setAddingMember(false);
      return;
    }

    setSelectedCollaboratorId("");
    await loadWorkspaceDetails(selectedWorkspaceId);
    setAddingMember(false);
  };

  const handleRemoveWorkspaceMember = async (member: WorkspaceMember) => {
    if (!selectedWorkspaceId) return;

    if (member.role === "owner") {
      alert("Workspace owner cannot be removed.");
      return;
    }

    const confirmRemove = window.confirm(
      `Remove ${
        member.profile?.full_name || member.profile?.email || "this member"
      } from this workspace?`,
    );

    if (!confirmRemove) return;

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", member.id);

    if (error) {
      console.log("REMOVE WORKSPACE MEMBER ERROR:", error);
      alert(error.message);
      return;
    }

    await loadWorkspaceDetails(selectedWorkspaceId);
  };

  const handleAddTask = async () => {
    if (!selectedWorkspaceId) {
      alert("Create or select a workspace first.");
      return;
    }

    if (!taskTitle.trim()) {
      alert("Add a task title.");
      return;
    }

    setAddingTask(true);

    const { error } = await supabase.from("workspace_tasks").insert({
      workspace_id: selectedWorkspaceId,
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      status: "todo",
      priority: taskPriority,
      due_date: taskDueDate || null,
      assigned_to: taskAssignedTo || null,
      created_by: userId,
    });

    if (error) {
      console.log("ADD TASK ERROR:", error);
      alert(error.message);
      setAddingTask(false);
      return;
    }

    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskDueDate("");
    setTaskAssignedTo("");

    await loadWorkspaceDetails(selectedWorkspaceId);
    setAddingTask(false);
  };

  const handleUpdateTaskStatus = async (taskId: string, nextStatus: string) => {
    const { error } = await supabase
      .from("workspace_tasks")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) {
      console.log("UPDATE TASK ERROR:", error);
      alert(error.message);
      return;
    }

    if (selectedWorkspaceId) {
      await loadWorkspaceDetails(selectedWorkspaceId);
    }
  };

  const handleUploadFiles = async () => {
    if (!selectedWorkspaceId) {
      alert("Select a workspace first.");
      return;
    }

    if (selectedFiles.length === 0) {
      alert("Choose at least one file.");
      return;
    }

    setUploadingFile(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const ext = getFileExt(file.name);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `workspace/${userId}/${selectedWorkspaceId}/${Date.now()}-${i}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.log("WORKSPACE FILE UPLOAD ERROR:", uploadError);
        alert(uploadError.message);
        setUploadingFile(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      const { error: insertError } = await supabase
        .from("workspace_files")
        .insert({
          workspace_id: selectedWorkspaceId,
          uploaded_by: userId,
          file_url: publicData.publicUrl,
          storage_path: storagePath,
          original_name: file.name,
          mime_type: file.type || null,
          file_ext: ext,
          file_size: file.size,
          file_category: getFileCategory(file),
        });

      if (insertError) {
        console.log("WORKSPACE FILE INSERT ERROR:", insertError);
        alert(insertError.message);
        setUploadingFile(false);
        return;
      }
    }

    setSelectedFiles([]);
    await loadWorkspaceDetails(selectedWorkspaceId);
    setUploadingFile(false);
  };

  return (
    <WorkspaceUI
      loading={loading}
      userId={userId}
      workspaces={workspaces}
      selectedWorkspaceId={selectedWorkspaceId}
      selectedWorkspace={selectedWorkspace}
      tasks={tasks}
      workspaceFiles={workspaceFiles}
      members={members}
      collaboratorOptions={collaboratorOptions}
      selectedCollaboratorId={selectedCollaboratorId}
      creatingWorkspace={creatingWorkspace}
      addingTask={addingTask}
      uploadingFile={uploadingFile}
      addingMember={addingMember}
      workspaceTitle={workspaceTitle}
      workspaceDescription={workspaceDescription}
      workspaceResearchArea={workspaceResearchArea}
      workspaceDueDate={workspaceDueDate}
      taskTitle={taskTitle}
      taskDescription={taskDescription}
      taskPriority={taskPriority}
      taskDueDate={taskDueDate}
      taskAssignedTo={taskAssignedTo}
      selectedFiles={selectedFiles}
      progress={progress}
      statusCounts={statusCounts}
      setWorkspaceTitle={setWorkspaceTitle}
      setWorkspaceDescription={setWorkspaceDescription}
      setWorkspaceResearchArea={setWorkspaceResearchArea}
      setWorkspaceDueDate={setWorkspaceDueDate}
      setTaskTitle={setTaskTitle}
      setTaskDescription={setTaskDescription}
      setTaskPriority={setTaskPriority}
      setTaskDueDate={setTaskDueDate}
      setTaskAssignedTo={setTaskAssignedTo}
      setSelectedFiles={setSelectedFiles}
      setSelectedCollaboratorId={setSelectedCollaboratorId}
      handleSelectWorkspace={handleSelectWorkspace}
      handleCreateWorkspace={handleCreateWorkspace}
      handleAddWorkspaceMember={handleAddWorkspaceMember}
      handleRemoveWorkspaceMember={handleRemoveWorkspaceMember}
      handleAddTask={handleAddTask}
      handleUpdateTaskStatus={handleUpdateTaskStatus}
      handleUploadFiles={handleUploadFiles}
    />
  );
}