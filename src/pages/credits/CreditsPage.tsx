import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  HandCoins,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  Wallet,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { format, parseISO, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  useCredit,
  useCredits,
  useCreditsCalendar,
  useCreditsSummary,
  useCreateCredit,
  useDeleteCredit,
  usePayInstallment,
  useRescheduleInstallment,
  useUnpayInstallment,
  useUpdateCredit,
} from '@/hooks/useCredits'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/common/EmptyState'
import { MetricCard } from '@/components/common/MetricCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MetricCardSkeleton, PageHeaderSkeleton, Skeleton, TableSkeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'
import { formatCurrencyFor, formatDate, todayISO } from '@/utils/format'
import type {
  CalendarInstallmentItem,
  CreditDirection,
  CreditInstallment,
  CreditStatus,
  CreditWithDetails,
} from '@/types/credits'

type View = 'list' | 'calendar' | 'create' | 'detail'

const DIRECTION_LABEL: Record<CreditDirection, string> = {
  OWED_BY_ME: 'Debo',
  OWED_TO_ME: 'Me deben',
}

const STATUS_LABEL: Record<CreditStatus, string> = {
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
}

function resolveView(pathname: string, creditId?: string): View {
  if (pathname.endsWith('/new')) return 'create'
  if (pathname.endsWith('/calendar')) return 'calendar'
  if (creditId) return 'detail'
  return 'list'
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function monthBounds(anchor: Date) {
  const start = startOfMonth(anchor)
  const end = endOfMonth(anchor)
  const rawLabel = format(start, 'MMMM yyyy', { locale: es })
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1),
  }
}

/** Mes siguiente al actual: eje del resumen "próximo a pagar". */
function nextMonthBounds(from = new Date()) {
  return monthBounds(addMonths(startOfMonth(from), 1))
}

function isDateInRange(dateStr: string, startDate: string, endDate: string) {
  const d = toDateInput(dateStr)
  return d >= startDate && d <= endDate
}

function nextMonthInstallment(credit: CreditWithDetails, startDate: string, endDate: string) {
  return (
    credit.installments.find(
      (i) => i.status === 'PENDING' && isDateInRange(i.dueDate, startDate, endDate),
    ) ?? null
  )
}

function payActionLabel(direction: CreditDirection) {
  return direction === 'OWED_BY_ME' ? 'Pagar' : 'Cobrar'
}

function DirectionBadge({ direction }: { direction: CreditDirection }) {
  return (
    <Badge variant={direction === 'OWED_BY_ME' ? 'destructive' : 'success'}>
      {DIRECTION_LABEL[direction]}
    </Badge>
  )
}

function StatusBadge({ status }: { status: CreditStatus }) {
  const variant =
    status === 'ACTIVE' ? 'default' : status === 'COMPLETED' ? 'success' : 'secondary'
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>
}

function ProgressBar({ paid, total, currency }: { paid: number; total: number; currency: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Pagado {formatCurrencyFor(paid, currency)} · Pendiente{' '}
          {formatCurrencyFor(Math.max(0, total - paid), currency)}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface PayTarget {
  creditId: string
  creditName: string
  direction: CreditDirection
  currency: string
  defaultCashAccountId: string | null
  installment: Pick<CreditInstallment, 'id' | 'number' | 'amount' | 'dueDate'>
}

interface PayForm {
  cashAccountId: string
  date: string
  description: string
}

interface CreateForm {
  name: string
  description: string
  counterparty: string
  direction: CreditDirection
  currency: string
  principal: string
  installmentCount: string
  startDate: string
  defaultCashAccountId: string
  useCustomDueDates: boolean
}

interface EditForm {
  name: string
  description: string
  counterparty: string
  defaultCashAccountId: string
}

/** Módulo completo de créditos / cuotas en un solo componente. */
export function CreditsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { creditId } = useParams<{ creditId?: string }>()
  const view = resolveView(location.pathname, creditId)

  const [directionFilter, setDirectionFilter] = useState<CreditDirection | ''>('')
  const [statusFilter, setStatusFilter] = useState<CreditStatus | ''>('ACTIVE')
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    creditId: string
    installmentId: string
    dueDate: string
  } | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [customDueDates, setCustomDueDates] = useState<string[]>([])

  const listFilters = useMemo(
    () => ({
      ...(directionFilter ? { direction: directionFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    [directionFilter, statusFilter],
  )

  const { data: credits = [], isLoading: listLoading, isFetching: listFetching } =
    useCredits(view === 'list' ? listFilters : undefined)
  const { data: summary, isLoading: summaryLoading } = useCreditsSummary(10)
  const nextMonth = useMemo(() => nextMonthBounds(), [])
  const calendarRange = useMemo(() => monthBounds(calendarMonth), [calendarMonth])
  const { data: nextMonthItems = [], isLoading: nextMonthLoading } = useCreditsCalendar(
    {
      startDate: nextMonth.startDate,
      endDate: nextMonth.endDate,
    },
    view === 'list',
  )
  const { data: calendarItems = [], isLoading: calendarLoading } = useCreditsCalendar(
    {
      startDate: calendarRange.startDate,
      endDate: calendarRange.endDate,
    },
    view === 'calendar',
  )

  const nextMonthPending = useMemo(
    () => nextMonthItems.filter((i) => i.status === 'PENDING'),
    [nextMonthItems],
  )
  const nextMonthOwedByMe = useMemo(
    () =>
      nextMonthPending
        .filter((i) => i.direction === 'OWED_BY_ME')
        .reduce((sum, i) => sum + i.amount, 0),
    [nextMonthPending],
  )
  const nextMonthOwedToMe = useMemo(
    () =>
      nextMonthPending
        .filter((i) => i.direction === 'OWED_TO_ME')
        .reduce((sum, i) => sum + i.amount, 0),
    [nextMonthPending],
  )
  const { data: credit, isLoading: detailLoading } = useCredit(
    view === 'detail' ? creditId : undefined,
  )
  const { data: accounts = [] } = useCashAccounts()

  const createCredit = useCreateCredit()
  const updateCredit = useUpdateCredit()
  const deleteCredit = useDeleteCredit()
  const payInstallment = usePayInstallment()
  const unpayInstallment = useUnpayInstallment()
  const rescheduleInstallment = useRescheduleInstallment()

  const openPay = (target: PayTarget) => setPayTarget(target)

  const openPayFromCalendar = (item: CalendarInstallmentItem) => {
    openPay({
      creditId: item.creditId,
      creditName: item.creditName,
      direction: item.direction,
      currency: item.currency,
      defaultCashAccountId: null,
      installment: {
        id: item.installmentId,
        number: item.number,
        amount: item.amount,
        dueDate: item.dueDate,
      },
    })
  }

  const openPayFromCredit = (c: CreditWithDetails, inst: CreditInstallment) => {
    openPay({
      creditId: c.id,
      creditName: c.name,
      direction: c.direction,
      currency: c.currency,
      defaultCashAccountId: c.defaultCashAccountId,
      installment: {
        id: inst.id,
        number: inst.number,
        amount: inst.amount,
        dueDate: inst.dueDate,
      },
    })
  }

  /* ─── Create form ─── */
  const createForm = useForm<CreateForm>({
    defaultValues: {
      name: '',
      description: '',
      counterparty: '',
      direction: 'OWED_BY_ME',
      currency: 'ARS',
      principal: '',
      installmentCount: '12',
      startDate: todayISO(),
      defaultCashAccountId: '',
      useCustomDueDates: false,
    },
  })

  const createWatch = createForm.watch()
  const principalNum = Number(createWatch.principal) || 0
  const countNum = Math.max(1, Math.min(360, Number(createWatch.installmentCount) || 1))
  const previewAmount = countNum > 0 ? Math.round((principalNum / countNum) * 100) / 100 : 0

  const accountsForCurrency = useMemo(
    () => accounts.filter((a) => a.currency === (createWatch.currency || 'ARS')),
    [accounts, createWatch.currency],
  )

  useEffect(() => {
    if (view !== 'create') return
    if (!createWatch.useCustomDueDates) {
      setCustomDueDates([])
      return
    }
    setCustomDueDates((prev) => {
      const next = Array.from({ length: countNum }, (_, i) => {
        if (prev[i]) return prev[i]!
        const base = createWatch.startDate || todayISO()
        const d = parseISO(base)
        d.setMonth(d.getMonth() + i)
        return format(d, 'yyyy-MM-dd')
      })
      return next
    })
  }, [view, createWatch.useCustomDueDates, createWatch.startDate, countNum])

  const onCreate = createForm.handleSubmit(async (data) => {
    const created = await createCredit.mutateAsync({
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      counterparty: data.counterparty.trim() || undefined,
      direction: data.direction,
      currency: data.currency || 'ARS',
      principal: Number(data.principal),
      installmentCount: countNum,
      startDate: data.startDate,
      dueDates: data.useCustomDueDates ? customDueDates.slice(0, countNum) : undefined,
      defaultCashAccountId: data.defaultCashAccountId || null,
    })
    navigate(ROUTES.creditDetail(created.id))
  })

  /* ─── Edit form ─── */
  const editForm = useForm<EditForm>({
    defaultValues: { name: '', description: '', counterparty: '', defaultCashAccountId: '' },
  })

  useEffect(() => {
    if (!editOpen || !credit) return
    editForm.reset({
      name: credit.name,
      description: credit.description ?? '',
      counterparty: credit.counterparty ?? '',
      defaultCashAccountId: credit.defaultCashAccountId ?? '',
    })
  }, [editOpen, credit, editForm])

  const onEdit = editForm.handleSubmit(async (data) => {
    if (!credit) return
    await updateCredit.mutateAsync({
      id: credit.id,
      input: {
        name: data.name.trim(),
        description: data.description.trim() || null,
        counterparty: data.counterparty.trim() || null,
        defaultCashAccountId: data.defaultCashAccountId || null,
      },
    })
    setEditOpen(false)
  })

  /* ─── Pay form ─── */
  const payForm = useForm<PayForm>({
    defaultValues: { cashAccountId: '', date: todayISO(), description: '' },
  })

  useEffect(() => {
    if (!payTarget) return
    const matching = accounts.filter((a) => a.currency === payTarget.currency)
    const preferred =
      matching.find((a) => a.id === payTarget.defaultCashAccountId)?.id ?? matching[0]?.id ?? ''
    payForm.reset({
      cashAccountId: preferred,
      date: todayISO(),
      description: '',
    })
  }, [payTarget, accounts, payForm])

  const onPay = payForm.handleSubmit(async (data) => {
    if (!payTarget) return
    await payInstallment.mutateAsync({
      creditId: payTarget.creditId,
      installmentId: payTarget.installment.id,
      input: {
        cashAccountId: data.cashAccountId,
        date: data.date,
        description: data.description.trim() || undefined,
      },
    })
    setPayTarget(null)
  })

  const payAccounts = payTarget
    ? accounts.filter((a) => a.currency === payTarget.currency)
    : []

  /* ─── Reschedule ─── */
  const [rescheduleDate, setRescheduleDate] = useState('')
  useEffect(() => {
    if (rescheduleTarget) setRescheduleDate(toDateInput(rescheduleTarget.dueDate))
  }, [rescheduleTarget])

  const onReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate) return
    await rescheduleInstallment.mutateAsync({
      creditId: rescheduleTarget.creditId,
      installmentId: rescheduleTarget.installmentId,
      input: { dueDate: rescheduleDate },
    })
    setRescheduleTarget(null)
  }

  const handleDelete = async () => {
    if (!credit) return
    const ok = window.confirm(
      '¿Eliminar o cancelar este crédito? Si ya hay cuotas pagadas, se cancelará sin borrar el historial.',
    )
    if (!ok) return
    await deleteCredit.mutateAsync(credit.id)
    navigate(ROUTES.CREDITS)
  }

  const handleUnpay = async (c: CreditWithDetails, inst: CreditInstallment) => {
    const ok = window.confirm(
      `¿Deshacer el pago de la cuota #${inst.number}? Se eliminará la transacción vinculada en cash.`,
    )
    if (!ok) return
    await unpayInstallment.mutateAsync({ creditId: c.id, installmentId: inst.id })
  }

  const calendarGrouped = useMemo(() => {
    const map = new Map<string, CalendarInstallmentItem[]>()
    for (const item of calendarItems) {
      const key = toDateInput(item.dueDate)
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [calendarItems])

  /* ═══════════════════ RENDER ═══════════════════ */

  return (
    <div className="space-y-6 animate-in md:space-y-8">
      {/* Nav tabs */}
      {view !== 'detail' && view !== 'create' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Créditos</h1>
            <p className="text-sm text-muted-foreground">
              Préstamos y cuotas fijas · Debo / Me deben
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tabs
              value={view === 'calendar' ? 'calendar' : 'list'}
              onValueChange={(v) =>
                navigate(v === 'calendar' ? ROUTES.CREDITS_CALENDAR : ROUTES.CREDITS)
              }
            >
              <TabsList>
                <TabsTrigger value="list">Lista</TabsTrigger>
                <TabsTrigger value="calendar">Agenda</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => navigate(ROUTES.CREDITS_NEW)}>
              <Plus className="h-4 w-4" />
              Nuevo crédito
            </Button>
          </div>
        </div>
      )}

      {view === 'list' && (
        <ListView
          summary={summary}
          summaryLoading={summaryLoading || nextMonthLoading}
          nextMonthLabel={nextMonth.label}
          nextMonthPending={nextMonthPending}
          nextMonthOwedByMe={nextMonthOwedByMe}
          nextMonthOwedToMe={nextMonthOwedToMe}
          nextMonthStart={nextMonth.startDate}
          nextMonthEnd={nextMonth.endDate}
          credits={credits}
          listLoading={listLoading}
          listFetching={listFetching}
          directionFilter={directionFilter}
          statusFilter={statusFilter}
          onDirectionFilter={setDirectionFilter}
          onStatusFilter={setStatusFilter}
          onPayUpcoming={openPayFromCalendar}
          onCreate={() => navigate(ROUTES.CREDITS_NEW)}
        />
      )}

      {view === 'calendar' && (
        <CalendarView
          label={calendarRange.label}
          loading={calendarLoading}
          grouped={calendarGrouped}
          onPrev={() => setCalendarMonth((m) => addMonths(m, -1))}
          onNext={() => setCalendarMonth((m) => addMonths(m, 1))}
          onPay={openPayFromCalendar}
        />
      )}

      {view === 'create' && (
        <CreateView
          form={createForm}
          accounts={accountsForCurrency}
          previewAmount={previewAmount}
          countNum={countNum}
          customDueDates={customDueDates}
          onCustomDueDate={(i, v) =>
            setCustomDueDates((prev) => prev.map((d, idx) => (idx === i ? v : d)))
          }
          isPending={createCredit.isPending}
          onSubmit={onCreate}
          onCancel={() => navigate(ROUTES.CREDITS)}
        />
      )}

      {view === 'detail' && (
        <DetailView
          credit={credit}
          loading={detailLoading}
          nextMonthLabel={nextMonth.label}
          nextMonthStart={nextMonth.startDate}
          nextMonthEnd={nextMonth.endDate}
          onBack={() => navigate(ROUTES.CREDITS)}
          onEdit={() => setEditOpen(true)}
          onDelete={handleDelete}
          deletePending={deleteCredit.isPending}
          onPay={openPayFromCredit}
          onReschedule={(inst) =>
            setRescheduleTarget({
              creditId: credit!.id,
              installmentId: inst.id,
              dueDate: inst.dueDate,
            })
          }
          onUnpay={handleUnpay}
          unpayPending={unpayInstallment.isPending}
        />
      )}

      {/* Pay / Cobrar modal */}
      <Dialog
        open={Boolean(payTarget)}
        onClose={() => setPayTarget(null)}
        title={
          payTarget
            ? `${payActionLabel(payTarget.direction)} cuota #${payTarget.installment.number}`
            : 'Pagar cuota'
        }
        description={
          payTarget
            ? `${payTarget.creditName} · ${formatCurrencyFor(payTarget.installment.amount, payTarget.currency)} · vence ${formatDate(payTarget.installment.dueDate)}`
            : undefined
        }
        footer={
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setPayTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="credit-pay-form"
              className="flex-1"
              disabled={payInstallment.isPending || payAccounts.length === 0}
            >
              {payInstallment.isPending
                ? 'Guardando...'
                : payTarget
                  ? payActionLabel(payTarget.direction)
                  : 'Confirmar'}
            </Button>
          </div>
        }
      >
        <form id="credit-pay-form" onSubmit={onPay} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pay-account">Cuenta cash</Label>
            {payAccounts.length === 0 ? (
              <p className="text-sm text-destructive">
                No hay cuentas en {payTarget?.currency}. Creá una cuenta con esa moneda o elegí
                otra.
              </p>
            ) : (
              <Select id="pay-account" {...payForm.register('cashAccountId', { required: true })}>
                {payAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-date">Fecha</Label>
            <Input id="pay-date" type="date" {...payForm.register('date', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-desc">Descripción (opcional)</Label>
            <Input id="pay-desc" placeholder="Ej. cuota tarjeta" {...payForm.register('description')} />
          </div>
        </form>
      </Dialog>

      {/* Reschedule modal */}
      <Dialog
        open={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title="Reprogramar cuota"
        description="Solo cuotas pendientes"
        footer={
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setRescheduleTarget(null)}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={!rescheduleDate || rescheduleInstallment.isPending}
              onClick={onReschedule}
            >
              {rescheduleInstallment.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="reschedule-date">Nueva fecha de vencimiento</Label>
          <Input
            id="reschedule-date"
            type="date"
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
          />
        </div>
      </Dialog>

      {/* Edit metadata modal */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar crédito"
        description="Nombre, contraparte y cuenta por defecto"
        className="max-w-lg"
        footer={
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="credit-edit-form" className="flex-1" disabled={updateCredit.isPending}>
              {updateCredit.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="credit-edit-form" onSubmit={onEdit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre</Label>
            <Input id="edit-name" {...editForm.register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-counterparty">Contraparte</Label>
            <Input id="edit-counterparty" placeholder="Banco / persona" {...editForm.register('counterparty')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Descripción</Label>
            <Textarea id="edit-desc" rows={2} {...editForm.register('description')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-account">Cuenta cash por defecto</Label>
            <Select id="edit-account" {...editForm.register('defaultCashAccountId')}>
              <option value="">Sin preferencia</option>
              {accounts
                .filter((a) => !credit || a.currency === credit.currency)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
            </Select>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

/* ═══════════════════ Sub-views (mismo archivo) ═══════════════════ */

function ListView({
  summary,
  summaryLoading,
  nextMonthLabel,
  nextMonthPending,
  nextMonthOwedByMe,
  nextMonthOwedToMe,
  nextMonthStart,
  nextMonthEnd,
  credits,
  listLoading,
  listFetching,
  directionFilter,
  statusFilter,
  onDirectionFilter,
  onStatusFilter,
  onPayUpcoming,
  onCreate,
}: {
  summary: ReturnType<typeof useCreditsSummary>['data']
  summaryLoading: boolean
  nextMonthLabel: string
  nextMonthPending: CalendarInstallmentItem[]
  nextMonthOwedByMe: number
  nextMonthOwedToMe: number
  nextMonthStart: string
  nextMonthEnd: string
  credits: CreditWithDetails[]
  listLoading: boolean
  listFetching: boolean
  directionFilter: CreditDirection | ''
  statusFilter: CreditStatus | ''
  onDirectionFilter: (v: CreditDirection | '') => void
  onStatusFilter: (v: CreditStatus | '') => void
  onPayUpcoming: (item: CalendarInstallmentItem) => void
  onCreate: () => void
}) {
  if (listLoading || summaryLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <TableSkeleton rows={5} />
      </div>
    )
  }

  const upcomingDebo = nextMonthPending.filter((i) => i.direction === 'OWED_BY_ME')
  const upcomingCobrar = nextMonthPending.filter((i) => i.direction === 'OWED_TO_ME')

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          title="Próximo a pagar"
          value={formatCurrencyFor(nextMonthOwedByMe, 'ARS')}
          icon={HandCoins}
          trend="down"
          subtitle={
            <span className="mt-1 block text-xs text-muted-foreground">
              {nextMonthLabel}
              {summary?.owedByMe.activeCredits
                ? ` · ${summary.owedByMe.activeCredits} créditos activos`
                : null}
              {(summary?.owedByMe.totalOverdue ?? 0) > 0 && (
                <span className="text-destructive">
                  {' '}
                  · vencido {formatCurrencyFor(summary!.owedByMe.totalOverdue, 'ARS')}
                </span>
              )}
            </span>
          }
        />
        <MetricCard
          title="Próximo a cobrar"
          value={formatCurrencyFor(nextMonthOwedToMe, 'ARS')}
          icon={Wallet}
          trend="up"
          subtitle={
            <span className="mt-1 block text-xs text-muted-foreground">
              {nextMonthLabel}
              {summary?.owedToMe.activeCredits
                ? ` · ${summary.owedToMe.activeCredits} créditos activos`
                : null}
              {(summary?.owedToMe.totalOverdue ?? 0) > 0 && (
                <span className="text-destructive">
                  {' '}
                  · vencido {formatCurrencyFor(summary!.owedToMe.totalOverdue, 'ARS')}
                </span>
              )}
            </span>
          }
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            Próximos pagos · {nextMonthLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {nextMonthPending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay cuotas pendientes en {nextMonthLabel.toLowerCase()}.
            </p>
          ) : (
            <>
              {upcomingDebo.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Debo
                </p>
              )}
              {upcomingDebo.map((item) => (
                <UpcomingRow key={item.installmentId} item={item} onPay={onPayUpcoming} />
              ))}
              {upcomingCobrar.length > 0 && (
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Me deben
                </p>
              )}
              {upcomingCobrar.map((item) => (
                <UpcomingRow key={item.installmentId} item={item} onPay={onPayUpcoming} />
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select
            value={directionFilter}
            onChange={(e) => onDirectionFilter(e.target.value as CreditDirection | '')}
            className="w-auto min-w-[140px]"
          >
            <option value="">Todas las direcciones</option>
            <option value="OWED_BY_ME">Debo</option>
            <option value="OWED_TO_ME">Me deben</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value as CreditStatus | '')}
            className="w-auto min-w-[140px]"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="COMPLETED">Completados</option>
            <option value="CANCELLED">Cancelados</option>
          </Select>
          {listFetching && !listLoading && (
            <span className="self-center text-xs text-muted-foreground">Actualizando…</span>
          )}
        </div>
      </div>

      {credits.length === 0 ? (
        <EmptyState
          message="Todavía no tenés créditos. Creá uno para llevar cuotas fijas."
          action={
            <Button variant="outline" onClick={onCreate}>
              <CreditCard className="h-4 w-4" />
              Nuevo crédito
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {credits.map((c) => {
            const nextInst =
              nextMonthInstallment(c, nextMonthStart, nextMonthEnd) ??
              (() => {
                const fromCal = nextMonthPending.find((i) => i.creditId === c.id)
                if (!fromCal) return null
                return {
                  id: fromCal.installmentId,
                  number: fromCal.number,
                  amount: fromCal.amount,
                  dueDate: fromCal.dueDate,
                }
              })()
            return (
              <Link key={c.id} to={ROUTES.creditDetail(c.id)} className="block">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{c.name}</p>
                        {c.counterparty && (
                          <p className="truncate text-xs text-muted-foreground">{c.counterparty}</p>
                        )}
                      </div>
                      <DirectionBadge direction={c.direction} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge status={c.status} />
                      {c.totals.overdueCount > 0 && (
                        <Badge variant="destructive">{c.totals.overdueCount} vencidas</Badge>
                      )}
                    </div>
                    {nextInst ? (
                      <div className="rounded-lg bg-muted/50 px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                          {c.direction === 'OWED_BY_ME' ? 'Próximo a pagar' : 'Próximo a cobrar'} ·{' '}
                          {nextMonthLabel}
                        </p>
                        <p className="text-lg font-bold">
                          {formatCurrencyFor(nextInst.amount, c.currency)}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            · cuota #{nextInst.number} · {formatDate(nextInst.dueDate)}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sin cuota en {nextMonthLabel.toLowerCase()}
                      </p>
                    )}
                    <ProgressBar
                      paid={c.totals.paidAmount}
                      total={c.principal}
                      currency={c.currency}
                    />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

function UpcomingRow({
  item,
  onPay,
}: {
  item: CalendarInstallmentItem
  onPay: (item: CalendarInstallmentItem) => void
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between',
        item.overdue && 'border-destructive/40 bg-destructive/5',
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={ROUTES.creditDetail(item.creditId)}
            className="truncate font-medium hover:underline"
          >
            {item.creditName}
          </Link>
          <DirectionBadge direction={item.direction} />
          {item.overdue && <Badge variant="destructive">Vencida</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          Cuota #{item.number} · {formatDate(item.dueDate)}
          {item.counterparty ? ` · ${item.counterparty}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          {formatCurrencyFor(item.amount, item.currency)}
        </span>
        {item.status === 'PENDING' && (
          <Button size="sm" onClick={() => onPay(item)}>
            {payActionLabel(item.direction)}
          </Button>
        )}
      </div>
    </div>
  )
}

function CalendarView({
  label,
  loading,
  grouped,
  onPrev,
  onNext,
  onPay,
}: {
  label: string
  loading: boolean
  grouped: [string, CalendarInstallmentItem[]][]
  onPrev: () => void
  onNext: () => void
  onPay: (item: CalendarInstallmentItem) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="icon" onClick={onPrev} aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold capitalize sm:text-lg">{label}</h2>
        <Button type="button" variant="outline" size="icon" onClick={onNext} aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState message="No hay cuotas en este mes." />
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => (
            <div key={date} className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">{formatDate(date)}</p>
              <div className="space-y-2">
                {items.map((item) => (
                  <Card
                    key={item.installmentId}
                    className={cn(item.overdue && 'border-destructive/40 bg-destructive/5')}
                  >
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={ROUTES.creditDetail(item.creditId)}
                            className="truncate font-medium hover:underline"
                          >
                            {item.creditName}
                          </Link>
                          <DirectionBadge direction={item.direction} />
                          {item.overdue && <Badge variant="destructive">Vencida</Badge>}
                          {item.status === 'PAID' && <Badge variant="success">Pagada</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Cuota #{item.number}
                          {item.counterparty ? ` · ${item.counterparty}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {formatCurrencyFor(item.amount, item.currency)}
                        </span>
                        {item.status === 'PENDING' && (
                          <Button size="sm" onClick={() => onPay(item)}>
                            {payActionLabel(item.direction)}
                          </Button>
                        )}
                        <Link
                          to={ROUTES.creditDetail(item.creditId)}
                          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
                        >
                          Ver
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateView({
  form,
  accounts,
  previewAmount,
  countNum,
  customDueDates,
  onCustomDueDate,
  isPending,
  onSubmit,
  onCancel,
}: {
  form: ReturnType<typeof useForm<CreateForm>>
  accounts: { id: string; name: string; currency: string }[]
  previewAmount: number
  countNum: number
  customDueDates: string[]
  onCustomDueDate: (index: number, value: string) => void
  isPending: boolean
  onSubmit: () => Promise<void>
  onCancel: () => void
}) {
  const { register, setValue, watch } = form
  const direction = watch('direction')
  const currency = watch('currency')
  const useCustom = watch('useCustomDueDates')

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Nuevo crédito</h1>
          <p className="text-sm text-muted-foreground">Cuotas fijas e iguales, sin interés amortizado</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          {(['OWED_BY_ME', 'OWED_TO_ME'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setValue('direction', d)}
              className={cn(
                'min-h-11 rounded-md py-2.5 text-sm font-medium transition-colors',
                direction === d
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {DIRECTION_LABEL[d]}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="credit-name">Nombre</Label>
          <Input
            id="credit-name"
            placeholder="Ej. Préstamo personal"
            {...register('name', { required: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="credit-counterparty">Contraparte</Label>
          <Input
            id="credit-counterparty"
            placeholder="Banco / persona / comercio"
            {...register('counterparty')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="credit-desc">Descripción</Label>
          <Textarea id="credit-desc" rows={2} {...register('description')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="credit-principal">Monto total</Label>
            <Input
              id="credit-principal"
              type="number"
              step="0.01"
              min="0.01"
              {...register('principal', { required: true, min: 0.01 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credit-count">Cantidad de cuotas</Label>
            <Input
              id="credit-count"
              type="number"
              min={1}
              max={360}
              {...register('installmentCount', { required: true, min: 1, max: 360 })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="credit-start">Primera cuota</Label>
            <Input id="credit-start" type="date" {...register('startDate', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credit-currency">Moneda</Label>
            <Select id="credit-currency" {...register('currency')}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          Preview: ~{formatCurrencyFor(previewAmount, currency || 'ARS')} por cuota ({countNum}{' '}
          cuotas)
        </div>

        <div className="space-y-2">
          <Label htmlFor="credit-account">Cuenta cash por defecto</Label>
          <Select id="credit-account" {...register('defaultCashAccountId')}>
            <option value="">Sin preferencia</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </Select>
          {accounts.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No hay cuentas en {currency}. Podés crear el crédito igual y elegir cuenta al pagar.
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={useCustom}
            onChange={(e) => setValue('useCustomDueDates', e.target.checked)}
          />
          Modo avanzado: editar fechas de cada cuota
        </label>

        {useCustom && (
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
            {customDueDates.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">#{i + 1}</span>
                <Input
                  type="date"
                  value={d}
                  onChange={(e) => onCustomDueDate(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Creando...' : 'Crear crédito'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function DetailView({
  credit,
  loading,
  nextMonthLabel,
  nextMonthStart,
  nextMonthEnd,
  onBack,
  onEdit,
  onDelete,
  deletePending,
  onPay,
  onReschedule,
  onUnpay,
  unpayPending,
}: {
  credit: CreditWithDetails | undefined
  loading: boolean
  nextMonthLabel: string
  nextMonthStart: string
  nextMonthEnd: string
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  deletePending: boolean
  onPay: (c: CreditWithDetails, inst: CreditInstallment) => void
  onReschedule: (inst: CreditInstallment) => void
  onUnpay: (c: CreditWithDetails, inst: CreditInstallment) => void
  unpayPending: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <Skeleton className="h-32 w-full rounded-xl" />
        <TableSkeleton rows={6} />
      </div>
    )
  }

  if (!credit) {
    return (
      <EmptyState
        message="No se encontró el crédito."
        action={
          <Button variant="outline" onClick={onBack}>
            Volver al listado
          </Button>
        }
      />
    )
  }

  const readOnly = credit.status === 'CANCELLED'
  const canPay = credit.status === 'ACTIVE' || credit.status === 'COMPLETED'
  const nextInst = nextMonthInstallment(credit, nextMonthStart, nextMonthEnd)
  const nextLabel =
    credit.direction === 'OWED_BY_ME' ? 'Próximo a pagar' : 'Próximo a cobrar'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={onBack} aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 space-y-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{credit.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <DirectionBadge direction={credit.direction} />
              <StatusBadge status={credit.status} />
              <Badge variant="outline">{credit.currency}</Badge>
            </div>
            {credit.counterparty && (
              <p className="text-sm text-muted-foreground">{credit.counterparty}</p>
            )}
            {credit.description && (
              <p className="text-sm text-muted-foreground">{credit.description}</p>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2 sm:pl-12">
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={deletePending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deletePending ? '…' : 'Eliminar'}
            </Button>
          </div>
        )}
      </div>

      {readOnly && (
        <div className="flex items-start gap-2 rounded-lg border border-muted bg-muted/40 p-3 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Este crédito está cancelado y es de solo lectura.
        </div>
      )}

      {nextInst && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {nextLabel} · {nextMonthLabel}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrencyFor(nextInst.amount, credit.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                Cuota #{nextInst.number} · vence {formatDate(nextInst.dueDate)}
                {nextInst.overdue ? ' · vencida' : ''}
              </p>
            </div>
            {canPay && !readOnly && nextInst.status === 'PENDING' && (
              <Button onClick={() => onPay(credit, nextInst)}>
                {payActionLabel(credit.direction)}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Principal</p>
              <p className="text-2xl font-bold">
                {formatCurrencyFor(credit.principal, credit.currency)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {credit.installmentCount} × {formatCurrencyFor(credit.installmentAmount, credit.currency)}
            </p>
          </div>
          <ProgressBar
            paid={credit.totals.paidAmount}
            total={credit.principal}
            currency={credit.currency}
          />
          {credit.totals.overdueCount > 0 && (
            <p className="text-sm text-destructive">
              {credit.totals.overdueCount} cuota(s) vencida(s) ·{' '}
              {formatCurrencyFor(credit.totals.overdueAmount, credit.currency)}
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold">Cuotas</h2>
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credit.installments.map((inst) => {
                const isNextMonth = isDateInRange(inst.dueDate, nextMonthStart, nextMonthEnd)
                return (
                  <TableRow
                    key={inst.id}
                    className={cn(
                      inst.overdue && inst.status === 'PENDING' && 'bg-destructive/5',
                      isNextMonth && inst.status === 'PENDING' && 'bg-primary/5',
                    )}
                  >
                    <TableCell className="font-medium">{inst.number}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {formatDate(inst.dueDate)}
                        {isNextMonth && inst.status === 'PENDING' && (
                          <Badge variant="default">{nextLabel}</Badge>
                        )}
                        {inst.overdue && inst.status === 'PENDING' && (
                          <Badge variant="destructive">Vencida</Badge>
                        )}
                      </div>
                      {inst.paidAt && (
                        <p className="text-xs text-muted-foreground">
                          Pagada {formatDate(inst.paidAt)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrencyFor(inst.amount, credit.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={inst.status === 'PAID' ? 'success' : 'outline'}>
                        {inst.status === 'PAID' ? 'Pagada' : 'Pendiente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {inst.status === 'PENDING' && canPay && !readOnly && (
                          <>
                            <Button size="sm" onClick={() => onPay(credit, inst)}>
                              {payActionLabel(credit.direction)}
                            </Button>
                            {credit.status === 'ACTIVE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onReschedule(inst)}
                              >
                                Reprogramar
                              </Button>
                            )}
                          </>
                        )}
                        {inst.status === 'PAID' && !readOnly && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={unpayPending}
                            onClick={() => onUnpay(credit, inst)}
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                            Deshacer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
