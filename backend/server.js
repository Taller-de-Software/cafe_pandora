import http from "http";
import app from "./src/main.js";
import setupSocket from "./src/config/socket.js";
import env from "./src/config/env.js";

const PORT = env.PORT || 3001;

const server = http.createServer(app);
const io = setupSocket(server);

app.set("io", io);
global.io = io;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
