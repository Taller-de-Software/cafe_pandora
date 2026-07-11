import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

const PROFILE_STORAGE_KEY = 'profileSettings'

export interface ProfileSettings {
  nombre: string
}

interface ProfileContextValue {
  profile: ProfileSettings
  saveProfile: (data: Partial<ProfileSettings>) => void
}

const DEFAULT_PROFILE: ProfileSettings = {
  nombre: 'Administrador',
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileSettings>(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (!raw) return DEFAULT_PROFILE
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
    } catch {
      return DEFAULT_PROFILE
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    } catch {}
  }, [profile])

  const saveProfile = useCallback((data: Partial<ProfileSettings>) => {
    setProfile((prev) => ({ ...prev, ...data }))
  }, [])

  return (
    <ProfileContext.Provider value={{ profile, saveProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile debe usarse dentro de ProfileProvider')
  return ctx
}
