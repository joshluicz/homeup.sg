// Each input item already carries its room context (spread from the
// Generate Room Clip node), so we map over all items to handle every room.
return $input.all().map((entry) => {
  const response = entry.json;

  const explicitError =
    response.error_message ||
    (typeof response.error === "string" ? response.error : null) ||
    response.error?.message ||
    response.message;

  if (response.success === false || (explicitError && !response.video_url)) {
    return {
      json: {
        ...response,
        clip_status: "error",
        error_message: explicitError || "Clip generation failed",
        retryable: response.retryable ?? true,
        metadata: {
          label: response.label,
          diagnostics: response.diagnostics || null,
          source: "generate-room-clip",
        },
      },
    };
  }

  const videoUrl =
    response.video_url || response.url || response.r2_url || response.clip_url;

  if (!videoUrl) {
    return {
      json: {
        ...response,
        clip_status: "error",
        error_message:
          "No video_url in clip response: " +
          JSON.stringify(response).substring(0, 300),
        retryable: true,
        metadata: {
          label: response.label,
          source: "generate-room-clip",
        },
      },
    };
  }

  return {
    json: {
      ...response,
      video_url: videoUrl,
      clip_status: "done",
      metadata: {
        label: response.label,
        diagnostics: response.diagnostics || null,
        source: "generate-room-clip",
      },
    },
  };
});
