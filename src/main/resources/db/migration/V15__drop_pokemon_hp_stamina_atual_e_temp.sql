ALTER TABLE pokemon
    DROP COLUMN IF EXISTS hp_atual,
    DROP COLUMN IF EXISTS hp_temporario,
    DROP COLUMN IF EXISTS stamina_atual,
    DROP COLUMN IF EXISTS stamina_temporaria;

ALTER TABLE perfil_jogador
    DROP COLUMN IF EXISTS hp_atual,
    DROP COLUMN IF EXISTS stamina_atual;

