import { useMemo } from 'react'
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  Percent,
  Calendar,
  BarChart3,
  Target,
  ArrowUpRight,
} from 'lucide-react'
import { useStatistics } from '@/hooks/useStatistics'
import { usePerformance, useMonthlyPerformance } from '@/hooks/usePerformance'
import { useMovements } from '@/hooks/useMovements'
import { useAccount } from '@/contexts/AccountContext'
import { MetricCard } from '@/components/common/MetricCard'
import { ChartCard } from '@/components/common/ChartCard'
import { EmptyState } from '@/components/common/EmptyState'
import { CapitalEvolutionChart } from '@/charts/CapitalEvolutionChart'
import { DailyReturnChart } from '@/charts/DailyReturnChart'
import { MonthlyReturnChart } from '@/charts/MonthlyReturnChart'
import { AccumulatedGainsChart } from '@/charts/AccumulatedGainsChart'
import { CapitalVsContributionsChart } from '@/charts/CapitalVsContributionsChart'
import { ReturnDistributionChart } from '@/charts/ReturnDistributionChart'
import { formatCurrency, formatRatio, formatPercent, formatMonthFromApi } from '@/utils/format'
import { buildDistributionBuckets, formatMonthKey } from '@/utils/mappers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCardSkeleton, ChartSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton'

export function DashboardPage() {
  const { isReady } = useAccount()
  const { data: stats, isLoading: statsLoading } = useStatistics()
  const { data: performances = [], isLoading: perfLoading } = usePerformance()
  const { data: monthly = [], isLoading: monthlyLoading } = useMonthlyPerformance()
  const { data: movements = [], isLoading: movLoading } = useMovements()

  const isLoading = !isReady || statsLoading || perfLoading || monthlyLoading || movLoading

  const capitalData = useMemo(
    () => performances.map((p) => ({ date: p.date, capital: p.shareValue })),
    [performances],
  )

  const gainsData = useMemo(
    () => performances.map((p) => ({ date: p.date, gains: p.dailyProfit })),
    [performances],
  )

  const dailyReturnData = useMemo(
    () => performances.map((p) => ({ date: p.date, return: p.dailyReturnPercent })),
    [performances],
  )

  const monthlyReturnData = useMemo(
    () =>
      monthly.map((m) => ({
        month: formatMonthKey(m.year, m.month),
        return: m.totalReturnPercent,
      })),
    [monthly],
  )

  const capitalVsContributionsData = useMemo(() => {
    let contributed = 0
    const sortedMovements = [...movements].sort((a, b) => a.date.localeCompare(b.date))
    const movementByDate = new Map(sortedMovements.map((m) => [m.date.split('T')[0], m]))

    return performances.map((p) => {
      const dateKey = p.date.split('T')[0]!
      const dayMovements = sortedMovements.filter((m) => m.date.split('T')[0] === dateKey)
      for (const m of dayMovements) {
        contributed += m.type === 'DEPOSIT' ? m.amount : -m.amount
      }
      void movementByDate
      return { date: p.date, capital: p.shareValue, contributions: contributed }
    })
  }, [performances, movements])

  const distributionData = useMemo(
    () => buildDistributionBuckets(performances.map((p) => p.dailyReturnPercent)),
    [performances],
  )

  const lastMonthReturn = monthly.length > 0 ? monthly[monthly.length - 1]!.totalReturnPercent : 0

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-8 animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Seguimiento de tu inversión en FCI</p>
        </div>
        <EmptyState message="No hay estadísticas disponibles. Agregá movimientos y registros diarios." />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Seguimiento de tu inversión en FCI</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Capital actual" value={formatCurrency(stats.capitalActual)} icon={Wallet} />
        <MetricCard
          title="Total invertido"
          value={formatCurrency(stats.capitalInvertido)}
          icon={PiggyBank}
        />
        <MetricCard
          title="Ganancia total"
          value={formatCurrency(stats.ganancia)}
          icon={TrendingUp}
          trend={stats.ganancia >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Rentabilidad"
          value={formatRatio(stats.rentabilidad)}
          icon={Percent}
          trend={stats.rentabilidad >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Promedio diario"
          value={formatRatio(stats.promedioDiario)}
          icon={Calendar}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Promedio mensual"
          value={formatRatio(stats.promedioMensual)}
          icon={BarChart3}
        />
        <MetricCard title="TEA" value={formatRatio(stats.tea)} subtitle="Tasa Efectiva Anual" icon={Target} />
        <MetricCard
          title="TNA equivalente"
          value={formatRatio(stats.tna)}
          subtitle="Tasa Nominal Anual"
          icon={Percent}
        />
        <MetricCard
          title="Rendimiento último mes"
          value={formatPercent(lastMonthReturn)}
          icon={ArrowUpRight}
          trend={lastMonthReturn >= 0 ? 'up' : 'down'}
        />
      </div>

      <MetricCard
        title="CAGR"
        value={formatRatio(stats.cagr)}
        subtitle="Tasa de crecimiento anual compuesta"
        icon={Target}
        className="max-w-md"
      />

      {performances.length > 0 ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Evolución del capital">
              <CapitalEvolutionChart data={capitalData} />
            </ChartCard>
            <ChartCard title="Ganancia diaria">
              <AccumulatedGainsChart data={gainsData} />
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Rendimiento diario">
              <DailyReturnChart data={dailyReturnData} />
            </ChartCard>
            <ChartCard title="Rendimiento mensual">
              <MonthlyReturnChart data={monthlyReturnData} />
            </ChartCard>
            <ChartCard title="Capital vs aportes">
              <CapitalVsContributionsChart data={capitalVsContributionsData} />
            </ChartCard>
          </div>

          <ChartCard title="Distribución de rendimientos diarios">
            <ReturnDistributionChart data={distributionData} />
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatItem label="Promedio diario" value={formatRatio(stats.promedioDiario)} />
                <StatItem label="Promedio mensual" value={formatRatio(stats.promedioMensual)} />
                <StatItem label="Volatilidad" value={formatRatio(stats.volatilidad)} />
                <StatItem label="Desvío estándar" value={formatRatio(stats.desvioEstandar)} />
                <StatItem
                  label="Mejor día"
                  value={stats.mejorDia ? formatPercent(stats.mejorDia.value) : '-'}
                />
                <StatItem
                  label="Peor día"
                  value={stats.peorDia ? formatPercent(stats.peorDia.value) : '-'}
                />
                <StatItem label="Max drawdown" value={formatRatio(stats.drawdown)} />
                <StatItem label="Días positivos" value={String(stats.diasPositivos)} />
                <StatItem label="Días negativos" value={String(stats.diasNegativos)} />
                <StatItem
                  label="Mejor mes"
                  value={
                    stats.mejorMes
                      ? `${formatMonthFromApi(stats.mejorMes.year, stats.mejorMes.month)} (${formatPercent(stats.mejorMes.returnPercent)})`
                      : '-'
                  }
                />
                <StatItem
                  label="Peor mes"
                  value={
                    stats.peorMes
                      ? `${formatMonthFromApi(stats.peorMes.year, stats.peorMes.month)} (${formatPercent(stats.peorMes.returnPercent)})`
                      : '-'
                  }
                />
                <StatItem label="CAGR" value={formatRatio(stats.cagr)} />
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState message="Comenzá agregando registros en el historial diario o movimientos de capital." />
      )}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}
