import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type PipelineRun = {
  id: string;
  workflow: string;
  status: "running" | "success" | "error";
  uploaded_by: string | null;
  subject_type: string | null;
  subject_id: string | null;
  title: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

type PipelineStep = {
  run_id: string;
  status: "running" | "success" | "error" | "skipped";
};

const REQUIRED_RUNTIME_ENV = [
  { key: "ANTHROPIC_API_KEY", label: "Anthropic blueprint generation" },
  { key: "FAL_API_KEY", label: "fal.ai room clip generation" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase pipeline writes" },
  { key: "R2_ACCESS_KEY_ID", label: "R2 access key" },
  { key: "R2_SECRET_ACCESS_KEY", label: "R2 secret key" },
  { key: "R2_BUCKET_NAME", label: "R2 bucket" },
  { key: "R2_ENDPOINT", label: "R2 endpoint" },
  { key: "R2_PUBLIC_URL", label: "R2 public URL" },
];

function statusClass(status: PipelineRun["status"] | PipelineStep["status"]) {
  switch (status) {
    case "success":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "error":
      return "bg-red-50 text-red-700 ring-red-200";
    case "running":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    default:
      return "bg-neutral-50 text-neutral-700 ring-neutral-200";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function durationMs(run: PipelineRun) {
  const end = run.completed_at ? Date.parse(run.completed_at) : Date.now();
  return Math.max(0, end - Date.parse(run.started_at));
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

export default async function ExecutionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/executions");
  }

  const serviceSupabase = createServiceClient();
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const canReadAll = profile?.role === "admin" || profile?.role === "batam";

  let runsQuery = serviceSupabase
    .from("media_pipeline_runs")
    .select(
      "id, workflow, status, uploaded_by, subject_type, subject_id, title, error_message, started_at, completed_at",
    )
    .order("started_at", { ascending: false })
    .limit(50);

  if (!canReadAll) {
    runsQuery = runsQuery.eq("uploaded_by", user.id);
  }

  const { data: runs, error } = await runsQuery;

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-neutral-950">Executions</h1>
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load execution logs: {error.message}
        </p>
      </div>
    );
  }

  const typedRuns = (runs ?? []) as PipelineRun[];
  const runIds = typedRuns.map((run) => run.id);
  const { data: steps } = runIds.length
    ? await serviceSupabase
        .from("media_pipeline_steps")
        .select("run_id, status")
        .in("run_id", runIds)
    : { data: [] };
  const typedSteps = (steps ?? []) as PipelineStep[];
  const envStatuses = REQUIRED_RUNTIME_ENV.map((item) => ({
    ...item,
    configured: Boolean(process.env[item.key]?.trim()),
  }));
  const missingEnv = envStatuses.filter((item) => !item.configured);

  const stepCounts = new Map<string, { total: number; failed: number }>();
  for (const step of typedSteps) {
    const count = stepCounts.get(step.run_id) ?? { total: 0, failed: 0 };
    count.total += 1;
    if (step.status === "error") count.failed += 1;
    stepCounts.set(step.run_id, count);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
            Internal workflow monitor
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-neutral-950">
            Executions
          </h1>
        </div>
        <p className="text-sm text-neutral-500">
          Showing latest {typedRuns.length} run{typedRuns.length === 1 ? "" : "s"}
        </p>
      </div>

      <div
        className={`mt-8 rounded-2xl border p-5 ${
          missingEnv.length > 0
            ? "border-amber-200 bg-amber-50"
            : "border-emerald-200 bg-emerald-50"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2
              className={`text-base font-semibold ${
                missingEnv.length > 0 ? "text-amber-900" : "text-emerald-900"
              }`}
            >
              Runtime configuration
            </h2>
            <p
              className={`mt-1 text-sm ${
                missingEnv.length > 0 ? "text-amber-800" : "text-emerald-800"
              }`}
            >
              {missingEnv.length > 0
                ? "Some required server-side environment variables are missing."
                : "All required server-side environment variables are present."}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
              missingEnv.length > 0
                ? "bg-amber-100 text-amber-800 ring-amber-200"
                : "bg-emerald-100 text-emerald-800 ring-emerald-200"
            }`}
          >
            {missingEnv.length > 0 ? `${missingEnv.length} missing` : "healthy"}
          </span>
        </div>
        {missingEnv.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-amber-900">
            {missingEnv.map((item) => (
              <li key={item.key}>
                <code>{item.key}</code> — {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {typedRuns.length === 0 ? (
          <div className="p-8 text-sm text-neutral-500">
            No executions logged yet. Run blueprint generation or approve a
            blueprint to see step-by-step logs here.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {typedRuns.map((run) => {
              const counts = stepCounts.get(run.id) ?? { total: 0, failed: 0 };
              return (
                <Link
                  key={run.id}
                  href={`/executions/${run.id}`}
                  className="block p-5 transition hover:bg-neutral-50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(run.status)}`}
                        >
                          {run.status}
                        </span>
                        <span className="text-sm font-semibold text-neutral-950">
                          {run.workflow.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h2 className="mt-2 text-base font-medium text-neutral-900">
                        {run.title ?? run.subject_id ?? run.id}
                      </h2>
                      {run.error_message && (
                        <p className="mt-1 max-w-2xl truncate text-sm text-red-600">
                          {run.error_message}
                        </p>
                      )}
                    </div>
                    <div className="text-left text-sm text-neutral-500 sm:text-right">
                      <p>{formatDate(run.started_at)}</p>
                      <p>
                        {formatDuration(durationMs(run))} · {counts.total} steps
                        {counts.failed > 0 ? ` · ${counts.failed} failed` : ""}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
