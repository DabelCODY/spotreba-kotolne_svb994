import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  const db = await open({
    filename: process.env.DATABASE_PATH || "./database.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS archives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  app.get("/api/archives", async (req, res) => {
    try {
      const archives = await db.all("SELECT * FROM archives ORDER BY created_at DESC");
      res.json(archives.map(a => ({ ...a, data: JSON.parse(a.data) })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch archives" });
    }
  });

  app.post("/api/archives", async (req, res) => {
    try {
      const { date, data } = req.body;
      await db.run(
        "INSERT INTO archives (date, data) VALUES (?, ?)",
        [date, JSON.stringify(data)]
      );
      res.status(201).json({ message: "Archive saved successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save archive" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
