import prisma from "../../config/db.config.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const listarCategorias = async () => {
  return prisma.categoria.findMany({
    include: {
      _count: { select: { productos: true, subcategorias: true } },
    },
  });
};

export const crearCategoria = async (data) => {
  return prisma.categoria.create({ data });
};

export const actualizarCategoria = async (id, data) => {
  return prisma.categoria.update({ where: { id }, data });
};

export const listarSubcategorias = async (categoriaId) => {
  const where = categoriaId ? { categoriaId } : {};
  return prisma.subcategoria.findMany({
    where,
    include: {
      categoria: { select: { id: true, nombre: true } },
      _count: { select: { productos: true } },
    },
    orderBy: { nombre: "asc" },
  });
};

export const crearSubcategoria = async (data) => {
  return prisma.subcategoria.create({ data });
};

export const actualizarSubcategoria = async (id, data) => {
  return prisma.subcategoria.update({ where: { id }, data });
};

export const eliminarSubcategoria = async (id) => {
  const productos = await prisma.producto.count({ where: { subcategoriaId: id } });
  if (productos > 0) {
    throw crearError(400, "No se puede eliminar: subcategoría con productos asociados");
  }
  return prisma.subcategoria.delete({ where: { id } });
};

export const eliminarCategoria = async (id) => {
  const productos = await prisma.producto.count({ where: { categoriaId: id } });
  if (productos > 0) {
    throw crearError(400, "No se puede eliminar: categoría con productos asociados");
  }
  return prisma.categoria.delete({ where: { id } });
};

export const listarProductos = async (categoriaId) => {
  const where = categoriaId ? { categoriaId } : {};
  return prisma.producto.findMany({
    where,
    include: {
      categoria: { select: { id: true, nombre: true } },
      subcategoria: { select: { id: true, nombre: true } },
    },
    orderBy: { categoriaId: "asc" },
  });
};

export const obtenerProducto = async (id) => {
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: { categoria: true, subcategoria: true },
  });
  if (!producto) throw crearError(404, "Producto no encontrado");
  return producto;
};

export const crearProducto = async (data) => {
  return prisma.producto.create({ data });
};

export const actualizarProducto = async (id, data) => {
  return prisma.producto.update({ where: { id }, data });
};

export const eliminarProducto = async (id) => {
  return prisma.producto.delete({ where: { id } });
};
