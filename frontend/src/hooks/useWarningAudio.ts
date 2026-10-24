import { useCallback, useRef } from 'react'
import { FlagType, SupportedLanguage } from '../lib/types'

export function useWarningAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const doorbellRef = useRef<HTMLAudioElement | null>(null)

  const playWarningAudio = useCallback((flag: FlagType | 'final' | 'safe_exit', lang: SupportedLanguage) => {
    try {
      let audioPath = ''

      if (flag === 'safe_exit') {
        audioPath = `/src/assets/warning-audio/safe_exit_${lang}.wav`
      } else if (flag === 'final') {
        audioPath = `/src/assets/warning-audio/final_${lang}.wav`
      } else {
        const flagKeyMap: Record<FlagType, string> = {
          threat: 'threat',
          authority_claim: 'threat',
          otp_request: 'otp',
          money_request: 'money',
          urgency: 'urgency',
          isolation: 'isolation',
        }
        const key = flagKeyMap[flag] || 'threat'
        audioPath = `/src/assets/warning-audio/${key}_${lang}.wav`
      }

      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(audioPath)
      audioRef.current = audio
      audio.volume = 1.0
      audio.play().catch((err) => {
        console.warn('Audio auto-play blocked or audio asset missing:', err)
      })
    } catch (e) {
      console.warn('Error playing warning audio:', e)
    }
  }, [])

  const playDoorbellBailout = useCallback((lang: SupportedLanguage, onDoorbellDone?: () => void) => {
    try {
      const doorbell = new Audio('/src/assets/warning-audio/safe_exit_doorbell.wav')
      doorbellRef.current = doorbell
      doorbell.volume = 1.0

      doorbell.onended = () => {
        // After doorbell finishes, play family voice
        playWarningAudio('safe_exit', lang)
        if (onDoorbellDone) onDoorbellDone()
      }

      doorbell.play().catch((err) => {
        console.warn('Doorbell sound play blocked:', err)
        playWarningAudio('safe_exit', lang)
        if (onDoorbellDone) onDoorbellDone()
      })
    } catch (e) {
      console.warn('Doorbell bailout error:', e)
    }
  }, [playWarningAudio])

  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (doorbellRef.current) {
      doorbellRef.current.pause()
      doorbellRef.current = null
    }
  }, [])

  return {
    playWarningAudio,
    playDoorbellBailout,
    stopAllAudio,
  }
}
