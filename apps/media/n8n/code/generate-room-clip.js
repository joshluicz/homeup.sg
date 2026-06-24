const item = $input.first().json;
const baseUrl =
  "https://ixhikkbytusikgjiuvqa.supabase.co/functions/v1/generate-room-clip";

const startPayload = {
  action: "start",
  blueprint_id: item.blueprint_id,
  label: item.label,
  r2_url: item.r2_url,
  higgsfield_prompt: item.higgsfield_prompt,
  duration_seconds: item.duration_seconds,
};

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
  startRes = await postClip.call(this, startPayload, 120000);
} catch (error) {
  const message =
    error?.message ||
    error?.description ||
    (typeof error === "string" ? error : "Clip start request failed");
  return [
    {
      json: {
        ...item,
        success: false,
        error: message,
        retryable: true,
      },
    },
  ];
}

if (!startRes?.success || !startRes.job_id) {
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

const jobId = startRes.job_id;
const maxAttempts = 30;

for (let attempt = 0; attempt < maxAttempts; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 15000));

  let pollRes;
  try {
    pollRes = await postClip.call(
      this,
      {
        action: "poll",
        job_id: jobId,
        label: item.label,
        blueprint_id: item.blueprint_id,
      },
      45000,
    );
  } catch (error) {
    const message =
      error?.message ||
      error?.description ||
      (typeof error === "string" ? error : "Clip poll request failed");
    if (attempt === maxAttempts - 1) {
      return [
        {
          json: {
            ...item,
            success: false,
            error: message,
            retryable: true,
            higgsfield_job_id: jobId,
            diagnostics: startRes.diagnostics || null,
          },
        },
      ];
    }
    continue;
  }

  if (pollRes?.status === "completed" && pollRes.video_url) {
    return [
      {
        json: {
          ...item,
          success: true,
          video_url: pollRes.video_url,
          higgsfield_job_id: jobId,
          diagnostics: {
            ...(startRes.diagnostics || {}),
            ...(pollRes.diagnostics || {}),
            poll_attempts: attempt + 1,
          },
        },
      },
    ];
  }

  if (pollRes?.status === "failed" || pollRes?.success === false) {
    return [
      {
        json: {
          ...item,
          success: false,
          error: pollRes?.error || "Higgsfield job failed",
          retryable: pollRes?.retryable ?? true,
          higgsfield_job_id: jobId,
          diagnostics: pollRes.diagnostics || startRes.diagnostics || null,
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
        "Higgsfield job is still processing after ~7.5 minutes. Please retry this room clip.",
      retryable: true,
      higgsfield_job_id: jobId,
      diagnostics: startRes.diagnostics || null,
    },
  },
];
