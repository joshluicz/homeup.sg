const context = $("Split Rooms for Processing").item.json;
const response = $input.first().json;

const explicitError =
  response.error_message ||
  (typeof response.error === "string" ? response.error : null) ||
  response.error?.message ||
  response.message;

if (response.success === false || (explicitError && !response.video_url)) {
  return [
    {
      json: {
        ...context,
        clip_status: "error",
        error_message: explicitError || "Clip generation failed",
        retryable: response.retryable ?? true,
      },
    },
  ];
}

const videoUrl =
  response.video_url || response.url || response.r2_url || response.clip_url;

if (!videoUrl) {
  return [
    {
      json: {
        ...context,
        clip_status: "error",
        error_message:
          "No video_url in clip response: " +
          JSON.stringify(response).substring(0, 300),
        retryable: true,
      },
    },
  ];
}

return [
  {
    json: {
      ...context,
      video_url: videoUrl,
      clip_status: "done",
      metadata: { label: context.label },
    },
  },
];
