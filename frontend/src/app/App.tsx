import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Radio,
  Sparkles,
  PhoneCall,
  RotateCcw,
  CheckCircle2,
  X,
  Phone,
} from 'lucide-react'
import { fetchSampleCalls, fetchHealth, postEmergencyAlert } from '../lib/api'
import { EmergencyContact, SampleCall, SupportedLanguage } from '../lib/types'
import { useLanguage } from '../hooks/useLanguage'
import { useCallStream } from '../hooks/useCallStream'
import { LanguageSwitcher } from '../features/call/LanguageSwitcher'
import { EmergencyContactCard } from '../features/home/EmergencyContactCard'
import { CallPicker } from '../features/home/CallPicker'
import { CallScreen } from '../features/call/CallScreen'
import { WarningOverlay } from '../features/warning/WarningOverlay'
import { AlertSentToast } from '../features/warning/AlertSentToast'
import { CallSummary } from '../features/summary/CallSummary'

export const App: React.FC = () => {
  const { language, setLanguage, t } = useLanguage()
  const [calls, setCalls] = useState<SampleCall[]>([])
  const [selectedCallId, setSelectedCallId] = useState<string>('scam_digital_arrest')
  const [mode, setMode] = useState<'live' | 'replay'>('replay')
  const [health, setHealth] = useState<{
    status: string
    gemini_model: string
    gemini_fallback_model: string
    live_gemini_active: boolean
    default_mode: string
  } | null>(null)

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: 'Ajay (Son)',
    relationship: 'Son',
    phone: '+91 98765 43210',
  })

  const [activeScreen, setActiveScreen] = useState<'home' | 'call' | 'summary'>('home')
  const [familyDialerOpen, setFamilyDialerOpen] = useState(false)
  const [toastDismissed, setToastDismissed] = useState(false)

  const {
    state,
    chunks,
    flags,
    level,
    alertSent,
    isStreaming,
    isFinished,
    error,
    startStream,
    stopStream,
  } = useCallStream()

  // Load calls manifest and health on mount
  useEffect(() => {
    fetchSampleCalls()
      .then((data) => {
        setCalls(data)
        if (data.length > 0) setSelectedCallId(data[0].id)
      })
      .catch((err) => console.error('Failed to load calls:', err))

    fetchHealth()
      .then((h) => {
        setHealth(h)
        if (h.live_gemini_active && h.default_mode === 'live') {
          setMode('live')
        }
      })
      .catch((err) => console.error('Health check error:', err))
  }, [])

  // Auto transition to summary when call stream finishes naturally
  useEffect(() => {
    if (isFinished && activeScreen === 'call') {
      setActiveScreen('summary')
    }
  }, [isFinished, activeScreen])

  const selectedCall = calls.find((c) => c.id === selectedCallId) || calls[0]

  const handleStartCall = () => {
    if (!selectedCall) return
    setActiveScreen('call')
    setToastDismissed(false)
    startStream(
      selectedCall.id,
      mode,
      language,
      emergencyContact.phone,
      emergencyContact.relationship
    )
  }

  const handleHangUp = () => {
    stopStream()
    setActiveScreen('summary')
  }

  const handleCallFamily = () => {
    setFamilyDialerOpen(true)
    postEmergencyAlert(
      emergencyContact.phone,
      emergencyContact.relationship,
      'Parent',
      state.flags
    ).catch((e) => console.warn('Manual alert dispatch failed', e))
  }

  const handleResetToHome = () => {
    stopStream()
    setActiveScreen('home')
  }

  const isScamWarningOpen = level === 'SCAM' && activeScreen === 'call'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16 selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <ShieldAlert className="w-7 h-7 text-rose-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {t('app_title')}
                </h1>
                <span className="text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  વૃદ્ધ સુરક્ષા કવચ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                "{t('app_tagline')}" — {t('app_subtitle')}
              </p>
            </div>
          </div>

          {/* Right Header: System Status & Language Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>
                {mode === 'live' && health?.live_gemini_active
                  ? `Gemini Live (${health.gemini_model})`
                  : 'Replay Mode (Offline Safe)'}
              </span>
            </div>

            <LanguageSwitcher currentLang={language} onSelectLang={setLanguage} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6 w-full">
        {/* Screen 1: Home View (CallPicker + Contact Card) */}
        {activeScreen === 'home' && (
          <div className="flex flex-col gap-6">
            <EmergencyContactCard
              language={language}
              onContactChange={setEmergencyContact}
            />

            <CallPicker
              calls={calls}
              selectedCallId={selectedCallId}
              onSelectCall={setSelectedCallId}
              onStartCall={handleStartCall}
              language={language}
              mode={mode}
              onToggleMode={setMode}
              liveGeminiActive={Boolean(health?.live_gemini_active)}
            />
          </div>
        )}

        {/* Screen 2: Active Call View */}
        {activeScreen === 'call' && selectedCall && (
          <CallScreen
            call={selectedCall}
            callState={state}
            chunks={chunks}
            flags={flags}
            language={language}
            isStreaming={isStreaming}
            onHangUp={handleHangUp}
            onCallFamily={handleCallFamily}
          />
        )}

        {/* Screen 3: Summary View */}
        {activeScreen === 'summary' && selectedCall && (
          <CallSummary
            call={selectedCall}
            callState={state}
            language={language}
            onReset={handleResetToHome}
          />
        )}
      </main>

      {/* Warning Overlay Takeover at SCAM Level */}
      <WarningOverlay
        isOpen={isScamWarningOpen}
        language={language}
        onHangUp={handleHangUp}
        onCallFamily={handleCallFamily}
        detectedFlags={flags}
        familyContactPhone={emergencyContact.phone}
        familyRelationship={emergencyContact.relationship}
      />

      {/* Simulated SMS Alert Toast */}
      {alertSent && !toastDismissed && (
        <AlertSentToast
          alert={alertSent}
          language={language}
          onDismiss={() => setToastDismissed(true)}
        />
      )}

      {/* Manual Family Call Dialer Modal */}
      {familyDialerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-emerald-600/20 border-2 border-emerald-400 flex items-center justify-center">
              <Phone className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">
                {language === 'gu'
                  ? 'પરિવારને કૉલ લાગી રહ્યો છે...'
                  : language === 'hi'
                  ? 'परिवार को कॉल मिलाया जा रहा है...'
                  : 'Dialing Trusted Family Member...'}
              </h3>
              <p className="text-emerald-300 font-mono text-xl font-bold mt-2">
                {emergencyContact.phone} ({emergencyContact.name})
              </p>
              <p className="text-sm text-slate-400 mt-2 font-sans">
                {language === 'gu'
                  ? 'તમારા પરિવારના સભ્યને તાત્કાલિક સાયબર એલર્ટ મોકલી દેવાયો છે.'
                  : language === 'hi'
                  ? 'आपके परिवार को तुरंत सुरक्षा अलर्ट भेज दिया गया है.'
                  : 'An emergency alert with the detected scam red flags has been dispatched (Simulated).'}
              </p>
            </div>

            <button
              onClick={() => setFamilyDialerOpen(false)}
              className="w-full min-h-[50px] bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-600 cursor-pointer text-base"
            >
              {language === 'gu' ? 'બંધ કરો' : language === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
