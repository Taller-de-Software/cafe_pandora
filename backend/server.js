import http from "http";
import { pathToFileURL } from "url";
import app, { setupAuthRateLimiter } from "./src/main.js";
import setupSocket from "./src/config/socket.js";
import env from "./src/config/env.js";
import { getBindAddress, getServerPort, getConfig } from "./src/config/network.js";
import prisma from "./src/config/db.config.js";

const server = http.createServer(app);
const io = setupSocket(server);

app.set("io", io);
global.io = io;

export async function startServer() {
  await getConfig();
  await setupAuthRateLimiter(prisma)();

  const PORT = env.PORT || getServerPort();
  const HOST = getBindAddress();

  await new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(PORT, HOST);
  });

  const displayHost = HOST === "0.0.0.0" ? "0.0.0.0 (todas las interfaces)" : HOST;
  console.log(`Servidor corriendo en http://${displayHost}:${PORT}`);

  return { port: PORT, host: HOST };
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  startServer().catch((err) => {
    console.error("Error al iniciar servidor:", err);
    process.exit(1);
  });
}
