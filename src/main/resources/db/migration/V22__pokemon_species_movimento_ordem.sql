ALTER TABLE pokemon_species_movimento
    ADD COLUMN ordem INTEGER;

COMMENT ON COLUMN pokemon_species_movimento.ordem IS 'Ordem no array moves da PokéAPI (0-based); desempate para moves iniciais.';
