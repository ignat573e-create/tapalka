// Tapalka Server — Node + Express + SQLite
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 3001;

let db;

(async () => {
  db = await open({
    filename: "./tapalka.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      taps INTEGER DEFAULT 0,
      rebirths INTEGER DEFAULT 0,
      balance REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      rarity TEXT,
      price REAL,
      for_sale INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  console.log("✅ SQLite ready");
})();

// Получить всех пользователей
app.get("/api/users", async (req, res) => {
  const users = await db.all("SELECT * FROM users");
  res.json(users);
});

// Зарегистрировать нового
app.post("/api/users", async (req, res) => {
  const { name } = req.body;
  const result = await db.run("INSERT INTO users (name) VALUES (?)", [name]);
  res.json({ id: result.lastID, name });
});

// Обновить прогресс
app.post("/api/progress", async (req, res) => {
  const { id, taps, rebirths, balance } = req.body;
  await db.run(
    "UPDATE users SET taps=?, rebirths=?, balance=? WHERE id=?",
    [taps, rebirths, balance, id]
  );
  res.json({ ok: true });
});

// Получить коллекцию пользователя
app.get("/api/items/:userId", async (req, res) => {
  const { userId } = req.params;
  const items = await db.all("SELECT * FROM items WHERE user_id=?", [userId]);
  res.json(items);
});

// Добавить предмет пользователю
app.post("/api/items", async (req, res) => {
  const { user_id, name, rarity, price } = req.body;
  const result = await db.run(
    "INSERT INTO items (user_id, name, rarity, price) VALUES (?, ?, ?, ?)",
    [user_id, name, rarity, price]
  );
  res.json({ id: result.lastID });
});

// Продажа предмета
app.post("/api/market/sell", async (req, res) => {
  const { item_id, price } = req.body;
  await db.run("UPDATE items SET price=?, for_sale=1 WHERE id=?", [price, item_id]);
  res.json({ ok: true });
});

// Покупка предмета
app.post("/api/market/buy", async (req, res) => {
  const { buyer_id, item_id } = req.body;

  const item = await db.get("SELECT * FROM items WHERE id=?", [item_id]);
  if (!item || !item.for_sale) return res.status(400).json({ error: "Item not for sale" });

  const seller = await db.get("SELECT * FROM users WHERE id=?", [item.user_id]);
  const buyer = await db.get("SELECT * FROM users WHERE id=?", [buyer_id]);

  if (buyer.balance < item.price) return res.status(400).json({ error: "Not enough money" });

  const fee = item.price * 0.05; // комиссия 5%
  const net = item.price - fee;

  await db.run("UPDATE users SET balance=balance-? WHERE id=?", [item.price, buyer_id]);
  await db.run("UPDATE users SET balance=balance+? WHERE id=?", [net, seller.id]);

  await db.run("UPDATE items SET user_id=?, for_sale=0 WHERE id=?", [buyer_id, item_id]);
  res.json({ ok: true });
});

// Получить рынок
app.get("/api/market", async (req, res) => {
  const items = await db.all("SELECT * FROM items WHERE for_sale=1");
  res.json(items);
});

app.listen(PORT, () => console.log(`🚀 Tapalka server running on http://localhost:${PORT}`));
