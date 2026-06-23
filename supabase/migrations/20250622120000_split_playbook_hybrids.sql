-- Split legacy hybrid rows (article + video_url on same row) into two standalone entries.
-- Article row keeps the written guide; a new video row gets the clip.

DO $$
DECLARE
  r RECORD;
  new_slug text;
BEGIN
  FOR r IN
    SELECT *
    FROM playbook_videos
    WHERE coalesce(trim(article), '') <> ''
      AND coalesce(trim(video_url), '') <> ''
  LOOP
    new_slug := r.slug || '-clip';

    WHILE EXISTS (SELECT 1 FROM playbook_videos pv WHERE pv.slug = new_slug) LOOP
      new_slug := r.slug || '-clip-' || substr(md5(random()::text), 1, 6);
    END LOOP;

    INSERT INTO playbook_videos (
      slug,
      title,
      description,
      category,
      duration,
      thumbnail,
      video_url,
      featured,
      published_at,
      tags,
      article,
      faq,
      meta_description,
      topic,
      content_kind
    ) VALUES (
      new_slug,
      coalesce(nullif(trim(r.description), ''), r.title),
      '',
      r.category,
      r.duration,
      r.thumbnail,
      r.video_url,
      r.featured,
      r.published_at,
      r.tags,
      '',
      '[]'::jsonb,
      '',
      r.topic,
      'video'
    );

    UPDATE playbook_videos
    SET
      video_url = '',
      duration = '',
      content_kind = 'article',
      updated_at = now()
    WHERE id = r.id;
  END LOOP;
END $$;

-- Ensure pure video rows are tagged correctly.
UPDATE playbook_videos
SET content_kind = 'video'
WHERE coalesce(trim(video_url), '') <> ''
  AND coalesce(trim(article), '') = ''
  AND content_kind IS DISTINCT FROM 'video';

-- Ensure pure article rows have no video fields.
UPDATE playbook_videos
SET
  video_url = '',
  duration = '',
  content_kind = 'article'
WHERE coalesce(trim(article), '') <> ''
  AND coalesce(trim(video_url), '') = ''
  AND (content_kind IS DISTINCT FROM 'article' OR video_url <> '' OR duration <> '');
