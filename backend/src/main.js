import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes.js";
import usuariosRoutes from "./modules/usuarios/usuarios.routes.js";
import menuRoutes from "./modules/menu/menu.routes.js";
import mesasRoutes from "./modules/mesas/mesas.routes.js";
import pedidosRoutes from "./modules/pedidos/pedidos.routes.js";
import facturasRoutes from "./modules/facturas/facturas.routes.js";
import impresionRoutes from "./modules/impresion/impresion.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API Pandora Cafe Bar funcionando" });
});

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/mesas", mesasRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/facturas", facturasRoutes);
app.use("/api/impresion", impresionRoutes);

app.use(errorHandler);

export default app;
