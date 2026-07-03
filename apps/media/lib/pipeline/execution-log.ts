import type { SupabaseClient } from "@supabase/supabase-js";

export type PipelineRunStatus = "running" | "success" | "error";
export type PipelineStepStatus = PipelineRunStatus | "skipped";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type Summary = Record<string, JsonValue>;

type CreateRunOptions = {
  supabase?: SupabaseClient | null;
  workflow: string;
  uploadedBy?: string | null;
  subjectType?: string;
  subjectId?: string;
  title?: string;
  inputSummary?: Summary;
};

type StepOptions = {
  inputSummary?: Summary;
  outputSummary?: Summary;
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unknown pipeline error";
}

function safeSummary(summary?: Summary): Summary | null {
  if (!summary) return null;
  return JSON.parse(JSON.stringify(summary)) as Summary;
}

export class PipelineRunLogger {
  constructor(
    private readonly supabase: SupabaseClient | null,
    readonly runId: string | null,
  ) {}

  static noop() {
    return new PipelineRunLogger(null, null);
  }

  get enabled() {
    return Boolean(this.supabase && this.runId);
  }

  async step<T>(
    stepKey: string,
    stepName: string,
    fn: () => Promise<T> | T,
    options: StepOptions = {},
  ): Promise<T> {
    const started = Date.now();
    const stepId = await this.createStep(stepKey, stepName, options.inputSummary);

    try {
      const result = await fn();
      await this.finishStep(stepId, "success", started, options.outputSummary);
      return result;
    } catch (error) {
      await this.finishStep(stepId, "error", started, undefined, errorMessage(error));
      throw error;
    }
  }

  async finish(outputSummary?: Summary) {
    await this.updateRun("success", outputSummary);
  }

  async fail(error: unknown, outputSummary?: Summary) {
    await this.updateRun("error", outputSummary, errorMessage(error));
  }

  private async createStep(
    stepKey: string,
    stepName: string,
    inputSummary?: Summary,
  ): Promise<string | null> {
    if (!this.supabase || !this.runId) return null;

    try {
      const { data, error } = await this.supabase
        .from("media_pipeline_steps")
        .insert({
          run_id: this.runId,
          step_key: stepKey,
          step_name: stepName,
          status: "running",
          input_summary: safeSummary(inputSummary),
        })
        .select("id")
        .single();

      if (error) {
        console.warn("pipeline step log insert failed:", error.message);
        return null;
      }

      return data?.id ?? null;
    } catch (error) {
      console.warn("pipeline step log insert failed:", errorMessage(error));
      return null;
    }
  }

  private async finishStep(
    stepId: string | null,
    status: PipelineStepStatus,
    started: number,
    outputSummary?: Summary,
    error?: string,
  ) {
    if (!this.supabase || !stepId) return;

    try {
      const { error: updateError } = await this.supabase
        .from("media_pipeline_steps")
        .update({
          status,
          output_summary: safeSummary(outputSummary),
          error_message: error ?? null,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - started,
        })
        .eq("id", stepId);

      if (updateError) {
        console.warn("pipeline step log update failed:", updateError.message);
      }
    } catch (updateError) {
      console.warn("pipeline step log update failed:", errorMessage(updateError));
    }
  }

  private async updateRun(
    status: PipelineRunStatus,
    outputSummary?: Summary,
    error?: string,
  ) {
    if (!this.supabase || !this.runId) return;

    try {
      const { error: updateError } = await this.supabase
        .from("media_pipeline_runs")
        .update({
          status,
          output_summary: safeSummary(outputSummary),
          error_message: error ?? null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", this.runId);

      if (updateError) {
        console.warn("pipeline run log update failed:", updateError.message);
      }
    } catch (updateError) {
      console.warn("pipeline run log update failed:", errorMessage(updateError));
    }
  }
}

export async function createPipelineRunLogger(
  options: CreateRunOptions,
): Promise<PipelineRunLogger> {
  const { supabase } = options;
  if (!supabase) return PipelineRunLogger.noop();

  try {
    const { data, error } = await supabase
      .from("media_pipeline_runs")
      .insert({
        workflow: options.workflow,
        uploaded_by: options.uploadedBy ?? null,
        subject_type: options.subjectType ?? null,
        subject_id: options.subjectId ?? null,
        title: options.title ?? null,
        status: "running",
        input_summary: safeSummary(options.inputSummary) ?? {},
      })
      .select("id")
      .single();

    if (error) {
      console.warn("pipeline run log insert failed:", error.message);
      return PipelineRunLogger.noop();
    }

    return new PipelineRunLogger(supabase, data?.id ?? null);
  } catch (error) {
    console.warn("pipeline run log insert failed:", errorMessage(error));
    return PipelineRunLogger.noop();
  }
}

export function summarizeGenerateBody(body: unknown): Summary {
  if (!body || typeof body !== "object") return {};
  const raw = body as Record<string, unknown>;
  return {
    address: typeof raw.address === "string" ? raw.address : null,
    property_type:
      typeof raw.property_type === "string" ? raw.property_type : null,
    room_count: Array.isArray(raw.room_photos) ? raw.room_photos.length : 0,
  };
}

export function summarizeApproveBody(body: unknown): Summary {
  if (!body || typeof body !== "object") return {};
  const raw = body as Record<string, unknown>;
  return {
    blueprint_id:
      typeof raw.blueprint_id === "string" ? raw.blueprint_id : null,
    room_count: Array.isArray(raw.room_photos) ? raw.room_photos.length : 0,
  };
}
