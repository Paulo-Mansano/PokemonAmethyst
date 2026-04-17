-- Cria o bucket publico para sprites customizados dos Pokémon.
insert into storage.buckets (id, name, public)
values ('pokemon-sprites', 'pokemon-sprites', true)
on conflict (id)
do update set
    name = excluded.name,
    public = true;
