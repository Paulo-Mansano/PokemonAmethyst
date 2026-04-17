-- Policies para o bucket publico pokemon-sprites.
-- Observacao: estas policies assumem que o upload sera feito com identidade autenticada do Supabase.
-- Se o frontend usar apenas anon key sem login do Supabase, o upload deve ser proxyado pelo backend.

alter table storage.objects enable row level security;

create policy "pokemon_sprites_public_read"
on storage.objects
for select
using (bucket_id = 'pokemon-sprites');

create policy "pokemon_sprites_authenticated_upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'pokemon-sprites');

create policy "pokemon_sprites_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'pokemon-sprites')
with check (bucket_id = 'pokemon-sprites');

create policy "pokemon_sprites_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'pokemon-sprites');
