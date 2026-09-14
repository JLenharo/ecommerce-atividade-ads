INSERT OR IGNORE INTO categories (id, name) VALUES
(1, 'Eletrônicos'), (2, 'Casa'), (3, 'Acessórios');

INSERT OR IGNORE INTO products
(id, name, description, price, stock, image_url, category_id, active) VALUES
(1, 'Fone Bluetooth', 'Fone sem fio com estojo de carregamento.', 129.90, 15, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700', 1, 1),
(2, 'Teclado Mecânico', 'Teclado compacto com iluminação.', 249.90, 8, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700', 1, 1),
(3, 'Luminária de Mesa', 'Iluminação moderna para estudo e trabalho.', 89.90, 12, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700', 2, 1),
(4, 'Mochila Urbana', 'Mochila resistente com compartimento para notebook.', 179.90, 10, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700', 3, 1);
