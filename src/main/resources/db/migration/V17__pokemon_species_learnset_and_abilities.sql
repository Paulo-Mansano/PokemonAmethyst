CREATE TABLE pokemon_species_habilidade (
    species_id VARCHAR(255) NOT NULL REFERENCES pokemon_species(id) ON DELETE CASCADE,
    habilidade_id VARCHAR(255) NOT NULL REFERENCES habilidade(id) ON DELETE CASCADE,
    slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (species_id, habilidade_id)
);

CREATE UNIQUE INDEX uq_pokemon_species_habilidade_species_slot
    ON pokemon_species_habilidade(species_id, slot);

CREATE INDEX idx_pokemon_species_habilidade_species
    ON pokemon_species_habilidade(species_id);

CREATE INDEX idx_pokemon_species_habilidade_habilidade
    ON pokemon_species_habilidade(habilidade_id);

CREATE TABLE pokemon_species_movimento (
    id BIGSERIAL PRIMARY KEY,
    species_id VARCHAR(255) NOT NULL REFERENCES pokemon_species(id) ON DELETE CASCADE,
    movimento_id VARCHAR(255) NOT NULL REFERENCES movimento(id) ON DELETE CASCADE,
    learn_method VARCHAR(50) NOT NULL,
    level INTEGER
);

CREATE INDEX idx_pokemon_species_movimento_species
    ON pokemon_species_movimento(species_id);

CREATE INDEX idx_pokemon_species_movimento_species_method_level
    ON pokemon_species_movimento(species_id, learn_method, level);

CREATE UNIQUE INDEX uq_pokemon_species_movimento_dedup
    ON pokemon_species_movimento(species_id, movimento_id, learn_method, COALESCE(level, -1));

ALTER TABLE pokemon_species
    ADD COLUMN IF NOT EXISTS gender_rate INTEGER,
    ADD COLUMN IF NOT EXISTS has_gender_differences BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS forms JSONB;
