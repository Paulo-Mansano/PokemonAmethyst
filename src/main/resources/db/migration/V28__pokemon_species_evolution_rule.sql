CREATE TABLE IF NOT EXISTS pokemon_species_evolution_rule (
    id BIGSERIAL PRIMARY KEY,
    from_pokedex_id INTEGER NOT NULL,
    to_pokedex_id INTEGER NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    min_level INTEGER,
    item_name VARCHAR(100),
    CONSTRAINT uq_pokemon_species_evolution_rule UNIQUE (from_pokedex_id, to_pokedex_id, trigger_type, min_level, item_name)
);

CREATE INDEX IF NOT EXISTS idx_pokemon_species_evolution_rule_from ON pokemon_species_evolution_rule(from_pokedex_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_species_evolution_rule_to ON pokemon_species_evolution_rule(to_pokedex_id);
