# Kalkulačka nákladov kotolne

Aplikácia na výpočet a archiváciu nákladov na teplo, plyn, elektrinu a vodu pre bytové domy.

## Funkcie
- Výpočet energetického výkonu (GJ, kWh)
- Rozpočítanie nákladov na plyn, elektrinu a vodu
- Sledovanie spotreby cez hlavné a podružné merače
- Archív dát podľa rokov v SQLite databáze
- Export výsledkov

## Inštalácia

1. Naklonujte repozitár:
   ```bash
   git clone https://github.com/vas-uzivatel/kalkulacka-kotolne.git
   cd kalkulacka-kotolne
   ```

2. Nainštalujte závislosti:
   ```bash
   npm install
   ```

3. Pripravte prostredie:
   - Skopírujte `.env.example` do `.env` (ak sú potrebné API kľúče)
   ```bash
   cp .env.example .env
   ```

4. Spustite aplikáciu:
   - **Vývojový režim:**
     ```bash
     npm run dev
     ```
   - **Produkčný režim:**
     ```bash
     npm run build
     npm start
     ```

## Inštalácia cez Docker (ZimaOS / CasaOS)

Aplikáciu môžete jednoducho spustiť ako Docker kontajner:

1. **Pomocou Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Manuálne (ZimaOS App Store / Custom App):**
   - **Image:** zostavte si vlastný pomocou priloženého `Dockerfile`
   - **Porty:** `3000:3000`
   - **Volume:** `/cesta/k/datam:/app/data` (pre zachovanie databázy)
   - **Environment:** `DATABASE_PATH=/app/data/database.sqlite`

Aplikácia bude dostupná na `http://<ip-adresa-zariadenia>:3000`.

## Technológie
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, SQLite
- **Nástroje:** tsx (pre beh TypeScript servera)

## Licencia
MIT
