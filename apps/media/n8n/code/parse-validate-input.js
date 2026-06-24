// Parse and validate payload from media.homeup.sg /api/generate-blueprint
const raw = $input.first().json;
const body = raw.body ?? raw;

const required = [
  "address",
  "property_type",
  "selling_points",
  "uploaded_by",
  "room_photos",
];

for (const field of required) {
  if (body[field] == null || body[field] === "") {
    throw new Error(`Missing required field: ${field}`);
  }
}

if (!Array.isArray(body.room_photos) || body.room_photos.length === 0) {
  throw new Error("room_photos must be a non-empty array");
}

for (const photo of body.room_photos) {
  if (!photo.label || !photo.r2_url) {
    throw new Error("Each room_photos entry needs label and r2_url");
  }
}

const roomList = `PROPERTY ADDRESS: ${body.address}\n\nROOMS:\n${body.room_photos
  .map((photo) => `- ${photo.label}: ${photo.r2_url}`)
  .join("\n")}`;

const roomCount = body.room_photos.length;
const wordsPerRoom =
  Number(body.words_per_room) || Math.max(20, Math.floor(195 / roomCount));
const secondsPerRoom =
  Number(body.seconds_per_room) ||
  Math.max(10, Math.round((wordsPerRoom / 130) * 60));

return [
  {
    json: {
      address: body.address,
      property_type: body.property_type,
      rooms: body.rooms || "Not specified",
      sqft: body.sqft || "Not specified",
      price_range: body.price_range || "Not specified",
      selling_points: body.selling_points,
      renovation_status: body.renovation_status || "Move-in ready",
      agent_notes: body.agent_notes || "None",
      uploaded_by: body.uploaded_by,
      room_photos: body.room_photos,
      room_list: roomList,
      room_count: roomCount,
      words_per_room: wordsPerRoom,
      seconds_per_room: secondsPerRoom,
    },
  },
];
