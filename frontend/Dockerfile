FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Con volumen ./frontend:/app, node_modules se monta aparte; instalar al arrancar
CMD ["sh", "-c", "npm install && npm run dev"]
