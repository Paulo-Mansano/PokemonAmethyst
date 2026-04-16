-- Refatoracao do modelo de atributos da instancia de Pokemon:
-- remove IV/EV classicos, renomeia atributos legados e adiciona novo sistema de distribuicao.

-- 1) Remove constraints de EV criadas em V21 para permitir o drop das colunas.
ALTER TABLE pokemon_instance
    DROP CONSTRAINT IF EXISTS ck_pokemon_instance_ev_hp,
    DROP CONSTRAINT IF EXISTS ck_pokemon_instance_ev_ataque,
    DROP CONSTRAINT IF EXISTS ck_pokemon_instance_ev_defesa,
    DROP CONSTRAINT IF EXISTS ck_pokemon_instance_ev_ataque_especial,
    DROP CONSTRAINT IF EXISTS ck_pokemon_instance_ev_defesa_especial,
    DROP CONSTRAINT IF EXISTS ck_pokemon_instance_ev_speed,
    DROP CONSTRAINT IF EXISTS ck_pokemon_instance_ev_total;

-- 2) Renomeia colunas legadas para o novo prefixo de atributos livres.
ALTER TABLE pokemon_instance
    RENAME COLUMN tecnica TO atr_tecnica;

ALTER TABLE pokemon_instance
    RENAME COLUMN respeito TO atr_respeito;

-- 3) Remove colunas legadas de IV/EV do sistema antigo.
ALTER TABLE pokemon_instance
    DROP COLUMN IF EXISTS iv_hp,
    DROP COLUMN IF EXISTS iv_ataque,
    DROP COLUMN IF EXISTS iv_defesa,
    DROP COLUMN IF EXISTS iv_ataque_especial,
    DROP COLUMN IF EXISTS iv_defesa_especial,
    DROP COLUMN IF EXISTS iv_speed,
    DROP COLUMN IF EXISTS ev_hp,
    DROP COLUMN IF EXISTS ev_ataque,
    DROP COLUMN IF EXISTS ev_defesa,
    DROP COLUMN IF EXISTS ev_ataque_especial,
    DROP COLUMN IF EXISTS ev_defesa_especial,
    DROP COLUMN IF EXISTS ev_speed;

-- 4) Adiciona colunas do novo sistema de classe e distribuicao.
ALTER TABLE pokemon_instance
    ADD COLUMN IF NOT EXISTS iv_class VARCHAR(1),
    ADD COLUMN IF NOT EXISTS pontos_distribuicao_disponiveis INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hp_base_rng INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS stamina_base_rng INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS atr_ataque INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS atr_defesa INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS atr_ataque_especial INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS atr_defesa_especial INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS atr_speed INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS atr_hp INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS atr_stamina INTEGER NOT NULL DEFAULT 0;