// Same value as MEDIA_WEBHOOK_SECRET in Vercel (media.homeup.sg).
// Edit this line in n8n after import — Code nodes cannot use credentials here.
const MEDIA_WEBHOOK_SECRET = "REPLACE_WITH_YOUR_SECRET";

const appUrl = "https://media.homeup.sg";

async function archiveItem(item) {
  if (item.clip_status === "error" || !item.video_url || !item.r2_key) {
    return item;
  }

  if (
    !MEDIA_WEBHOOK_SECRET ||
    MEDIA_WEBHOOK_SECRET === "REPLACE_WITH_YOUR_SECRET"
  ) {
    return {
      ...item,
      metadata: {
        ...(item.metadata || {}),
        archive_skipped:
          "Set MEDIA_WEBHOOK_SECRET at the top of Archive Clip to R2 code",
      },
    };
  }

  try {
    const archived = await this.helpers.httpRequest({
      method: "POST",
      url: `${appUrl}/api/clips/archive`,
      headers: {
        "Content-Type": "application/json",
        "x-media-webhook-secret": MEDIA_WEBHOOK_SECRET,
      },
      body: {
        source_url: item.video_url,
        r2_key: item.r2_key,
      },
      json: true,
      timeout: 120000,
    });

    return {
      ...item,
      video_url: archived.r2_url,
      file_size: archived.file_size,
      metadata: {
        ...(item.metadata || {}),
        archived_to_r2: true,
        original_source_url: item.video_url,
      },
    };
  } catch (error) {
    const message =
      error?.message ||
      error?.description ||
      (typeof error === "string" ? error : "Archive request failed");

    return {
      ...item,
      metadata: {
        ...(item.metadata || {}),
        archive_error: message,
      },
    };
  }
}

const items = $input.all().map((entry) => entry.json);
const processed = await Promise.all(
  items.map((item) => archiveItem.call(this, item)),
);

return processed.map((json) => ({ json }));
