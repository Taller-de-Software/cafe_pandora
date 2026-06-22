function setupPedidosSocket(io) {
  io.on("connection", (socket) => {
    socket.on("pedido:nuevo", (data) => {
      socket.to("room:ADMIN").emit("pedido:nuevo", data);
    });

    socket.on("pedido:estado", (data) => {
      socket.to("room:all").emit("pedido:estado", data);
    });

    socket.on("detalle:completado", (data) => {
      socket.to("room:all").emit("detalle:completado", data);
    });

    socket.on("pedido:fusionado", (data) => {
      socket.to("room:all").emit("pedido:fusionado", data);
    });
  });
}

export default setupPedidosSocket;
