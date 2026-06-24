const { blueprint_id, room_photos } = $("Parse Approval Input").first().json;

return room_photos.map((photo) => ({
  json: {
    blueprint_id,
    label: photo.label,
    r2_url: photo.r2_url,
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
}));
