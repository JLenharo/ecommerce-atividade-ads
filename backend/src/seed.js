const db = require("./database");
const fs = require("fs");
const path = require("path");

const seed = fs.readFileSync(path.resolve(__dirname, "../../database/seed.sql"), "utf8");
db.exec(seed);
console.log("Banco preparado com sucesso em database/ecommerce.db");
db.close();
