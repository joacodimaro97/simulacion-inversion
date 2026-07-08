import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Play, Save, Shuffle } from 'lucide-react'
import { useAccount } from '@/contexts/AccountContext'
import { usePerformance } from '@/hooks/usePerformance'
import { useRunSimulation, useSaveSimulation } from '@/hooks/useSimulation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ChartCard } from '@/components/common/ChartCard'
import { CapitalEvolutionChart } from '@/charts/CapitalEvolutionChart'
import { MetricCard } from '@/components/common/MetricCard'
import { mapUiModelToSimulationType, percentToDecimal, type UiSimulationModel } from '@/utils/mappers'
import { formatCurrency, formatRatio } from '@/utils/format'
import type { RunSimulationInput, SimulationOutput } from '@/types/api'
import { Wallet, TrendingUp, Percent } from 'lucide-react'

interface SimulatorForm {
  name: string
  model: UiSimulationModel
  initialCapital: number
  monthlyContribution: number
  years: number
  annualRate: number
  frequency: string
  optimisticMin: number
  optimisticMax: number
  pessimisticMin: number
  pessimisticMax: number
  distributionMean: number
  distributionStdDev: number
  negativeDayProbability: number
}

const DEFAULTS: SimulatorForm = {
  name: 'Mi simulación',
  model: 'fixed_rate',
  initialCapital: 100000,
  monthlyContribution: 50000,
  years: 1,
  annualRate: 59,
  frequency: 'monthly',
  optimisticMin: 0.05,
  optimisticMax: 0.22,
  pessimisticMin: -0.35,
  pessimisticMax: 0.12,
  distributionMean: 0.1,
  distributionStdDev: 0.05,
  negativeDayProbability: 0.15,
}

export function SimulatorPage() {
  const { accountId } = useAccount()
  const { data: performances = [] } = usePerformance()
  const runSimulation = useRunSimulation()
  const saveSimulation = useSaveSimulation()
  const [result, setResult] = useState<SimulationOutput | null>(null)

  const { register, handleSubmit, watch, setValue } = useForm<SimulatorForm>({
    defaultValues: DEFAULTS,
  })

  const model = watch('model')

  const buildPayload = (data: SimulatorForm): RunSimulationInput => {
    const simulationType = mapUiModelToSimulationType(data.model)
    return {
      accountId: accountId!,
      name: data.name,
      simulationType,
      capitalInitial: Number(data.initialCapital),
      monthlyContribution: Number(data.monthlyContribution),
      years: Number(data.years),
      annualRate:
        simulationType === 'FIXED' ? percentToDecimal(Number(data.annualRate)) : undefined,
      optimisticMin: percentToDecimal(Number(data.optimisticMin)),
      optimisticMax: percentToDecimal(Number(data.optimisticMax)),
      pessimisticMin: percentToDecimal(Number(data.pessimisticMin)),
      pessimisticMax: percentToDecimal(Number(data.pessimisticMax)),
      customMean: percentToDecimal(Number(data.distributionMean)),
      customStdDev: percentToDecimal(Number(data.distributionStdDev)),
      customLossProbability: Number(data.negativeDayProbability),
    }
  }

  const onSubmit = async (data: SimulatorForm) => {
    if (!accountId) return
    const output = await runSimulation.mutateAsync(buildPayload(data))
    setResult(output)
  }

  const handleSave = async () => {
    if (!accountId || !result) return
    const data = watch()
    await saveSimulation.mutateAsync({
      ...buildPayload(data),
      name: data.name,
    })
  }

  const handleGenerateRandom = async () => {
    setValue('model', 'custom_distribution')
    const data = watch()
    if (!accountId) return
    const output = await runSimulation.mutateAsync({
      accountId,
      simulationType: 'CUSTOM',
      capitalInitial: Number(data.initialCapital),
      monthlyContribution: Number(data.monthlyContribution),
      years: 1,
      customMean: percentToDecimal(Number(data.distributionMean) || 0.1),
      customStdDev: percentToDecimal(Number(data.distributionStdDev) || 0.05),
      customLossProbability: Number(data.negativeDayProbability) || 0.15,
    })
    setResult(output)
  }

  const chartData =
    result?.results.map((r) => ({
      date: `Día ${r.day}`,
      capital: r.capital,
    })) ?? []

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Simulador</h1>
        <p className="text-muted-foreground">
          Proyectá escenarios futuros con interés compuesto
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parámetros generales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...register('name')} />
            </div>
            <div className="space-y-2">
              <Label>Capital inicial ($)</Label>
              <Input type="number" {...register('initialCapital')} />
            </div>
            <div className="space-y-2">
              <Label>Aporte mensual ($)</Label>
              <Input type="number" {...register('monthlyContribution')} />
            </div>
            <div className="space-y-2">
              <Label>Años</Label>
              <Input type="number" min={1} max={30} {...register('years')} />
            </div>
            <div className="space-y-2">
              <Label>Tasa anual (%)</Label>
              <Input type="number" step="0.01" {...register('annualRate')} />
            </div>
            <div className="space-y-2">
              <Label>Frecuencia de aportes</Label>
              <Select {...register('frequency')}>
                <option value="monthly">Mensual</option>
                <option value="biweekly">Quincenal</option>
                <option value="weekly">Semanal</option>
                <option value="daily">Diaria</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modelo de simulación</CardTitle>
          </CardHeader>
          <CardContent>
            <input type="hidden" {...register('model')} />
            <Tabs value={model} onValueChange={(v) => setValue('model', v as UiSimulationModel)}>
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="fixed_rate">Tasa fija</TabsTrigger>
                <TabsTrigger value="custom_distribution">Personalizado</TabsTrigger>
                <TabsTrigger value="optimistic">Optimista</TabsTrigger>
                <TabsTrigger value="pessimistic">Pesimista</TabsTrigger>
                <TabsTrigger value="historical">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="fixed_rate">
                <p className="text-sm text-muted-foreground">
                  Usa la tasa anual indicada convertida a rendimiento diario compuesto.
                </p>
              </TabsContent>

              <TabsContent value="custom_distribution" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Promedio (%)</Label>
                    <Input type="number" step="0.01" {...register('distributionMean')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Desvío (%)</Label>
                    <Input type="number" step="0.01" {...register('distributionStdDev')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Prob. días negativos</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={1}
                      {...register('negativeDayProbability')}
                    />
                  </div>
                </div>
                <Button type="button" variant="secondary" onClick={handleGenerateRandom}>
                  <Shuffle className="h-4 w-4" />
                  Generar escenario aleatorio (1 año)
                </Button>
              </TabsContent>

              <TabsContent value="optimistic" className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mínimo (%)</Label>
                  <Input type="number" step="0.01" {...register('optimisticMin')} />
                </div>
                <div className="space-y-2">
                  <Label>Máximo (%)</Label>
                  <Input type="number" step="0.01" {...register('optimisticMax')} />
                </div>
              </TabsContent>

              <TabsContent value="pessimistic" className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mínimo (%)</Label>
                  <Input type="number" step="0.01" {...register('pessimisticMin')} />
                </div>
                <div className="space-y-2">
                  <Label>Máximo (%)</Label>
                  <Input type="number" step="0.01" {...register('pessimisticMax')} />
                </div>
              </TabsContent>

              <TabsContent value="historical">
                <p className="text-sm text-muted-foreground">
                  {performances.length > 0
                    ? `Usa los ${performances.length} rendimientos diarios reales cargados.`
                    : 'No hay datos históricos. Cargá registros en el historial diario primero.'}
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={runSimulation.isPending}>
            <Play className="h-4 w-4" />
            {runSimulation.isPending ? 'Ejecutando...' : 'Ejecutar simulación'}
          </Button>
          {result && (
            <Button type="button" variant="outline" onClick={handleSave} disabled={saveSimulation.isPending}>
              <Save className="h-4 w-4" />
              Guardar simulación
            </Button>
          )}
        </div>
      </form>

      {result && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Capital final"
              value={formatCurrency(result.finalCapital)}
              icon={Wallet}
            />
            <MetricCard
              title="Ganancia"
              value={formatCurrency(result.totalProfit)}
              icon={TrendingUp}
              trend={result.totalProfit >= 0 ? 'up' : 'down'}
            />
            <MetricCard
              title="Rentabilidad"
              value={formatRatio(result.totalReturn)}
              icon={Percent}
            />
          </div>

          <ChartCard title="Evolución del capital simulado">
            <CapitalEvolutionChart data={chartData} />
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultado de la simulación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Capital inicial" value={formatCurrency(result.capitalInitial)} />
                <Stat label="Aporte mensual" value={formatCurrency(result.monthlyContribution)} />
                <Stat label="Años" value={String(result.years)} />
                <Stat label="Días simulados" value={String(result.results.length)} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}
