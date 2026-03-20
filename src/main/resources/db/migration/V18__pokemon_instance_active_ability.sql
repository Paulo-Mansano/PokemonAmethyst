ALTER TABLE pokemon_instance
    ADD COLUMN IF NOT EXISTS ability_id VARCHAR(255) REFERENCES habilidade(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pokemon_instance_ability
    ON pokemon_instance(ability_id);

UPDATE pokemon_instance pi
SET ability_id = src.habilidade_id
FROM (
    SELECT pih.pokemon_instance_id, MIN(pih.habilidade_id) AS habilidade_id
    FROM pokemon_instance_habilidade pih
    GROUP BY pih.pokemon_instance_id
) src
WHERE pi.id = src.pokemon_instance_id
  AND pi.ability_id IS NULL;

INSERT INTO pokemon_species_habilidade (species_id, habilidade_id, slot, is_hidden)
SELECT ps.id,
       h.id,
       ROW_NUMBER() OVER (PARTITION BY ps.id ORDER BY h.id) AS slot,
       FALSE
FROM pokemon_species ps
         CROSS JOIN LATERAL UNNEST(string_to_array(COALESCE(ps.abilities, ''), ',')) AS raw_name(nome)
         JOIN habilidade h ON lower(COALESCE(h.nome_en, h.nome)) = lower(trim(raw_name.nome))
WHERE trim(raw_name.nome) <> ''
ON CONFLICT (species_id, habilidade_id) DO NOTHING;

ALTER TABLE pokemon_species
    DROP COLUMN IF EXISTS abilities;
