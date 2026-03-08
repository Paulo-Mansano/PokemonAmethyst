CREATE TABLE pokemon (
    id VARCHAR(255) PRIMARY KEY,
    perfil_id VARCHAR(255) NOT NULL REFERENCES perfil_jogador(id) ON DELETE CASCADE,
    ordem_time INTEGER,
    pokedex_id INTEGER NOT NULL,
    especie VARCHAR(255) NOT NULL,
    apelido VARCHAR(255),
    imagem_url VARCHAR(512),
    notas TEXT,
    genero VARCHAR(50) NOT NULL,
    is_shiny BOOLEAN NOT NULL DEFAULT FALSE,
    tipo_primario VARCHAR(50) NOT NULL,
    tipo_secundario VARCHAR(50),
    personalidade VARCHAR(50),
    especializacao VARCHAR(50),
    berry_favorita VARCHAR(255),
    nivel_de_vinculo INTEGER NOT NULL DEFAULT 0,
    nivel INTEGER NOT NULL DEFAULT 1,
    xp_atual INTEGER NOT NULL DEFAULT 0,
    pokebola_captura VARCHAR(50) NOT NULL,
    item_segurado_id VARCHAR(255) REFERENCES item(id) ON DELETE SET NULL,
    hp_maximo INTEGER NOT NULL,
    hp_atual INTEGER NOT NULL,
    hp_temporario INTEGER NOT NULL DEFAULT 0,
    stamina_maxima INTEGER NOT NULL,
    stamina_atual INTEGER NOT NULL,
    stamina_temporaria INTEGER NOT NULL DEFAULT 0,
    ataque INTEGER NOT NULL DEFAULT 0,
    ataque_especial INTEGER NOT NULL DEFAULT 0,
    defesa INTEGER NOT NULL DEFAULT 0,
    defesa_especial INTEGER NOT NULL DEFAULT 0,
    speed INTEGER NOT NULL DEFAULT 0,
    tecnica INTEGER NOT NULL DEFAULT 0,
    respeito INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE pokemon_status (
    pokemon_id VARCHAR(255) NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
    condicao VARCHAR(50) NOT NULL,
    PRIMARY KEY (pokemon_id, condicao)
);

CREATE TABLE pokemon_habilidade (
    pokemon_id VARCHAR(255) NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
    habilidade_id VARCHAR(255) NOT NULL REFERENCES habilidade(id) ON DELETE CASCADE,
    PRIMARY KEY (pokemon_id, habilidade_id)
);

CREATE TABLE pokemon_movimento (
    pokemon_id VARCHAR(255) NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
    movimento_id VARCHAR(255) NOT NULL REFERENCES movimento(id) ON DELETE CASCADE,
    PRIMARY KEY (pokemon_id, movimento_id)
);

CREATE INDEX idx_pokemon_perfil ON pokemon(perfil_id);
CREATE INDEX idx_pokemon_ordem_time ON pokemon(perfil_id, ordem_time);
