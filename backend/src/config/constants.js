export const ROLES = {
  ADMIN: "administrador",
  MESERO: "mesero",
};

export const ESTADOS_PEDIDO = {
  ESPERA: "espera",
  PREPARACION: "preparacion",
  LISTO: "listo",
  CAJA: "caja",
  FACTURADO: "facturado",
  CANCELADO: "cancelado",
};

export const ESTADOS_MESA = {
  VACIA: "vacia",
  OCUPADA: "ocupada",
  POR_PAGAR: "por_pagar",
  RESERVADA: "reservada",
};

export const METODOS_PAGO = {
  EFECTIVO: "efectivo",
  TRANSFERENCIA: "transferencia",
  TARJETA: "tarjeta",
};

export const TOKEN_EXPIRACION = {
  ACCESS: "15m",
  REFRESH: "7d",
};
