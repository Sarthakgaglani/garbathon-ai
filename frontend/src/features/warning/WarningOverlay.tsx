import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PhoneOff,
  PhoneCall,
  ShieldAlert,
  AlertOctagon,
  Volume2,
  DoorOpen,
  BellRing,
} from 'lucide-react'
import { DetectedFlag, SupportedLanguage } from '../../lib/types'
import { useWarningAudio } from '../../hooks/useWarningAudio'

interface Props {
  isOpen: boolean
  language: SupportedLanguage
  onHangUp: () => void
  onCallFamily: () => void
  detectedFlags: DetectedFlag[]
  familyContactPhone: string
  familyRelationship: string
}

export const WarningOverlay: React.FC<Props> = ({
  isOpen,
  language,
  onHangUp,
  onCallFamily,
  detectedFlags,
  familyContactPhone,
  familyRelationship,
}) => {
  const { playWarningAudio, playDoorbellBailout, stopAllAudio } = useWarningAudio()
  const [safeExitTriggered, setSafeExitTriggered] = useState(false)

  const textContent = {
    gu: {
      headline: 'આ છેતરપિંડી છે – ફોન કાપી નાખો!',
      subheadline: 'સાયબર ગઠિયા તમને ડરાવીને પૈસા કે ઓટીપી પડાવવાનો પ્રયાસ કરી રહ્યા છે.',
      hangUpBtn: 'તરત ફોન કાપી નાખો (Hang Up)',
      callFamilyBtn: `પરિવાર (${familyRelationship}) ને કૉલ કરો`,
      safeExitBtn: 'સાંસ્કૃતિક બહાનું (Safe Exit Bailout)',
      safeExitTitle: 'દરવાજાનું બહાનું શરૂ થયું!',
      safeExitLine: 'મારા ઘરે મહેમાન આવ્યા છે, હું દરવાજો ખોલું છું. હું પોલીસ સ્ટેશને રૂબરૂ આવીશ.',
      replayAudio: 'અવાજ સાંભળો',
      reasonsTitle: 'ચેતવણીના મુખ્ય કારણો (પુરાવા):',
    },
    hi: {
      headline: 'यह धोखाधड़ी है – तुरंत फोन काट दें!',
      subheadline: 'साइबर अपराधी आपको डराकर पैसे या ओटीपी चुराने की कोशिश कर रहे हैं।',
      hangUpBtn: 'तुरंत फोन काटें (Hang Up)',
      callFamilyBtn: `परिवार (${familyRelationship}) को कॉल करें`,
      safeExitBtn: 'सुरक्षित बहाना (Safe Exit Bailout)',
      safeExitTitle: 'दरवाजे का बहाना चालू हुआ!',
      safeExitLine: 'घर पर मेहमान आए हैं, मैं दरवाजा खोलने जा रहा हूँ। मैं थाने खुद आऊँगा।',
      replayAudio: 'आवाज दोबारा सुनें',
      reasonsTitle: 'धोखाधड़ी के मुख्य कारण (सबूत):',
    },
    en: {
      headline: 'SCAM DETECTED – HANG UP NOW!',
      subheadline: 'Fraudsters are impersonating authority to steal money or passwords.',
      hangUpBtn: 'Hang Up Call Immediately',
      callFamilyBtn: `Call Trusted ${familyRelationship}`,
      safeExitBtn: 'Safe Exit Bailout (Doorbell)',
      safeExitTitle: 'Doorbell Interruption Activated!',
      safeExitLine: 'Someone is at my door, I have to open it. I will visit the police station in person.',
      replayAudio: 'Play Warning Audio',
      reasonsTitle: 'Key Fraud Indicators Detected:',
    },
  }[language]

  useEffect(() => {
    if (isOpen) {
      setSafeExitTriggered(false)
      playWarningAudio('final', language)
    } else {
      stopAllAudio()
    }
  }, [isOpen, language, playWarningAudio, stopAllAudio])

  const handleTriggerSafeExit = () => {
    setSafeExitTriggered(true)
    playDoorbellBailout(language, () => {
      // Auto-hangup after bailout audio finishes
      setTimeout(() => {
        onHangUp()
      }, 3500)
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="fixed inset-0 z-50 bg-rose-950/95 backdrop-blur-lg flex flex-col items-center justify-between p-6 sm:p-10 text-white overflow-y-auto"
        role="alert"
        aria-live="assertive"
      >
        {/* Top Emergency Pill */}
        <div className="w-full max-w-2xl flex items-center justify-center gap-3 bg-rose-600/30 border-2 border-rose-500 py-3 px-6 rounded-2xl animate-pulse">
          <AlertOctagon className="w-8 h-8 text-rose-400 shrink-0" />
          <span className="text-xl sm:text-2xl font-black uppercase tracking-wider text-rose-100">
            EMERGENCY FRAUD ALERT
          </span>
          <AlertOctagon className="w-8 h-8 text-rose-400 shrink-0" />
        </div>

        {/* Center Warning Details */}
        <div className="w-full max-w-2xl my-auto text-center flex flex-col items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-rose-600 border-4 border-rose-300 flex items-center justify-center shadow-2xl shadow-rose-600/70">
            <ShieldAlert className="w-14 h-14 text-white" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black leading-tight text-white drop-shadow-md">
            {textContent.headline}
          </h1>

          <p className="text-lg sm:text-xl font-medium text-rose-100 max-w-xl">
            {textContent.subheadline}
          </p>

          {/* Replay voice button */}
          <button
            onClick={() => playWarningAudio('final', language)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-800/80 hover:bg-rose-700 text-rose-200 hover:text-white rounded-xl text-xs font-bold border border-rose-500/40 cursor-pointer transition-all shadow-md"
          >
            <Volume2 className="w-4 h-4" />
            <span>{textContent.replayAudio}</span>
          </button>

          {/* Safe Exit Bailout Active Card */}
          {safeExitTriggered ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full bg-amber-500 text-slate-950 p-5 rounded-3xl border-2 border-white shadow-2xl flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2 text-xl font-black">
                <BellRing className="w-7 h-7 animate-bounce" />
                <span>{textContent.safeExitTitle}</span>
              </div>
              <p className="text-sm font-bold opacity-90">
                આ વાક્ય મોટેથી બોલીને ફોન તરત કાપી નાખો:
              </p>
              <div className="bg-slate-950 text-white text-lg sm:text-xl font-black p-3.5 rounded-2xl border border-amber-300 w-full text-center">
                "{textContent.safeExitLine}"
              </div>
              <span className="text-xs font-semibold mt-1">
                ફોન 3 સેકન્ડમાં આપોઆપ કાપી નાખવામાં આવશે...
              </span>
            </motion.div>
          ) : (
            /* Red Flags Evidence List */
            detectedFlags.length > 0 && (
              <div className="w-full bg-black/50 border border-rose-500/40 rounded-2xl p-4 text-left max-h-44 overflow-y-auto">
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2">
                  {textContent.reasonsTitle}
                </h4>
                <ul className="space-y-2">
                  {detectedFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm font-semibold text-rose-100">
                      <span className="text-rose-400">⚠️</span>
                      <span className="capitalize font-bold text-amber-300">[{flag.type}]:</span>
                      <span className="italic">"{flag.evidence}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-2xl flex flex-col gap-3 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Giant Hang Up */}
            <button
              onClick={onHangUp}
              className="flex-1 min-h-[68px] bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xl sm:text-2xl font-black rounded-3xl shadow-2xl shadow-rose-600/70 flex items-center justify-center gap-3 px-6 py-3 border-2 border-rose-400 cursor-pointer transition-all"
            >
              <PhoneOff className="w-8 h-8 text-white shrink-0" />
              <span>{textContent.hangUpBtn}</span>
            </button>

            {/* Giant Call Family */}
            <button
              onClick={onCallFamily}
              className="flex-1 min-h-[68px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xl font-black rounded-3xl shadow-2xl shadow-emerald-600/50 flex flex-col items-center justify-center px-6 py-3 border-2 border-emerald-400 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2">
                <PhoneCall className="w-6 h-6 text-white shrink-0" />
                <span>{textContent.callFamilyBtn}</span>
              </div>
              <span className="text-xs font-mono text-emerald-100 opacity-90">
                {familyContactPhone}
              </span>
            </button>
          </div>

          {/* Safe Exit Bailout Button */}
          {!safeExitTriggered && (
            <button
              onClick={handleTriggerSafeExit}
              className="w-full min-h-[54px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <DoorOpen className="w-6 h-6" />
              <span>{textContent.safeExitBtn}</span>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
