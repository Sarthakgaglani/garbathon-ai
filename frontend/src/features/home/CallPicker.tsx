import React from 'react'
import { motion } from 'framer-motion'
import { PhoneCall, Play, ShieldAlert, ShieldCheck, Sparkles, Radio } from 'lucide-react'
import { SampleCall, SupportedLanguage } from '../../lib/types'

interface Props {
  calls: SampleCall[]
  selectedCallId: string
  onSelectCall: (id: string) => void
  onStartCall: () => void
  language: SupportedLanguage
  mode: 'live' | 'replay'
  onToggleMode: (mode: 'live' | 'replay') => void
  liveGeminiActive: boolean
}

export const CallPicker: React.FC<Props> = ({
  calls,
  selectedCallId,
  onSelectCall,
  onStartCall,
  language,
  mode,
  onToggleMode,
  liveGeminiActive,
}) => {
  const selectedCall = calls.find((c) => c.id === selectedCallId) || calls[0]

  const texts = {
    gu: {
      heading: 'ડેમો કૉલ પસંદ કરો',
      subheading: '3 છેતરપિંડીના હુમલા + 1 સાચો સ્વિગી ડિલિવરી કૉલ',
      startBtn: 'કૉલ સિમ્યુલેશન શરૂ કરો',
      modeLive: 'લાઈવ જેમિની AI',
      modeReplay: 'ડેમો મોડ (ઑફલાઇન)',
    },
    hi: {
      heading: 'डेमो कॉल परिदृश्य चुनें',
      subheading: '3 धोखाधड़ी के मामले + 1 असली स्विगी डिलीवरी कॉल',
      startBtn: 'कॉल शुरू करें',
      modeLive: 'लाइव जेमिनी AI',
      modeReplay: 'डेमो मोड (ऑफलाइन)',
    },
    en: {
      heading: 'Select a Scenario Call to Simulate',
      subheading: '3 High-pressure Scam Attacks + 1 Genuine Swiggy Delivery Call',
      startBtn: 'Start Call Simulation',
      modeLive: 'Live Gemini AI',
      modeReplay: 'Demo Mode (Offline)',
    },
  }[language]

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-white">{texts.heading}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{texts.subheading}</p>
        </div>

        {/* Live vs Replay Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-end sm:self-auto">
          <button
            onClick={() => onToggleMode('replay')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'replay'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {texts.modeReplay}
          </button>
          <button
            onClick={() => onToggleMode('live')}
            disabled={!liveGeminiActive}
            title={!liveGeminiActive ? 'Add GEMINI_API_KEY in .env to enable Live AI' : ''}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'live'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : liveGeminiActive
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>{texts.modeLive}</span>
          </button>
        </div>
      </div>

      {/* Grid of 4 Sample Calls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {calls.map((call) => {
          const isSelected = call.id === selectedCallId
          const isScam = call.expected_verdict === 'SCAM'

          return (
            <motion.div
              key={call.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCall(call.id)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? isScam
                    ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/20'
                    : 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isScam ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {isScam ? '🚨 SCAM' : '🟢 GENUINE'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{call.duration_sec}s</span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                  {call.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-normal">
                  {call.description}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium text-slate-400">{call.language}</span>
                <span className="font-extrabold text-amber-300">
                  {isSelected ? '✓ Selected' : 'Tap to select'}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Start Button Bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-400">
          Selected Call:{' '}
          <span className="text-white font-bold">{selectedCall?.title}</span>
        </div>

        <button
          onClick={onStartCall}
          className="min-h-[50px] px-8 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2.5 cursor-pointer transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{texts.startBtn}</span>
        </button>
      </div>
    </div>
  )
}
