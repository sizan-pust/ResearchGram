"use client";

import { useEffect, useMemo, useState } from "react";

export type ViewerFile = {
  id: string;
  url: string;
  name: string;
  mime_type: string | null;
  file_ext: string | null;
  attachment_type: string | null;
  file_size: number | null;
};

type FileViewerModalProps = {
  open: boolean;
  files: ViewerFile[];
  currentIndex: number;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
};

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "Unknown size";

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function isImageFile(file: ViewerFile) {
  return (
    file.attachment_type === "image" ||
    file.mime_type?.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp"].includes(file.file_ext || "")
  );
}

function isPdfFile(file: ViewerFile) {
  return (
    file.attachment_type === "pdf" ||
    file.mime_type === "application/pdf" ||
    file.file_ext === "pdf"
  );
}

export default function FileViewerModal({
  open,
  files,
  currentIndex,
  onClose,
  onChangeIndex,
}: FileViewerModalProps) {
  const [zoom, setZoom] = useState(1);

  const file = files[currentIndex] || null;

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < files.length - 1;

  useEffect(() => {
    setZoom(1);
  }, [currentIndex, open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();

      if (event.key === "ArrowLeft" && canGoPrevious) {
        onChangeIndex(currentIndex - 1);
      }

      if (event.key === "ArrowRight" && canGoNext) {
        onChangeIndex(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    open,
    currentIndex,
    canGoPrevious,
    canGoNext,
    onClose,
    onChangeIndex,
  ]);

  const viewerTitle = useMemo(() => {
    if (!file) return "File viewer";
    return file.name || "Research file";
  }, [file]);

  if (!open || !file) return null;

  const imageFile = isImageFile(file);
  const pdfFile = isPdfFile(file);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 text-white">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{viewerTitle}</p>
            <p className="text-xs text-white/60">
              {formatFileSize(file.file_size)} · {currentIndex + 1} of{" "}
              {files.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {imageFile && (
              <>
                <button
                  onClick={() => setZoom((current) => Math.max(0.5, current - 0.25))}
                  className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20"
                >
                  −
                </button>

                <span className="w-14 text-center text-sm font-semibold">
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  onClick={() => setZoom((current) => Math.min(3, current + 0.25))}
                  className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20"
                >
                  +
                </button>
              </>
            )}

            <a
              href={file.url}
              download={file.name}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-gray-200"
            >
              Download
            </a>

            <button
              onClick={onClose}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </header>

        <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
          {canGoPrevious && (
            <button
              onClick={() => onChangeIndex(currentIndex - 1)}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl font-bold transition hover:bg-white/20"
            >
              ‹
            </button>
          )}

          {canGoNext && (
            <button
              onClick={() => onChangeIndex(currentIndex + 1)}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl font-bold transition hover:bg-white/20"
            >
              ›
            </button>
          )}

          {imageFile ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-full max-w-full rounded-xl object-contain transition-transform"
              style={{
                transform: `scale(${zoom})`,
              }}
            />
          ) : pdfFile ? (
            <iframe
              src={file.url}
              title={file.name}
              className="h-full min-h-[75vh] w-full max-w-6xl rounded-xl bg-white"
            />
          ) : (
            <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center text-gray-950">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                📎
              </div>

              <h2 className="text-xl font-bold">{file.name}</h2>

              <p className="mt-2 text-sm text-gray-500">
                This file type cannot be previewed directly. You can download or
                open it in a new tab.
              </p>

              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Open File
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}