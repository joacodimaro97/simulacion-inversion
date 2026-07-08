import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  ArrowLeftRight,
  LineChart,
  GitCompareArrows,
  TrendingUp,
  Wallet,
  Tags,
  Receipt,
  PiggyBank,
  LogOut,
} from 'lucide-react'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'

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
  { to: ROUTES.CASH_CATEGORIES, label: 'Categorías', icon: Tags },
  { to: ROUTES.CASH_ACCOUNTS, label: 'Cuentas', icon: PiggyBank },
]

const mobileItems = [
  { to: ROUTES.DASHBOARD, label: 'Inversiones', icon: TrendingUp },
  { to: ROUTES.CASH, label: 'Gastos', icon: Wallet },
  { to: ROUTES.CASH_TRANSACTIONS, label: 'Cash', icon: Receipt },
  { to: ROUTES.SIMULATOR, label: 'Simular', icon: LineChart },
]

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
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
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

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r bg-card lg:sticky lg:top-0 lg:flex">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-sm font-bold">FCI Tracker</h1>
          <p className="text-xs text-muted-foreground">Inversiones y finanzas</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Inversiones
          </p>
          {investmentItems.map((item) => (
            <NavItem key={item.to} {...item} end={item.to === ROUTES.DASHBOARD} />
          ))}
        </div>
        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Gastos e ingresos
          </p>
          {cashItems.map((item) => (
            <NavItem key={item.to} {...item} end={item.to === ROUTES.CASH} />
          ))}
        </div>
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
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card lg:hidden">
      <div className="flex justify-around py-2">
        {mobileItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === ROUTES.DASHBOARD || to === ROUTES.CASH}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
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
        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
      >
        <LogOut className="h-4 w-4" />
        Salir
      </button>
    </div>
  )
}
