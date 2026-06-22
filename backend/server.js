import http from "http";
import app from "./src/main.js";
import setupSocket from "./src/config/socket.js";
import env from "./src/config/env.js";
import { verificarYSeed } from "./src/config/db.config.js";

const PORT = env.PORT || 3001;

await verificarYSeed();

const server = http.createServer(app);
const io = setupSocket(server);

app.set("io", io);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto http://localhost:${PORT}`);
});
