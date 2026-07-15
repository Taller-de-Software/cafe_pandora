import http from "http";
import app from "./src/main.js";
import setupSocket from "./src/config/socket.js";
import env from "./src/config/env.js";
import { getBindAddress, getServerPort, getConfig } from "./src/config/network.js";

const server = http.createServer(app);
const io = setupSocket(server);

app.set("io", io);
global.io = io;

async function start() {
  await getConfig();

  const PORT = env.PORT || getServerPort();
  const HOST = getBindAddress();

  server.listen(PORT, HOST, () => {
    const displayHost = HOST === "0.0.0.0" ? "0.0.0.0 (todas las interfaces)" : HOST;
    console.log(`Servidor corriendo en http://${displayHost}:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Error al iniciar servidor:", err);
  process.exit(1);
});
