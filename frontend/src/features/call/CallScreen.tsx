import React from 'react'
import { motion } from 'framer-motion'
import { PhoneOff, PhoneCall, User, Radio } from 'lucide-react'
import { CallState, ChunkAnalysis, DetectedFlag, SampleCall, SupportedLanguage } from '../../lib/types'
import { FlagChip } from './FlagChip'
import { TranscriptPane } from './TranscriptPane'
import { StatusBanner } from './StatusBanner'
import { Waveform } from './Waveform'

interface Props {
  call: SampleCall
  callState: CallState
  chunks: ChunkAnalysis[]
  flags: DetectedFlag[]
  language: SupportedLanguage
  isStreaming: boolean
  onHangUp: () => void
  onCallFamily: () => void
}

export const CallScreen: React.FC<Props> = ({
  call,
  callState,
  chunks,
  flags,
  language,
  isStreaming,
  onHangUp,
  onCallFamily,
}) => {
  const level = callState.level
  const durationSec = callState.duration_sec
  const score = callState.score

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const texts = {
    gu: {
      hangUp: 'ફોન કાપી નાખો (Hang Up)',
      callFamily: 'સગાને કૉલ કરો',
      listening: 'લાઈવ સાંભળી રહ્યા છીએ',
      transcriptTitle: 'કૉલની વાતચીત (લાઈવ)',
      flagsTitle: 'શોધાયેલા જોખમી સંકેતો',
      noFlags: 'હજુ સુધી કોઈ શંકાસ્પદ વાત જણાઈ નથી.',
    },
    hi: {
      hangUp: 'फोन काटें (Hang Up)',
      callFamily: 'परिवार को कॉल करें',
      listening: 'लाइव सुन रहे हैं',
      transcriptTitle: 'कॉल बातचीत (लाइव)',
      flagsTitle: 'पहचाने गए खतरे',
      noFlags: 'अभी तक कोई संदिग्ध बात नहीं मिली।',
    },
    en: {
      hangUp: 'Hang Up Call',
      callFamily: 'Call Family Member',
      listening: 'Listening to call audio',
      transcriptTitle: 'Live Conversation',
      flagsTitle: 'Detected Red Flags',
      noFlags: 'No suspicious signals detected yet.',
    },
  }[language]

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top Banner: Caller Card + Traffic Light + Waveform */}
      <div
        className={`bg-slate-900/90 rounded-3xl p-6 border-2 transition-all duration-500 shadow-2xl ${
          level === 'SCAM'
            ? 'border-rose-500 shadow-rose-500/20'
            : level === 'SUSPICIOUS'
            ? 'border-amber-500/50 shadow-amber-500/10'
            : 'border-emerald-500/40 shadow-emerald-500/10'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Caller Details */}
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
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{call.title}</h2>
              <p className="text-base text-slate-300 font-mono mt-0.5">{call.caller_id}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 font-medium">
                  {call.language}
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  ⏱️ {formatTimer(durationSec)}
                </span>
                {/* Listening micro-label */}
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
                  <Radio className="w-3 h-3 text-amber-400" />
                  <span>
                    {texts.listening} {formatTimer(durationSec)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Light State & Waveform */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <StatusBanner level={level} language={language} score={score} />
            <Waveform isActive={isStreaming} level={level} />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Live Transcript (7 cols) & Detected Flags (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Transcript */}
        <div className="lg:col-span-7 h-[420px]">
          <TranscriptPane
            chunks={chunks}
            speakerClaim={callState.speaker_claims_to_be}
            allFlags={flags}
            title={texts.transcriptTitle}
          />
        </div>

        {/* Right Column: Detected Red Flags Pop-in */}
        <div className="lg:col-span-5 h-[420px] flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-base flex items-center gap-2">
              <span>{texts.flagsTitle}</span>
            </h3>
            <span className="text-xs bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded-full">
              {flags.length}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {flags.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <p className="text-base font-medium">{texts.noFlags}</p>
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
          <span className="font-bold text-slate-200">વડીલ સુરક્ષા:</span> શંકા જણાય તો તરત જ
          લાલ બટન દબાવીને કૉલ કટ કરો અથવા સગાને જાણ કરો.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Giant Hang Up */}
          <button
            onClick={onHangUp}
            className="flex-1 sm:flex-none min-h-[52px] bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-lg px-6 py-2.5 rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <PhoneOff className="w-5 h-5" />
            <span>{texts.hangUp}</span>
          </button>

          {/* Giant Call Family */}
          <button
            onClick={onCallFamily}
            className="flex-1 sm:flex-none min-h-[52px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-lg px-6 py-2.5 rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <PhoneCall className="w-5 h-5" />
            <span>{texts.callFamily}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
