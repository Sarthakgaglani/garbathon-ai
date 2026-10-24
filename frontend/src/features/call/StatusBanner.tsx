import React from 'react'
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react'
import { Level, SupportedLanguage } from '../../lib/types'

interface Props {
  level: Level
  language: SupportedLanguage
  score: number
}

export const StatusBanner: React.FC<Props> = ({ level, language, score }) => {
  const meta = {
    SAFE: {
      labelGu: 'સામાન્ય કૉલ (સુરક્ષિત)',
      labelHi: 'सामान्य कॉल (सुरक्षित)',
      labelEn: 'Looks Normal (Safe)',
      bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
    },
    SUSPICIOUS: {
      labelGu: 'શંકાસ્પદ કૉલ (સાવચેત રહો)',
      labelHi: 'संदिग्ध कॉल (सावधान रहें)',
      labelEn: 'Suspicious (Be Careful)',
      bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
    },
    SCAM: {
      labelGu: 'છેતરપિંડી (SCAM)',
      labelHi: 'धोखाधड़ी (SCAM)',
      labelEn: 'SCAM DETECTED',
      bg: 'bg-rose-500/30 text-rose-200 border-rose-500',
      dot: 'bg-rose-500',
      icon: ShieldAlert,
    },
  }[level]

  const Icon = meta.icon
  const label =
    language === 'gu' ? meta.labelGu : language === 'hi' ? meta.labelHi : meta.labelEn

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border text-base sm:text-lg font-black shadow-lg transition-all ${meta.bg}`}
      >
        <span className={`w-3 h-3 rounded-full ${meta.dot} animate-pulse`} />
        <Icon className="w-6 h-6 shrink-0" />
        <span>{label}</span>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400">
        <span>Score:</span>
        <span className="text-white font-mono font-bold text-sm">{score} pts</span>
      </div>
    </div>
  )
}
