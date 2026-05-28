ALTER TABLE pokemon_instance
    ADD COLUMN contagem_evolucoes INT NOT NULL DEFAULT 0,
    ADD COLUMN pontos_roll_inicial INT NOT NULL DEFAULT 0;
