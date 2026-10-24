import { useState, useRef, useCallback, useEffect } from 'react'
import {
  AlertSentEvent,
  CallEndedEvent,
  CallStartedEvent,
  CallState,
  ChunkAnalysis,
  ChunkAnalysisEvent,
  DetectedFlag,
  FlagType,
  Level,
  LevelChangedEvent,
  ScamDetectedEvent,
} from '../lib/types'

export function useCallStream() {
  const [state, setState] = useState<CallState>({
    level: 'SAFE',
    flags: [],
    score: 0,
    summary: '',
    chunk_index: 0,
    duration_sec: 0,
    speaker_claims_to_be: null,
    transcript_history: [],
    all_evidence: [],
  })

  const [chunks, setChunks] = useState<ChunkAnalysis[]>([])
  const [flags, setFlags] = useState<DetectedFlag[]>([])
  const [level, setLevel] = useState<Level>('SAFE')
  const [alertSent, setAlertSent] = useState<AlertSentEvent | null>(null)
  const [mode, setMode] = useState<string>('replay')
  const [isStreaming, setIsStreaming] = useState<boolean>(false)
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const startStream = useCallback(
    (
      callId: string,
      selectedMode: 'live' | 'replay' = 'replay',
      lang: string = 'gu',
      emergencyContact: string = '+91 98765 43210',
      relationship: string = 'Son'
    ) => {
      stopStream()
      setChunks([])
      setFlags([])
      setLevel('SAFE')
      setAlertSent(null)
      setError(null)
      setIsFinished(false)

      const initial: CallState = {
        level: 'SAFE',
        flags: [],
        score: 0,
        summary: '',
        chunk_index: 0,
        duration_sec: 0,
        speaker_claims_to_be: null,
        transcript_history: [],
        all_evidence: [],
      }
      setState(initial)
      setIsStreaming(true)

      const url = `/api/calls/${callId}/stream?mode=${selectedMode}&lang=${lang}&delay_per_chunk=1.8&emergency_contact=${encodeURIComponent(
        emergencyContact
      )}&relationship=${encodeURIComponent(relationship)}`

      const es = new EventSource(url)
      eventSourceRef.current = es

      es.addEventListener('call_started', (e: MessageEvent) => {
        try {
          const payload: CallStartedEvent = JSON.parse(e.data)
          setMode(payload.mode)
        } catch (err) {
          console.error('Failed to parse call_started event', err)
        }
      })

      es.addEventListener('chunk_analysis', (e: MessageEvent) => {
        try {
          const payload: ChunkAnalysisEvent = JSON.parse(e.data)
          setState(payload.state)
          setLevel(payload.state.level)
          if (payload.new_flags && payload.new_flags.length > 0) {
            setFlags((prev) => [...prev, ...payload.new_flags])
          }
          setChunks((prev) => [
            ...prev,
            {
              transcript: payload.transcript,
              language: lang,
              flags: payload.new_flags,
              summary_so_far: payload.state.summary,
            },
          ])
        } catch (err) {
          console.error('Failed to parse chunk_analysis event', err)
        }
      })

      es.addEventListener('level_changed', (e: MessageEvent) => {
        try {
          const payload: LevelChangedEvent = JSON.parse(e.data)
          setLevel(payload.level)
        } catch (err) {
          console.error('Failed to parse level_changed event', err)
        }
      })

      es.addEventListener('scam_detected', (e: MessageEvent) => {
        try {
          const payload: ScamDetectedEvent = JSON.parse(e.data)
          setLevel('SCAM')
        } catch (err) {
          console.error('Failed to parse scam_detected event', err)
        }
      })

      es.addEventListener('alert_sent', (e: MessageEvent) => {
        try {
          const payload: AlertSentEvent = JSON.parse(e.data)
          setAlertSent(payload)
        } catch (err) {
          console.error('Failed to parse alert_sent event', err)
        }
      })

      es.addEventListener('call_ended', (e: MessageEvent) => {
        try {
          const payload: CallEndedEvent = JSON.parse(e.data)
          setLevel(payload.final_level)
          setIsFinished(true)
          stopStream()
        } catch (err) {
          console.error('Failed to parse call_ended event', err)
        }
      })

      es.onerror = (err) => {
        console.error('SSE Stream error:', err)
        setError('Stream interrupted. Replaying cached data.')
        stopStream()
        setIsFinished(true)
      }
    },
    [stopStream]
  )

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return {
    state,
    chunks,
    flags,
    level,
    alertSent,
    mode,
    isStreaming,
    isFinished,
    error,
    startStream,
    stopStream,
  }
}
