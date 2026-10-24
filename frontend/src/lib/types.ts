export type FlagType =
  | 'urgency'
  | 'threat'
  | 'authority_claim'
  | 'isolation'
  | 'otp_request'
  | 'money_request'

export type Level = 'SAFE' | 'SUSPICIOUS' | 'SCAM'

export interface DetectedFlag {
  type: FlagType
  evidence: string
  confidence: number
}

export interface ChunkAnalysis {
  transcript: string
  language: string
  flags: DetectedFlag[]
  speaker_claims_to_be?: string | null
  summary_so_far: string
}

export interface CallState {
  level: Level
  flags: FlagType[]
  score: number
  summary: string
  chunk_index: number
  duration_sec: number
  speaker_claims_to_be?: string | null
  transcript_history: string[]
  all_evidence: Array<{
    type: string
    evidence: string
    confidence: number
    t: number
  }>
}

export interface SampleCall {
  id: string
  title: string
  language: string
  caller_id: string
  expected_verdict: Level
  description: string
  duration_sec: number
  audio_file: string
  danger_level: string
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
}

export type SupportedLanguage = 'gu' | 'hi' | 'en'

export interface CallStartedEvent {
  call_id: string
  total_chunks: number
  mode: string
}

export interface ChunkAnalysisEvent {
  index: number
  t_start: number
  t_end: number
  transcript: string
  new_flags: DetectedFlag[]
  state: CallState
}

export interface LevelChangedEvent {
  level: Level
  previous_level: Level
  score: number
}

export interface ScamDetectedEvent {
  flags: FlagType[]
  evidence: string[]
  t: number
}

export interface AlertSentEvent {
  contact: string
  message: string
  simulated: boolean
}

export interface CallEndedEvent {
  final_level: Level
  final_score: number
  summary: string
}
