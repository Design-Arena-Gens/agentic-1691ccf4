"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DriveVideoFile } from "@/types";

type CreativePayload = {
  title: string;
  description: string;
  hashtags: string[];
};

const STEPS = [
  {
    title: "Authorize Google",
    description:
      "Connect the automation to Google Drive and YouTube with one OAuth flow. Tokens are stored securely in a httpOnly cookie."
  },
  {
    title: "Select a Drive Video",
    description:
      "Pull in up to 25 of your freshest video assets from Google Drive, prioritized by last modified date."
  },
  {
    title: "Generate the Viral Creative Stack",
    description:
      "Let the AI growth strategist craft an optimized title, description, and hashtag blend tailored to your brief."
  },
  {
    title: "Upload to YouTube",
    description:
      "Ship the video straight to your channel with a single click, including metadata, privacy, and scheduling."
  }
];

function formatDuration(durationMillis?: number) {
  if (!durationMillis) return "—";
  const totalSeconds = Math.floor(durationMillis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .filter((value, index) => value > 0 || index > 0)
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function formatDate(date?: string) {
  if (!date) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveVideoFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const [brief, setBrief] = useState("");
  const [target, setTarget] = useState("Emerging creators");
  const [tone, setTone] = useState("High-energy, punchy");

  const [creative, setCreative] = useState<CreativePayload | null>(null);
  const [creativeLoading, setCreativeLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtagsText, setHashtagsText] = useState("");
  const [privacyStatus, setPrivacyStatus] =
    useState<"public" | "private" | "unlisted">("unlisted");
  const [publishAt, setPublishAt] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    ok: boolean;
    message: string;
    videoId?: string;
  } | null>(null);

  const selectedFile = useMemo(
    () => driveFiles.find((file) => file.id === selectedFileId) ?? null,
    [driveFiles, selectedFileId]
  );

  const hashtagsArray = useMemo(
    () =>
      hashtagsText
        .split(/[\s,]+/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)),
    [hashtagsText]
  );

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/session", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setAuthenticated(Boolean(data.authenticated));
  }, []);

  const fetchDriveVideos = useCallback(async () => {
    if (!authenticated) return;
    setLoadingDrive(true);
    try {
      const response = await fetch("/api/google/drive/list", {
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error("Failed to load videos");
      }
      const data = await response.json();
      setDriveFiles(data.videos ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDrive(false);
    }
  }, [authenticated]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (authenticated) {
      fetchDriveVideos();
    } else {
      setDriveFiles([]);
      setSelectedFileId(null);
    }
  }, [authenticated, fetchDriveVideos]);

  const handleAuthorize = useCallback(async () => {
    setAuthenticating(true);
    try {
      const response = await fetch("/api/google/auth-url");
      if (!response.ok) {
        throw new Error("Failed to fetch auth url");
      }
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setAuthenticating(false);
    }
  }, []);

  const handleGenerateCreative = useCallback(async () => {
    if (!selectedFile) return;
    setCreativeLoading(true);
    setUploadResult(null);
    try {
      const response = await fetch("/api/creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          brief,
          target,
          tone
        })
      });
      if (!response.ok) {
        throw new Error("Creative generation failed");
      }
      const data = (await response.json()) as CreativePayload;
      setCreative(data);
      setTitle(data.title);
      setDescription(data.description);
      setHashtagsText(data.hashtags.map((tag) => `#${tag}`.replace("##", "#")).join(" "));
    } catch (error) {
      console.error(error);
    } finally {
      setCreativeLoading(false);
    }
  }, [brief, selectedFile, target, tone]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: selectedFile.id,
          title,
          description,
          hashtags: hashtagsArray,
          privacyStatus,
          publishAt: publishAt || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Upload failed");
      }
      const data = await response.json();
      setUploadResult({
        ok: true,
        message: "Uploaded to YouTube successfully.",
        videoId: data.videoId
      });
    } catch (error) {
      console.error(error);
      setUploadResult({
        ok: false,
        message:
          error instanceof Error ? error.message : "Something went wrong."
      });
    } finally {
      setUploading(false);
    }
  }, [selectedFile, title, description, hashtagsArray, privacyStatus, publishAt]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/google/logout", { method: "POST" });
    setAuthenticated(false);
    setCreative(null);
    setTitle("");
    setDescription("");
    setHashtagsText("");
  }, []);

  return (
    <main>
      <header style={{ marginBottom: "48px" }}>
        <span className="pill">Google Drive → AI Creative → YouTube</span>
        <h1>Launch Viral-Ready Videos In One Flow</h1>
        <p style={{ maxWidth: "620px", color: "#cbd5f5" }}>
          Plug in a Drive library, extract the perfect metadata with AI, and
          publish instantly to YouTube with the right privacy, schedule, and
          hashtags engineered for discovery.
        </p>
      </header>

      <section>
        <h2>Automation Timeline</h2>
        <div className="grid grid-two">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              style={{
                padding: "16px",
                borderRadius: "16px",
                border: "1px solid rgba(148,163,184,0.2)",
                background: "rgba(30,41,59,0.35)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px"
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "12px",
                    background: "rgba(99,102,241,0.2)",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700
                  }}
                >
                  {index + 1}
                </div>
                <strong>{step.title}</strong>
              </div>
              <p style={{ margin: 0, color: "#a5b4fc" }}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>1. Connect Your Google Workspace</h2>
        <p style={{ color: "#cbd5f5" }}>
          Authorize the workflow to pull from Drive and push to YouTube. Tokens
          stay in your browser session; revoke any time.
        </p>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button onClick={handleAuthorize} disabled={authenticating}>
            {authenticated ? "Reauthorize Google" : "Connect Google Workspace"}
          </button>
          {authenticated && (
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(248,250,252,0.08)",
                color: "#f8fafc",
                border: "1px solid rgba(148,163,184,0.3)"
              }}
            >
              Sign Out
            </button>
          )}
          <span style={{ color: authenticated ? "#34d399" : "#f97316" }}>
            {authenticated ? "Connected" : "Not connected"}
          </span>
        </div>
      </section>

      <section>
        <h2>2. Choose a Video From Drive</h2>
        {authenticated ? (
          <>
            <p style={{ color: "#cbd5f5" }}>
              Select a file below to generate creative and upload.
            </p>
            <button
              onClick={fetchDriveVideos}
              disabled={loadingDrive}
              style={{ marginBottom: "16px" }}
            >
              {loadingDrive ? "Refreshing Library…" : "Refresh Library"}
            </button>

            <div className="grid">
              {driveFiles.length === 0 && !loadingDrive && (
                <div
                  style={{
                    border: "1px dashed rgba(148,163,184,0.4)",
                    padding: "24px",
                    borderRadius: "16px"
                  }}
                >
                  No recent video files found in Drive. Upload more assets or
                  try refreshing.
                </div>
              )}

              {driveFiles.map((file) => {
                const active = selectedFileId === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    style={{
                      cursor: "pointer",
                      borderRadius: "16px",
                      border: active
                        ? "2px solid #6366f1"
                        : "1px solid rgba(148,163,184,0.2)",
                      background: active
                        ? "rgba(99,102,241,0.15)"
                        : "rgba(30,41,59,0.35)",
                      padding: "20px",
                      transition: "border 0.2s ease"
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: "8px" }}>
                      {file.name}
                    </strong>
                    <small style={{ color: "#94a3b8" }}>
                      Modified {formatDate(file.modifiedTime)} • Duration{" "}
                      {formatDuration(file.durationMillis)}
                    </small>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p style={{ color: "#f97316" }}>
            Connect Google first to browse Drive videos.
          </p>
        )}
      </section>

      <section>
        <h2>3. Generate Metadata With AI</h2>
        <p style={{ color: "#cbd5f5" }}>
          Feed the AI strategist the context it needs. You can iterate until the
          copy hits the mark.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleGenerateCreative();
          }}
        >
          <div>
            <label htmlFor="brief">Creative brief</label>
            <textarea
              id="brief"
              rows={4}
              placeholder="Core story beats, value prop, hook, CTAs..."
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="target">Target audience</label>
            <input
              id="target"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="tone">Tone</label>
            <input
              id="tone"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
            />
          </div>

          <button type="submit" disabled={!selectedFile || creativeLoading}>
            {creativeLoading ? "Generating…" : "Generate Metadata"}
          </button>
        </form>

        {creative && (
          <div
            style={{
              marginTop: "24px",
              borderRadius: "16px",
              border: "1px solid rgba(148,163,184,0.2)",
              padding: "20px",
              background: "rgba(15,23,42,0.55)"
            }}
          >
            <h3 style={{ marginTop: 0 }}>Latest AI Output</h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "Menlo, Monaco, Consolas, monospace",
                background: "rgba(15,23,42,0.65)",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid rgba(148,163,184,0.2)",
                color: "#a5b4fc"
              }}
            >
              {JSON.stringify(creative, null, 2)}
            </pre>
          </div>
        )}
      </section>

      <section>
        <h2>4. Finalize & Publish to YouTube</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleUpload();
          }}
        >
          <div>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter a compelling headline"
            />
          </div>

          <div>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="hashtags">
              Hashtags (space or comma separated, include # optionally)
            </label>
            <textarea
              id="hashtags"
              rows={2}
              value={hashtagsText}
              onChange={(event) => setHashtagsText(event.target.value)}
            />
          </div>

          <div className="grid grid-two">
            <div>
              <label htmlFor="privacy">Privacy</label>
              <select
                id="privacy"
                value={privacyStatus}
                onChange={(event) =>
                  setPrivacyStatus(event.target.value as typeof privacyStatus)
                }
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label htmlFor="publishAt">
                Scheduled Publish (ISO8601 or leave blank)
              </label>
              <input
                id="publishAt"
                value={publishAt}
                onChange={(event) => setPublishAt(event.target.value)}
                placeholder="2024-07-01T15:30:00Z"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedFile || uploading || !title.trim()}
          >
            {uploading ? "Uploading…" : "Upload to YouTube"}
          </button>
        </form>

        {uploadResult && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              borderRadius: "12px",
              border: `1px solid ${
                uploadResult.ok ? "rgba(34,197,94,0.4)" : "rgba(248,113,113,0.4)"
              }`,
              background: uploadResult.ok
                ? "rgba(34,197,94,0.15)"
                : "rgba(248,113,113,0.15)"
            }}
          >
            <strong>{uploadResult.message}</strong>
            {uploadResult.ok && uploadResult.videoId && (
              <p style={{ marginTop: "8px" }}>
                Video ID:{" "}
                <code style={{ color: "#a5b4fc" }}>{uploadResult.videoId}</code>
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
