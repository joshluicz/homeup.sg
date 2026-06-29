const { blueprint_id, room_photos } = $("Parse Approval Input").first().json;

return room_photos.map((photo) => {
  const image_urls =
    Array.isArray(photo.image_urls) && photo.image_urls.length > 0
      ? photo.image_urls
      : photo.r2_url
        ? [photo.r2_url]
        : [];
  const r2_url = image_urls[0] ?? photo.r2_url;

  return {
    json: {
      blueprint_id,
      label: photo.label,
      r2_url,
      image_urls,
      higgsfield_prompt: photo.higgsfield_prompt,
      duration_seconds: photo.duration_seconds || 6,
      file_name:
        "room_clip_" + photo.label.toLowerCase().replace(/ /g, "_") + ".mp4",
      r2_key:
        "room-clips/" +
        blueprint_id +
        "/" +
        photo.label.toLowerCase().replace(/ /g, "_") +
        ".mp4",
    },
  };
});
