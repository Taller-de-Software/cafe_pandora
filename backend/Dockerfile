FROM node:26.3.1-slim

RUN npm install -g pnpm@11.8.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY prisma/ ./prisma/
RUN pnpm prisma generate

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "pnpm install && pnpm dev"]
