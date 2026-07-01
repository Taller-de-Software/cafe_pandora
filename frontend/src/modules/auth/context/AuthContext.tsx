import { type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { login as loginApi, getMe, type Usuario, type LoginRequest } from '../data/auth'
import { storage } from '@/services/storage'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery<Usuario>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      if (!storage.getAccessToken()) throw new Error('No token')
      return getMe()
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (res) => {
      storage.setAccessToken(res.accessToken)
      storage.setRefreshToken(res.refreshToken)
      storage.setUser(res.usuario)
      queryClient.setQueryData(['auth', 'me'], res.usuario)
    },
  })

  const login = async (data: LoginRequest) => {
    await loginMutation.mutateAsync(data)
  }

  const logout = () => {
    storage.clear()
    queryClient.clear()
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        loading: isLoading || loginMutation.isPending,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
