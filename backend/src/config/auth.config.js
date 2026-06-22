export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || "fallback-secret-no-usar-en-prod",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-no-usar-en-prod",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  get refreshTokenExpiresMs() {
    const match = this.jwtRefreshExpiresIn.match(/^(\d+)([dhms])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const num = parseInt(match[1]);
    switch (match[2]) {
      case "d": return num * 24 * 60 * 60 * 1000;
      case "h": return num * 60 * 60 * 1000;
      case "m": return num * 60 * 1000;
      case "s": return num * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  },
};
