import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { getNetworkInterfaces, getServerPort } from "./config/network.js";

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

const staticOrigins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"];

async function buildCorsOrigins() {
  const envOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
    : [];
  try {
    const interfaces = await getNetworkInterfaces();
    const port = getServerPort();
    const networkUrls = interfaces
      .filter((i) => !i.internal)
      .map((i) => `http://${i.address}:${port}`);
    return [...new Set([...staticOrigins, ...envOrigins, ...networkUrls])];
  } catch {
    return [...new Set([...staticOrigins, ...envOrigins])];
  }
}

let corsOrigins = staticOrigins;

buildCorsOrigins().then((origins) => {
  corsOrigins = origins;
  console.log("[CORS] Orígenes permitidos:", corsOrigins);
});

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
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

app.get("/api/health", async (req, res) => {
  try {
    const interfaces = await getNetworkInterfaces();
    const preferred = interfaces.find((i) => i.preferred);
    const hostname = os.hostname();
    const port = getServerPort();

    let dbOk = false;
    try {
      const prisma = (await import("./config/db.config.js")).default;
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {}

    let socketClients = 0;
    if (global.io) {
      for (const [, ] of global.io.sockets.sockets) {
        socketClients++;
      }
    }

    res.json({
      success: true,
      message: "API Cafe Pandora funcionando",
      data: {
        hostname,
        ip: preferred?.address || interfaces.find((i) => !i.internal)?.address || hostname,
        port,
        uptime: process.uptime(),
        database: dbOk ? "connected" : "disconnected",
        socket: { clients: socketClients },
      },
    });
  } catch {
    res.json({ success: true, message: "API Cafe Pandora funcionando" });
  }
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

app.use("/uploads", express.static(path.join(__dirname, "../../uploads"), {
  setHeaders(res) {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  },
}));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    data: null,
  });
});

app.use(errorHandler);

export default app;
