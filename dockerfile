# 1. Krok: Build aplikácie
FROM node:18-alpine AS build
WORKDIR /app

# Skopírujeme súbory pre npm
COPY package*.json ./
RUN npm install

# Skopírujeme kód a zostavíme ho
COPY . .
RUN npm run build

# 2. Krok: Servovanie cez Nginx
FROM nginx:stable-alpine
# Vite štandardne ukladá build do prieèinka 'dist'
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]