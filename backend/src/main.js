import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./modules/auth/auth.routes.js";
import usuariosRoutes from "./modules/usuarios/usuarios.routes.js";
import menuRoutes from "./modules/menu/menu.routes.js";
import mesasRoutes from "./modules/mesas/mesas.routes.js";
import pedidosRoutes from "./modules/pedidos/pedidos.routes.js";
import facturasRoutes from "./modules/facturas/facturas.routes.js";
import impresionRoutes from "./modules/impresion/impresion.routes.js";
import ventasRoutes from "./modules/ventas/ventas.routes.js";
import cajaRoutes from "./modules/caja/caja.routes.js";
import metodosPagoRoutes from "./modules/metodos_pago/metodos_pago.routes.js";
import reservasRoutes from "./modules/reservas/reservas.routes.js";
import configuracionRoutes from "./modules/configuracion/configuracion.routes.js";
import diagnosticoRoutes from "./modules/diagnostico/diagnostico.routes.js";
import redRoutes from "./modules/red/red.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demasiadas peticiones. Intenta de nuevo en 15 minutos." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

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
app.use("/api/ventas", ventasRoutes);
app.use("/api/caja", cajaRoutes);
app.use("/api/metodos-pago", metodosPagoRoutes);
app.use("/api/configuracion", configuracionRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/diagnostico", diagnosticoRoutes);
app.use("/api/red", redRoutes);

app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    data: null,
  });
});

app.use(errorHandler);

export default app;
