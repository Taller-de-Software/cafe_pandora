import { useState, useEffect, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { login as loginApi, register as registerApi, getMe, type Usuario, type LoginRequest } from '../data/auth'
import { storage } from '@/services/storage'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null)

  const { data: user, isLoading, isError } = useQuery<Usuario>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      if (!storage.getAccessToken()) throw new Error('No token')
      return getMe()
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (isError && storage.getAccessToken()) {
      storage.clear()
      window.location.href = '/'
    }
  }, [isError])

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (res) => {
      storage.setAccessToken(res.accessToken)
      storage.setRefreshToken(res.refreshToken)
      storage.setUser(res.usuario)
      queryClient.setQueryData(['auth', 'me'], res.usuario)
    },
  })

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (res) => {
      storage.setAccessToken(res.accessToken)
      storage.setRefreshToken(res.refreshToken)
      storage.setUser(res.usuario)
      queryClient.setQueryData(['auth', 'me'], res.usuario)
      setIsFirstUser(res.esPrimero)
    },
  })

  const login = async (data: LoginRequest) => {
    await loginMutation.mutateAsync(data)
  }

  const register = async (pin?: string) => {
    await registerMutation.mutateAsync(pin)
  }

  const logout = () => {
    storage.clear()
    queryClient.clear()
    setIsFirstUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        loading: isLoading || loginMutation.isPending || registerMutation.isPending,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isFirstUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
