"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type Blueprint,
  type BlueprintInputData,
  type BlueprintRoom,
  type SavedBlueprintSummary,
  buildApproveRoomPhotos,
  blueprintFromWebhookPayload,
  blueprintToDbRow,
  remappedRoomPhotos,
  roomImageUrls,
} from "@/lib/blueprint";
import { EMPTY_WEBHOOK_RESPONSE_MESSAGE, readResponseJson } from "@/lib/read-response-json";
import { clipFileNameForLabel, expandPhotoLabels } from "@/lib/pipeline/room-label";

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

const HDB_ROOM_OPTIONS = [
  "1 room",
  "2 rooms",
  "3 rooms",
  "4 rooms",
  "5 rooms",
  "Executive",
  "Jumbo",
  "Multi Gen",
] as const;

const COUNT_OPTIONS = ["1", "2", "3", "4", "5"] as const;

const TENURE_PRESETS = ["99 yrs", "999 yrs", "Freehold", "Others"] as const;
type TenurePreset = (typeof TENURE_PRESETS)[number];

function isHdbPropertyType(propertyType: PropertyType): boolean {
  return propertyType === "HDB Flat";
}

function parseTenureInput(saved: string): {
  preset: TenurePreset | "";
  other: string;
} {
  if (!saved) return { preset: "", other: "" };
  if (saved === "99 yrs" || saved === "999 yrs" || saved === "Freehold") {
    return { preset: saved, other: "" };
  }
  return { preset: "Others", other: saved };
}

function resolveTenureValue(preset: TenurePreset | "", other: string): string {
  if (preset === "Others") return other.trim();
  return preset;
}

const INPUT_CLASS =
  "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none transition-colors duration-200 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200";
const CARD_CLASS = "rounded-xl border border-neutral-200 bg-white p-6 shadow-sm";
const SUBMIT_BTN_CLASS =
  "inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8";
const SECONDARY_BTN_CLASS =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition-colors duration-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-60";
const TERTIARY_BTN_CLASS =
  "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors duration-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-60";

type PageState = "form" | "generating_blueprint" | "review" | "clips";

type WizardStep = "form" | "review" | "clips";

const WIZARD_STEPS: { id: WizardStep; label: string }[] = [
  { id: "form", label: "Details" },
  { id: "review", label: "Review" },
  { id: "clips", label: "Clips" },
];

function wizardStep(state: PageState): WizardStep {
  if (state === "review") return "review";
  if (state === "clips") return "clips";
  return "form";
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIndex = WIZARD_STEPS.findIndex((step) => step.id === current);

  return (
    <nav aria-label="Progress" className="mb-6">
      <ol className="flex items-center">
        {WIZARD_STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={step.id}
              className={index === WIZARD_STEPS.length - 1 ? "flex items-center" : "flex flex-1 items-center"}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200 ${
                  isComplete
                    ? "bg-neutral-900 text-white"
                    : isCurrent
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-400"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={`ml-2 text-sm font-medium ${
                  isCurrent
                    ? "text-neutral-900"
                    : isComplete
                      ? "text-neutral-700"
                      : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
              {index < WIZARD_STEPS.length - 1 && (
                <span
                  className={`mx-3 h-px flex-1 transition-colors duration-200 ${
                    isComplete ? "bg-neutral-300" : "bg-neutral-200"
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type PropertyType = "HDB Flat" | "Condo" | "Landed" | "EC";
type RenovationStatus =
  | "Move-in ready"
  | "Fully renovated"
  | "Partially renovated"
  | "Original condition";

type RoomPhoto = {
  id: string;
  file: File | null;
  previewUrl: string | null;
  r2Url: string | null;
  cleanedR2Url?: string | null;
};

type RoomEntry = {
  id: string;
  label: string;
  durationSeconds: number;
  photos: RoomPhoto[];
  useDeclutteredForVideo?: boolean;
};

type MediaFileRow = {
  id: string;
  job_id: string;
  file_name: string;
  r2_url: string;
  status: "uploaded" | "processing" | "done" | "error";
  metadata?: { label?: string } | null;
  error_message?: string | null;
  created_at?: string;
};

const MEDIA_FILE_STATUS_RANK: Record<MediaFileRow["status"], number> = {
  done: 4,
  processing: 3,
  uploaded: 2,
  error: 1,
};

function findMediaFileForLabel(
  rows: MediaFileRow[],
  label: string,
): MediaFileRow | undefined {
  const exactFileName = clipFileNameForLabel(label).toLowerCase();
  const matches = rows.filter((file) => {
    const metaLabel = file.metadata?.label;
    if (metaLabel && metaLabel === label) return true;
    return file.file_name.toLowerCase() === exactFileName;
  });

  if (matches.length === 0) return undefined;

  return [...matches].sort((a, b) => {
    const rankDiff =
      MEDIA_FILE_STATUS_RANK[b.status] - MEDIA_FILE_STATUS_RANK[a.status];
    if (rankDiff !== 0) return rankDiff;
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    return bTime - aTime;
  })[0];
}

type ClipCard = {
  label: string;
  status: "queued" | "generating" | "ready" | "failed";
  videoUrl?: string;
  errorMessage?: string;
  previewUrl?: string | null;
  mediaFileId?: string;
  fileName?: string;
};

function buildClipCardsFromRows(
  rows: MediaFileRow[],
  roomLabels: string[],
): ClipCard[] {
  // Blueprint labels come first; then append any extra labels created by the
  // pipeline for multi-photo rooms (e.g. "Living Room (2)") that aren't
  // already represented in the blueprint list.
  const seen = new Set(roomLabels);
  const extraLabels: string[] = [];
  for (const row of rows) {
    const lbl = row.metadata?.label;
    if (lbl && !seen.has(lbl)) {
      seen.add(lbl);
      extraLabels.push(lbl);
    }
  }

  const labels =
    roomLabels.length > 0
      ? [...roomLabels, ...extraLabels]
      : rows
          .map((row) => row.metadata?.label)
          .filter((label): label is string => Boolean(label));

  return labels.map((label) => {
    const row = findMediaFileForLabel(rows, label);
    if (!row) {
      return { label, status: "queued" as const };
    }

    return {
      label,
      status: mapFileStatus(row.status),
      videoUrl: row.status === "done" ? `${row.r2_url}?v=${row.id}` : undefined,
      errorMessage:
        row.status === "error"
          ? (row.error_message ?? "Generation failed")
          : undefined,
      mediaFileId: row.id,
      fileName: row.file_name,
    };
  });
}

function createEmptyRoomPhoto(): RoomPhoto {
  return {
    id: crypto.randomUUID(),
    file: null,
    previewUrl: null,
    r2Url: null,
    cleanedR2Url: null,
  };
}

function createDefaultRooms(): RoomEntry[] {
  return ["Living Room", "Kitchen", "Master Bedroom"].map((label) => ({
    id: crypto.randomUUID(),
    label,
    durationSeconds: 5,
    photos: [createEmptyRoomPhoto()],
    useDeclutteredForVideo: false,
  }));
}

function roomHasPhotos(room: RoomEntry): boolean {
  return room.photos.some((photo) => photo.file || photo.r2Url);
}

function roomSourceUrls(room: RoomEntry): string[] {
  return room.photos.map((photo) => photo.r2Url).filter((url): url is string => Boolean(url));
}

function roomCleanedUrls(room: RoomEntry): string[] {
  return room.photos
    .map((photo) => photo.cleanedR2Url)
    .filter((url): url is string => Boolean(url));
}

function roomUrlsForVideo(room: RoomEntry): string[] {
  const useCleaned =
    room.useDeclutteredForVideo ?? roomCleanedUrls(room).length > 0;
  if (useCleaned) {
    return room.photos
      .map((photo) => photo.cleanedR2Url ?? photo.r2Url)
      .filter((url): url is string => Boolean(url));
  }
  return roomSourceUrls(room);
}

function roomPrimaryPreviewUrl(room: RoomEntry): string | null {
  const photo = room.photos[0];
  if (!photo) return null;
  return photo.previewUrl ?? photo.cleanedR2Url ?? photo.r2Url;
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

function buildPhotoKey(label: string, file: File, index = 0): string {
  return `room-photos/${Date.now()}-${slugifyLabel(label)}-${index}.${fileExtension(file)}`;
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
  meta: { address: string; uploadedBy: string; inputData?: BlueprintInputData },
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

async function fetchRoomClips(
  blueprintId: string,
  roomLabels: string[],
): Promise<ClipCard[]> {
  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("media_files")
    .select("*")
    .eq("job_id", blueprintId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return buildClipCardsFromRows((rows ?? []) as MediaFileRow[], roomLabels);
}

function clipForLabel(clips: ClipCard[], label: string): ClipCard | undefined {
  return clips.find((clip) => clip.label === label);
}

function enrichClipsWithPhotos(
  clips: ClipCard[],
  blueprint: Blueprint | null,
  roomEntries: RoomEntry[] = [],
): ClipCard[] {
  return clips.map((clip) => ({
    ...clip,
    previewUrl:
      clip.previewUrl ??
      roomDisplayImageUrl(clip.label, roomEntries, blueprint),
  }));
}

async function deleteBlueprint(blueprintId: string): Promise<void> {
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
    .eq("id", blueprintId);

  if (error) {
    throw new Error(`Failed to delete blueprint: ${error.message}`);
  }
}

function formatSavedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function createRoomEntriesFromInput(
  roomPhotos: BlueprintInputData["room_photos"] | undefined,
): RoomEntry[] {
  if (!roomPhotos || roomPhotos.length === 0) return createDefaultRooms();

  return roomPhotos.map((room) => {
    const urls = roomImageUrls(room);
    const cleaned = room.cleaned_image_urls ?? [];
    const photos: RoomPhoto[] =
      urls.length > 0
        ? urls.map((url, index) => ({
            id: crypto.randomUUID(),
            file: null,
            previewUrl: null,
            r2Url: url,
            cleanedR2Url: cleaned[index] ?? null,
          }))
        : [createEmptyRoomPhoto()];

    return {
      id: crypto.randomUUID(),
      label: room.label,
      durationSeconds: room.duration_seconds ?? 5,
      photos,
      useDeclutteredForVideo: cleaned.length > 0,
    };
  });
}

function syncRoomStateFromBlueprint(
  blueprint: Blueprint,
  setRoomEntries: React.Dispatch<React.SetStateAction<RoomEntry[]>>,
  roomPhotoUrlsRef: React.MutableRefObject<Map<string, string>>,
) {
  const remapped = remappedRoomPhotos(
    blueprint.rooms ?? [],
    blueprint.input_data?.room_photos,
  );
  if (remapped.length === 0) return;

  roomPhotoUrlsRef.current = new Map(
    remapped.map((room) => [room.label, roomImageUrls(room)[0] ?? room.r2_url]),
  );
  setRoomEntries(createRoomEntriesFromInput(remapped));
}

function roomDisplayImageUrls(
  label: string,
  roomEntries: RoomEntry[],
  blueprint: Blueprint | null,
): string[] {
  const entry = roomEntries.find((room) => room.label === label);
  if (entry) {
    const fromEntry = entry.photos
      .map((photo) => photo.previewUrl ?? photo.cleanedR2Url ?? photo.r2Url)
      .filter((url): url is string => Boolean(url));
    if (fromEntry.length > 0) return fromEntry;
  }

  const remapped = remappedRoomPhotos(
    blueprint?.rooms ?? [],
    blueprint?.input_data?.room_photos,
  );
  const stored = remapped.find((room) => room.label === label);
  if (!stored) return [];

  return roomImageUrls(stored);
}

function roomDisplayImageUrl(
  label: string,
  roomEntries: RoomEntry[],
  blueprint: Blueprint | null,
): string | null {
  return roomDisplayImageUrls(label, roomEntries, blueprint)[0] ?? null;
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
  const fromPopStateRef = useRef(false);
  const didMountRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the wizard (form → review → clips) in sync with browser history so the
  // browser back button steps back through the flow instead of leaving /generate.
  useEffect(() => {
    window.history.replaceState({ step: "form" }, "");
    const onPopState = (event: PopStateEvent) => {
      const step = (event.state as { step?: WizardStep } | null)?.step ?? "form";
      fromPopStateRef.current = true;
      setPageState(step);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (pageState === "generating_blueprint") return;
    if (fromPopStateRef.current) {
      fromPopStateRef.current = false;
      return;
    }
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const step = wizardStep(pageState);
    window.history.pushState({ step }, "", `?step=${step}`);
  }, [pageState]);

  const [address, setAddress] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [listingType, setListingType] = useState("For Sale");
  const [propertyType, setPropertyType] = useState<PropertyType>("HDB Flat");
  const [rooms, setRooms] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sqft, setSqft] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [pricePsf, setPricePsf] = useState("");
  const [tenurePreset, setTenurePreset] = useState<TenurePreset | "">("");
  const [tenureOther, setTenureOther] = useState("");
  const [condition, setCondition] = useState("");
  const [renovationStatus, setRenovationStatus] =
    useState<RenovationStatus>("Move-in ready");
  const [sellingPoints, setSellingPoints] = useState("");
  const [agentNotes, setAgentNotes] = useState("");
  const [secondsPerRoom, setSecondsPerRoom] = useState(5);

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
  const [creatingUploadJob, setCreatingUploadJob] = useState(false);
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const [declutteringRoomId, setDeclutteringRoomId] = useState<string | null>(null);
  const [declutterErrors, setDeclutterErrors] = useState<Record<string, string>>(
    {},
  );

  const roomPhotoUrlsRef = useRef<Map<string, string>>(new Map());
  const declutterSessionRef = useRef(crypto.randomUUID());

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const blueprintId = params.get("blueprint");
    const view = params.get("view");
    if (blueprintId && view === "clips") {
      void handleViewClips(blueprintId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshRoomClips(blueprintId: string, roomLabels: string[]) {
    const clips = await fetchRoomClips(blueprintId, roomLabels);
    setClipCards(enrichClipsWithPhotos(clips, blueprint, roomEntries));
    return clips;
  }

  async function handleViewClips(blueprintId: string) {
    setError(null);
    setLoadingBlueprintId(blueprintId);
    setUploadJobId(null);

    try {
      const loaded = await fetchBlueprint(blueprintId);
      syncRoomStateFromBlueprint(loaded, setRoomEntries, roomPhotoUrlsRef);
      setBlueprint(loaded);
      const roomLabels = (loaded.rooms ?? []).map((room) => room.label);
      const clips = await fetchRoomClips(blueprintId, roomLabels);
      setClipCards(enrichClipsWithPhotos(clips, loaded, roomEntries));
      setPageState("clips");

      const needsSync = clips.some(
        (clip) =>
          clip.status === "ready" &&
          clip.videoUrl &&
          clip.videoUrl.includes("fal.media"),
      );
      if (needsSync) {
        void fetch("/api/clips/sync-storage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blueprint_id: blueprintId }),
        })
          .then(async (res) => {
            if (!res.ok) return;
            const refreshed = await fetchRoomClips(blueprintId, roomLabels);
            setClipCards(enrichClipsWithPhotos(refreshed, loaded, roomEntries));
          })
          .catch(() => {
            // Non-fatal — fal URLs still play in the browser
          });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clips.");
    } finally {
      setLoadingBlueprintId(null);
    }
  }

  async function handleCreateUploadJob() {
    if (!blueprint) return;

    setCreatingUploadJob(true);
    setError(null);

    try {
      const res = await fetch("/api/clips/create-upload-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint_id: blueprint.blueprint_id }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (body as { error?: string }).error ?? "Failed to create upload job",
        );
      }

      setUploadJobId((body as { job_id?: string }).job_id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create upload job.");
    } finally {
      setCreatingUploadJob(false);
    }
  }

  async function handleLoadSavedBlueprint(blueprintId: string) {
    setError(null);
    setLoadingBlueprintId(blueprintId);

    try {
      const loaded = await fetchBlueprint(blueprintId);
      syncRoomStateFromBlueprint(loaded, setRoomEntries, roomPhotoUrlsRef);
      setBlueprint(loaded);
      const roomLabels = (loaded.rooms ?? []).map((room) => room.label);
      if (roomLabels.length > 0) {
        const clips = await fetchRoomClips(blueprintId, roomLabels);
        setClipCards(enrichClipsWithPhotos(clips, loaded, roomEntries));
        // If clips have already been started, land on the clips view so the
        // user can see status and retry failed clips directly.
        setPageState(clips.length > 0 ? "clips" : "review");
      } else {
        setClipCards([]);
        setPageState("review");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blueprint.");
    } finally {
      setLoadingBlueprintId(null);
    }
  }

  async function handleEditDraft(blueprintId: string) {
    setError(null);
    setLoadingBlueprintId(blueprintId);

    try {
      const loaded = await fetchBlueprint(blueprintId);
      const input = loaded.input_data;
      if (!input) {
        throw new Error(
          "This draft was created before edit support. Please generate a new draft.",
        );
      }

      setAddress(input.address ?? "");
      setListingTitle(input.listing_title ?? "");
      setListingType(input.listing_type ?? "For Sale");
      setPropertyType((input.property_type as PropertyType) ?? "HDB Flat");
      setRooms(input.rooms ?? "");
      setBedrooms(input.bedrooms ?? "");
      setBathrooms(input.bathrooms ?? "");
      setSqft(input.sqft ?? "");
      setAreaSqm(input.area_sqm ?? "");
      setPriceRange(input.price_range ?? "");
      setPricePsf(input.price_psf ?? "");
      const parsedTenure = parseTenureInput(input.tenure ?? "");
      setTenurePreset(parsedTenure.preset);
      setTenureOther(parsedTenure.other);
      setCondition(input.condition ?? "");
      setRenovationStatus(
        (input.renovation_status as RenovationStatus) ?? "Move-in ready",
      );
      setSellingPoints(input.selling_points ?? "");
      setAgentNotes(input.agent_notes ?? "");
      setSecondsPerRoom(input.seconds_per_room ?? 5);

      const remappedPhotos = remappedRoomPhotos(
        loaded.rooms ?? [],
        input.room_photos,
      );
      setRoomEntries(createRoomEntriesFromInput(remappedPhotos));
      roomPhotoUrlsRef.current = new Map(
        remappedPhotos.map((room) => [
          room.label,
          roomImageUrls(room)[0] ?? room.r2_url,
        ]),
      );

      setBlueprint(loaded);
      setPageState("form");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load draft for edit.");
    } finally {
      setLoadingBlueprintId(null);
    }
  }

  async function handleDeleteBlueprint(blueprintId: string, propertyName: string) {
    const confirmed = window.confirm(
      `Delete "${propertyName}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setError(null);
    setDeletingBlueprintId(blueprintId);

    try {
      await deleteBlueprint(blueprintId);

      if (blueprint?.blueprint_id === blueprintId) {
        setBlueprint(null);
        setPageState("form");
      }

      await refreshSavedBlueprints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete blueprint.");
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
        durationSeconds: 5,
        photos: [createEmptyRoomPhoto()],
        useDeclutteredForVideo: false,
      },
    ]);
  }

  function removeRoom(id: string) {
    setRoomEntries((prev) => prev.filter((room) => room.id !== id));
  }

  function addRoomPhotos(roomId: string, files: File[]) {
    if (files.length === 0) return;

    setRoomEntries((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;

        const newPhotos = files.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          r2Url: null,
          cleanedR2Url: null,
        }));

        const existing = room.photos.filter(
          (photo) => photo.file || photo.previewUrl || photo.r2Url,
        );

        return {
          ...room,
          photos: [...existing, ...newPhotos],
        };
      }),
    );
  }

  function removeRoomPhoto(roomId: string, photoId: string) {
    setRoomEntries((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;

        const nextPhotos = room.photos.filter((photo) => photo.id !== photoId);
        return {
          ...room,
          photos: nextPhotos.length > 0 ? nextPhotos : [createEmptyRoomPhoto()],
        };
      }),
    );
  }

  async function ensureRoomPhotosUploaded(room: RoomEntry): Promise<RoomEntry> {
    const uploadedPhotos: RoomPhoto[] = [];

    for (let index = 0; index < room.photos.length; index += 1) {
      const photo = room.photos[index]!;
      if (!photo.file) {
        uploadedPhotos.push(photo);
        continue;
      }

      const key = buildPhotoKey(room.label, photo.file, index);
      const r2Url = await uploadRoomPhoto(photo.file, key);
      uploadedPhotos.push({ ...photo, r2Url, file: null });
    }

    const urls = uploadedPhotos
      .map((photo) => photo.r2Url)
      .filter((url): url is string => Boolean(url));
    if (urls[0]) {
      roomPhotoUrlsRef.current.set(room.label, urls[0]);
    }

    return { ...room, photos: uploadedPhotos };
  }

  async function handleDeclutterRoom(roomId: string) {
    const room = roomEntries.find((entry) => entry.id === roomId);
    if (!room) return;

    setDeclutteringRoomId(roomId);
    setError(null);
    setDeclutterErrors((prev) => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });

    try {
      const uploadedRoom = await ensureRoomPhotosUploaded(room);
      const photosWithSource = uploadedRoom.photos.filter((photo) => photo.r2Url);
      if (photosWithSource.length === 0) {
        throw new Error("Upload room photos before decluttering.");
      }

      const blueprintId = blueprint?.blueprint_id ?? null;
      const sessionId = blueprintId ?? declutterSessionRef.current;
      const cleanedPhotos: RoomPhoto[] = [];

      for (let index = 0; index < uploadedRoom.photos.length; index += 1) {
        const photo = uploadedRoom.photos[index]!;
        if (!photo.r2Url) {
          cleanedPhotos.push(photo);
          continue;
        }

        const res = await fetch("/api/images/declutter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_url: photo.r2Url,
            room_label: uploadedRoom.label,
            blueprint_id: sessionId,
            index,
          }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            (body as { error?: string }).error ?? "Declutter failed",
          );
        }

        cleanedPhotos.push({
          ...photo,
          cleanedR2Url: (body as { cleaned_r2_url?: string }).cleaned_r2_url ?? null,
        });
      }

      setRoomEntries((prev) =>
        prev.map((entry) =>
          entry.id === roomId
            ? {
                ...uploadedRoom,
                photos: cleanedPhotos,
                useDeclutteredForVideo: true,
              }
            : entry,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Declutter failed.";
      setError(message);
      setDeclutterErrors((prev) => ({ ...prev, [roomId]: message }));
    } finally {
      setDeclutteringRoomId(null);
    }
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

    const roomsWithPhotos = roomEntries.filter(roomHasPhotos);
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
        if (!roomHasPhotos(room)) {
          uploadedRooms.push(room);
          continue;
        }
        uploadedRooms.push(await ensureRoomPhotosUploaded(room));
      }

      setRoomEntries(uploadedRooms);

      const roomPhotos = uploadedRooms
        .filter(roomHasPhotos)
        .map((room) => {
          const sourceUrls = roomSourceUrls(room);
          const cleanedUrls = roomCleanedUrls(room);
          const videoUrls = roomUrlsForVideo(room);

          return {
            label: room.label,
            r2_url: videoUrls[0] ?? sourceUrls[0]!,
            image_urls: videoUrls,
            ...(cleanedUrls.length > 0
              ? { cleaned_image_urls: cleanedUrls }
              : {}),
            duration_seconds: room.durationSeconds,
          };
        });

      const webhookRes = await fetch(WEBHOOK_GENERATE_BLUEPRINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          listing_title: requiredField(listingTitle, "Not specified"),
          listing_type: requiredField(listingType, "For Sale"),
          property_type: propertyType,
          rooms: requiredField(rooms, "Not specified"),
          bedrooms: requiredField(bedrooms, "Not specified"),
          bathrooms: requiredField(bathrooms, "Not specified"),
          sqft: requiredField(sqft, "Not specified"),
          area_sqm: requiredField(areaSqm, "Not specified"),
          price_range: requiredField(priceRange, "Not specified"),
          price_psf: requiredField(pricePsf, "Not specified"),
          tenure: requiredField(
            resolveTenureValue(tenurePreset, tenureOther),
            "Not specified",
          ),
          condition: requiredField(condition, "Not specified"),
          selling_points: sellingPoints.trim(),
          renovation_status: renovationStatus,
          agent_notes: requiredField(agentNotes, "None"),
          seconds_per_room: secondsPerRoom,
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

      const remappedPhotos = remappedRoomPhotos(
        fullBlueprint.rooms ?? [],
        roomPhotos,
      );
      const inputData: BlueprintInputData = {
        address: address.trim(),
        listing_title: listingTitle.trim(),
        listing_type: listingType,
        property_type: propertyType,
        rooms: rooms.trim(),
        bedrooms: bedrooms.trim(),
        bathrooms: bathrooms.trim(),
        sqft: sqft.trim(),
        area_sqm: areaSqm.trim(),
        price_range: priceRange.trim(),
        price_psf: pricePsf.trim(),
        tenure: resolveTenureValue(tenurePreset, tenureOther).trim(),
        condition: condition.trim(),
        renovation_status: renovationStatus,
        selling_points: sellingPoints.trim(),
        agent_notes: agentNotes.trim(),
        seconds_per_room: secondsPerRoom,
        room_photos: remappedPhotos,
      };

      await saveBlueprintToDatabase(fullBlueprint, {
        address: address.trim(),
        uploadedBy: user.id,
        inputData,
      });

      await refreshSavedBlueprints();

      syncRoomStateFromBlueprint(
        { ...fullBlueprint, input_data: inputData },
        setRoomEntries,
        roomPhotoUrlsRef,
      );
      setBlueprint({ ...fullBlueprint, input_data: inputData });
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
      image_urls?: string[];
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

    setClipCards((prev) => {
      return roomPhotos.flatMap((room) => {
        const imageCount = Math.max(
          (room.image_urls?.filter((u) => u.trim() !== "") ?? [room.r2_url].filter(Boolean)).length,
          1,
        );
        const subLabels = expandPhotoLabels(room.label, imageCount);
        const baseEntry = roomEntries.find((entry) => entry.label === room.label);

        return subLabels.map((label, i) => {
          const existing = prev.find((clip) => clip.label === label);
          return {
            label,
            status: "queued" as const,
            fileName: clipFileNameForLabel(label),
            previewUrl:
              existing?.previewUrl ??
              (i === 0
                ? roomPrimaryPreviewUrl(
                    baseEntry ?? {
                      id: "",
                      label: room.label,
                      durationSeconds: 5,
                      photos: [],
                    },
                  )
                : null),
          };
        });
      });
    });
    setPageState("clips");
  }

  function buildRoomPhotos(rooms: BlueprintRoom[], labels?: string[]) {
    if (!blueprint) return [];

    return buildApproveRoomPhotos(blueprint, {
      ref: roomPhotoUrlsRef.current,
      entries: roomEntries.map((room) => ({
        label: room.label,
        r2Url: roomUrlsForVideo(room)[0] ?? roomSourceUrls(room)[0] ?? null,
        imageUrls: roomUrlsForVideo(room),
        durationSeconds: room.durationSeconds,
      })),
      defaultDuration: secondsPerRoom,
      labels,
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

  /**
   * Map clip labels (including sub-labels like "Living Room (2)") back to
   * individual room photo entries suitable for re-submission to the API.
   * Sub-labels resolve to the base blueprint room and the specific photo URL
   * at that photo's index.
   */
  function resolveRetryRoomPhotos(labels: string[]): Array<{
    label: string;
    r2_url: string;
    image_urls: string[];
    higgsfield_prompt: string;
    duration_seconds: number;
  }> {
    if (!blueprint) return [];

    return labels.flatMap((label) => {
      const match = label.match(/^(.+)\s+\((\d+)\)$/);
      const baseLabel = match ? match[1] : label;
      const photoIndex = match ? parseInt(match[2]) - 1 : 0;

      const room = (blueprint.rooms ?? []).find((r) => r.label === baseLabel);
      if (!room) return [];

      const entry = roomEntries.find((e) => e.label === baseLabel);
      const allUrls = entry
        ? roomUrlsForVideo(entry)
        : roomImageUrls({ r2_url: room.r2_url, image_urls: room.image_urls });

      const specificUrl = allUrls[photoIndex] ?? allUrls[0] ?? room.r2_url ?? "";
      if (!specificUrl) return [];

      return [
        {
          label,
          r2_url: specificUrl,
          image_urls: [specificUrl],
          higgsfield_prompt: room.higgsfield_prompt ?? "",
          duration_seconds: room.duration_seconds ?? secondsPerRoom ?? 6,
        },
      ];
    });
  }

  async function handleRetryClip(label: string) {
    if (!blueprint || approving) return;

    setApproving(true);
    setError(null);

    try {
      const roomPhotos = resolveRetryRoomPhotos([label]);
      if (roomPhotos.length === 0 || !roomPhotos[0].r2_url) {
        throw new Error(
          "Cannot retry — photo URL is missing. Try reloading the blueprint.",
        );
      }
      await startClipGeneration(roomPhotos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed.");
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
      const roomPhotos = resolveRetryRoomPhotos(failedLabels);
      if (roomPhotos.length === 0) {
        throw new Error(
          "Cannot retry — room photos are missing. Try reloading the blueprint.",
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

    const roomLabels = blueprint?.rooms?.map((room) => room.label) ?? [];
    if (roomLabels.length === 0) return;

    async function pollMediaFiles() {
      try {
        await fetch("/api/clips/advance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blueprint_id: blueprintId }),
        });
        const clips = await fetchRoomClips(blueprintId!, roomLabels);
        setClipCards(enrichClipsWithPhotos(clips, blueprint, roomEntries));
      } catch {
        // Polling errors are non-fatal; next tick will retry
      }
    }

    pollMediaFiles();
    const interval = setInterval(pollMediaFiles, 15_000);
    return () => clearInterval(interval);
  }, [pageState, blueprintId, blueprint?.rooms, roomEntries]);

  const clipsDone = clipCards.filter((c) => c.status === "ready").length;
  const clipsFailed = clipCards.filter((c) => c.status === "failed").length;
  const clipsTotal = clipCards.length;
  const allClipsReady =
    clipsTotal > 0 && clipCards.every((c) => c.status === "ready");

  if (pageState === "generating_blueprint") {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-24">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 motion-reduce:animate-none"
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
        <StepIndicator current="review" />
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Review Blueprint</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Check the generated script before creating room clips.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.history.back()}
            className={SECONDARY_BTN_CLASS}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back
          </button>
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
                const photoUrls = roomDisplayImageUrls(
                  room.label,
                  roomEntries,
                  blueprint,
                );
                const cleanedUrls =
                  remappedRoomPhotos(
                    blueprint.rooms ?? [],
                    blueprint.input_data?.room_photos,
                  ).find((photo) => photo.label === room.label)
                    ?.cleaned_image_urls ?? [];
                const clip = clipForLabel(clipCards, room.label);

                return (
                  <div
                    key={room.label}
                    className="rounded-lg border border-neutral-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {room.label}
                        </p>
                        {room.duration_seconds != null && (
                          <p className="text-sm text-neutral-500">
                            {room.duration_seconds}s script
                          </p>
                        )}
                      </div>
                      {clip && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-sm ${statusBadgeClass(clip.status)}`}
                        >
                          {statusLabel(clip.status)}
                        </span>
                      )}
                    </div>

                    <RoomBlueprintMedia
                      photoUrls={photoUrls}
                      cleanedUrls={cleanedUrls}
                      clip={clip}
                    />

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
                          Seedance prompt
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
              {allClipsReady ? "Room Clips" : "Generate Clips"}
            </h2>
            {allClipsReady ? (
              <>
                <p className="mb-4 text-sm text-neutral-600">
                  All room clips are ready. Download below or send them to the
                  upload pipeline.
                </p>
                <button
                  type="button"
                  onClick={handleCreateUploadJob}
                  disabled={creatingUploadJob}
                  className={`${SUBMIT_BTN_CLASS} mb-3`}
                >
                  {creatingUploadJob
                    ? "Creating upload job…"
                    : "Send clips to upload pipeline →"}
                </button>
                <button
                  type="button"
                  onClick={() => setPageState("clips")}
                  className="text-sm font-medium text-neutral-700 underline hover:no-underline"
                >
                  Open clips view
                </button>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-neutral-600">
                  Approve this blueprint to generate room clips with Seedance 1.5.
                  Each photo produces one clip.
                </p>
                <button
                  type="button"
                  onClick={handleApproveBlueprint}
                  disabled={approving}
                  className={SUBMIT_BTN_CLASS}
                >
                  {approving ? "Starting…" : "Approve & generate clips →"}
                </button>
              </>
            )}
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
        <StepIndicator current="clips" />
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              {allClipsReady ? "Room Clips" : "Generating Clips"}
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              {allClipsReady
                ? "Preview, download, or send clips into the upload pipeline."
                : "Room clips are being created from your blueprint."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPageState("review")}
            className={SECONDARY_BTN_CLASS}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {allClipsReady && (
          <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            All clips ready. You can download them below or continue to the upload
            pipeline for transcription.
          </div>
        )}

        {uploadJobId && (
          <div className="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Upload job created. Clips were sent to the Videos pipeline (job{" "}
            <span className="font-mono">{uploadJobId.slice(0, 8)}…</span>).{" "}
            <a href="/upload" className="font-medium underline hover:no-underline">
              Open upload page
            </a>
          </div>
        )}

        {clipsFailed > 0 && (
          <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {clipsFailed} clip{clipsFailed === 1 ? "" : "s"} failed — usually a
            temporary timeout. Wait a minute, then retry, or open Clips from your
            saved blueprint if a later run succeeded.
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
                  <>
                    {clip.previewUrl && (
                      <img
                        src={clip.previewUrl}
                        alt={`${clip.label} source`}
                        className="mb-3 w-full rounded-lg object-cover max-h-28"
                      />
                    )}
                    <video
                      src={clip.videoUrl}
                      controls
                      muted
                      playsInline
                      className="w-full rounded-lg"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {clip.mediaFileId && (
                        <a
                          href={`/api/clips/download?id=${clip.mediaFileId}`}
                          className={TERTIARY_BTN_CLASS}
                        >
                          Download
                        </a>
                      )}
                      <a
                        href={clip.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={TERTIARY_BTN_CLASS}
                      >
                        Open
                      </a>
                    </div>
                  </>
                )}

                {clip.status === "failed" && (
                  <div className="space-y-2">
                    {clip.errorMessage && (
                      <p className="text-sm text-red-600">{clip.errorMessage}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRetryClip(clip.label)}
                      disabled={approving}
                      className={TERTIARY_BTN_CLASS}
                    >
                      {approving ? "Retrying…" : "Retry this clip"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {allClipsReady && (
            <button
              type="button"
              onClick={handleCreateUploadJob}
              disabled={creatingUploadJob}
              className={`${SUBMIT_BTN_CLASS} mt-6`}
            >
              {creatingUploadJob
                ? "Creating upload job…"
                : "Send clips to upload pipeline →"}
            </button>
          )}

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
      <StepIndicator current="form" />
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
                  className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors duration-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-60"
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
                    onClick={() => handleEditDraft(item.id)}
                    disabled={
                      deletingBlueprintId === item.id || loadingBlueprintId === item.id
                    }
                    className={SECONDARY_BTN_CLASS}
                    aria-label={`Edit draft for ${item.property_name}`}
                  >
                    Edit
                  </button>
                )}
                {item.status === "ready" && (
                  <button
                    type="button"
                    onClick={() => handleViewClips(item.id)}
                    disabled={
                      deletingBlueprintId === item.id || loadingBlueprintId === item.id
                    }
                    className={SECONDARY_BTN_CLASS}
                  >
                    Clips
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteBlueprint(item.id, item.property_name)}
                  disabled={deletingBlueprintId === item.id}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 px-3 py-2 text-sm text-red-600 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Delete blueprint for ${item.property_name}`}
                >
                  {deletingBlueprintId === item.id ? "Deleting…" : "Delete"}
                </button>
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
                  Listing Title
                </label>
                <input
                  type="text"
                  value={listingTitle}
                  onChange={(e) => setListingTitle(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. Park Green"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Listing Type
                </label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="For Sale">For Sale</option>
                  <option value="For Rent">For Rent</option>
                </select>
              </div>
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
                  onChange={(e) => {
                    const next = e.target.value as PropertyType;
                    setPropertyType(next);
                    if (
                      isHdbPropertyType(next) &&
                      rooms &&
                      !HDB_ROOM_OPTIONS.includes(
                        rooms as (typeof HDB_ROOM_OPTIONS)[number],
                      )
                    ) {
                      setRooms("");
                    }
                  }}
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
                {isHdbPropertyType(propertyType) ? (
                  <select
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="">Select HDB room type</option>
                    {HDB_ROOM_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder='e.g. "4"'
                  />
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Bedrooms (Private)
                </label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Select</option>
                  {COUNT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Bathrooms
                </label>
                <select
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Select</option>
                  {COUNT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
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
                  Area sqm
                </label>
                <input
                  type="text"
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. 111.02"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Price psf
                </label>
                <input
                  type="text"
                  value={pricePsf}
                  onChange={(e) => setPricePsf(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. $1,129.71"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Tenure
                </label>
                <select
                  value={tenurePreset}
                  onChange={(e) =>
                    setTenurePreset(e.target.value as TenurePreset | "")
                  }
                  className={INPUT_CLASS}
                >
                  <option value="">Select</option>
                  {TENURE_PRESETS.map((option) => (
                    <option key={option} value={option}>
                      {option === "Others" ? "Others:" : option}
                    </option>
                  ))}
                </select>
                {tenurePreset === "Others" && (
                  <input
                    type="text"
                    value={tenureOther}
                    onChange={(e) => setTenureOther(e.target.value)}
                    className={`${INPUT_CLASS} mt-2`}
                    placeholder="Specify tenure"
                  />
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Condition
                </label>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. Partial Furnishing"
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
                <option value={5}>5s</option>
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
              className={TERTIARY_BTN_CLASS}
            >
              + Add room
            </button>
          </div>
          <p className="mb-4 text-sm text-neutral-500">
            Add one or more photos per room. Each room becomes an animated B-roll clip.
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
                decluttering={declutteringRoomId === room.id}
                declutterError={declutterErrors[room.id] ?? null}
                onLabelChange={(label) => updateRoom(room.id, { label })}
                onDurationChange={(durationSeconds) =>
                  updateRoom(room.id, { durationSeconds })
                }
                onAddPhotos={(files) => addRoomPhotos(room.id, files)}
                onRemovePhoto={(photoId) => removeRoomPhoto(room.id, photoId)}
                onUseDeclutteredChange={(useDeclutteredForVideo) =>
                  updateRoom(room.id, { useDeclutteredForVideo })
                }
                onDeclutter={() => void handleDeclutterRoom(room.id)}
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

function RoomBlueprintMedia({
  photoUrls,
  cleanedUrls = [],
  clip,
}: {
  photoUrls: string[];
  cleanedUrls?: string[];
  clip?: ClipCard;
}) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Source photos
        </p>
        {photoUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {photoUrls.map((url, index) => (
              <img
                key={`${url}-${index}`}
                src={url}
                alt={`Room source ${index + 1}`}
                className="max-h-28 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-neutral-200 text-sm text-neutral-400">
            No photos saved
          </div>
        )}
        {cleanedUrls.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Decluttered photos
            </p>
            <div className="grid grid-cols-2 gap-2">
              {cleanedUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="space-y-1">
                  <img
                    src={url}
                    alt={`Decluttered ${index + 1}`}
                    className="max-h-28 w-full rounded-lg object-cover"
                  />
                  <a
                    href={url}
                    download
                    className="inline-block text-sm text-neutral-600 underline hover:no-underline"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Generated clip
        </p>
        {clip?.status === "ready" && clip.videoUrl ? (
          <>
            <video
              src={clip.videoUrl}
              controls
              muted
              playsInline
              className="max-h-44 w-full rounded-lg"
            />
            {clip.mediaFileId && (
              <a
                href={`/api/clips/download?id=${clip.mediaFileId}`}
                className="mt-2 inline-block rounded-lg border border-neutral-200 px-2.5 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Download
              </a>
            )}
          </>
        ) : clip?.status === "generating" || clip?.status === "queued" ? (
          <div className="flex h-28 items-center justify-center rounded-lg bg-neutral-50 text-sm text-neutral-500">
            Generating…
          </div>
        ) : clip?.status === "failed" ? (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {clip.errorMessage ?? "Generation failed"}
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-neutral-200 text-sm text-neutral-400">
            Not generated yet
          </div>
        )}
      </div>
    </div>
  );
}

function RoomPhotoCard({
  room,
  decluttering,
  declutterError,
  onLabelChange,
  onDurationChange,
  onAddPhotos,
  onRemovePhoto,
  onUseDeclutteredChange,
  onDeclutter,
  onRemove,
  canRemove,
}: {
  room: RoomEntry;
  decluttering: boolean;
  declutterError: string | null;
  onLabelChange: (label: string) => void;
  onDurationChange: (durationSeconds: number) => void;
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (photoId: string) => void;
  onUseDeclutteredChange: (use: boolean) => void;
  onDeclutter: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasUploadedPhotos = room.photos.some((photo) => photo.r2Url || photo.file);
  const hasCleanedPhotos = room.photos.some((photo) => photo.cleanedR2Url);
  const useDecluttered =
    room.useDeclutteredForVideo ?? (hasCleanedPhotos && hasUploadedPhotos);

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="w-full space-y-2">
          <input
            type="text"
            list="room-suggestions"
            value={room.label}
            onChange={(e) => onLabelChange(e.target.value)}
            className={`${INPUT_CLASS} font-medium`}
          />
          <select
            value={room.durationSeconds}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className={INPUT_CLASS}
          >
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={15}>15s</option>
            <option value={20}>20s</option>
            <option value={25}>25s</option>
          </select>
        </div>
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

      <div className="mb-3 grid grid-cols-2 gap-2">
        {room.photos
          .filter((photo) => photo.previewUrl || photo.r2Url)
          .map((photo, index) => (
            <div key={photo.id} className="relative">
              <img
                src={photo.previewUrl ?? photo.r2Url!}
                alt={`${room.label} ${index + 1}`}
                className="h-24 w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => onRemovePhoto(photo.id)}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
              >
                ×
              </button>
            </div>
          ))}
      </div>

      {hasCleanedPhotos && (
        <div className="mb-3">
          <p className="mb-1.5 text-sm font-medium text-neutral-700">
            Decluttered
          </p>
          <div className="grid grid-cols-2 gap-2">
            {room.photos
              .filter((photo) => photo.cleanedR2Url)
              .map((photo, index) => (
                <div key={`cleaned-${photo.id}`} className="space-y-1">
                  <img
                    src={photo.cleanedR2Url!}
                    alt={`${room.label} cleaned ${index + 1}`}
                    className="h-24 w-full rounded-lg object-cover ring-2 ring-green-200"
                  />
                  <a
                    href={photo.cleanedR2Url!}
                    download
                    className="inline-block text-sm text-neutral-600 underline hover:no-underline"
                  >
                    Download
                  </a>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={TERTIARY_BTN_CLASS}
        >
          + Add photo
        </button>
        <button
          type="button"
          onClick={onDeclutter}
          disabled={decluttering || !hasUploadedPhotos}
          className={TERTIARY_BTN_CLASS}
        >
          {decluttering ? "Decluttering…" : "Declutter photos"}
        </button>
      </div>

      {declutterError && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {declutterError}
        </p>
      )}

      {hasCleanedPhotos && (
        <label className="mb-3 flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={useDecluttered}
            onChange={(e) => onUseDeclutteredChange(e.target.checked)}
            className="rounded border-neutral-300"
          />
          Use decluttered photos for video
        </label>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-neutral-200 px-3 py-4 text-center transition-colors hover:border-neutral-300"
      >
        <p className="text-sm font-medium text-neutral-700">
          {hasUploadedPhotos ? "Add more photos" : "Click to browse"}
        </p>
        <p className="mt-1 text-sm text-neutral-500">JPEG, PNG, WebP</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) onAddPhotos(files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
