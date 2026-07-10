import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getStoredToken } from '@/api/http'
import { ROUTES } from '@/constants'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, sessionError, retrySession, logout } = useAuth()
  const hasToken = Boolean(getStoredToken())

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
        <Skeleton className="h-8 w-48" />
        <p className="text-sm text-muted-foreground">Restaurando sesión…</p>
      </div>
    )
  }

  if (!isAuthenticated && sessionError && hasToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-sm font-medium">No pudimos verificar tu sesión</p>
        <p className="max-w-sm text-sm text-muted-foreground">{sessionError}</p>
        <div className="flex gap-2">
          <Button onClick={() => void retrySession()}>Reintentar</Button>
          <Button variant="outline" onClick={logout}>
            Ir al login
          </Button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Outlet />
}
