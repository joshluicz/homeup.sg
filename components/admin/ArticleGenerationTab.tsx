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

const SCORE_COLOR = (s: number) =>
  s >= 80 ? "text-emerald-600" : s >= 60 ? "text-amber-600" : "text-red-500";

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
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">{label}</span>
        <span className={cn("text-xs font-bold tabular-nums", SCORE_COLOR(score))}>{score}</span>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function ArticleGenerationTab() {
  // Topic list
  const [topics, setTopics] = useState<TopicCandidate[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<TopicCandidate | null>(null);
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

  const previewRef = useRef<HTMLDivElement>(null);

  // ── Load topics on mount ────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/topics")
      .then((r) => r.json())
      .then((data: TopicCandidate[]) => {
        setTopics(data);
        setLoadingTopics(false);
      })
      .catch(() => setLoadingTopics(false));
  }, []);

  // ── Generate article ────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!selectedTopic) return;

    setGenerateError(null);
    setResult(null);
    setPublishResult(null);
    setPublishError(null);
    setGenerating(true);
    setShowTopicList(false);

    // Animate pipeline steps
    const steps: PipelineStep[] = ["brief", "draft", "compliance", "package"];
    let stepIdx = 0;

    const tick = () => {
      if (stepIdx < steps.length) {
        const step = steps[stepIdx];
        setPipelineStatus((prev) => ({ ...prev, [step]: "running" }));
        stepIdx++;
      }
    };

    tick();
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        const prev = steps[stepIdx - 1];
        setPipelineStatus((s) => ({ ...s, [prev]: "done" }));
        tick();
      }
    }, 12000);

    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedTopic }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || "Generation failed");
      }

      const data: PackagedArticle = await res.json();
      setPipelineStatus({ brief: "done", draft: "done", compliance: "done", package: "done" });

      setResult(data);
      setEditedArticle(data.draft.article);
      setEditedTitle(data.draft.title);
      setEditedDescription(data.draft.description);
      setEditedMeta(data.draft.metaDescription);

      // Default playbook topic by category
      const cat = data.draft.brief.topic.category;
      if (cat === "buying_first" || cat === "hdb_bto" || cat === "hdb_resale") {
        setPlaybookTopic("buying_first");
      } else if (cat === "condo_resale" || cat === "condo_new_launch" || cat === "ec" || cat === "investment") {
        setPlaybookTopic("condo_tips");
      } else {
        setPlaybookTopic("upgraders");
      }

      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setGenerateError(msg);
      setPipelineStatus((prev) => {
        const updated = { ...prev };
        const running = Object.entries(updated).find(([, v]) => v === "running");
        if (running) (updated as Record<string, StepState>)[running[0]] = "error";
        return updated;
      });
    } finally {
      setGenerating(false);
    }
  }, [selectedTopic]);

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
        const err = await res.json();
        throw new Error(err.detail || err.error || "Publish failed");
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
    setGenerateError(null);
    setPublishResult(null);
    setPublishError(null);
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
                {topics.map((topic) => (
                  <button
                    key={topic.id}
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Generate button + pipeline status ── */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
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
            Running {Object.values(pipelineStatus).filter((s) => s === "running").length > 0
              ? PIPELINE_STEPS.find((s) => pipelineStatus[s.id] === "running")?.description
              : "pipeline"}… this takes ~30–60 seconds.
          </div>
        )}

        {generateError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">Generation failed</p>
              <p className="text-xs text-red-600">{generateError}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Result preview ── */}
      {result && (
        <div ref={previewRef} className="space-y-4">
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
              <h2 className="text-sm font-bold text-neutral-900">Audit scores</h2>
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
            <div className="grid gap-4 sm:grid-cols-3">
              <AuditBar label="Structure" score={result.audit.structure} />
              <AuditBar label="SEO" score={result.audit.seo} />
              <AuditBar label="Compliance" score={result.audit.compliance} />
            </div>
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
                  <Button
                    onClick={handlePublish}
                    disabled={publishing || !allStepsDone || editedMeta.length > 155}
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
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
