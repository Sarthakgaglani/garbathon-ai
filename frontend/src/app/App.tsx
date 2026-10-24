import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  PhoneCall,
  RotateCcw,
  Sparkles,
  Info,
  Radio,
  CheckCircle2,
  X,
  Phone,
} from 'lucide-react'
import { fetchSampleCalls, fetchHealth } from '../lib/api'
import { SampleCall, SupportedLanguage } from '../lib/types'
import { useCallStream } from '../hooks/useCallStream'
import { LanguageSwitcher } from '../features/call/LanguageSwitcher'
import { CallScreen } from '../features/call/CallScreen'
import { WarningOverlay } from '../features/call/WarningOverlay'

export const App: React.FC = () => {
  const [calls, setCalls] = useState<SampleCall[]>([])
  const [selectedCallId, setSelectedCallId] = useState<string>('scam_digital_arrest')
  const [language, setLanguage] = useState<SupportedLanguage>('gu')
  const [health, setHealth] = useState<{ status: string; gemini_model: string; live_gemini_active: boolean } | null>(null)
  const [familyModalOpen, setFamilyModalOpen] = useState(false)
  const [hangUpNotice, setHangUpNotice] = useState<string | null>(null)

  const { callState, chunks, isStreaming, isFinished, startStream, stopStream } = useCallStream()

  useEffect(() => {
    fetchSampleCalls()
      .then((data) => {
        setCalls(data)
        if (data.length > 0) {
          setSelectedCallId(data[0].id)
        }
      })
      .catch((err) => console.error('Failed to load sample calls:', err))

    fetchHealth()
      .then(setHealth)
      .catch((err) => console.error('Health check failed:', err))
  }, [])

  const selectedCall = calls.find((c) => c.id === selectedCallId) || calls[0]

  const handleStartCall = () => {
    if (!selectedCall) return
    setHangUpNotice(null)
    startStream(selectedCall.id)
  }

  const handleHangUp = () => {
    stopStream()
    setHangUpNotice(
      language === 'gu'
        ? 'કૉલ કાપી નાખવામાં આવ્યો છે. તમે સુરક્ષિત છો!'
        : language === 'hi'
        ? 'कॉल काट दिया गया है. आप सुरक्षित हैं!'
        : 'Call disconnected successfully. You are safe!'
    )
    setTimeout(() => {
      setHangUpNotice(null)
    }, 4500)
  }

  const handleCallFamily = () => {
    setFamilyModalOpen(true)
  }

  const isScamLevel = callState?.level === 'SCAM'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
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
                  {language === 'gu'
                    ? 'સ્કેમ કૉલ શીલ્ડ'
                    : language === 'hi'
                    ? 'स्कैम कॉल शील्ड'
                    : 'Scam Call Shield'}
                </h1>
                <span className="text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  વૃદ્ધ સુરક્ષા કવચ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'gu'
                  ? 'વડીલો માટે ગુજરાતી અને હિન્દી રીઅલ-ટાઇમ છેતરપિંડી સુરક્ષા'
                  : language === 'hi'
                  ? 'बुजुर्गों के लिए गुजराती और हिंदी रियल-टाइम धोखाधड़ी सुरक्षा'
                  : 'Real-time elder telephone fraud shield with native Gujarati & Hindi AI'}
              </p>
            </div>
          </div>

          {/* Right Header: System Status & Language Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>
                {health?.live_gemini_active
                  ? `Gemini Live (${health.gemini_model})`
                  : 'Replay Mode (Offline Safe)'}
              </span>
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher currentLang={language} onSelectLang={setLanguage} />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6 w-full">
        {/* Hang Up Notice Banner */}
        {hangUpNotice && (
          <div className="w-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-200 p-4 rounded-2xl flex items-center justify-between text-lg font-bold shadow-xl animate-bounce">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span>{hangUpNotice}</span>
            </div>
            <button
              onClick={() => setHangUpNotice(null)}
              className="text-emerald-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Call Scenario Picker Carousel */}
        <section className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="font-extrabold text-lg text-white">
                {language === 'gu'
                  ? 'ડેમો કૉલ સિનારિયો પસંદ કરો'
                  : language === 'hi'
                  ? 'डेमो कॉल परिदृश्य चुनें'
                  : 'Select Test Scenario Call'}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              3 Scam Attacks + 1 Genuine Verification Call
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {calls.map((c) => {
              const isSelected = c.id === selectedCallId
              const isScam = c.expected_verdict === 'SCAM'

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    if (isStreaming) stopStream()
                    setSelectedCallId(c.id)
                  }}
                  className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? isScam
                        ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/20 scale-[1.02]'
                        : 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isScam
                            ? 'bg-rose-500 text-white'
                            : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {isScam ? '🚨 SCAM' : '🟢 GENUINE'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{c.duration_sec}s</span>
                    </div>

                    <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-normal">
                      {c.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-300">
                    <span>{c.language}</span>
                    <span className="font-semibold text-amber-300">
                      {isSelected ? '✓ Selected' : 'Tap to test'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Simulation Trigger Bar */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {language === 'gu'
                  ? 'પસંદ કરેલા કૉલ પર ક્લિક કરીને લાઈવ ઓડિયો પ્રોસેસિંગ શરૂ કરો.'
                  : language === 'hi'
                  ? 'चयनित कॉल पर क्लिक करके लाइव ऑडियो प्रोसेसिंग शुरू करें.'
                  : 'Start the live stream to slice 16kHz audio into 5s chunks with AI risk scoring.'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isStreaming ? (
                <button
                  onClick={handleStartCall}
                  className="flex-1 sm:flex-none min-h-[48px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>
                    {language === 'gu'
                      ? 'કૉલ સિમ્યુલેશન શરૂ કરો'
                      : language === 'hi'
                      ? 'कॉल शुरू करें'
                      : 'Start Call Simulation'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={stopStream}
                  className="flex-1 sm:flex-none min-h-[48px] px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>
                    {language === 'gu' ? 'કૉલ રોકો / રીસેટ' : language === 'hi' ? 'कॉल रोकें' : 'Stop / Reset'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Live Call Screen */}
        {selectedCall && (
          <CallScreen
            call={selectedCall}
            callState={callState}
            chunks={chunks}
            language={language}
            isStreaming={isStreaming}
            onHangUp={handleHangUp}
            onCallFamily={handleCallFamily}
          />
        )}
      </main>

      {/* SCAM Warning Full-Screen Takeover Modal */}
      <WarningOverlay
        isOpen={isScamLevel}
        language={language}
        onHangUp={handleHangUp}
        onCallFamily={handleCallFamily}
        detectedFlags={callState?.all_detected_flags || []}
      />

      {/* Emergency Call Family Contact Modal */}
      {familyModalOpen && (
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
                +91 98765 43210 (પુત્ર: અજય)
              </p>
              <p className="text-sm text-slate-400 mt-2">
                {language === 'gu'
                  ? 'તમારા પુત્રને તરત જ આ શંકાસ્પદ કૉલ અને લોકેશનની માહિતી મોકલવામાં આવી છે.'
                  : language === 'hi'
                  ? 'आपके बेटे को तुरंत इस संदिग्ध कॉल की जानकारी भेज दी गई है.'
                  : 'An emergency alert and live fraud transcript snippet have been forwarded.'}
              </p>
            </div>

            <button
              onClick={() => setFamilyModalOpen(false)}
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
