
-- Storage RLS for avatars and post-images.
-- Path convention: <user_id>/<filename>. The first path segment must equal auth.uid().
-- Reads are allowed to any authenticated user so profiles/post covers render across the app.
-- Writes (insert/update/delete) are restricted to the owning user.

-- AVATARS
CREATE POLICY "avatars_select_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- POST IMAGES
CREATE POLICY "post_images_select_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'post-images');

CREATE POLICY "post_images_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "post_images_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "post_images_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
