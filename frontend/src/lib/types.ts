export type FlagType =
  | 'urgency'
  | 'threat'
  | 'otp_request'
  | 'money_request'
  | 'authority_claim'
  | 'isolation'

export type Level = 'SAFE' | 'SUSPICIOUS' | 'SCAM'

export interface DetectedFlag {
  type: FlagType
  evidence: string
  explanation_gu: string
  explanation_hi: string
  explanation_en?: string
}

export interface ChunkAnalysis {
  transcript: string
  flags: DetectedFlag[]
  speaker_claims_to_be?: string | null
}

export interface CallState {
  call_id: string
  chunk_index: number
  duration_sec: number
  level: Level
  score: number
  flags: FlagType[]
  all_detected_flags: DetectedFlag[]
  transcript_history: string[]
  speaker_claims_to_be?: string | null
  running_summary: string
}

export interface StreamEvent {
  type: string
  state: CallState
  chunk: ChunkAnalysis
  is_final: boolean
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

export type SupportedLanguage = 'gu' | 'hi' | 'en'
