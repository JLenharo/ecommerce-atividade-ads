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

module.exports = db;
