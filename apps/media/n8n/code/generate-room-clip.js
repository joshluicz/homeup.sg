const item = $input.first().json;
const baseUrl =
  "https://ixhikkbytusikgjiuvqa.supabase.co/functions/v1/generate-room-clip";

async function postClip(body, timeoutMs) {
  return await this.helpers.httpRequest({
    method: "POST",
    url: baseUrl,
    headers: { "Content-Type": "application/json" },
    body,
    json: true,
    timeout: timeoutMs,
  });
}

let startRes;
try {
  startRes = await postClip.call(
    this,
    {
      action: "start",
      blueprint_id: item.blueprint_id,
      label: item.label,
      r2_url: item.r2_url,
      higgsfield_prompt: item.higgsfield_prompt,
      duration_seconds: item.duration_seconds,
    },
    45000,
  );
} catch (error) {
  const message =
    error?.message ||
    error?.description ||
    (typeof error === "string" ? error : "Clip start request failed");
  return [{ json: { ...item, success: false, error: message, retryable: true } }];
}

const jobId = startRes?.job_id ?? startRes?.higgsfield_job_id;
if (!startRes?.success || !jobId) {
  return [
    {
      json: {
        ...item,
        success: false,
        error: startRes?.error || "Clip start did not return a job_id",
        retryable: startRes?.retryable ?? true,
        diagnostics: startRes?.diagnostics || null,
      },
    },
  ];
}

const maxAttempts = 40;

for (let attempt = 0; attempt < maxAttempts; attempt++) {
  if (attempt > 0) {
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }

  let statusRes;
  try {
    statusRes = await postClip.call(
      this,
      { action: "status", job_id: jobId, label: item.label },
      20000,
    );
  } catch (error) {
    const message =
      error?.message ||
      error?.description ||
      (typeof error === "string" ? error : "Clip status request failed");
    if (attempt === maxAttempts - 1) {
      return [
        {
          json: {
            ...item,
            success: false,
            error: message,
            retryable: true,
            higgsfield_job_id: jobId,
          },
        },
      ];
    }
    continue;
  }

  if (statusRes?.status === "failed" || statusRes?.success === false) {
    return [
      {
        json: {
          ...item,
          success: false,
          error: statusRes?.error || "fal job failed",
          retryable: statusRes?.retryable ?? true,
          higgsfield_job_id: jobId,
          diagnostics: statusRes?.diagnostics || null,
        },
      },
    ];
  }

  if (statusRes?.status === "completed") {
    let resultRes;
    try {
      resultRes = await postClip.call(
        this,
        { action: "result", job_id: jobId, label: item.label },
        45000,
      );
    } catch (error) {
      const message =
        error?.message ||
        error?.description ||
        (typeof error === "string" ? error : "Clip result request failed");
      return [
        {
          json: {
            ...item,
            success: false,
            error: message,
            retryable: true,
            higgsfield_job_id: jobId,
          },
        },
      ];
    }

    if (resultRes?.video_url) {
      return [
        {
          json: {
            ...item,
            success: true,
            video_url: resultRes.video_url,
            higgsfield_job_id: jobId,
            diagnostics: {
              ...(startRes.diagnostics || {}),
              ...(statusRes.diagnostics || {}),
              ...(resultRes.diagnostics || {}),
              poll_attempts: attempt + 1,
            },
          },
        },
      ];
    }

    return [
      {
        json: {
          ...item,
          success: false,
          error: resultRes?.error || "fal result did not include video_url",
          retryable: true,
          higgsfield_job_id: jobId,
        },
      },
    ];
  }
}

return [
  {
    json: {
      ...item,
      success: false,
      error:
        "fal job is still processing after ~10 minutes. Please retry this room clip.",
      retryable: true,
      higgsfield_job_id: jobId,
    },
  },
];
