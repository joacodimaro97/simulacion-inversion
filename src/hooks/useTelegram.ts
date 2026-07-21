import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { AuthService } from '@/services/AuthService'
import { TelegramService } from '@/services/TelegramService'

export function useTelegramStatus(enabled = true) {
  return useQuery({
    queryKey: queryKeys.telegram.status,
    queryFn: () => TelegramService.getStatus(),
    enabled,
  })
}

export function useLinkTelegram() {
  const { showError } = useToast()

  return useMutation({
    mutationFn: () => TelegramService.link(),
    onError: showError,
  })
}

export function useUnlinkTelegram() {
  const queryClient = useQueryClient()
  const { setUser } = useAuth()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: () => TelegramService.unlink(),
    onSuccess: async (user) => {
      setUser(user)
      await queryClient.invalidateQueries({ queryKey: queryKeys.telegram.status })
      showToast({ title: 'Telegram desconectado', variant: 'success' })
    },
    onError: showError,
  })
}

export function useRefreshTelegramStatus() {
  const queryClient = useQueryClient()
  const { setUser } = useAuth()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const [status, me] = await Promise.all([
        TelegramService.getStatus(),
        AuthService.getMe(),
      ])
      return { status, me }
    },
    onSuccess: ({ status, me }) => {
      setUser(me)
      queryClient.setQueryData(queryKeys.telegram.status, status)
      if (status.linked || me.telegramLinked) {
        showToast({ title: 'Telegram conectado', variant: 'success' })
      } else {
        showToast({
          title: 'Aún no vinculado',
          description: 'Tocá Start en Telegram y volvé a actualizar.',
        })
      }
    },
    onError: showError,
  })
}
