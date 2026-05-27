-- Create community-images storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-images', 'community-images', true, 5242880, array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']);

-- Public read access
create policy "Community images are publicly viewable"
on storage.objects for select
using (bucket_id = 'community-images');

-- Authenticated users can upload
create policy "Users can upload community images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'community-images' and owner = auth.uid());

-- Users can delete their own uploads
create policy "Users can delete their own community images"
on storage.objects for delete
to authenticated
using (bucket_id = 'community-images' and owner = auth.uid());
