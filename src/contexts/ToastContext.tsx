import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { getApiError } from '@/api/http'

export type ToastVariant = 'default' | 'success' | 'destructive'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  showError: (error: unknown) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { ...toast, id }])
      setTimeout(() => dismissToast(id), 5000)
    },
    [dismissToast],
  )

  const showError = useCallback(
    (error: unknown) => {
      const apiError = getApiError(error)
      const title =
        apiError.statusCode === 400
          ? 'Datos inválidos'
          : apiError.statusCode === 401
            ? 'No autorizado'
            : apiError.statusCode === 404
              ? 'No encontrado'
              : apiError.statusCode === 409
                ? 'Conflicto'
                : apiError.statusCode >= 500
                  ? 'Error del servidor'
                  : 'Error'

      showToast({
        title,
        description: apiError.message,
        variant: 'destructive',
      })
    },
    [showToast],
  )

  return (
    <ToastContext.Provider value={{ toasts, showToast, showError, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return context
}
