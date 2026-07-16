import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { AccountProvider } from '@/contexts/AccountContext'
import { ToastProvider, useToast } from '@/contexts/ToastContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { GuestRoute } from '@/components/layout/GuestRoute'
import { Toaster } from '@/components/ui/toaster'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DailyHistoryPage } from '@/pages/DailyHistoryPage'
import { MovementsPage } from '@/pages/MovementsPage'
import { SimulatorPage } from '@/pages/SimulatorPage'
import { ComparatorPage } from '@/pages/ComparatorPage'
import { CashDashboardPage } from '@/pages/cash/CashDashboardPage'
import { CashAccountsPage } from '@/pages/cash/CashAccountsPage'
import { CashCategoriesPage } from '@/pages/cash/CashCategoriesPage'
import { CashTransactionsPage } from '@/pages/cash/CashTransactionsPage'
import { CashTransfersPage } from '@/pages/cash/CashTransfersPage'
import { CashFundingsPage } from '@/pages/cash/CashFundingsPage'
import { CashBudgetsPage } from '@/pages/cash/CashBudgetsPage'
import { ROUTES } from '@/constants'
import { useTheme } from '@/hooks/useTheme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  },
})

function AppRoutes() {
  useTheme()
  const { toasts, dismissToast } = useToast()

  return (
    <>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <AccountProvider>
                <AppLayout />
              </AccountProvider>
            }
          >
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.DAILY_HISTORY} element={<DailyHistoryPage />} />
            <Route path={ROUTES.MOVEMENTS} element={<MovementsPage />} />
            <Route path={ROUTES.SIMULATOR} element={<SimulatorPage />} />
            <Route path={ROUTES.COMPARATOR} element={<ComparatorPage />} />
            <Route path={ROUTES.CASH} element={<CashDashboardPage />} />
            <Route path={ROUTES.CASH_ACCOUNTS} element={<CashAccountsPage />} />
            <Route path={ROUTES.CASH_CATEGORIES} element={<CashCategoriesPage />} />
            <Route path={ROUTES.CASH_TRANSACTIONS} element={<CashTransactionsPage />} />
            <Route path={ROUTES.CASH_TRANSFERS} element={<CashTransfersPage />} />
            <Route path={ROUTES.CASH_FUNDINGS} element={<CashFundingsPage />} />
            <Route path={ROUTES.CASH_BUDGETS} element={<CashBudgetsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.CASH} replace />} />
      </Routes>
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
