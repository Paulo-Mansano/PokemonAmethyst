-- EVs (Effort Values): mesmos 6 atributos que IVs; máx. 252 por stat e 510 no total.
ALTER TABLE pokemon_instance
    ADD COLUMN ev_hp INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN ev_ataque INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN ev_defesa INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN ev_ataque_especial INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN ev_defesa_especial INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN ev_speed INTEGER NOT NULL DEFAULT 0;

ALTER TABLE pokemon_instance
    ADD CONSTRAINT ck_pokemon_instance_ev_hp CHECK (ev_hp >= 0 AND ev_hp <= 252),
    ADD CONSTRAINT ck_pokemon_instance_ev_ataque CHECK (ev_ataque >= 0 AND ev_ataque <= 252),
    ADD CONSTRAINT ck_pokemon_instance_ev_defesa CHECK (ev_defesa >= 0 AND ev_defesa <= 252),
    ADD CONSTRAINT ck_pokemon_instance_ev_ataque_especial CHECK (ev_ataque_especial >= 0 AND ev_ataque_especial <= 252),
    ADD CONSTRAINT ck_pokemon_instance_ev_defesa_especial CHECK (ev_defesa_especial >= 0 AND ev_defesa_especial <= 252),
    ADD CONSTRAINT ck_pokemon_instance_ev_speed CHECK (ev_speed >= 0 AND ev_speed <= 252),
    ADD CONSTRAINT ck_pokemon_instance_ev_total CHECK (
        ev_hp + ev_ataque + ev_defesa + ev_ataque_especial + ev_defesa_especial + ev_speed <= 510
    );
