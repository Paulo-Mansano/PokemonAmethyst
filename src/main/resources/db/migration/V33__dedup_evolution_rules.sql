-- Remove duplicate evolution rules keeping only the lowest id per (from_pokedex_id, to_pokedex_id) pair
DELETE FROM pokemon_species_evolution_rule
WHERE id NOT IN (
    SELECT MIN(id)
    FROM pokemon_species_evolution_rule
    GROUP BY from_pokedex_id, to_pokedex_id
);
