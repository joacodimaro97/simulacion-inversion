import { cn } from '@/utils/cn'
import type { Toast } from '@/contexts/ToastContext'

export function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-3 right-3 z-[100] flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-80 lg:bottom-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'animate-in w-full rounded-lg border p-4 shadow-lg sm:w-80',
            toast.variant === 'destructive'
              ? 'border-destructive/50 bg-destructive text-destructive-foreground'
              : toast.variant === 'success'
                ? 'border-success/50 bg-success text-success-foreground'
                : 'border-border bg-card text-card-foreground',
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-xs opacity-90">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
