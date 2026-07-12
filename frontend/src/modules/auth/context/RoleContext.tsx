import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

const ROLES_STORAGE_KEY = 'roles'

export interface Role {
  nombre: string
  pin?: string
}

interface RoleContextValue {
  roles: Role[]
  addRole: (nombre: string, pin?: string) => void
}

const DEFAULT_ROLES: Role[] = [
  { nombre: 'administrador' },
  { nombre: 'mesero' },
]

export const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<Role[]>(() => {
    try {
      const raw = localStorage.getItem(ROLES_STORAGE_KEY)
      if (!raw) return DEFAULT_ROLES
      return JSON.parse(raw)
    } catch {
      return DEFAULT_ROLES
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles))
    } catch {}
  }, [roles])

  const addRole = useCallback((nombre: string, pin?: string) => {
    setRoles((prev) => {
      const lower = nombre.toLowerCase().trim()
      if (!lower || prev.some((r) => r.nombre === lower)) return prev
      return [...prev, { nombre: lower, ...(pin ? { pin } : {}) }]
    })
  }, [])

  return (
    <RoleContext.Provider value={{ roles, addRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRoles(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRoles debe usarse dentro de RoleProvider')
  return ctx
}
