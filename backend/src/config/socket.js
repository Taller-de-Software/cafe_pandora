import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import env from "./env.js";
import setupPedidosSocket from "../modules/pedidos/pedidos.socket.js";

function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Token requerido"));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    const rol = socket.user.rol;
    if (rol === "administrador") {
      socket.join("room:ADMIN");
    }
    socket.join("room:all");
    socket.on("disconnect", () => {});
  });

  setupPedidosSocket(io);

  return io;
}

export default setupSocket;
