export const ROLES = {
  ADMIN: "administrador",
  MESERO: "mesero",
};

export const ESTADOS_PEDIDO = {
  RECIBIDO: "recibido",
  PENDIENTE: "pendiente",
  HECHO: "hecho",
  FINALIZADO: "finalizado",
  CANCELADO: "cancelado",
};

export const ESTADOS_MESA = {
  VACIA: "vacia",
  OCUPADA: "ocupada",
  POR_PAGAR: "por_pagar",
  RESERVADA: "reservada",
  FUERA_DE_SERVICIO: "fuera_de_servicio",
};

export const METODOS_PAGO = {
  EFECTIVO: "efectivo",
  TRANSFERENCIA: "transferencia",
  TARJETA: "tarjeta",
};

export const TOKEN_EXPIRACION = {
  ACCESS: "1h",
  REFRESH: "10h",
};
