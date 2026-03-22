ALTER TABLE pokemon_instance
    ADD COLUMN hp_atual INTEGER,
    ADD COLUMN origem VARCHAR(50) NOT NULL DEFAULT 'TREINADOR',
    ADD COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'ATIVO';

UPDATE pokemon_instance
SET hp_atual = 1
WHERE hp_atual IS NULL;

ALTER TABLE pokemon_instance
    ALTER COLUMN hp_atual SET NOT NULL;

ALTER TABLE pokemon_instance
    ADD CONSTRAINT ck_pokemon_instance_hp_atual_non_negative CHECK (hp_atual >= 0);
