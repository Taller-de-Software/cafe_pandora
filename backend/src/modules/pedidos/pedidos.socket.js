function setupPedidosSocket(io) {
  io.on("connection", (socket) => {
    socket.on("pedido:nuevo", (data) => {
      try {
        socket.to("room:ADMIN").emit("pedido:nuevo", data);
      } catch (err) {
        console.error("[Socket] Error en pedido:nuevo:", err);
      }
    });

    socket.on("pedido:estado", (data) => {
      try {
        socket.to("room:all").emit("pedido:estado", data);
      } catch (err) {
        console.error("[Socket] Error en pedido:estado:", err);
      }
    });

    socket.on("detalle:completado", (data) => {
      try {
        socket.to("room:all").emit("detalle:completado", data);
      } catch (err) {
        console.error("[Socket] Error en detalle:completado:", err);
      }
    });

    socket.on("pedido:fusionado", (data) => {
      try {
        socket.to("room:all").emit("pedido:fusionado", data);
      } catch (err) {
        console.error("[Socket] Error en pedido:fusionado:", err);
      }
    });
  });
}

export default setupPedidosSocket;
