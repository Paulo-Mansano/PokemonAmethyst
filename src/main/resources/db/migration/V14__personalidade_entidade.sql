CREATE TABLE personalidade (
    id VARCHAR(255) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

INSERT INTO personalidade (id, nome) VALUES
('OUSADO', 'Ousado'),
('MODESTO', 'Modesto'),
('TIMIDO', 'Timido'),
('CALMO', 'Calmo'),
('SERIO', 'Serio'),
('ALEGRE', 'Alegre'),
('BRAVO', 'Bravo'),
('RELAXADO', 'Relaxado'),
('IMPACIENTE', 'Impaciente'),
('DOCIL', 'Docil');

ALTER TABLE pokemon ADD COLUMN personalidade_id VARCHAR(255) REFERENCES personalidade(id) ON DELETE SET NULL;

UPDATE pokemon SET personalidade_id = personalidade WHERE personalidade IS NOT NULL;

ALTER TABLE pokemon DROP COLUMN personalidade;
