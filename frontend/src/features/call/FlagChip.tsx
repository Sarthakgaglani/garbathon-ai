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
  const metaMap = {
    otp_request: {
      labelGu: 'ઓટીપી માંગણી (ખૂબ જોખમી)',
      labelHi: 'ओटीपी की मांग (अत्यधिक जोखिम)',
      labelEn: 'OTP Request (Critical)',
      explGu: 'ક્યારેય ઓટીપી આપશો નહીં. બેંક ક્યારેય કૉલ પર ઓટીપી માંગતી નથી.',
      explHi: 'कभी भी ओटीपी शेयर न करें। बैंक कभी कॉल पर ओटीपी नहीं मांगते।',
      explEn: 'Never share an OTP. Banks never ask for it on a call.',
      icon: KeyRound,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      dotColor: 'bg-rose-500',
    },
    money_request: {
      labelGu: 'પૈસા ટ્રાન્સફર માંગણી (ખૂબ જોખમી)',
      labelHi: 'पैसे ट्रांसफर की मांग (अत्यधिक जोखिम)',
      labelEn: 'Money Transfer (Critical)',
      explGu: 'કોઈ સાચા અધિકારી કેસ બંધ કરવા માટે પૈસા ટ્રાન્સફર કરવાનું કહેતા નથી.',
      explHi: 'कोई भी असली अधिकारी केस रफा-दफा करने के लिए पैसे नहीं मांगता।',
      explEn: 'No real officer asks you to transfer money to close a case.',
      icon: IndianRupee,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      dotColor: 'bg-rose-500',
    },
    isolation: {
      labelGu: 'એકલા રહેવાનું દબાણ (ડિજિટલ અરેસ્ટ)',
      labelHi: 'अकेले रहने का दबाव (डिजिटल अरेस्ट)',
      labelEn: 'Forced Isolation (Critical)',
      explGu: 'સાચા અધિકારીઓ ક્યારેય આ વાત પરિવારથી છુપાવવા કહેતા નથી.',
      explHi: 'असली पुलिस या अधिकारी कभी इसे परिवार से छिपाने को नहीं कहते।',
      explEn: 'Real officers never tell you to hide this from your family.',
      icon: UserX,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      dotColor: 'bg-purple-500',
    },
    threat: {
      labelGu: 'ધરપકડ / જેલની ધમકી',
      labelHi: 'गिरफ्तारी / जेल की धमकी',
      labelEn: 'Threat of Arrest / Legal Action',
      explGu: 'પોલીસ ક્યારેય ફોન કે વીડિયો કૉલ પર ધરપકડ કરતી નથી.',
      explHi: 'पुलिस कभी भी फोन या वीडियो कॉल पर गिरफ्तार नहीं करती।',
      explEn: 'Police never arrest anyone over a phone or video call.',
      icon: AlertTriangle,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      dotColor: 'bg-amber-500',
    },
    urgency: {
      labelGu: 'ઉતાવળ / ગભરાટનું દબાણ',
      labelHi: 'जल्दबाजी / घबराहट का दबाव',
      labelEn: 'Extreme Urgency / Panic',
      explGu: 'ગઠિયા તમને વિચારવાનો સમય ન મળે એટલે ઉતાવળ કરાવે છે.',
      explHi: 'धोखेबाज आपको जल्दबाजी में डालते हैं ताकि आप सोच न सकें।',
      explEn: 'Scammers rush you so you cannot think.',
      icon: Clock,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      dotColor: 'bg-amber-500',
    },
    authority_claim: {
      labelGu: 'પોલીસ / સરકારી હોદ્દાનો દાવો',
      labelHi: 'पुलिस / सरकारी अधिकारी का दावा',
      labelEn: 'Authority / Police Impersonation',
      explGu: 'પોલીસ કે સીબીઆઇ ક્યારેય ફોન પર ધમકી આપીને પૈસા નથી માંગતી.',
      explHi: 'पुलिस या सीबीआई कभी फोन पर डिजिटल अरेस्ट की धमकी नहीं देती।',
      explEn: 'Real authorities never threaten arrest over video or demand funds.',
      icon: BadgeAlert,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      dotColor: 'bg-blue-400',
    },
  }

  const meta = metaMap[flag.type] || metaMap.threat
  const Icon = meta.icon

  const title =
    language === 'gu' ? meta.labelGu : language === 'hi' ? meta.labelHi : meta.labelEn

  const explanation =
    language === 'gu' ? meta.explGu : language === 'hi' ? meta.explHi : meta.explEn

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl ${meta.badgeColor} border`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-100 text-sm sm:text-base">{title}</span>
        </div>
        <span className="flex h-2.5 w-2.5 relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${meta.dotColor} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${meta.dotColor}`} />
        </span>
      </div>

      {/* Static human-reviewed explanation for elder protection */}
      <p className="text-amber-200/95 font-medium text-sm sm:text-base leading-snug bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40">
        💡 {explanation}
      </p>

      {/* Quoted audio evidence in original language */}
      {flag.evidence && (
        <div className="text-xs text-slate-400 italic bg-slate-950/40 px-2.5 py-1 rounded-lg font-sans">
          "{flag.evidence}"
        </div>
      )}
    </motion.div>
  )
}
