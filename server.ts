import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Initialize SQLite
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  // Create table if not exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS archives (
      year INTEGER PRIMARY KEY,
      data TEXT NOT NULL
    )
  `);

  // API routes
  app.get("/api/archive", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM archives");
      const archive = rows.reduce((acc, row) => {
        acc[row.year] = JSON.parse(row.data);
        return acc;
      }, {});
      res.json(archive);
    } catch (error) {
      console.error("Error fetching archive:", error);
      res.status(500).json({ error: "Failed to fetch archive" });
    }
  });

  app.post("/api/archive", async (req, res) => {
    try {
      const { year, data } = req.body;
      if (!year || !data) {
        return res.status(400).json({ error: "Year and data are required" });
      }
      await db.run(
        "INSERT OR REPLACE INTO archives (year, data) VALUES (?, ?)",
        [year, JSON.stringify(data)]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving archive:", error);
      res.status(500).json({ error: "Failed to save archive" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
