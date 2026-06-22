-- Storage for playbook videos, thumbnails, and in-article images.
INSERT INTO storage.buckets (id, name, public)
VALUES ('playbook-videos', 'playbook-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload playbook media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'playbook-videos');

CREATE POLICY "Authenticated users can update playbook media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'playbook-videos');

CREATE POLICY "Authenticated users can delete playbook media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'playbook-videos');

CREATE POLICY "Public read playbook media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'playbook-videos');
