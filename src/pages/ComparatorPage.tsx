import { useState, useMemo } from 'react'
import { GitCompareArrows, Check } from 'lucide-react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useAccount } from '@/contexts/AccountContext'
import { useSimulations } from '@/hooks/useSimulation'
import { useStatistics } from '@/hooks/useStatistics'
import { SimulationService } from '@/services/SimulationService'
import { queryKeys } from '@/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartCard } from '@/components/common/ChartCard'
import { EmptyState } from '@/components/common/EmptyState'
import { SimulationComparisonChart } from '@/charts/SimulationComparisonChart'
import { PageHeaderSkeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/utils/format'
import { decimalToPercent } from '@/utils/mappers'
import type { Simulation, SimulationWithResults } from '@/types/api'
import { cn } from '@/utils/cn'

const MAX_COMPARISONS = 5
const REAL_HISTORY_ID = '__real__'

interface ComparisonOption {
  id: string
  name: string
  isReal: boolean
  subtitle: string
}

interface ComparisonItem {
  id: string
  name: string
  isReal: boolean
  subtitle: string
  data: SimulationWithResults | null
}

export function ComparatorPage() {
  const { accountId, isReady } = useAccount()
  const { data: stats } = useStatistics()
  const { data: simulations = [], isLoading } = useSimulations()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const savedIds = selectedIds.filter((id) => id !== REAL_HISTORY_ID)
  const includeReal = selectedIds.includes(REAL_HISTORY_ID)

  const detailQueries = useQueries({
    queries: savedIds.map((id) => ({
      queryKey: queryKeys.simulations.detail(id),
      queryFn: () => SimulationService.getSimulationById(id),
    })),
  })

  const realHistoryQuery = useQuery({
    queryKey: ['simulation', 'real-history', accountId],
    queryFn: async (): Promise<SimulationWithResults> => {
      const output = await SimulationService.runSimulation({
        accountId: accountId!,
        simulationType: 'REAL_HISTORY',
        capitalInitial: stats?.capitalInvertido ?? 100000,
        years: 1,
      })

      return {
        id: REAL_HISTORY_ID,
        accountId: accountId!,
        name: 'Rendimiento real',
        simulationType: 'REAL_HISTORY',
        capitalInitial: output.capitalInitial,
        monthlyContribution: output.monthlyContribution,
        annualRate: null,
        years: output.years,
        createdAt: new Date().toISOString(),
        results: output.results.map((r, i) => ({
          id: `real-${i}`,
          simulationId: REAL_HISTORY_ID,
          day: r.day,
          capital: r.capital,
          profit: r.profit,
          dailyRate: r.dailyRate,
        })),
      }
    },
    enabled: includeReal && !!accountId,
  })

  const allOptions = useMemo((): ComparisonOption[] => {
    const options: ComparisonOption[] = simulations.map((s: Simulation) => ({
      id: s.id,
      name: s.name,
      isReal: false,
      subtitle: `${s.annualRate ? decimalToPercent(s.annualRate).toFixed(0) : '—'}% · ${s.years} año(s)`,
    }))
    options.unshift({
      id: REAL_HISTORY_ID,
      name: 'Rendimiento real',
      isReal: true,
      subtitle: 'Datos históricos',
    })
    return options
  }, [simulations])

  const comparisonItems: ComparisonItem[] = useMemo(() => {
    const items: ComparisonItem[] = []

    for (const id of selectedIds) {
      if (id === REAL_HISTORY_ID) {
        items.push({
          id,
          name: 'Rendimiento real',
          isReal: true,
          subtitle: 'Datos históricos',
          data: realHistoryQuery.data ?? null,
        })
        continue
      }

      const queryIndex = savedIds.indexOf(id)
      const data = detailQueries[queryIndex]?.data ?? null
      const option = allOptions.find((o) => o.id === id)
      items.push({
        id,
        name: option?.name ?? 'Simulación',
        isReal: false,
        subtitle: option?.subtitle ?? '',
        data,
      })
    }

    return items
  }, [selectedIds, savedIds, detailQueries, realHistoryQuery.data, allOptions])

  const loadedItems = comparisonItems.filter((item) => item.data !== null)

  const chartSeries = useMemo(
    () =>
      loadedItems.map((item) => ({
        name: item.name,
        data: (item.data?.results ?? []).map((r) => ({ day: r.day, capital: r.capital })),
      })),
    [loadedItems],
  )

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id)
      if (prev.length >= MAX_COMPARISONS) return prev
      return [...prev, id]
    })
  }

  const isDetailsLoading =
    detailQueries.some((q) => q.isLoading) || (includeReal && realHistoryQuery.isLoading)

  if (!isReady || isLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comparador</h1>
        <p className="text-muted-foreground">
          Compará hasta {MAX_COMPARISONS} simulaciones con tu rendimiento real
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4" />
            Seleccionar simulaciones ({selectedIds.length}/{MAX_COMPARISONS})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allOptions.length <= 1 ? (
            <EmptyState message="Guardá simulaciones desde el simulador o cargá datos reales en el historial." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allOptions.map((sim) => {
                const isSelected = selectedIds.includes(sim.id)
                const isDisabled = !isSelected && selectedIds.length >= MAX_COMPARISONS
                return (
                  <button
                    key={sim.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleSelection(sim.id)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-4 text-left transition-all',
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                      isDisabled && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <div>
                      <p className="font-medium">{sim.name}</p>
                      <p className="text-xs text-muted-foreground">{sim.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sim.isReal && <Badge variant="success">Real</Badge>}
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedIds.length > 0 && isDetailsLoading && (
        <p className="text-center text-sm text-muted-foreground">Cargando simulaciones...</p>
      )}

      {loadedItems.length > 0 && (
        <>
          <ChartCard title="Comparación de simulaciones">
            <SimulationComparisonChart series={chartSeries} />
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultados comparados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Simulación</th>
                      <th className="pb-3 pr-4 font-medium">Capital final</th>
                      <th className="pb-3 pr-4 font-medium">Capital inicial</th>
                      <th className="pb-3 pr-4 font-medium">Años</th>
                      <th className="pb-3 font-medium">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadedItems.map((item) => {
                      const data = item.data!
                      const finalCapital =
                        data.results[data.results.length - 1]?.capital ?? data.capitalInitial
                      return (
                        <tr key={item.id} className="border-b">
                          <td className="py-3 pr-4 font-medium">
                            {item.name}
                            {item.isReal && (
                              <Badge variant="success" className="ml-2">
                                Real
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 pr-4">{formatCurrency(finalCapital)}</td>
                          <td className="py-3 pr-4">{formatCurrency(data.capitalInitial)}</td>
                          <td className="py-3 pr-4">{data.years}</td>
                          <td className="py-3">{data.simulationType}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loadedItems.map((item) => {
              const data = item.data!
              const finalCapital =
                data.results[data.results.length - 1]?.capital ?? data.capitalInitial
              const lastResult = data.results[data.results.length - 1]
              return (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <Row label="Capital final" value={formatCurrency(finalCapital)} />
                    <Row label="Capital inicial" value={formatCurrency(data.capitalInitial)} />
                    <Row
                      label="Última ganancia diaria"
                      value={formatCurrency(lastResult?.profit ?? 0)}
                      highlight={(lastResult?.profit ?? 0) >= 0 ? 'up' : 'down'}
                    />
                    <Row label="Días simulados" value={String(data.results.length)} />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: 'up' | 'down'
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-medium',
          highlight === 'up' && 'text-success',
          highlight === 'down' && 'text-destructive',
        )}
      >
        {value}
      </span>
    </div>
  )
}
