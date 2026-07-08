import { http } from '@/api/http'
import type {
  RunSimulationInput,
  SaveSimulationInput,
  Simulation,
  SimulationOutput,
  SimulationWithResults,
} from '@/types/api'

export const SimulationService = {
  async runSimulation(input: RunSimulationInput): Promise<SimulationOutput> {
    const { data } = await http.post<SimulationOutput>('/simulation', input)
    return data
  },

  async saveSimulation(input: SaveSimulationInput): Promise<SimulationWithResults> {
    const { data } = await http.post<SimulationWithResults>('/simulation/save', input)
    return data
  },

  async getSimulations(accountId?: string): Promise<Simulation[]> {
    const { data } = await http.get<Simulation[]>('/simulation', {
      params: accountId ? { accountId } : undefined,
    })
    return data
  },

  async getSimulationById(id: string): Promise<SimulationWithResults> {
    const { data } = await http.get<SimulationWithResults>(`/simulation/${id}`)
    return data
  },

  async deleteSimulation(id: string): Promise<void> {
    await http.delete(`/simulation/${id}`)
  },
}
