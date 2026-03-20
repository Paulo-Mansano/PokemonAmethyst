-- Remove dados legados de espécie placeholder.
-- A criação de Pokémon agora exige pokedex_id válido (> 0).
DELETE FROM pokemon_instance
WHERE species_id = 'species-0';

DELETE FROM pokemon_species
WHERE id = 'species-0'
  AND pokedex_id = 0;
