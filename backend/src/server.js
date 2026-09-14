const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";

app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "../../frontend")));

const adminOnly = (req, res, next) => {
  if (req.headers["x-admin-key"] !== ADMIN_KEY) {
    return res.status(401).json({ error: "Senha administrativa inválida." });
  }
  next();
};

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.get("/api/categories", (_, res) => {
  res.json(db.prepare("SELECT * FROM categories ORDER BY name").all());
});

app.get("/api/products", (req, res) => {
  const includeInactive = req.query.all === "1" && req.headers["x-admin-key"] === ADMIN_KEY;
  const sql = `SELECT p.*, c.name AS category_name FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${includeInactive ? "" : "WHERE p.active = 1"} ORDER BY p.id DESC`;
  res.json(db.prepare(sql).all());
});

app.post("/api/products", adminOnly, (req, res) => {
  const { name, description = "", price, stock = 0, image_url = "", category_id } = req.body;
  if (!name || Number(price) < 0 || Number(stock) < 0) {
    return res.status(400).json({ error: "Nome, preço e estoque válidos são obrigatórios." });
  }
  const result = db.prepare(`INSERT INTO products
    (name, description, price, stock, image_url, category_id) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(name.trim(), description.trim(), Number(price), Number(stock), image_url.trim(), category_id || null);
  res.status(201).json(db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid));
});

app.put("/api/products/:id", adminOnly, (req, res) => {
  const current = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!current) return res.status(404).json({ error: "Produto não encontrado." });
  const data = { ...current, ...req.body };
  if (!data.name || Number(data.price) < 0 || Number(data.stock) < 0) {
    return res.status(400).json({ error: "Dados do produto inválidos." });
  }
  db.prepare(`UPDATE products SET name=?, description=?, price=?, stock=?,
    image_url=?, category_id=?, active=? WHERE id=?`).run(
      data.name, data.description || "", Number(data.price), Number(data.stock),
      data.image_url || "", data.category_id || null, data.active ? 1 : 0, req.params.id
    );
  res.json(db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id));
});

app.delete("/api/products/:id", adminOnly, (req, res) => {
  const result = db.prepare("UPDATE products SET active = 0 WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Produto não encontrado." });
  res.status(204).end();
});

app.post("/api/sales", (req, res) => {
  const { customer, items } = req.body;
  if (!customer?.name || !customer?.email || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Cliente e itens são obrigatórios." });
  }

  try {
    const sale = db.transaction(() => {
      db.prepare(`INSERT INTO customers (name,email,phone,address) VALUES (?,?,?,?)
        ON CONFLICT(email) DO UPDATE SET name=excluded.name, phone=excluded.phone,
        address=excluded.address`).run(
          customer.name.trim(), customer.email.trim().toLowerCase(),
          customer.phone || "", customer.address || ""
        );
      const savedCustomer = db.prepare("SELECT * FROM customers WHERE email=?")
        .get(customer.email.trim().toLowerCase());

      let total = 0;
      const selected = items.map(item => {
        const product = db.prepare("SELECT * FROM products WHERE id=? AND active=1").get(item.product_id);
        const quantity = Number(item.quantity);
        if (!product || quantity < 1 || product.stock < quantity) {
          throw new Error(`Estoque insuficiente para ${product?.name || "um produto"}.`);
        }
        total += product.price * quantity;
        return { product, quantity };
      });

      const saleResult = db.prepare("INSERT INTO sales (customer_id,total) VALUES (?,?)")
        .run(savedCustomer.id, total);
      const insertItem = db.prepare(`INSERT INTO sale_items
        (sale_id,product_id,quantity,unit_price) VALUES (?,?,?,?)`);
      const lowerStock = db.prepare("UPDATE products SET stock=stock-? WHERE id=?");
      for (const item of selected) {
        insertItem.run(saleResult.lastInsertRowid, item.product.id, item.quantity, item.product.price);
        lowerStock.run(item.quantity, item.product.id);
      }
      return { id: saleResult.lastInsertRowid, total };
    })();
    res.status(201).json({ message: "Compra registrada com sucesso.", ...sale });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/sales", (req, res) => {
  const email = (req.query.email || "").trim().toLowerCase();
  const isAdmin = req.headers["x-admin-key"] === ADMIN_KEY;
  if (!email && !isAdmin) return res.status(400).json({ error: "Informe o e-mail." });

  const sales = db.prepare(`SELECT s.*, c.name AS customer_name, c.email FROM sales s
    JOIN customers c ON c.id=s.customer_id
    ${email ? "WHERE c.email=?" : ""} ORDER BY s.id DESC`).all(...(email ? [email] : []));
  const itemQuery = db.prepare(`SELECT si.*, p.name FROM sale_items si
    JOIN products p ON p.id=si.product_id WHERE si.sale_id=?`);
  res.json(sales.map(sale => ({ ...sale, items: itemQuery.all(sale.id) })));
});

app.patch("/api/sales/:id/status", adminOnly, (req, res) => {
  const allowed = ["Confirmada", "Em preparação", "Enviada", "Concluída", "Cancelada"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Status inválido." });
  const result = db.prepare("UPDATE sales SET status=? WHERE id=?").run(req.body.status, req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Venda não encontrada." });
  res.json({ message: "Status atualizado." });
});

app.get("*", (_, res) => res.sendFile(path.resolve(__dirname, "../../frontend/index.html")));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(PORT, () => console.log(`Loja disponível em http://localhost:${PORT}`));
