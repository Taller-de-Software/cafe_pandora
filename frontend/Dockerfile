FROM node:26.3.1-slim

RUN npm install -g pnpm@11.8.0

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN CI=true pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
