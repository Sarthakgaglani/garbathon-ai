import React from 'react'
import { motion } from 'framer-motion'
import {
  ShieldAlert,
  Clock,
  KeyRound,
  IndianRupee,
  BadgeAlert,
  UserX,
  AlertTriangle,
} from 'lucide-react'
import { DetectedFlag, SupportedLanguage } from '../../lib/types'

interface Props {
  flag: DetectedFlag
  language: SupportedLanguage
  index: number
}

export const FlagChip: React.FC<Props> = ({ flag, language, index }) => {
  const getFlagMeta = () => {
    switch (flag.type) {
      case 'otp_request':
        return {
          labelGu: 'ઓટીપી માંગણી (ખૂબ જોખમી)',
          labelHi: 'ओटीपी की मांग (अत्यधिक जोखिम)',
          labelEn: 'OTP Request (Critical)',
          icon: KeyRound,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dotColor: 'bg-rose-500',
        }
      case 'money_request':
        return {
          labelGu: 'પૈસા ટ્રાન્સફર માંગણી (ખૂબ જોખમી)',
          labelHi: 'पैसे ट्रांसफर की मांग (अत्यधिक जोखिम)',
          labelEn: 'Money Transfer (Critical)',
          icon: IndianRupee,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dotColor: 'bg-rose-500',
        }
      case 'isolation':
        return {
          labelGu: 'એકલા રહેવાનું દબાણ (ડિજિટલ અરેસ્ટ)',
          labelHi: 'अकेले रहने का दबाव (डिजिटल अरेस्ट)',
          labelEn: 'Forced Isolation (Critical)',
          icon: UserX,
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          dotColor: 'bg-purple-500',
        }
      case 'threat':
        return {
          labelGu: 'ધરપકડ / જેલની ધમકી',
          labelHi: 'गिरफ्तारी / जेल की धमकी',
          labelEn: 'Threat of Arrest / Police Action',
          icon: AlertTriangle,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotColor: 'bg-amber-500',
        }
      case 'urgency':
        return {
          labelGu: 'ઉતાવળ / ગભરાટનું દબાણ',
          labelHi: 'जल्दबाजी / घबराहट का दबाव',
          labelEn: 'Extreme Urgency / Panic',
          icon: Clock,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotColor: 'bg-amber-500',
        }
      case 'authority_claim':
        return {
          labelGu: 'પોલીસ / સરકારી હોદ્દાનો દાવો',
          labelHi: 'पुलिस / सरकारी अधिकारी का दावा',
          labelEn: 'Authority / Police Impersonation',
          icon: BadgeAlert,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dotColor: 'bg-blue-400',
        }
      default:
        return {
          labelGu: 'શંકાસ્પદ સંકેત',
          labelHi: 'संदिग्ध संकेत',
          labelEn: 'Suspicious Signal',
          icon: ShieldAlert,
          badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
          dotColor: 'bg-slate-400',
        }
    }
  }

  const meta = getFlagMeta()
  const Icon = meta.icon

  const title =
    language === 'gu' ? meta.labelGu : language === 'hi' ? meta.labelHi : meta.labelEn

  const explanation =
    language === 'gu'
      ? flag.explanation_gu
      : language === 'hi'
      ? flag.explanation_hi
      : flag.explanation_en || flag.explanation_hi

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl ${meta.badgeColor} border`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-100 text-base">{title}</span>
        </div>
        <span className="flex h-2.5 w-2.5 relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${meta.dotColor} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${meta.dotColor}`} />
        </span>
      </div>

      {/* Elder explanation (large text, high contrast) */}
      <p className="text-amber-200/90 font-medium text-base leading-snug bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40">
        💡 {explanation}
      </p>

      {/* Quoted audio evidence */}
      {flag.evidence && (
        <div className="text-xs text-slate-400 italic bg-slate-950/40 px-2 py-1 rounded-lg">
          "{flag.evidence}"
        </div>
      )}
    </motion.div>
  )
}
