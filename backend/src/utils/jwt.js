import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { TOKEN_EXPIRACION } from "../config/constants.js";

export function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRACION.ACCESS });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: TOKEN_EXPIRACION.REFRESH });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
