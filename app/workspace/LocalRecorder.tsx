"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Meeting = {
  id: string;
  title: string;
};

type LocalRecorderProps = {
  workspaceId: string;
  meeting: Meeting;
  userId: string;
  onSaved: () => void;
};

function getSupportedMimeType() {
  const options = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  for (const option of options) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(option)
    ) {
      return option;
    }
  }

  return "";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function LocalRecorder({
  workspaceId,
  meeting,
  userId,
  onSaved,
}: LocalRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastFileName, setLastFileName] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert("Screen/tab recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const mimeType = getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setSaving(true);

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });

        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - startedAtRef.current) / 1000),
        );

        const safeTitle = meeting.title
          .replace(/[^\w\-]+/g, "_")
          .slice(0, 50);

        const fileName = `ResearchGram_${safeTitle}_${Date.now()}.webm`;

        downloadBlob(blob, fileName);
        setLastFileName(fileName);

        const { error } = await supabase.from("workspace_recordings").insert({
          workspace_id: workspaceId,
          meeting_id: meeting.id,
          recorded_by: userId,
          title: `${meeting.title} recording`,
          file_name: fileName,
          file_type: blob.type || "video/webm",
          duration_seconds: durationSeconds,
          saved_location_note:
            "Downloaded to the recorder's local computer. The actual video file is not stored in cloud.",
        });

        if (error) {
          console.log("SAVE RECORDING METADATA ERROR:", error);
          alert(
            "Video downloaded, but recording metadata could not be saved: " +
              error.message,
          );
        } else {
          onSaved();
        }

        stream.getTracks().forEach((track) => track.stop());

        recorderRef.current = null;
        streamRef.current = null;
        chunksRef.current = [];

        setRecording(false);
        setSaving(false);
      };

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      });

      recorderRef.current = recorder;
      streamRef.current = stream;

      recorder.start(1000);
      setRecording(true);
    } catch (error) {
      console.log("START LOCAL RECORDING ERROR:", error);
      alert(
        "Recording was cancelled or failed. Please allow screen/tab recording permission.",
      );
    }
  };

  const handleStopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  return (
    <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-bold text-yellow-950">Local Meeting Recording</h3>

          <p className="mt-1 text-sm leading-6 text-yellow-800">
            This records to your computer only. When the browser asks, choose
            this meeting tab/window and enable tab audio if available.
          </p>

          {lastFileName && (
            <p className="mt-2 text-xs font-semibold text-yellow-900">
              Last downloaded file: {lastFileName}
            </p>
          )}
        </div>

        {!recording ? (
          <button
            onClick={handleStartRecording}
            disabled={saving}
            className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            Start Local Recording
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            disabled={saving}
            className="rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
          >
            Stop Recording
          </button>
        )}
      </div>

      {recording && (
        <p className="mt-4 rounded-2xl bg-red-100 p-3 text-sm font-bold text-red-700">
          ● Recording is running. Do not close this tab.
        </p>
      )}
    </div>
  );
}