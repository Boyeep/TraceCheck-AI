FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package.json ./package.json

RUN npm install

WORKDIR /app

COPY shared ./shared
COPY backend/src ./backend/src
COPY backend/.env.example ./backend/.env.example

EXPOSE 8787

WORKDIR /app/backend

CMD ["npm", "run", "start"]
