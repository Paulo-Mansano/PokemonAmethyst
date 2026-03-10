-- Apenas nome e tipo (tipagem) permanecem obrigatórios; categoria e demais campos opcionais
ALTER TABLE movimento ALTER COLUMN categoria DROP NOT NULL;
