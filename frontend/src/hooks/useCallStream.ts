import { useState, useRef, useCallback, useEffect } from 'react'
import { CallState, ChunkAnalysis, StreamEvent } from '../lib/types'

export function useCallStream() {
  const [callState, setCallState] = useState<CallState | null>(null)
  const [chunks, setChunks] = useState<ChunkAnalysis[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
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
    (callId: string) => {
      stopStream()
      setChunks([])
      setError(null)
      setIsFinished(false)

      // Initial clean state
      const initialState: CallState = {
        call_id: callId,
        chunk_index: 0,
        duration_sec: 0,
        level: 'SAFE',
        score: 0,
        flags: [],
        all_detected_flags: [],
        transcript_history: [],
        running_summary: '',
      }
      setCallState(initialState)
      setIsStreaming(true)

      const sseUrl = `/api/calls/${callId}/stream?delay_per_chunk=1.8`
      const es = new EventSource(sseUrl)
      eventSourceRef.current = es

      es.addEventListener('chunk_update', (event) => {
        try {
          const payload: StreamEvent = JSON.parse(event.data)
          setCallState(payload.state)
          setChunks((prev) => [...prev, payload.chunk])
          if (payload.is_final) {
            setIsFinished(true)
          }
        } catch (err) {
          console.error('Failed to parse SSE chunk update:', err)
        }
      })

      es.addEventListener('call_completed', () => {
        setIsFinished(true)
        stopStream()
      })

      es.onerror = (err) => {
        console.error('SSE connection error:', err)
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
    callState,
    chunks,
    isStreaming,
    isFinished,
    error,
    startStream,
    stopStream,
  }
}
