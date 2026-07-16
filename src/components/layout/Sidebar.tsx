import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  ArrowLeftRight,
  LineChart,
  GitCompareArrows,
  Wallet,
  Tags,
  Receipt,
  PiggyBank,
  TrendingUp,
  Target,
  LogOut,
  ChevronDown,
  Menu,
} from 'lucide-react'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog } from '@/components/ui/dialog'

const investmentItems = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.DAILY_HISTORY, label: 'Historial', icon: CalendarDays },
  { to: ROUTES.MOVEMENTS, label: 'Movimientos', icon: ArrowLeftRight },
  { to: ROUTES.SIMULATOR, label: 'Simulador', icon: LineChart },
  { to: ROUTES.COMPARATOR, label: 'Comparador', icon: GitCompareArrows },
]

const cashItems = [
  { to: ROUTES.CASH, label: 'Resumen', icon: Wallet },
  { to: ROUTES.CASH_TRANSACTIONS, label: 'Transacciones', icon: Receipt },
  { to: ROUTES.CASH_BUDGETS, label: 'Presupuestos', icon: Target },
  { to: ROUTES.CASH_TRANSFERS, label: 'Transferencias', icon: ArrowLeftRight },
  { to: ROUTES.CASH_FUNDINGS, label: 'Efectivo ↔ Inv.', icon: TrendingUp },
  { to: ROUTES.CASH_CATEGORIES, label: 'Categorías', icon: Tags },
  { to: ROUTES.CASH_ACCOUNTS, label: 'Cuentas', icon: PiggyBank },
]

const mobileItems = [
  { to: ROUTES.CASH, label: 'Resumen', icon: Wallet },
  { to: ROUTES.CASH_TRANSACTIONS, label: 'Movimientos', icon: Receipt },
  { to: ROUTES.CASH_TRANSFERS, label: 'Transfer.', icon: ArrowLeftRight },
  { to: ROUTES.CASH_FUNDINGS, label: 'Inv.', icon: TrendingUp },
] as const

function isInvestmentPath(pathname: string) {
  return investmentItems.some((item) =>
    item.to === ROUTES.DASHBOARD ? pathname === '/' : pathname.startsWith(item.to),
  )
}

function NavSection({
  title,
  items,
  defaultEnd,
}: {
  title: string
  items: typeof cashItems
  defaultEnd?: string
}) {
  return (
    <div className="space-y-1">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {items.map((item) => (
        <NavItem key={item.to} {...item} end={item.to === defaultEnd} />
      ))}
    </div>
  )
}

function CollapsibleNavSection({
  title,
  items,
  open,
  onToggle,
  defaultEnd,
}: {
  title: string
  items: typeof investmentItems
  open: boolean
  onToggle: () => void
  defaultEnd?: string
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open ? 'rotate-0' : '-rotate-90')}
        />
      </button>
      {open && (
        <div className="space-y-1">
          {items.map((item) => (
            <NavItem key={item.to} {...item} end={item.to === defaultEnd} />
          ))}
        </div>
      )}
    </div>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [investmentsOpen, setInvestmentsOpen] = useState(() => isInvestmentPath(pathname))

  useEffect(() => {
    if (isInvestmentPath(pathname)) setInvestmentsOpen(true)
  }, [pathname])

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r bg-card lg:sticky lg:top-0 lg:flex">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
        <Wallet className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-sm font-bold">FCI Tracker</h1>
          <p className="text-xs text-muted-foreground">Gastos e inversiones</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        <NavSection
          title="Gastos e ingresos"
          items={cashItems}
          defaultEnd={ROUTES.CASH}
        />
        <CollapsibleNavSection
          title="Inversiones"
          items={investmentItems}
          open={investmentsOpen}
          onToggle={() => setInvestmentsOpen((v) => !v)}
          defaultEnd={ROUTES.DASHBOARD}
        />
      </nav>

      <div className="shrink-0 border-t bg-card p-4">
        {user && (
          <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = isInvestmentPath(pathname)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex">
          {mobileItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === ROUTES.CASH}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors sm:text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex min-h-14 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors sm:text-xs',
              moreActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Menu className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate">Más</span>
          </button>
        </div>
      </nav>

      <Dialog
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Más opciones"
        description="Inversiones y otras secciones"
      >
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Gastos e ingresos
            </p>
            {cashItems
              .filter((item) => !mobileItems.some((m) => m.to === item.to))
              .map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
          </div>
          <div className="space-y-1">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Inversiones
            </p>
            {investmentItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === ROUTES.DASHBOARD}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </Dialog>
    </>
  )
}

export function MobileTopBar() {
  const { user, logout } = useAuth()

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">FCI Tracker</p>
        {user && (
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        )}
      </div>
      <button
        type="button"
        onClick={logout}
        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
      >
        <LogOut className="h-4 w-4" />
        Salir
      </button>
    </div>
  )
}
