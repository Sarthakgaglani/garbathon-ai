import { SampleCall } from './types'

const API_BASE = '/api'

export async function fetchHealth(): Promise<{
  status: string
  gemini_model: string
  gemini_fallback_model: string
  live_gemini_active: boolean
  default_mode: string
}> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Health check failed')
  return res.json()
}

export async function fetchSampleCalls(): Promise<SampleCall[]> {
  const res = await fetch(`${API_BASE}/calls`)
  if (!res.ok) throw new Error('Failed to load sample calls')
  return res.json()
}

export async function postEmergencyAlert(
  contactPhone: string,
  relationship: string = 'Son',
  elderName: string = 'Grandparent',
  detectedFlags: string[] = []
): Promise<{ contact: string; message: string; simulated: boolean }> {
  const res = await fetch(`${API_BASE}/alerts/emergency`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contact_phone: contactPhone,
      relationship: relationship,
      elder_name: elderName,
      detected_flags: detectedFlags,
    }),
  })
  if (!res.ok) throw new Error('Failed to send emergency alert')
  return res.json()
}
