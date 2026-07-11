"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackagedArticle, TopicCandidate } from "@/lib/pipeline/types";
import { PUBLISH_THRESHOLD } from "@/lib/pipeline/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type PipelineStep = "brief" | "draft" | "compliance" | "package";
type StepState = "idle" | "running" | "done" | "error";

interface PipelineStatus {
  brief: StepState;
  draft: StepState;
  compliance: StepState;
  package: StepState;
}

const PIPELINE_STEPS: { id: PipelineStep; label: string; description: string }[] = [
  { id: "brief", label: "Brief", description: "SEO title, H2 questions, author" },
  { id: "draft", label: "Draft", description: "Full article via Claude" },
  { id: "compliance", label: "Compliance", description: "CEA gate + structure check" },
  { id: "package", label: "Package", description: "Audit scores + meta" },
];

const VALID_TOPICS = [
  { value: "upgraders", label: "Sell / Upgrade" },
  { value: "buying_first", label: "Buy Tips" },
  { value: "condo_tips", label: "Insights" },
] as const;

type PlaybookTopic = "upgraders" | "buying_first" | "condo_tips";

const DEMAND_BADGE: Record<string, string> = {
  high: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  low: "bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200",
};

const SCORE_BADGE = (s: number) =>
  s >= 8
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : s >= 6
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-red-50 text-red-600 ring-red-200";

function qualityVerdict(overall: number): string {
  if (overall >= 8) return "Excellent — ready to publish";
  if (overall >= 6) return "Good — minor polish recommended";
  return "Needs work — review before publishing";
}

function QualityScorePanel({ result }: { result: PackagedArticle }) {
  const llm = result.audit.llm;

  if (llm) {
    const overall = (llm.seo + llm.geo + llm.aeo) / 3;
    const verdict = qualityVerdict(overall);
    const verdictColor =
      overall >= 8 ? "text-emerald-700" : overall >= 6 ? "text-amber-700" : "text-red-600";

    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Worth posting?
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div>
            <p className={cn("font-display text-4xl font-bold tabular-nums", verdictColor)}>
              {overall.toFixed(1)}
              <span className="text-xl font-normal text-neutral-400"> / 10</span>
            </p>
            <p className={cn("mt-1 text-sm font-semibold", verdictColor)}>{verdict}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { label: "SEO", score: llm.seo },
                { label: "GEO", score: llm.geo },
                { label: "AEO", score: llm.aeo },
              ] as const
            ).map(({ label, score }) => (
              <span
                key={label}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ring-1",
                  SCORE_BADGE(score),
                )}
              >
                {label} {score}/10
              </span>
            ))}
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-bold ring-1",
                result.compliance.passed
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-red-50 text-red-600 ring-red-200",
              )}
            >
              Compliance {result.compliance.passed ? "PASS" : "FAIL"}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          SEO = search rankings · GEO = AI/search clarity for Singapore · AEO = answer engines
          (Quick Answer, FAQ). Scored by Claude against a strict rubric — 8+ is genuinely strong.
        </p>
      </div>
    );
  }

  // Heuristic fallback when LLM audit did not run
  const overall = result.audit.overall / 10;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
        Worth posting? (estimated)
      </p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-amber-800">
        {(result.audit.overall / 10).toFixed(1)}
        <span className="text-lg font-normal text-amber-600"> / 10</span>
      </p>
      <p className="mt-1 text-sm font-semibold text-amber-800">{qualityVerdict(overall)}</p>
      <p className="mt-2 text-xs text-amber-700">
        LLM audit unavailable — showing heuristic scores only. Regenerate if you need SEO/GEO/AEO
        breakdown.
      </p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepBadge({ state, label }: { state: StepState; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {state === "idle" && <Circle className="h-3.5 w-3.5 text-neutral-300" />}
      {state === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-600" />}
      {state === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
      {state === "error" && <TriangleAlert className="h-3.5 w-3.5 text-red-500" />}
      <span
        className={cn(
          "text-xs font-medium",
          state === "idle" && "text-neutral-400",
          state === "running" && "text-primary-700",
          state === "done" && "text-emerald-700",
          state === "error" && "text-red-600",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function AuditBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">{label}</span>
        <span className={cn("text-xs font-bold tabular-nums", color)}>{score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-400" : "bg-red-400",
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function GenerateErrorBanner({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <div className="flex items-start gap-2">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-red-700">Generation failed</p>
          <p className="text-xs text-red-600">{message}</p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={retrying} className="shrink-0">
        {retrying ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Retrying…
          </>
        ) : (
          <>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ArticleGenerationTab() {
  // Topic list
  const [topics, setTopics] = useState<TopicCandidate[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<TopicCandidate | null>(null);
  const [autoSelectedTopic, setAutoSelectedTopic] = useState<TopicCandidate | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [showTopicList, setShowTopicList] = useState(true);

  // Pipeline state
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>({
    brief: "idle",
    draft: "idle",
    compliance: "idle",
    package: "idle",
  });
  const [generating, setGenerating] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [result, setResult] = useState<PackagedArticle | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Editable article fields
  const [editedArticle, setEditedArticle] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedMeta, setEditedMeta] = useState("");
  const [playbookTopic, setPlaybookTopic] = useState<PlaybookTopic>("upgraders");

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ slug: string; id: string } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [auditOverride, setAuditOverride] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const lastGenerateRef = useRef<{ topic: TopicCandidate | null; auto: boolean }>({
    topic: null,
    auto: false,
  });

  const loadTopics = useCallback(async () => {
    setLoadingTopics(true);
    try {
      const res = await fetch("/api/admin/topics");
      if (!res.ok) throw new Error("Failed to load topics");
      const data: unknown = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid topics response");
      setTopics(data as TopicCandidate[]);
    } catch {
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  }, []);

  // ── Load topics on mount ────────────────────────────────────────────────────
  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  // ── Generate article ────────────────────────────────────────────────────────
  const runGenerate = useCallback(async (topic: TopicCandidate | null, auto = false) => {
    lastGenerateRef.current = { topic, auto };
    setGenerateError(null);
    setResult(null);
    setPublishResult(null);
    setPublishError(null);
    setAutoSelectedTopic(null);
    setAutoGenerating(auto);
    setGenerating(true);
    setPipelineStatus({
      brief: "running",
      draft: "running",
      compliance: "running",
      package: "running",
    });

    setTimeout(() => pipelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auto ? { auto: true } : { topic }),
      });

      const data = (await res.json()) as PackagedArticle & {
        selectedTopic?: TopicCandidate;
        detail?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Generation failed");
      }

      if (!data.draft?.article?.trim()) {
        throw new Error(
          "Generation completed but the draft body was empty. Check server logs and ANTHROPIC_API_KEY.",
        );
      }

      setPipelineStatus({ brief: "done", draft: "done", compliance: "done", package: "done" });
      setShowTopicList(false);

      if (data.selectedTopic) {
        setAutoSelectedTopic(data.selectedTopic);
        setSelectedTopic(data.selectedTopic);
      } else if (topic) {
        setSelectedTopic(topic);
      }

      setResult(data);
      setEditedArticle(data.draft.article);
      setEditedTitle(data.draft.title);
      setEditedDescription(data.draft.description);
      setEditedMeta(data.draft.metaDescription);

      const cat = data.draft.brief.topic.category;
      if (cat === "buying_first" || cat === "hdb_bto" || cat === "hdb_resale") {
        setPlaybookTopic("buying_first");
      } else if (cat === "condo_resale" || cat === "condo_new_launch" || cat === "ec" || cat === "investment") {
        setPlaybookTopic("condo_tips");
      } else {
        setPlaybookTopic("upgraders");
      }

      void loadTopics();
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setGenerateError(msg);
      setShowTopicList(true);
      setPipelineStatus({ brief: "idle", draft: "idle", compliance: "idle", package: "idle" });
    } finally {
      setGenerating(false);
      setAutoGenerating(false);
    }
  }, [loadTopics]);

  const handleGenerate = useCallback(() => {
    if (!selectedTopic) return;
    void runGenerate(selectedTopic, false);
  }, [selectedTopic, runGenerate]);

  const handleAutoGenerate = useCallback(() => {
    void runGenerate(null, true);
  }, [runGenerate]);

  const handleRetryGenerate = useCallback(() => {
    const { topic, auto } = lastGenerateRef.current;
    void runGenerate(topic, auto);
  }, [runGenerate]);

  // ── Add custom topic ────────────────────────────────────────────────────────
  const handleCustomTopic = useCallback(async () => {
    const title = customTitle.trim();
    if (!title) return;
    const res = await fetch("/api/admin/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const topic: TopicCandidate = await res.json();
      setTopics((prev) => [topic, ...prev]);
      setSelectedTopic(topic);
      setCustomTitle("");
    }
  }, [customTitle]);

  // ── Publish ─────────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!result) return;

    setPublishError(null);
    setPublishing(true);

    const patched: PackagedArticle = {
      ...result,
      draft: {
        ...result.draft,
        article: editedArticle,
        title: editedTitle,
        description: editedDescription,
        metaDescription: editedMeta,
      },
    };

    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article: patched, topic: playbookTopic }),
      });
      if (!res.ok) {
        const err = (await res.json()) as {
          detail?: string;
          error?: string;
          issues?: string[];
        };
        const issueList = err.issues?.length ? `: ${err.issues.join("; ")}` : "";
        throw new Error(err.detail || err.error || `Publish failed${issueList}`);
      }
      const data = await res.json();
      setPublishResult(data);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }, [result, editedArticle, editedTitle, editedDescription, editedMeta, playbookTopic]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setResult(null);
    setSelectedTopic(null);
    setAutoSelectedTopic(null);
    setGenerateError(null);
    setPublishResult(null);
    setPublishError(null);
    setAutoGenerating(false);
    setShowTopicList(true);
    setPipelineStatus({ brief: "idle", draft: "idle", compliance: "idle", package: "idle" });
  };

  const allStepsDone = Object.values(pipelineStatus).every((s) => s === "done");

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Admin</p>
          <h1 className="font-display text-2xl font-bold text-neutral-900">
            Article Generation
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            AI-powered Singapore property articles — brief → draft → compliance → publish
          </p>
        </div>
        {result && (
          <Button variant="outline" size="sm" onClick={handleReset} className="shrink-0">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Start over
          </Button>
        )}
      </div>

      {/* ── Auto-generate (primary action) ── */}
      <div className="rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-5 shadow-sm">
        <Button
          type="button"
          onClick={handleAutoGenerate}
          disabled={generating}
          className="w-full py-3 text-base font-semibold sm:w-auto"
        >
          {generating && autoGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI is picking the best trending topic and writing…
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Auto-Generate Best Article
            </>
          )}
        </Button>
        <p className="mt-2 text-xs text-neutral-500">
          Picks the top radar topic that isn&apos;t already live on /playbook, then runs the full
          pipeline. Or choose a topic manually below.
          {!loadingTopics && topics.length > 0 && (
            <>
              {" "}
              <span className="font-medium text-neutral-700">
                ({topics.filter((t) => !t.alreadyPublished).length} of {topics.length} topics
                available)
              </span>
            </>
          )}
        </p>
        {!loadingTopics && topics.length > 0 && topics.every((t) => t.alreadyPublished) && (
          <p className="mt-2 text-xs font-medium text-amber-700">
            Every trending topic is already on the Playbook — add a custom topic below to generate
            something new.
          </p>
        )}
        {generateError && (
          <GenerateErrorBanner
            message={generateError}
            onRetry={handleRetryGenerate}
            retrying={generating}
          />
        )}
      </div>

      {/* ── Step 1: Topic selection ── */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <button
          className="flex w-full items-center justify-between px-5 py-4"
          onClick={() => setShowTopicList((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-bold text-neutral-900">
              1 — Select a topic
            </span>
            {selectedTopic && (
              <span className="ml-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
                {selectedTopic.title}
              </span>
            )}
          </div>
          {showTopicList ? (
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          )}
        </button>

        {showTopicList && (
          <div className="border-t border-neutral-100 px-5 pb-5">
            {/* Custom topic input */}
            <div className="mb-4 mt-4 flex gap-2">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomTopic()}
                placeholder="Type a custom topic…"
                className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomTopic}
                disabled={!customTitle.trim()}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            {/* Radar topics */}
            {loadingTopics ? (
              <div className="flex items-center gap-2 py-8 text-sm text-neutral-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading radar topics…
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {topics.map((topic) =>
                  topic.alreadyPublished ? (
                    <div
                      key={topic.id}
                      className="flex flex-col gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 opacity-60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold leading-snug text-neutral-700">
                          {topic.title}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                            DEMAND_BADGE[topic.demand],
                          )}
                        >
                          {topic.demand}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-2">{topic.searchIntent}</p>
                      {topic.matchedArticle ? (
                        <Link
                          href={`/playbook/${topic.matchedArticle.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800"
                        >
                          Already covered → view
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-xs font-medium text-neutral-500">Already covered</span>
                      )}
                    </div>
                  ) : (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setSelectedTopic(topic)}
                      className={cn(
                        "group flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-all",
                        selectedTopic?.id === topic.id
                          ? "border-primary-500 bg-primary-50 shadow-sm"
                          : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold leading-snug",
                            selectedTopic?.id === topic.id
                              ? "text-primary-900"
                              : "text-neutral-800 group-hover:text-neutral-900",
                          )}
                        >
                          {topic.title}
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {topic.source === "custom" && (
                            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                              Custom
                            </span>
                          )}
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                              DEMAND_BADGE[topic.demand],
                            )}
                          >
                            {topic.demand}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-2">{topic.searchIntent}</p>
                      <div className="flex flex-wrap gap-1">
                        {topic.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-white px-1.5 py-0.5 text-xs text-neutral-500 ring-1 ring-neutral-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Generate button + pipeline status ── */}
      <div ref={pipelineRef} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                <StepBadge state={pipelineStatus[step.id]} label={step.label} />
                {i < PIPELINE_STEPS.length - 1 && (
                  <ChevronRight className="h-3 w-3 shrink-0 text-neutral-300" />
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!selectedTopic || generating}
            className="shrink-0"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>

        {generating && (
          <div className="mt-3 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-xs text-primary-700">
            {autoGenerating
              ? "AI is picking the best trending topic and writing… (~30–60 seconds)"
              : "Running brief → draft → compliance → package… (~30–60 seconds)"}
          </div>
        )}

        {generateError && !generating && (
          <GenerateErrorBanner
            message={generateError}
            onRetry={handleRetryGenerate}
            retrying={generating}
          />
        )}
      </div>

      {/* ── Result preview ── */}
      {result && (
        <div ref={previewRef} className="space-y-4">
          {autoSelectedTopic && (
            <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
              <span className="font-semibold">AI selected:</span> {autoSelectedTopic.title}
            </div>
          )}

          <QualityScorePanel result={result} />

          {/* Compliance notices */}
          {result.compliance.issues.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-red-700">
                <TriangleAlert className="h-4 w-4" />
                Compliance issues (fixed by pipeline — review before publishing)
              </p>
              <ul className="space-y-1">
                {result.compliance.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-red-600 before:mr-1.5 before:content-['•']">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.compliance.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="mb-2 text-xs font-bold text-amber-700">Warnings</p>
              <ul className="space-y-1">
                {result.compliance.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-700 before:mr-1.5 before:content-['•']">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meta fields */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-900">
              <BookOpen className="h-4 w-4 text-primary-600" />
              Article metadata
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                  Title
                </label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                  Author
                </label>
                <input
                  type="text"
                  readOnly
                  value={result.draft.brief.authorName}
                  className="w-full rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                  Card description
                  <span className="ml-1.5 font-normal text-neutral-400">
                    ({editedDescription.length}/35 words)
                  </span>
                </label>
                <input
                  type="text"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                  Meta description
                  <span className="ml-1.5 font-normal text-neutral-400">
                    ({editedMeta.length}/155 chars)
                  </span>
                </label>
                <input
                  type="text"
                  value={editedMeta}
                  onChange={(e) => setEditedMeta(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:ring-2 focus:ring-primary-100",
                    editedMeta.length > 155
                      ? "border-red-300 focus:border-red-400"
                      : "border-neutral-200 focus:border-primary-500",
                  )}
                />
                {editedMeta.length > 155 && (
                  <p className="mt-1 text-xs text-red-500">Meta description is too long — trim to 155 characters.</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                  Playbook section
                </label>
                <select
                  value={playbookTopic}
                  onChange={(e) => setPlaybookTopic(e.target.value as PlaybookTopic)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  {VALID_TOPICS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Tags</label>
                <div className="flex flex-wrap gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                  {result.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-white px-2 py-0.5 text-xs text-neutral-600 ring-1 ring-neutral-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Article editor */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900">Article body</h2>
              <span className="text-xs text-neutral-400">
                {editedArticle.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              value={editedArticle}
              onChange={(e) => setEditedArticle(e.target.value)}
              rows={28}
              spellCheck
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-xs leading-relaxed text-neutral-800 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Audit scores */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-sm font-bold text-neutral-900">
                Audit scores
                {result.audit.llm && (
                  <span className="ml-1.5 text-xs font-normal text-neutral-400">(LLM)</span>
                )}
              </h2>
              <span
                className={cn(
                  "ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums",
                  result.audit.overall >= 80
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : result.audit.overall >= 60
                      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      : "bg-red-50 text-red-600 ring-1 ring-red-200",
                )}
              >
                {result.audit.overall}/100 overall
              </span>
            </div>

            {result.audit.llm ? (
              // Real LLM audit — show SEO / GEO / AEO on 0–10 scale
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      { label: "SEO", score: result.audit.llm.seo, desc: "keywords, title, meta" },
                      { label: "GEO", score: result.audit.llm.geo, desc: "clarity, local specificity" },
                      { label: "AEO", score: result.audit.llm.aeo, desc: "Quick Answer, FAQ, citations" },
                    ] as const
                  ).map(({ label, score, desc }) => (
                    <div key={label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-neutral-700">{label}</span>
                          <span className="ml-1.5 text-xs text-neutral-400">{desc}</span>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            score >= 8 ? "text-emerald-600" : score >= 6 ? "text-amber-600" : "text-red-500",
                          )}
                        >
                          {score}/10
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-amber-400" : "bg-red-400",
                          )}
                          style={{ width: `${score * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fixes */}
                {result.audit.llm.fixes.length > 0 && (
                  <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                    <p className="mb-1.5 text-xs font-semibold text-neutral-600">
                      Suggested improvements
                    </p>
                    <ul className="space-y-1">
                      {result.audit.llm.fixes.map((fix, i) => (
                        <li key={i} className="flex gap-1.5 text-xs text-neutral-600">
                          <span className="mt-0.5 shrink-0 text-neutral-300">→</span>
                          {fix}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Gate warning */}
                {!result.audit.llm.passesGate && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-800">
                        Below publish threshold ({result.audit.llm.overall.toFixed(1)}/10 — need ≥{PUBLISH_THRESHOLD})
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700">
                        Apply the fixes above, then regenerate — or use the admin override below.
                      </p>
                      <label className="mt-2 flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={auditOverride}
                          onChange={(e) => setAuditOverride(e.target.checked)}
                          className="h-3.5 w-3.5 rounded"
                        />
                        <span className="text-xs font-medium text-amber-800">
                          Override — publish anyway (admin only)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Heuristic fallback
              <div className="grid gap-4 sm:grid-cols-3">
                <AuditBar label="Structure" score={result.audit.structure} />
                <AuditBar label="SEO" score={result.audit.seo} />
                <AuditBar label="Compliance" score={result.audit.compliance} />
              </div>
            )}
          </div>

          {/* FAQ preview */}
          {result.draft.faq.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-neutral-900">
                FAQ ({result.draft.faq.length} pairs)
              </h2>
              <div className="space-y-3">
                {result.draft.faq.map((faq, i) => (
                  <div key={i} className="rounded-lg bg-neutral-50 p-3">
                    <p className="text-xs font-semibold text-neutral-800">Q: {faq.q}</p>
                    <p className="mt-1 text-xs text-neutral-600">A: {faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publish bar */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            {publishResult ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-emerald-700">Published successfully!</p>
                  <p className="text-xs text-neutral-500">
                    Slug:{" "}
                    <Link
                      href={`/playbook/${publishResult.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-0.5 text-primary-600 hover:underline"
                    >
                      /playbook/{publishResult.slug}
                      <ExternalLink className="ml-0.5 h-3 w-3" />
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <>
                {publishError && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                    <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                    {publishError}
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-neutral-500">
                    Review the article above before publishing. Once live, it will appear in the
                    Playbook under{" "}
                    <strong>{VALID_TOPICS.find((t) => t.value === playbookTopic)?.label}</strong>.
                  </p>
                  {!result.compliance.passed ? (
                    <div className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-right">
                      <p className="text-xs font-semibold text-red-700">Blocked — fix compliance</p>
                      <ul className="mt-1 space-y-0.5 text-left">
                        {result.compliance.issues.map((issue, i) => (
                          <li key={i} className="text-xs text-red-600">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <Button
                      onClick={handlePublish}
                      disabled={
                        publishing ||
                        !allStepsDone ||
                        editedMeta.length > 155 ||
                        (!!result?.audit?.llm && !result.audit.llm.passesGate && !auditOverride)
                      }
                      className="shrink-0"
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing…
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Publish to Playbook
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
