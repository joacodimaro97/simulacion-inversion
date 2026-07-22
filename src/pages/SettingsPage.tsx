import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DollarSign, Loader2, Send, UserRound } from 'lucide-react'
import { queryKeys } from '@/constants'
import { useAuth } from '@/contexts/AuthContext'
import {
  useLinkTelegram,
  useRefreshTelegramStatus,
  useTelegramStatus,
  useUnlinkTelegram,
} from '@/hooks/useTelegram'
import { AuthService } from '@/services/AuthService'
import { TelegramService } from '@/services/TelegramService'
import { useUsdExchangeRate } from '@/utils/exchangeRate'
import { parseLocalNumber } from '@/utils/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const POLL_INTERVAL_MS = 2500
const POLL_DURATION_MS = 30_000

export function SettingsPage() {
  const { user, setUser } = useAuth()
  const queryClient = useQueryClient()
  const { data: status, isLoading: statusLoading } = useTelegramStatus()
  const linkTelegram = useLinkTelegram()
  const unlinkTelegram = useUnlinkTelegram()
  const refreshStatus = useRefreshTelegramStatus()
  const [usdRate, setUsdRate] = useUsdExchangeRate()
  const [rateInput, setRateInput] = useState(() =>
    usdRate != null ? String(usdRate) : '',
  )
  const [rateSaved, setRateSaved] = useState(false)

  const [awaitingLink, setAwaitingLink] = useState(false)
  const [polling, setPolling] = useState(false)
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  const pollDeadlineRef = useRef<number | null>(null)

  useEffect(() => {
    setRateInput(usdRate != null ? String(usdRate) : '')
  }, [usdRate])

  const linked = status?.linked ?? user?.telegramLinked ?? false

  useEffect(() => {
    if (linked) {
      setAwaitingLink(false)
      setPolling(false)
    }
  }, [linked])

  useEffect(() => {
    if (!polling || linked) return

    pollDeadlineRef.current = Date.now() + POLL_DURATION_MS

    const tick = async () => {
      if (!pollDeadlineRef.current || Date.now() > pollDeadlineRef.current) {
        setPolling(false)
        return
      }

      try {
        const [nextStatus, me] = await Promise.all([
          TelegramService.getStatus(),
          AuthService.getMe(),
        ])
        queryClient.setQueryData(queryKeys.telegram.status, nextStatus)
        setUser(me)
        if (nextStatus.linked || me.telegramLinked) {
          setPolling(false)
          setAwaitingLink(false)
        }
      } catch {
        // Poll best-effort; el usuario puede refrescar a mano.
      }
    }

    void tick()
    const id = window.setInterval(() => {
      void tick()
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [polling, linked, queryClient, setUser])

  const handleConnect = async () => {
    const result = await linkTelegram.mutateAsync()
    window.open(result.deepLink, '_blank', 'noopener,noreferrer')
    setAwaitingLink(true)
    setPolling(true)
    setConfirmUnlink(false)
  }

  const handleUnlink = async () => {
    if (!confirmUnlink) {
      setConfirmUnlink(true)
      return
    }
    await unlinkTelegram.mutateAsync()
    setConfirmUnlink(false)
    setAwaitingLink(false)
    setPolling(false)
  }

  const handleSaveRate = () => {
    const parsed = parseLocalNumber(rateInput)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setUsdRate(null)
      setRateInput('')
    } else {
      setUsdRate(parsed)
      setRateInput(String(parsed))
    }
    setRateSaved(true)
    window.setTimeout(() => setRateSaved(false), 2000)
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Perfil y conexiones de tu cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Perfil</CardTitle>
          </div>
          <CardDescription>Datos de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm font-medium text-foreground">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Cotización del dólar</CardTitle>
          </div>
          <CardDescription>
            Valor USD → ARS para convertir cuentas en dólares al calcular balances totales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="usd-rate">1 USD = … ARS</Label>
            <div className="flex gap-2">
              <Input
                id="usd-rate"
                type="text"
                inputMode="decimal"
                placeholder="Ej: 1400"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRate()
                }}
              />
              <Button type="button" onClick={handleSaveRate}>
                Guardar
              </Button>
            </div>
          </div>
          {rateSaved ? (
            <p className="text-sm text-success">Cotización guardada.</p>
          ) : usdRate != null ? (
            <p className="text-sm text-muted-foreground">
              Actual: 1 USD = {usdRate.toLocaleString('es-AR')} ARS
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin cotización. Los totales con cuentas en USD no se convertirán.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Telegram</CardTitle>
            {!statusLoading && linked && (
              <Badge variant="success">Telegram conectado</Badge>
            )}
          </div>
          <CardDescription>
            Vinculá tu cuenta para usar el bot de finanzas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando estado…
            </div>
          ) : linked ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Tu cuenta ya está vinculada al bot de Telegram.
              </p>
              <Button
                type="button"
                variant={confirmUnlink ? 'destructive' : 'outline'}
                disabled={unlinkTelegram.isPending}
                onClick={() => void handleUnlink()}
                onBlur={() => setConfirmUnlink(false)}
              >
                {unlinkTelegram.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Desconectando…
                  </>
                ) : confirmUnlink ? (
                  'Confirmar desconexión'
                ) : (
                  'Desconectar'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Conectá Telegram para usar el bot de finanzas.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  disabled={linkTelegram.isPending}
                  onClick={() => void handleConnect()}
                >
                  {linkTelegram.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Conectando…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Conectar Telegram
                    </>
                  )}
                </Button>
                {awaitingLink && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={refreshStatus.isPending}
                    onClick={() => refreshStatus.mutate()}
                  >
                    {refreshStatus.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Actualizando…
                      </>
                    ) : (
                      'Ya conecté / Actualizar'
                    )}
                  </Button>
                )}
              </div>
              {awaitingLink && (
                <p className="text-sm text-muted-foreground">
                  Tocá Start en Telegram. Cuando vuelvas, el estado se actualizará.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
