CREATE TABLE perfil_jogador (
    id VARCHAR(255) PRIMARY KEY,
    usuario_id VARCHAR(255) NOT NULL UNIQUE REFERENCES usuario(id) ON DELETE CASCADE,
    mochila_id VARCHAR(255) UNIQUE REFERENCES mochila(id) ON DELETE SET NULL,
    nome_personagem VARCHAR(255) NOT NULL,
    classe VARCHAR(50) NOT NULL,
    pokedolares INTEGER NOT NULL DEFAULT 0,
    nivel INTEGER NOT NULL DEFAULT 1,
    xp_atual INTEGER NOT NULL DEFAULT 0,
    hp_maximo INTEGER NOT NULL,
    hp_atual INTEGER NOT NULL,
    stamina_maxima INTEGER NOT NULL,
    stamina_atual INTEGER NOT NULL,
    habilidade INTEGER NOT NULL DEFAULT 0,
    atr_forca INTEGER NOT NULL DEFAULT 0,
    atr_speed INTEGER NOT NULL DEFAULT 0,
    atr_inteligencia INTEGER NOT NULL DEFAULT 0,
    atr_tecnica INTEGER NOT NULL DEFAULT 0,
    atr_sabedoria INTEGER NOT NULL DEFAULT 0,
    atr_percepcao INTEGER NOT NULL DEFAULT 0,
    atr_dominio INTEGER NOT NULL DEFAULT 0,
    atr_respeito INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_perfil_jogador_usuario ON perfil_jogador(usuario_id);
CREATE INDEX idx_perfil_jogador_mochila ON perfil_jogador(mochila_id);
