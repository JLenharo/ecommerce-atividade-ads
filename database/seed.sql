PRAGMA foreign_keys = OFF;
DELETE FROM sale_items; DELETE FROM sales; DELETE FROM customers; DELETE FROM products; DELETE FROM categories;
DELETE FROM sqlite_sequence WHERE name IN ('categories','products','customers','sales','sale_items');
PRAGMA foreign_keys = ON;

INSERT INTO categories (id,name) VALUES
(1,'Romance'),(2,'Fantasia'),(3,'Suspense'),(4,'Clássicos');

INSERT INTO products (id,name,description,price,stock,image_url,category_id,active) VALUES
(1,'Verity — Colleen Hoover','Um suspense psicológico intenso sobre uma escritora contratada para concluir a obra de uma autora famosa e os segredos perturbadores que encontra.',35.87,18,'https://covers.openlibrary.org/isbn/9781538724736-L.jpg',3,1),
(2,'Quarta Asa — Rebecca Yarros','Dragões, rivalidades e uma academia militar mortal dão início à série O Empyriano.',131.50,12,'https://covers.openlibrary.org/isbn/9781649374042-L.jpg',2,1),
(3,'A Empregada — Freida McFadden','Um thriller cheio de reviravoltas sobre uma casa aparentemente perfeita e uma funcionária que percebe que nada é o que parece.',44.90,20,'https://covers.openlibrary.org/isbn/9781728296210-L.jpg',3,1),
(4,'O Despertar da Lua Caída — Sarah A. Parker','Uma fantasia épica de dragões, magia, destinos cruzados e segredos capazes de transformar reinos.',69.90,10,'https://covers.openlibrary.org/isbn/9786559704156-L.jpg',2,1),
(5,'É Assim que Acaba — Colleen Hoover','Uma história marcante sobre amor, escolhas difíceis e a coragem necessária para romper ciclos.',39.90,15,'https://covers.openlibrary.org/isbn/9781501110368-L.jpg',1,1),
(6,'O Príncipe Cruel — Holly Black','Jude precisa conquistar seu lugar na perigosa Corte das Fadas enquanto enfrenta o príncipe Cardan.',54.90,11,'https://covers.openlibrary.org/isbn/9780316310314-L.jpg',2,1),
(7,'Os Sete Maridos de Evelyn Hugo — Taylor Jenkins Reid','Uma lendária estrela de Hollywood decide contar sua verdadeira história a uma jornalista desconhecida.',49.90,16,'https://covers.openlibrary.org/isbn/9781501161933-L.jpg',1,1),
(8,'Orgulho e Preconceito — Jane Austen','O clássico romance de Elizabeth Bennet e Mr. Darcy em uma edição para novos leitores.',34.90,14,'https://covers.openlibrary.org/isbn/9780141439518-L.jpg',4,1);
