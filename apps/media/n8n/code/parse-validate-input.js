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

function resolvePhotoImageUrls(photo) {
  if (Array.isArray(photo.image_urls) && photo.image_urls.length > 0) {
    return photo.image_urls.filter(
      (url) => typeof url === "string" && url.trim() !== "",
    );
  }
  if (photo.r2_url) {
    return [photo.r2_url];
  }
  return [];
}

for (const photo of body.room_photos) {
  if (!photo.label) {
    throw new Error("Each room_photos entry needs label");
  }

  const imageUrls = resolvePhotoImageUrls(photo);
  if (imageUrls.length === 0) {
    throw new Error(
      "Each room_photos entry needs at least one image (r2_url or image_urls)",
    );
  }

  if (!photo.r2_url) {
    photo.r2_url = imageUrls[0];
  }
}

const roomList = `PROPERTY ADDRESS: ${body.address}\n\nROOMS:\n${body.room_photos
  .map((photo) => {
    const urls = resolvePhotoImageUrls(photo);
    const duration = photo.duration_seconds || body.seconds_per_room || 5;
    const urlLines = urls
      .map((url, index) => `  - @Image${index + 1}: ${url}`)
      .join("\n");
    const multiNote =
      urls.length > 1
        ? `\n  (${urls.length} reference photos — write higgsfield_prompt using @Image1, @Image2, etc.)`
        : "";
    return `- ${photo.label} (${duration}s):\n${urlLines}${multiNote}`;
  })
  .join("\n")}`;

const roomCount = body.room_photos.length;
const wordsPerRoom =
  Number(body.words_per_room) || Math.max(20, Math.floor(195 / roomCount));
const secondsPerRoom =
  Number(body.seconds_per_room) ||
  Math.max(5, Math.round((wordsPerRoom / 130) * 60));

return [
  {
    json: {
      address: body.address,
      property_type: body.property_type,
      rooms: body.rooms || "Not specified",
      listing_title: body.listing_title || "Not specified",
      listing_type: body.listing_type || "For Sale",
      bedrooms: body.bedrooms || "Not specified",
      bathrooms: body.bathrooms || "Not specified",
      sqft: body.sqft || "Not specified",
      area_sqm: body.area_sqm || "Not specified",
      price_range: body.price_range || "Not specified",
      price_psf: body.price_psf || "Not specified",
      tenure: body.tenure || "Not specified",
      condition: body.condition || "Not specified",
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
