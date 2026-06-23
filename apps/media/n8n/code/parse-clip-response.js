const context = $("Split Rooms for Processing").item.json;
const response = $input.first().json;

const videoUrl =
  response.video_url || response.url || response.r2_url || response.clip_url;

if (!videoUrl) {
  throw new Error(
    "No video_url in clip response: " + JSON.stringify(response).substring(0, 300),
  );
}

return [
  {
    json: {
      ...context,
      video_url: videoUrl,
      metadata: { label: context.label },
    },
  },
];
