import React from 'react'
import { motion } from 'framer-motion'
import {
  Phone,
  PhoneOff,
  PhoneCall,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  User,
  Activity,
} from 'lucide-react'
import { CallState, ChunkAnalysis, SampleCall, SupportedLanguage } from '../../lib/types'
import { FlagChip } from './FlagChip'
import { TranscriptPane } from './TranscriptPane'

interface Props {
  call: SampleCall
  callState: CallState | null
  chunks: ChunkAnalysis[]
  language: SupportedLanguage
  isStreaming: boolean
  onHangUp: () => void
  onCallFamily: () => void
}

export const CallScreen: React.FC<Props> = ({
  call,
  callState,
  chunks,
  language,
  isStreaming,
  onHangUp,
  onCallFamily,
}) => {
  const level = callState?.level || 'SAFE'
  const durationSec = callState?.duration_sec || 0
  const score = callState?.score || 0
  const flags = callState?.all_detected_flags || []

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Traffic Light Theme configuration
  const trafficTheme = {
    SAFE: {
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      dotBg: 'bg-emerald-500',
      labelGu: 'સામાન્ય કૉલ (સુરક્ષિત)',
      labelHi: 'सामान्य कॉल (सुरक्षित)',
      labelEn: 'Looks Normal (Safe)',
      icon: ShieldCheck,
      borderGlow: 'border-emerald-500/30 shadow-emerald-500/10',
    },
    SUSPICIOUS: {
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      dotBg: 'bg-amber-500',
      labelGu: 'શંકાસ્પદ કૉલ (સાવચેત રહો)',
      labelHi: 'संदिग्ध कॉल (सावधान रहें)',
      labelEn: 'Suspicious (Be Careful)',
      icon: AlertTriangle,
      borderGlow: 'border-amber-500/40 shadow-amber-500/20',
    },
    SCAM: {
      badgeBg: 'bg-rose-600/30 text-rose-200 border-rose-500',
      dotBg: 'bg-rose-500',
      labelGu: 'છેતરપિંડી (SCAM)',
      labelHi: 'धोखाधड़ी (SCAM)',
      labelEn: 'SCAM DETECTED',
      icon: ShieldAlert,
      borderGlow: 'border-rose-500 shadow-rose-500/30',
    },
  }[level]

  const StatusIcon = trafficTheme.icon
  const statusLabel =
    language === 'gu'
      ? trafficTheme.labelGu
      : language === 'hi'
      ? trafficTheme.labelHi
      : trafficTheme.labelEn

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top Phone Status & Caller Banner */}
      <div
        className={`bg-slate-900/90 rounded-3xl p-6 border-2 transition-all duration-500 shadow-2xl ${trafficTheme.borderGlow}`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Caller Profile */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-xl ${
                  level === 'SCAM'
                    ? 'bg-rose-600'
                    : level === 'SUSPICIOUS'
                    ? 'bg-amber-600'
                    : 'bg-emerald-600'
                }`}
              >
                <User className="w-10 h-10" />
              </div>
              {isStreaming && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {call.title}
                </h2>
              </div>
              <p className="text-base text-slate-300 font-mono mt-0.5">{call.caller_id}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                <span className="bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 font-medium">
                  {call.language}
                </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  ⏱️ {formatTimer(durationSec)}
                </span>
              </div>
            </div>
          </div>

          {/* Traffic Light State & Live Audio Waveform */}
          <div className="flex flex-col items-center md:items-end gap-3">
            {/* Traffic Light Status Pill */}
            <div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border text-lg font-extrabold shadow-lg ${trafficTheme.badgeBg}`}
            >
              <span className={`w-3.5 h-3.5 rounded-full ${trafficTheme.dotBg} animate-pulse`} />
              <StatusIcon className="w-6 h-6" />
              <span>{statusLabel}</span>
            </div>

            {/* Audio Waveform Simulator */}
            <div className="flex items-center gap-1.5 h-10 bg-slate-950/70 px-4 py-2 rounded-2xl border border-slate-800">
              <Activity className="w-4 h-4 text-slate-400 mr-1" />
              {[35, 60, 20, 85, 45, 95, 30, 75, 40, 90, 25, 70].map((h, i) => (
                <motion.div
                  key={i}
                  animate={
                    isStreaming
                      ? {
                          height: [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`],
                        }
                      : { height: '20%' }
                  }
                  transition={{
                    repeat: Infinity,
                    duration: 0.8 + (i % 4) * 0.2,
                    ease: 'easeInOut',
                  }}
                  className={`w-1 rounded-full ${
                    level === 'SCAM'
                      ? 'bg-rose-500'
                      : level === 'SUSPICIOUS'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ minHeight: '6px' }}
                />
              ))}
              <span className="text-xs text-slate-400 font-mono ml-2">
                {isStreaming ? '16kHz Audio Stream' : 'Idle'}
              </span>
            </div>

            {/* Risk Score Pill */}
            <div className="text-xs font-semibold text-slate-400">
              Deterministic Risk Score:{' '}
              <span className="text-white font-bold text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {score} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Transcripts & Detected Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Transcript (7 cols) */}
        <div className="lg:col-span-7 h-[420px]">
          <TranscriptPane
            chunks={chunks}
            speakerClaim={callState?.speaker_claims_to_be}
            allFlags={flags}
            title={language === 'gu' ? 'કૉલની વાતચીત (લાઈવ)' : language === 'hi' ? 'कॉल बातचीत (लाइव)' : 'Live Transcript'}
          />
        </div>

        {/* Right Column: Detected Red Flags (5 cols) */}
        <div className="lg:col-span-5 h-[420px] flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>
                {language === 'gu'
                  ? 'શોધાયેલા જોખમી સંકેતો'
                  : language === 'hi'
                  ? 'पहचाने गए खतरे'
                  : 'Detected Red Flags'}
              </span>
            </h3>
            <span className="text-xs bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded-full">
              {flags.length}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {flags.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <ShieldCheck className="w-12 h-12 text-emerald-500/40 mb-2" />
                <p className="text-base font-medium">
                  {language === 'gu'
                    ? 'હજુ સુધી કોઈ શંકાસ્પદ વાત જણાઈ નથી.'
                    : language === 'hi'
                    ? 'अभी तक कोई संदिग्ध बात नहीं मिली.'
                    : 'No suspicious signals detected yet.'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Gemini Flash continuously monitors audio slices in real time.
                </p>
              </div>
            ) : (
              flags.map((flag, idx) => (
                <FlagChip key={idx} flag={flag} language={language} index={idx} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Emergency Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="text-sm text-slate-400">
          <span className="font-bold text-slate-200">વડીલ સુરક્ષા બટનો:</span> શંકા જણાય તો તરત જ
          લાલ બટન દબાવીને કૉલ કટ કરો અથવા સગાને જાણ કરો.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Giant Hang up button */}
          <button
            onClick={onHangUp}
            className="flex-1 sm:flex-none min-h-[52px] bg-rose-600 hover:bg-rose-500 text-white font-black text-lg px-6 py-2.5 rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <PhoneOff className="w-5 h-5" />
            <span>
              {language === 'gu' ? 'ફોન કાપી નાખો' : language === 'hi' ? 'फोन काटें' : 'Hang Up'}
            </span>
          </button>

          {/* Giant Family call button */}
          <button
            onClick={onCallFamily}
            className="flex-1 sm:flex-none min-h-[52px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg px-6 py-2.5 rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <PhoneCall className="w-5 h-5" />
            <span>
              {language === 'gu' ? 'સગાને ફોન કરો' : language === 'hi' ? 'परिवार को कॉल करें' : 'Call Family'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
