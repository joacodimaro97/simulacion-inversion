import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  setUnauthorizedHandler,
  getApiError,
} from '@/api/http'
import { ROUTES } from '@/constants'
import type { User } from '@/types/api'
import { AuthService } from '@/services/AuthService'
import { restoreSession } from '@/utils/sessionRestore'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionError: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  retrySession: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const logout = useCallback(() => {
    clearStoredToken()
    setUser(null)
    setSessionError(null)
    navigate(ROUTES.LOGIN, { replace: true })
  }, [navigate])

  const bootstrapSession = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      setSessionError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setSessionError(null)

    try {
      const me = await restoreSession()
      setUser(me)
    } catch (error) {
      const apiError = getApiError(error)
      if (apiError.statusCode === 401) {
        clearStoredToken()
        setUser(null)
        setSessionError(null)
      } else {
        setUser(null)
        setSessionError(apiError.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setSessionError(null)
      navigate(ROUTES.LOGIN, { replace: true })
    })
  }, [navigate])

  useEffect(() => {
    void bootstrapSession()
  }, [bootstrapSession])

  const login = async (email: string, password: string) => {
    const { user: loggedUser, token } = await AuthService.login({ email, password })
    setStoredToken(token)
    setUser(loggedUser)
    setSessionError(null)
    navigate(ROUTES.CASH, { replace: true })
  }

  const register = async (name: string, email: string, password: string) => {
    const { user: registeredUser, token } = await AuthService.register({ name, email, password })
    setStoredToken(token)
    setUser(registeredUser)
    setSessionError(null)
    navigate(ROUTES.CASH, { replace: true })
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      sessionError,
      login,
      register,
      logout,
      retrySession: bootstrapSession,
      setUser,
    }),
    [user, isLoading, sessionError, logout, bootstrapSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
