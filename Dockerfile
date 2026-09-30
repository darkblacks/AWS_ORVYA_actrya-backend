FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["sh", "-c", "npm run migration:run:prod && node dist/main.js"]	
