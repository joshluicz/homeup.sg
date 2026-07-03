import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type ExecutionDetailProps = {
  params: { id: string };
};

type PipelineRun = {
  id: string;
  workflow: string;
  status: "running" | "success" | "error";
  uploaded_by: string | null;
  subject_type: string | null;
  subject_id: string | null;
  title: string | null;
  input_summary: Record<string, unknown> | null;
  output_summary: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

type PipelineStep = {
  id: string;
  step_key: string;
  step_name: string;
  status: "running" | "success" | "error" | "skipped";
  input_summary: Record<string, unknown> | null;
  output_summary: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
};

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
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatDuration(ms?: number | null) {
  if (ms == null) return "running";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function JsonPanel({
  label,
  value,
}: {
  label: string;
  value: Record<string, unknown> | null;
}) {
  if (!value || Object.keys(value).length === 0) return null;

  return (
    <details className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50">
      <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-neutral-700">
        {label}
      </summary>
      <pre className="overflow-x-auto border-t border-neutral-200 px-4 py-3 text-xs text-neutral-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

export default async function ExecutionDetailPage({
  params,
}: ExecutionDetailProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/executions/${params.id}`);
  }

  const serviceSupabase = createServiceClient();
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const canReadAll = profile?.role === "admin" || profile?.role === "batam";

  const { data: run, error } = await serviceSupabase
    .from("media_pipeline_runs")
    .select(
      "id, workflow, status, uploaded_by, subject_type, subject_id, title, input_summary, output_summary, error_message, started_at, completed_at",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !run) notFound();

  const typedRun = run as PipelineRun;
  if (!canReadAll && typedRun.uploaded_by !== user.id) {
    notFound();
  }

  const { data: steps } = await serviceSupabase
    .from("media_pipeline_steps")
    .select(
      "id, step_key, step_name, status, input_summary, output_summary, error_message, started_at, completed_at, duration_ms",
    )
    .eq("run_id", params.id)
    .order("started_at", { ascending: true });
  const typedSteps = (steps ?? []) as PipelineStep[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/executions"
        className="text-sm font-medium text-neutral-600 hover:text-neutral-950"
      >
        &larr; Back to executions
      </Link>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(typedRun.status)}`}
            >
              {typedRun.status}
            </span>
            <h1 className="mt-3 text-2xl font-semibold text-neutral-950">
              {typedRun.title ?? typedRun.workflow.replace(/_/g, " ")}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {typedRun.workflow.replace(/_/g, " ")}
              {typedRun.subject_id ? ` · ${typedRun.subject_id}` : ""}
            </p>
          </div>
          <div className="text-left text-sm text-neutral-500 sm:text-right">
            <p>Started {formatDate(typedRun.started_at)}</p>
            <p>
              {typedRun.completed_at
                ? `Completed ${formatDate(typedRun.completed_at)}`
                : "Still running"}
            </p>
          </div>
        </div>

        {typedRun.error_message && (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {typedRun.error_message}
          </p>
        )}

        <JsonPanel label="Input summary" value={typedRun.input_summary} />
        <JsonPanel label="Output summary" value={typedRun.output_summary} />
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-950">Steps</h2>
        {typedSteps.length === 0 ? (
          <p className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            No steps were logged for this run.
          </p>
        ) : (
          typedSteps.map((step, index) => (
            <div
              key={step.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                      {index + 1}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(step.status)}`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold text-neutral-950">
                    {step.step_name}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {step.step_key}
                  </p>
                </div>
                <div className="text-sm text-neutral-500 sm:text-right">
                  <p>{formatDate(step.started_at)}</p>
                  <p>{formatDuration(step.duration_ms)}</p>
                </div>
              </div>

              {step.error_message && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {step.error_message}
                </p>
              )}

              <JsonPanel label="Input summary" value={step.input_summary} />
              <JsonPanel label="Output summary" value={step.output_summary} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
