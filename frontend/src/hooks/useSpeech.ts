import { useCallback, useRef } from 'react'
import { SupportedLanguage } from '../lib/types'

export function useSpeech() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playAlertTone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      // 2-tone urgent warning beep
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.15)
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.3)

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch (e) {
      console.warn('AudioContext alert tone not supported:', e)
    }
  }, [])

  const speakWarning = useCallback((text: string, lang: SupportedLanguage) => {
    if (!('speechSynthesis' in window)) return

    try {
      window.speechSynthesis.cancel() // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text)

      // Map language
      if (lang === 'gu') {
        utterance.lang = 'gu-IN'
      } else if (lang === 'hi') {
        utterance.lang = 'hi-IN'
      } else {
        utterance.lang = 'en-IN'
      }

      utterance.rate = 0.95 // Slightly slower for elderly comprehension
      utterance.pitch = 1.05
      utterance.volume = 1.0

      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.warn('Speech synthesis error:', e)
    }
  }, [])

  return {
    playAlertTone,
    speakWarning,
  }
}
