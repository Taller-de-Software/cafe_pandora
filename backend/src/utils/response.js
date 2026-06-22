export const ok = (res, data, message = 'OK', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const created = (res, data, message = 'Creado exitosamente') => {
  return ok(res, data, message, 201);
};

export const error = (res, message = 'Error interno', status = 500) => {
  return res.status(status).json({
    success: false,
    message,
    data: null,
  });
};

export const notFound = (res, message = 'No encontrado') => {
  return error(res, message, 404);
};

export const unauthorized = (res, message = 'No autorizado') => {
  return error(res, message, 401);
};

export const forbidden = (res, message = 'Acceso denegado') => {
  return error(res, message, 403);
};

export const badRequest = (res, message = 'Datos inválidos') => {
  return error(res, message, 400);
};
