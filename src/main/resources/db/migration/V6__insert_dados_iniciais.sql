-- Itens iniciais para o catálogo (permite testar a mochila)
INSERT INTO item (id, nome, descricao, peso, preco) VALUES
('item-pocao', 'Poção', 'Restaura 20 HP de um Pokémon.', 0.1, 200),
('item-super-pocao', 'Super Poção', 'Restaura 50 HP de um Pokémon.', 0.2, 700),
('item-pokeball', 'Poké Bola', 'Permite capturar Pokémon selvagens.', 0.1, 200),
('item-greatball', 'Great Bola', 'Taxa de captura melhor que a Poké Bola.', 0.2, 600)
ON CONFLICT (id) DO NOTHING;
