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

2. **Inštalácia cez ZimaOS / CasaOS App Store (Custom App):**

Skopírujte tento YAML do konfigurácie "Custom App":

```yaml
name: Spotreba Kotolne React
services:
  app:
    image: ghcr.io/dabelcody/spotreba-kotolne_svb994:latest
    container_name: kotolna_react
    ports:
      - "8080:80" # Aplikácia bude dostupná na porte 8080 tvojho servera
    volumes:
      - /DATA/AppData/kotolna:/app/data
    environment:
      - DATABASE_PATH=/app/data/database.sqlite
    restart: always
x-casaos:
  author: DabelCODY
  icon: https://cdn-icons-png.flaticon.com/512/930/930353.png
  title:
    en_us: Spotreba Kotolne
    sk_sk: Spotreba Kotolne
```

Aplikácia bude dostupná na `http://<ip-adresa-zariadenia>:8080`.

## Technológie
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, SQLite
- **Nástroje:** tsx (pre beh TypeScript servera)

## Licencia
MIT
