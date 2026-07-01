const KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const

export const storage = {
  getAccessToken: () => localStorage.getItem(KEYS.ACCESS_TOKEN),
  setAccessToken: (token: string) => localStorage.setItem(KEYS.ACCESS_TOKEN, token),
  getRefreshToken: () => localStorage.getItem(KEYS.REFRESH_TOKEN),
  setRefreshToken: (token: string) => localStorage.setItem(KEYS.REFRESH_TOKEN, token),
  getUser: () => {
    const raw = localStorage.getItem(KEYS.USER)
    return raw ? JSON.parse(raw) : null
  },
  setUser: (user: unknown) => localStorage.setItem(KEYS.USER, JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem(KEYS.ACCESS_TOKEN)
    localStorage.removeItem(KEYS.REFRESH_TOKEN)
    localStorage.removeItem(KEYS.USER)
  },
}
