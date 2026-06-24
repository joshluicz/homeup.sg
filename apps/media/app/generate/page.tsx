"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type Blueprint,
  type BlueprintRoom,
  type SavedBlueprintSummary,
  blueprintFromWebhookPayload,
  blueprintToDbRow,
} from "@/lib/blueprint";
import { EMPTY_WEBHOOK_RESPONSE_MESSAGE, readResponseJson } from "@/lib/read-response-json";

const WEBHOOK_GENERATE_BLUEPRINT = "/api/generate-blueprint";
const WEBHOOK_APPROVE_BLUEPRINT = "/api/approve-blueprint";

const ROOM_SUGGESTIONS = [
  "Living Room",
  "Kitchen",
  "Master Bedroom",
  "Common Bedroom",
  "Bathroom",
  "Dining Area",
  "Study",
  "Balcony",
  "Utility",
  "Facade",
];

const INPUT_CLASS =
  "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200";
const CARD_CLASS = "rounded-xl border border-neutral-200 bg-white p-6 shadow-sm";
const SUBMIT_BTN_CLASS =
  "w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 sm:w-auto sm:px-8";

type PageState = "form" | "generating_blueprint" | "review" | "clips";

type PropertyType = "HDB Flat" | "Condo" | "Landed" | "EC";
type RenovationStatus =
  | "Move-in ready"
  | "Fully renovated"
  | "Partially renovated"
  | "Original condition";

type RoomEntry = {
  id: string;
  label: string;
  file: File | null;
  previewUrl: string | null;
  r2Url: string | null;
};

type MediaFileRow = {
  id: string;
  job_id: string;
  file_name: string;
  r2_url: string;
  status: "uploaded" | "processing" | "done" | "error";
  metadata?: { label?: string } | null;
  error_message?: string | null;
};

type ClipCard = {
  label: string;
  status: "queued" | "generating" | "ready" | "failed";
  videoUrl?: string;
  errorMessage?: string;
  previewUrl?: string | null;
};

function createDefaultRooms(): RoomEntry[] {
  return ["Living Room", "Kitchen", "Master Bedroom"].map((label) => ({
    id: crypto.randomUUID(),
    label,
    file: null,
    previewUrl: null,
    r2Url: null,
  }));
}

function fileExtension(file: File): string {
  const parts = file.name.split(".");
  if (parts.length > 1) return parts.pop()!.toLowerCase();
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "room";
}

function buildPhotoKey(label: string, file: File): string {
  return `room-photos/${Date.now()}-${slugifyLabel(label)}.${fileExtension(file)}`;
}

function labelToFileSlug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "_");
}

function requiredField(value: string, fallback: string): string {
  return value.trim() || fallback;
}

async function fetchBlueprint(blueprintId: string): Promise<Blueprint> {
  const res = await fetch(`/api/blueprints/${blueprintId}`);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error ?? "Failed to load blueprint",
    );
  }

  return body as Blueprint;
}

async function saveBlueprintToDatabase(
  blueprint: Blueprint,
  meta: { address: string; uploadedBy: string },
): Promise<void> {
  const supabase = createClient();
  const row = blueprintToDbRow(blueprint, meta);
  const { error } = await supabase.from("blueprints").upsert(row);
  if (error) {
    throw new Error(`Failed to save blueprint: ${error.message}`);
  }
}

async function fetchSavedBlueprints(): Promise<SavedBlueprintSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blueprints")
    .select("id,property_name,status,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SavedBlueprintSummary[];
}

async function deleteDraftBlueprint(blueprintId: string): Promise<void> {
  const supabase = createClient();

  const { error: clipsError } = await supabase
    .from("media_files")
    .delete()
    .eq("job_id", blueprintId);

  if (clipsError) {
    throw new Error(`Failed to delete related clips: ${clipsError.message}`);
  }

  const { error } = await supabase
    .from("blueprints")
    .delete()
    .eq("id", blueprintId)
    .eq("status", "draft");

  if (error) {
    throw new Error(`Failed to delete draft: ${error.message}`);
  }
}

function formatSavedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapFileStatus(
  status: MediaFileRow["status"],
): ClipCard["status"] {
  switch (status) {
    case "uploaded":
      return "queued";
    case "processing":
      return "generating";
    case "done":
      return "ready";
    case "error":
      return "failed";
    default:
      return "queued";
  }
}

function statusBadgeClass(status: ClipCard["status"]): string {
  switch (status) {
    case "ready":
      return "bg-green-100 text-green-800";
    case "generating":
      return "bg-amber-100 text-amber-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

function statusLabel(status: ClipCard["status"]): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "generating":
      return "Generating";
    case "failed":
      return "Failed";
    default:
      return "Queued";
  }
}

async function uploadRoomPhoto(file: File, key: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("key", key);

  const res = await fetch("/api/upload-to-r2", {
    method: "POST",
    body: formData,
  });

  const body = await readResponseJson<{ url?: string; error?: string }>(res).catch(
    () => ({} as { url?: string; error?: string }),
  );
  if (!res.ok) {
    throw new Error(body.error ?? "Photo upload failed");
  }
  if (!body.url) {
    throw new Error("Photo upload succeeded but no URL was returned.");
  }

  return body.url;
}

export default function GeneratePage() {
  const [pageState, setPageState] = useState<PageState>("form");
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("HDB Flat");
  const [rooms, setRooms] = useState("");
  const [sqft, setSqft] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [renovationStatus, setRenovationStatus] =
    useState<RenovationStatus>("Move-in ready");
  const [sellingPoints, setSellingPoints] = useState("");
  const [agentNotes, setAgentNotes] = useState("");
  const [secondsPerRoom, setSecondsPerRoom] = useState(15);

  const [roomEntries, setRoomEntries] = useState<RoomEntry[]>(createDefaultRooms);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [clipCards, setClipCards] = useState<ClipCard[]>([]);
  const [approving, setApproving] = useState(false);
  const [savedBlueprints, setSavedBlueprints] = useState<SavedBlueprintSummary[]>(
    [],
  );
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingBlueprintId, setLoadingBlueprintId] = useState<string | null>(
    null,
  );
  const [deletingBlueprintId, setDeletingBlueprintId] = useState<string | null>(
    null,
  );

  const roomPhotoUrlsRef = useRef<Map<string, string>>(new Map());

  const refreshSavedBlueprints = useCallback(async () => {
    try {
      const rows = await fetchSavedBlueprints();
      setSavedBlueprints(rows);
    } catch {
      // Non-fatal — list can be refreshed on next visit
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    void refreshSavedBlueprints();
  }, [refreshSavedBlueprints]);

  async function handleLoadSavedBlueprint(blueprintId: string) {
    setError(null);
    setLoadingBlueprintId(blueprintId);

    try {
      const loaded = await fetchBlueprint(blueprintId);
      setBlueprint(loaded);
      setPageState("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blueprint.");
    } finally {
      setLoadingBlueprintId(null);
    }
  }

  async function handleDeleteDraft(blueprintId: string, propertyName: string) {
    const confirmed = window.confirm(
      `Delete draft for "${propertyName}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setError(null);
    setDeletingBlueprintId(blueprintId);

    try {
      await deleteDraftBlueprint(blueprintId);

      if (blueprint?.blueprint_id === blueprintId) {
        setBlueprint(null);
        setPageState("form");
      }

      await refreshSavedBlueprints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete draft.");
    } finally {
      setDeletingBlueprintId(null);
    }
  }

  const updateRoom = useCallback((id: string, patch: Partial<RoomEntry>) => {
    setRoomEntries((prev) =>
      prev.map((room) => (room.id === id ? { ...room, ...patch } : room)),
    );
  }, []);

  function addRoom() {
    setRoomEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: "New Room",
        file: null,
        previewUrl: null,
        r2Url: null,
      },
    ]);
  }

  function removeRoom(id: string) {
    setRoomEntries((prev) => prev.filter((room) => room.id !== id));
  }

  function handleRoomFile(id: string, file: File) {
    const previewUrl = URL.createObjectURL(file);
    updateRoom(id, { file, previewUrl });
  }

  async function handleGenerateBlueprint(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!address.trim()) {
      setError("Address is required.");
      return;
    }
    if (!sellingPoints.trim()) {
      setError("Selling points are required.");
      return;
    }

    const roomsWithPhotos = roomEntries.filter((room) => room.file);
    if (roomsWithPhotos.length === 0) {
      setError("Please add at least one room photo.");
      return;
    }

    setPageState("generating_blueprint");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be signed in to generate a blueprint.");
      }

      const uploadedRooms: RoomEntry[] = [];

      for (const room of roomEntries) {
        if (!room.file) {
          uploadedRooms.push(room);
          continue;
        }

        const key = buildPhotoKey(room.label, room.file);
        const r2Url = await uploadRoomPhoto(room.file, key);
        roomPhotoUrlsRef.current.set(room.label, r2Url);
        uploadedRooms.push({ ...room, r2Url });
      }

      setRoomEntries(uploadedRooms);

      const roomPhotos = uploadedRooms
        .filter((room) => room.r2Url)
        .map((room) => ({
          label: room.label,
          r2_url: room.r2Url!,
        }));

      const webhookRes = await fetch(WEBHOOK_GENERATE_BLUEPRINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          property_type: propertyType,
          rooms: requiredField(rooms, "Not specified"),
          sqft: requiredField(sqft, "Not specified"),
          price_range: requiredField(priceRange, "Not specified"),
          selling_points: sellingPoints.trim(),
          renovation_status: renovationStatus,
          agent_notes: requiredField(agentNotes, "None"),
          uploaded_by: user.id,
          room_photos: roomPhotos,
        }),
      });

      if (!webhookRes.ok) {
        const detail = await webhookRes.json().catch(() => ({}));
        throw new Error(
          (detail as { error?: string }).error ?? "Blueprint generation failed",
        );
      }

      const data = await readResponseJson<Record<string, unknown>>(
        webhookRes,
      ).catch((err) => {
        if (err instanceof Error && err.message === "EMPTY_RESPONSE") {
          throw new Error(EMPTY_WEBHOOK_RESPONSE_MESSAGE);
        }
        throw err;
      });

      const webhookBlueprint = blueprintFromWebhookPayload(data);
      if (!webhookBlueprint?.blueprint_id) {
        throw new Error("Blueprint workflow did not return a blueprint_id.");
      }

      let fullBlueprint: Blueprint;
      if (webhookBlueprint.rooms?.length) {
        fullBlueprint = webhookBlueprint;
      } else {
        fullBlueprint = await fetchBlueprint(webhookBlueprint.blueprint_id);
      }

      await saveBlueprintToDatabase(fullBlueprint, {
        address: address.trim(),
        uploadedBy: user.id,
      });

      await refreshSavedBlueprints();

      setBlueprint(fullBlueprint);
      setPageState("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPageState("form");
    }
  }

  async function startClipGeneration(
    roomPhotos: Array<{
      label: string;
      r2_url: string;
      higgsfield_prompt: string;
      duration_seconds: number;
    }>,
  ) {
    const res = await fetch(WEBHOOK_APPROVE_BLUEPRINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blueprint_id: blueprint!.blueprint_id,
        room_photos: roomPhotos,
      }),
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(
        (detail as { error?: string }).error ?? "Failed to start clip generation",
      );
    }

    setClipCards((prev) =>
      roomPhotos.map((room) => {
        const existing = prev.find((clip) => clip.label === room.label);
        return {
          label: room.label,
          status: "queued" as const,
          previewUrl:
            existing?.previewUrl ??
            roomEntries.find((entry) => entry.label === room.label)?.previewUrl ??
            null,
        };
      }),
    );
    setPageState("clips");
  }

  function buildRoomPhotos(
    rooms: BlueprintRoom[],
    labels?: string[],
  ) {
    const selected = labels
      ? rooms.filter((room) => labels.includes(room.label))
      : rooms;

    return selected.map((room) => {
      const photoUrl =
        roomPhotoUrlsRef.current.get(room.label) ??
        roomEntries.find((entry) => entry.label === room.label)?.r2Url ??
        null;

      return {
        label: room.label,
        r2_url: photoUrl ?? "",
        higgsfield_prompt: room.higgsfield_prompt ?? "",
        duration_seconds: room.duration_seconds ?? secondsPerRoom,
      };
    });
  }

  async function handleApproveBlueprint() {
    if (!blueprint) return;

    setApproving(true);
    setError(null);

    try {
      const roomPhotos = buildRoomPhotos(blueprint.rooms ?? []);
      const missingPhotos = roomPhotos.filter((room) => !room.r2_url);
      if (missingPhotos.length > 0) {
        throw new Error(
          `Missing room photos for: ${missingPhotos.map((room) => room.label).join(", ")}`,
        );
      }

      await startClipGeneration(roomPhotos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setApproving(false);
    }
  }

  async function handleRetryFailedClips() {
    if (!blueprint) return;

    const failedLabels = clipCards
      .filter((clip) => clip.status === "failed")
      .map((clip) => clip.label);

    if (failedLabels.length === 0) return;

    setApproving(true);
    setError(null);

    try {
      const roomPhotos = buildRoomPhotos(blueprint.rooms ?? [], failedLabels);
      const missingPhotos = roomPhotos.filter((room) => !room.r2_url);
      if (missingPhotos.length > 0) {
        throw new Error(
          `Cannot retry — room photos are missing for: ${missingPhotos.map((room) => room.label).join(", ")}. Generate a new blueprint instead.`,
        );
      }

      await startClipGeneration(roomPhotos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed.");
    } finally {
      setApproving(false);
    }
  }

  const blueprintId = blueprint?.blueprint_id ?? null;

  useEffect(() => {
    if (pageState !== "clips" || !blueprintId) return;

    async function pollMediaFiles() {
      try {
        const supabase = createClient();
        const { data: rows, error: pollError } = await supabase
          .from("media_files")
          .select("*")
          .eq("job_id", blueprintId);

        if (pollError || !rows) return;

        setClipCards((prev) =>
          prev.map((clip) => {
            const row = rows.find((file: MediaFileRow) => {
              const metaLabel = file.metadata?.label;
              if (metaLabel && metaLabel === clip.label) return true;
              const slug = labelToFileSlug(clip.label);
              return file.file_name.toLowerCase().includes(slug);
            });

            if (!row) return clip;

            return {
              ...clip,
              status: mapFileStatus(row.status),
              videoUrl: row.status === "done" ? row.r2_url : clip.videoUrl,
              errorMessage:
                row.status === "error"
                  ? (row.error_message ?? "Generation failed")
                  : undefined,
            };
          }),
        );
      } catch {
        // Polling errors are non-fatal; next tick will retry
      }
    }

    pollMediaFiles();
    const interval = setInterval(pollMediaFiles, 15_000);
    return () => clearInterval(interval);
  }, [pageState, blueprintId]);

  const clipsDone = clipCards.filter((c) => c.status === "ready").length;
  const clipsFailed = clipCards.filter((c) => c.status === "failed").length;
  const clipsTotal = clipCards.length;
  const allClipsReady =
    clipsTotal > 0 && clipCards.every((c) => c.status === "ready");

  if (pageState === "generating_blueprint") {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-24">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900"
          aria-hidden
        />
        <p className="mt-4 text-sm font-medium text-neutral-900">
          Writing blueprint…
        </p>
      </div>
    );
  }

  if (pageState === "review" && blueprint) {
    const blueprintRooms = blueprint.rooms ?? [];

    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-neutral-900">Review Blueprint</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Check the generated script before creating room clips.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <section className={CARD_CLASS}>
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Blueprint</h2>

            {blueprint.hook_script && (
              <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3">
                <p className="mb-1 text-sm font-semibold text-neutral-900">Hook</p>
                <p className="text-sm text-neutral-800">{blueprint.hook_script}</p>
              </div>
            )}

            <div className="space-y-4">
              {blueprintRooms.map((room) => {
                const previewUrl =
                  roomEntries.find((entry) => entry.label === room.label)
                    ?.previewUrl ?? null;

                return (
                  <div
                    key={room.label}
                    className="rounded-lg border border-neutral-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt={room.label}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {room.label}
                          </p>
                          {room.duration_seconds != null && (
                            <p className="text-sm text-neutral-500">
                              {room.duration_seconds}s
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {room.script && (
                      <div className="mb-3">
                        <p className="mb-1 text-sm font-medium text-neutral-900">
                          Script
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-neutral-800">
                          {room.script}
                        </p>
                      </div>
                    )}
                    {room.presenter_direction && (
                      <div className="mb-3">
                        <p className="mb-1 text-sm font-medium text-neutral-900">
                          Presenter direction
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-neutral-600">
                          {room.presenter_direction}
                        </p>
                      </div>
                    )}
                    {room.higgsfield_prompt && (
                      <div className="rounded-lg bg-purple-50 px-3 py-2">
                        <p className="mb-1 text-sm font-medium text-purple-900">
                          Higgsfield prompt
                        </p>
                        <p className="font-mono text-sm text-purple-800">
                          {room.higgsfield_prompt}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {blueprint.cta_script && (
              <div className="mt-6 rounded-lg bg-neutral-50 px-4 py-3">
                <p className="mb-1 text-sm font-semibold text-neutral-900">CTA</p>
                <p className="text-sm text-neutral-800">{blueprint.cta_script}</p>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-neutral-700">Colour Grade</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {blueprint.colour_grade || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700">Edit Notes</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {blueprint.edit_notes || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700">
                  Presentation Guide
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {blueprint.presentation_guide || "—"}
                </p>
              </div>
            </div>
          </section>

          <section className={CARD_CLASS}>
            <h2 className="mb-2 text-sm font-semibold text-neutral-900">
              Generate Clips
            </h2>
            <p className="mb-4 text-sm text-neutral-600">
              Approve this blueprint to generate {blueprintRooms.length} Higgsfield room
              clips.
            </p>
            <button
              type="button"
              onClick={handleApproveBlueprint}
              disabled={approving}
              className={SUBMIT_BTN_CLASS}
            >
              {approving ? "Starting…" : "Approve & generate clips →"}
            </button>
          </section>
        </div>
      </div>
    );
  }

  if (pageState === "clips") {
    const progressPercent =
      clipsTotal > 0 ? Math.round((clipsDone / clipsTotal) * 100) : 0;

    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-neutral-900">Generating Clips</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Room clips are being created from your blueprint.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {allClipsReady && (
          <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            All clips ready.
          </div>
        )}

        {clipsFailed > 0 && (
          <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {clipsFailed} clip{clipsFailed === 1 ? "" : "s"} failed — usually a
            temporary Higgsfield API timeout. Wait a minute, then retry.
          </div>
        )}

        <section className={CARD_CLASS}>
          <p className="mb-2 text-sm font-medium text-neutral-900">
            {clipsDone}/{clipsTotal} rooms complete
          </p>
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-neutral-700 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {clipCards.map((clip) => (
              <div
                key={clip.label}
                className="rounded-lg border border-neutral-200 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{clip.label}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-sm ${statusBadgeClass(clip.status)}`}
                  >
                    {statusLabel(clip.status)}
                  </span>
                </div>

                {clip.status === "ready" && clip.videoUrl && (
                  <video
                    src={clip.videoUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    className="w-full rounded-lg"
                  />
                )}

                {clip.status === "failed" && clip.errorMessage && (
                  <p className="text-sm text-red-600">{clip.errorMessage}</p>
                )}
              </div>
            ))}
          </div>

          {clipsFailed > 0 && (
            <button
              type="button"
              onClick={handleRetryFailedClips}
              disabled={approving}
              className={`${SUBMIT_BTN_CLASS} mt-6`}
            >
              {approving
                ? "Retrying…"
                : `Retry ${clipsFailed} failed clip${clipsFailed === 1 ? "" : "s"}`}
            </button>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Generate Video</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Upload room photos and generate a property video blueprint.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className={`${CARD_CLASS} mb-8`}>
        <h2 className="mb-1 text-sm font-semibold text-neutral-900">
          Saved blueprints
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Load a previous blueprint to review or generate clips.
        </p>

        {loadingSaved ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : savedBlueprints.length === 0 ? (
          <p className="text-sm text-neutral-500">No saved blueprints yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {savedBlueprints.map((item) => (
              <li key={item.id} className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadSavedBlueprint(item.id)}
                  disabled={
                    loadingBlueprintId === item.id ||
                    deletingBlueprintId === item.id
                  }
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-2 py-3 text-left hover:bg-neutral-50 disabled:opacity-60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {item.property_name}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {formatSavedDate(item.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-sm capitalize text-neutral-600">
                    {loadingBlueprintId === item.id ? "Loading…" : item.status}
                  </span>
                </button>
                {item.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteDraft(item.id, item.property_name)}
                    disabled={deletingBlueprintId === item.id}
                    className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                    aria-label={`Delete draft for ${item.property_name}`}
                  >
                    {deletingBlueprintId === item.id ? "Deleting…" : "Delete"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={handleGenerateBlueprint} className="space-y-8">
        <section className={CARD_CLASS}>
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">
            Property Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. Blk 123 Ang Mo Kio Ave 3"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Content Type
                </label>
                <select disabled value="short" className={`${INPUT_CLASS} opacity-60`}>
                  <option value="short">Short-form</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Category
                </label>
                <select
                  disabled
                  value="house_tour"
                  className={`${INPUT_CLASS} opacity-60`}
                >
                  <option value="house_tour">House Tour</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className={INPUT_CLASS}
                >
                  <option value="HDB Flat">HDB Flat</option>
                  <option value="Condo">Condo</option>
                  <option value="Landed">Landed</option>
                  <option value="EC">EC</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Rooms
                </label>
                <input
                  type="text"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder='e.g. "4"'
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Size sqft
                </label>
                <input
                  type="text"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. 1200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Price Range
                </label>
                <input
                  type="text"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. $720k–$740k"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Renovation Status
              </label>
              <select
                value={renovationStatus}
                onChange={(e) =>
                  setRenovationStatus(e.target.value as RenovationStatus)
                }
                className={INPUT_CLASS}
              >
                <option value="Move-in ready">Move-in ready</option>
                <option value="Fully renovated">Fully renovated</option>
                <option value="Partially renovated">Partially renovated</option>
                <option value="Original condition">Original condition</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Selling Points <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={sellingPoints}
                onChange={(e) => setSellingPoints(e.target.value)}
                rows={3}
                className={INPUT_CLASS}
                placeholder="Key selling points for the property"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Agent Notes
              </label>
              <textarea
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                rows={2}
                className={INPUT_CLASS}
                placeholder="Optional notes for the editing team"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Seconds per room
              </label>
              <select
                value={secondsPerRoom}
                onChange={(e) => setSecondsPerRoom(Number(e.target.value))}
                className={INPUT_CLASS}
              >
                <option value={10}>10s</option>
                <option value={15}>15s</option>
                <option value={20}>20s</option>
                <option value={25}>25s</option>
              </select>
            </div>
          </div>
        </section>

        <section className={CARD_CLASS}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-neutral-900">Room Photos</h2>
            <button
              type="button"
              onClick={addRoom}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              + Add room
            </button>
          </div>
          <p className="mb-4 text-sm text-neutral-500">
            Each photo becomes an animated B-roll clip
          </p>

          <datalist id="room-suggestions">
            {ROOM_SUGGESTIONS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roomEntries.map((room) => (
              <RoomPhotoCard
                key={room.id}
                room={room}
                onLabelChange={(label) => updateRoom(room.id, { label })}
                onFileSelect={(file) => handleRoomFile(room.id, file)}
                onRemove={() => removeRoom(room.id)}
                canRemove={roomEntries.length > 1}
              />
            ))}
          </div>
        </section>

        <button type="submit" className={SUBMIT_BTN_CLASS}>
          Generate blueprint →
        </button>
      </form>
    </div>
  );
}

function RoomPhotoCard({
  room,
  onLabelChange,
  onFileSelect,
  onRemove,
  canRemove,
}: {
  room: RoomEntry;
  onLabelChange: (label: string) => void;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <input
          type="text"
          list="room-suggestions"
          value={room.label}
          onChange={(e) => onLabelChange(e.target.value)}
          className={`${INPUT_CLASS} font-medium`}
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-sm text-neutral-400 hover:text-neutral-700"
          >
            Remove
          </button>
        )}
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-neutral-200 px-3 py-6 text-center transition-colors hover:border-neutral-300"
      >
        {room.previewUrl ? (
          <img
            src={room.previewUrl}
            alt={room.label}
            className="mx-auto max-h-28 rounded object-cover"
          />
        ) : (
          <>
            <p className="text-sm font-medium text-neutral-700">Click to browse</p>
            <p className="mt-1 text-sm text-neutral-500">JPEG, PNG, WebP</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
