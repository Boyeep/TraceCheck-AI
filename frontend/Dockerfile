FROM node:20-alpine

WORKDIR /app/frontend

COPY frontend/package.json ./package.json

RUN npm install

WORKDIR /app

COPY shared ./shared
COPY frontend/index.html ./frontend/index.html
COPY frontend/tsconfig.json ./frontend/tsconfig.json
COPY frontend/tsconfig.app.json ./frontend/tsconfig.app.json
COPY frontend/tsconfig.node.json ./frontend/tsconfig.node.json
COPY frontend/vite.config.ts ./frontend/vite.config.ts
COPY frontend/src ./frontend/src
COPY frontend/.env.example ./frontend/.env.example

WORKDIR /app/frontend

RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
