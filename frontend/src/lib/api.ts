import { SampleCall } from './types'

const API_BASE = '/api'

export async function fetchSampleCalls(): Promise<SampleCall[]> {
  const res = await fetch(`${API_BASE}/calls`)
  if (!res.ok) {
    throw new Error(`Failed to fetch calls: ${res.statusText}`)
  }
  return res.json()
}

export async function fetchHealth(): Promise<{ status: string; gemini_model: string; live_gemini_active: boolean }> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) {
    throw new Error(`Failed to check health: ${res.statusText}`)
  }
  return res.json()
}
