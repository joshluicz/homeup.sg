const raw = $input.first().json;
const body = raw.body ?? raw;

if (!body.blueprint_id) {
  throw new Error("Missing blueprint_id");
}

if (!body.room_photos || !Array.isArray(body.room_photos)) {
  throw new Error("Missing room_photos array");
}

for (const photo of body.room_photos) {
  if (!photo.label || !photo.r2_url) {
    throw new Error("Each room_photos entry needs label and r2_url");
  }
}

return [
  {
    json: {
      blueprint_id: body.blueprint_id,
      room_photos: body.room_photos,
    },
  },
];
