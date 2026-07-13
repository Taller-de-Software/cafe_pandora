import { z } from "zod";

const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Datos inválidos",
      errors: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};

export const validateId = (req, res, next) => {
  const result = idSchema.safeParse(req.params);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "ID inválido",
      errors: result.error.flatten().fieldErrors,
    });
  }
  req.params.id = result.data.id;
  next();
};
