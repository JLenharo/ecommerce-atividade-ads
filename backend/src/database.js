const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const databaseDir = path.resolve(__dirname, "../../database");
const databaseFile = path.join(databaseDir, "ecommerce.db");
if (!fs.existsSync(databaseDir)) fs.mkdirSync(databaseDir, { recursive: true });

const db = new Database(databaseFile);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

const schema = fs.readFileSync(path.join(databaseDir, "schema.sql"), "utf8");
db.exec(schema);

const localCovers = {
  1: "/assets/covers/verity.webp",
  2: "/assets/covers/quarta-asa.webp",
  3: "/assets/covers/a-empregada.webp",
  4: "/assets/covers/lua-caida.webp",
  5: "/assets/covers/assim-que-acaba.webp",
  6: "/assets/covers/principe-cruel.webp",
  7: "/assets/covers/evelyn-hugo.webp",
  8: "/assets/covers/orgulho-preconceito.webp"
};
const updateCover = db.prepare("UPDATE products SET image_url = ? WHERE id = ?");
for (const [id, cover] of Object.entries(localCovers)) updateCover.run(cover, Number(id));

module.exports = db;
