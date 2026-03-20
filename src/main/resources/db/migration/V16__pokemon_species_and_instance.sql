CREATE TABLE pokemon_species (
    id VARCHAR(255) PRIMARY KEY,
    pokedex_id INTEGER NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    imagem_url VARCHAR(512),
    sprite_shiny_url VARCHAR(512),
    tipo_primario VARCHAR(50) NOT NULL,
    tipo_secundario VARCHAR(50),
    base_hp INTEGER NOT NULL DEFAULT 1,
    base_ataque INTEGER NOT NULL DEFAULT 1,
    base_defesa INTEGER NOT NULL DEFAULT 1,
    base_ataque_especial INTEGER NOT NULL DEFAULT 1,
    base_defesa_especial INTEGER NOT NULL DEFAULT 1,
    base_speed INTEGER NOT NULL DEFAULT 1,
    growth_rate VARCHAR(100),
    base_experience INTEGER,
    capture_rate INTEGER,
    abilities TEXT,
    height INTEGER,
    weight INTEGER,
    habitat VARCHAR(100),
    legendary BOOLEAN NOT NULL DEFAULT FALSE,
    mythical BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE pokemon_instance (
    id VARCHAR(255) PRIMARY KEY,
    perfil_id VARCHAR(255) NOT NULL REFERENCES perfil_jogador(id) ON DELETE CASCADE,
    species_id VARCHAR(255) NOT NULL REFERENCES pokemon_species(id) ON DELETE RESTRICT,
    ordem_time INTEGER,
    apelido VARCHAR(255),
    notas TEXT,
    genero VARCHAR(50) NOT NULL,
    is_shiny BOOLEAN NOT NULL DEFAULT FALSE,
    personalidade_id VARCHAR(255) REFERENCES personalidade(id) ON DELETE SET NULL,
    especializacao VARCHAR(50),
    berry_favorita VARCHAR(255),
    nivel_de_vinculo INTEGER NOT NULL DEFAULT 0,
    nivel INTEGER NOT NULL DEFAULT 1,
    xp_atual INTEGER NOT NULL DEFAULT 0,
    pokebola_captura VARCHAR(50) NOT NULL,
    item_segurado_id VARCHAR(255) REFERENCES item(id) ON DELETE SET NULL,
    stamina_maxima INTEGER NOT NULL DEFAULT 10,
    tecnica INTEGER NOT NULL DEFAULT 0,
    respeito INTEGER NOT NULL DEFAULT 0,
    iv_hp INTEGER NOT NULL DEFAULT 0,
    iv_ataque INTEGER NOT NULL DEFAULT 0,
    iv_defesa INTEGER NOT NULL DEFAULT 0,
    iv_ataque_especial INTEGER NOT NULL DEFAULT 0,
    iv_defesa_especial INTEGER NOT NULL DEFAULT 0,
    iv_speed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE pokemon_instance_status (
    pokemon_instance_id VARCHAR(255) NOT NULL REFERENCES pokemon_instance(id) ON DELETE CASCADE,
    condicao VARCHAR(50) NOT NULL,
    PRIMARY KEY (pokemon_instance_id, condicao)
);

CREATE TABLE pokemon_instance_habilidade (
    pokemon_instance_id VARCHAR(255) NOT NULL REFERENCES pokemon_instance(id) ON DELETE CASCADE,
    habilidade_id VARCHAR(255) NOT NULL REFERENCES habilidade(id) ON DELETE CASCADE,
    PRIMARY KEY (pokemon_instance_id, habilidade_id)
);

CREATE TABLE pokemon_instance_movimento (
    pokemon_instance_id VARCHAR(255) NOT NULL REFERENCES pokemon_instance(id) ON DELETE CASCADE,
    movimento_id VARCHAR(255) NOT NULL REFERENCES movimento(id) ON DELETE CASCADE,
    PRIMARY KEY (pokemon_instance_id, movimento_id)
);

CREATE INDEX idx_pokemon_instance_perfil ON pokemon_instance(perfil_id);
CREATE INDEX idx_pokemon_instance_ordem_time ON pokemon_instance(perfil_id, ordem_time);
CREATE INDEX idx_pokemon_instance_species ON pokemon_instance(species_id);

INSERT INTO pokemon_species (
    id, pokedex_id, nome, imagem_url, sprite_shiny_url,
    tipo_primario, tipo_secundario,
    base_hp, base_ataque, base_defesa, base_ataque_especial, base_defesa_especial, base_speed,
    growth_rate, base_experience, capture_rate, abilities, legendary, mythical
) VALUES (
    'species-0',
    0,
    'Desconhecido',
    NULL,
    NULL,
    'NORMAL',
    NULL,
    10, 10, 10, 10, 10, 10,
    'unknown',
    0,
    255,
    NULL,
    FALSE,
    FALSE
) ON CONFLICT (pokedex_id) DO NOTHING;

DELETE FROM pokemon;
