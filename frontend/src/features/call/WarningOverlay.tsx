import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneOff, PhoneCall, ShieldAlert, AlertOctagon } from 'lucide-react'
import { DetectedFlag, SupportedLanguage } from '../../lib/types'
import { useSpeech } from '../../hooks/useSpeech'

interface Props {
  isOpen: boolean
  language: SupportedLanguage
  onHangUp: () => void
  onCallFamily: () => void
  detectedFlags: DetectedFlag[]
}

export const WarningOverlay: React.FC<Props> = ({
  isOpen,
  language,
  onHangUp,
  onCallFamily,
  detectedFlags,
}) => {
  const { playAlertTone, speakWarning } = useSpeech()

  const textContent = {
    gu: {
      headline: 'આ છેતરપિંડી છે – ફોન કાપી નાખો!',
      subheadline: 'સાયબર ગઠિયા તમને ડરાવીને પૈસા કે ઓટીપી પડાવવાનો પ્રયાસ કરી રહ્યા છે.',
      hangUpBtn: 'તરત ફોન કાપી નાખો (Hang Up)',
      callFamilyBtn: 'પરિવાર / પુત્રને કૉલ કરો',
      familyContact: '+91 98765 43210 (પુત્ર: અજય)',
      scamReasonsTitle: 'ચેતવણીના મુખ્ય કારણો:',
      spokenWarning: 'ચેતવણી! આ છેતરપિંડીનો કૉલ છે. તરત જ ફોન કાપી નાખો અને પરિવારને જાણ કરો.',
    },
    hi: {
      headline: 'यह धोखाधड़ी है – तुरंत फोन काट दें!',
      subheadline: 'साइबर अपराधी आपको डराकर पैसे या ओटीपी चुराने की कोशिश कर रहे हैं.',
      hangUpBtn: 'तुरंत फोन काटें (Hang Up)',
      callFamilyBtn: 'परिवार / बेटे को कॉल करें',
      familyContact: '+91 98765 43210 (बेटा: अजय)',
      scamReasonsTitle: 'धोखाधड़ी के मुख्य कारण:',
      spokenWarning: 'सावधान! यह फर्जी कॉल है. तुरंत फोन काट दें और परिवार को बताएं.',
    },
    en: {
      headline: 'SCAM DETECTED – HANG UP NOW!',
      subheadline: 'Fraudsters are impersonating authority to steal money or passwords.',
      hangUpBtn: 'Hang Up Call Immediately',
      callFamilyBtn: 'Call Trusted Family Member',
      familyContact: '+91 98765 43210 (Son: Ajay)',
      scamReasonsTitle: 'Key Fraud Indicators Detected:',
      spokenWarning: 'Warning! This is a scam call. Hang up immediately and alert your family.',
    },
  }[language]

  useEffect(() => {
    if (isOpen) {
      playAlertTone()
      speakWarning(textContent.spokenWarning, language)
    }
  }, [isOpen, language, playAlertTone, speakWarning, textContent.spokenWarning])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 250 }}
        className="fixed inset-0 z-50 bg-rose-950/95 backdrop-blur-md flex flex-col items-center justify-between p-6 sm:p-10 text-white overflow-y-auto"
      >
        {/* Pulsing Emergency Top Banner */}
        <div className="w-full max-w-2xl flex items-center justify-center gap-3 bg-rose-600/30 border-2 border-rose-500 py-3 px-6 rounded-2xl animate-pulse">
          <AlertOctagon className="w-9 h-9 text-rose-400 shrink-0" />
          <span className="text-xl sm:text-2xl font-black uppercase tracking-wider text-rose-100">
            EMERGENCY FRAUD ALERT
          </span>
          <AlertOctagon className="w-9 h-9 text-rose-400 shrink-0" />
        </div>

        {/* Core Warning Content */}
        <div className="w-full max-w-2xl my-auto text-center flex flex-col items-center gap-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-24 h-24 rounded-full bg-rose-600 border-4 border-rose-300 flex items-center justify-center shadow-2xl shadow-rose-600/60"
          >
            <ShieldAlert className="w-14 h-14 text-white" />
          </motion.div>

          <h1 className="text-3xl sm:text-5xl font-black leading-tight text-white drop-shadow-lg">
            {textContent.headline}
          </h1>

          <p className="text-lg sm:text-2xl font-medium text-rose-100 max-w-xl">
            {textContent.subheadline}
          </p>

          {/* Key Red Flag Reasons */}
          {detectedFlags.length > 0 && (
            <div className="w-full bg-black/40 border border-rose-500/40 rounded-2xl p-4 text-left max-h-48 overflow-y-auto">
              <h4 className="text-sm font-bold text-rose-300 uppercase tracking-wider mb-2">
                {textContent.scamReasonsTitle}
              </h4>
              <ul className="space-y-2">
                {detectedFlags.slice(-3).map((flag, idx) => {
                  const expl =
                    language === 'gu'
                      ? flag.explanation_gu
                      : language === 'hi'
                      ? flag.explanation_hi
                      : flag.explanation_en || flag.explanation_hi
                  return (
                    <li key={idx} className="flex items-start gap-2 text-base font-semibold text-rose-100">
                      <span className="text-rose-400 text-lg">⚠️</span>
                      <span>{expl}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Giant Elder Action Buttons */}
        <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-4 mt-6">
          {/* Giant Hang Up Button */}
          <button
            onClick={onHangUp}
            className="flex-1 min-h-[72px] bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xl sm:text-2xl font-black rounded-3xl shadow-2xl shadow-rose-600/70 flex items-center justify-center gap-3 px-6 py-4 border-2 border-rose-400 transition-all cursor-pointer"
          >
            <PhoneOff className="w-8 h-8 text-white shrink-0" />
            <span>{textContent.hangUpBtn}</span>
          </button>

          {/* Giant Call Family Button */}
          <button
            onClick={onCallFamily}
            className="flex-1 min-h-[72px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xl sm:text-2xl font-black rounded-3xl shadow-2xl shadow-emerald-600/50 flex flex-col items-center justify-center px-6 py-4 border-2 border-emerald-400 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <PhoneCall className="w-7 h-7 text-white shrink-0" />
              <span>{textContent.callFamilyBtn}</span>
            </div>
            <span className="text-xs font-medium text-emerald-100 opacity-90">
              {textContent.familyContact}
            </span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
