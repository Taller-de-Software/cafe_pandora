import prisma from "../../config/db.config.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const listarCategorias = async () => {
  return prisma.categoria.findMany({
    include: { _count: { select: { productos: true } } },
  });
};

export const crearCategoria = async (nombre) => {
  return prisma.categoria.create({ data: { nombre } });
};

export const actualizarCategoria = async (id, nombre) => {
  return prisma.categoria.update({ where: { id }, data: { nombre } });
};

export const eliminarCategoria = async (id) => {
  const productos = await prisma.producto.count({ where: { categoriaId: id } });
  if (productos > 0) {
    throw crearError(400, "No se puede eliminar: categoría con productos asociados");
  }
  return prisma.categoria.delete({ where: { id } });
};

export const listarProductos = async (categoriaId) => {
  const where = categoriaId ? { categoriaId, activo: true } : { activo: true };
  return prisma.producto.findMany({
    where,
    include: { categoria: { select: { id: true, nombre: true } } },
    orderBy: { categoriaId: "asc" },
  });
};

export const obtenerProducto = async (id) => {
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: { categoria: true },
  });
  if (!producto) throw crearError(404, "Producto no encontrado");
  return producto;
};

export const crearProducto = async (data) => {
  return prisma.producto.create({
    data: {
      nombre: data.nombre,
      precio: data.precio,
      categoriaId: data.categoriaId,
    },
  });
};

export const actualizarProducto = async (id, data) => {
  return prisma.producto.update({ where: { id }, data });
};

export const eliminarProducto = async (id) => {
  return prisma.producto.update({ where: { id }, data: { activo: false } });
};
