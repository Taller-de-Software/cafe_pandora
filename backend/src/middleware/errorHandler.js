import { z } from "zod";

export const errorHandler = (err, req, res, next) => {
  if (err instanceof z.ZodError) {
    const flat = err.flatten();
    return res.status(400).json({
      success: false,
      message: "Datos inválidos",
      errors: flat.fieldErrors,
    });
  }

  if (err.code && err.code.startsWith("P")) {
    let message = "Error de base de datos";
    let status = 500;

    if (err.code === "P2002") {
      message = "El valor ya existe (campo único)";
      status = 409;
    }
    if (err.code === "P2025") {
      message = "Registro no encontrado";
      status = 404;
    }

    return res.status(status).json({
      success: false,
      message,
      data: null,
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || "Error",
      data: null,
    });
  }

  console.error("Error no manejado:", err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    data: null,
  });
};
