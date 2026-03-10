                                                                                                                           # Základný obraz s Pythonom
FROM python:3.10-slim

# Nastavenie pracovného prieèinka vnútri kontajnera
WORKDIR /app

# Inštalácia systémových závislostí
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Skopírovanie zoznamu knižníc a ich inštalácia
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Skopírovanie celého kódu aplikácie
COPY . .

# Port, na ktorom beží Streamlit
EXPOSE 8501

# Príkaz na spustenie aplikácie (predpokladám, že tvoj hlavný súbor je app.py)
ENTRYPOINT ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]