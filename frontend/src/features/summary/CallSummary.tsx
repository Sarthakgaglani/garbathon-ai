import React from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Clock,
  PhoneCall,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { CallState, Level, SampleCall, SupportedLanguage } from '../../lib/types'

interface Props {
  call: SampleCall
  callState: CallState
  language: SupportedLanguage
  onReset: () => void
}

export const CallSummary: React.FC<Props> = ({ call, callState, language, onReset }) => {
  const isScam = callState.level === 'SCAM'
  const isSafe = callState.level === 'SAFE'

  const labels = {
    gu: {
      heading: 'કૉલ વિશ્લેષણ પરિણામ',
      safeVerdict: 'કૉલ સુરક્ષિત હતો — કોઈ છેતરપિંડીના સંકેત મળ્યા નથી.',
      scamVerdict: 'આ કૉલ છેતરપિંડી (SCAM) તરીકે ચિહ્નિત થયો છે!',
      timelineTitle: 'શોધાયેલા સંકેતોનો સમયક્રમ:',
      nextStepsTitle: 'સુરક્ષા માટે આગળ શું કરવું:',
      step1: 'જો કોઈ બેંક માહિતી કે ઓટીપી આપ્યો હોય તો તાત્કાલિક બેંકનો સંપર્ક કરો.',
      step2: 'રાષ્ટ્રીય સાયબર હેલ્પલાઇન 1930 પર કૉલ કરીને ઘટનાની નોંધ કરાવો.',
      step3: 'ઓનલાઇન સાયબર ક્રાઇમ પોર્ટલ પર ફરિયાદ નોંધાવો.',
      helplineBtn: '1930 હેલ્પલાઇન ડાયલ કરો',
      portalBtn: 'cybercrime.gov.in પોર્ટલ ખોલો',
      resetBtn: 'બીજો કૉલ ટેસ્ટ કરો',
    },
    hi: {
      heading: 'कॉल विश्लेषण परिणाम',
      safeVerdict: 'कॉल सुरक्षित था — कोई धोखाधड़ी का संकेत नहीं मिला।',
      scamVerdict: 'यह कॉल गंभीर धोखाधड़ी (SCAM) पाई गई!',
      timelineTitle: 'पहचाने गए संकेतों की समयरेखा:',
      nextStepsTitle: 'सुरक्षा के लिए आगे क्या करें:',
      step1: 'यदि कोई बैंक जानकारी या ओटीपी दिया है, तो तुरंत बैंक को सूचित करें।',
      step2: 'राष्ट्रीय साइबर हेल्पलाइन 1930 पर कॉल करें।',
      step3: 'ऑनलाइन साइबर क्राइम पोर्टल पर शिकायत दर्ज करें।',
      helplineBtn: '1930 हेल्पलाइन डायल करें',
      portalBtn: 'cybercrime.gov.in खोलें',
      resetBtn: 'दूसरा कॉल टेस्ट करें',
    },
    en: {
      heading: 'Call Analysis Summary',
      safeVerdict: 'No scam signs found. The call was verified genuine and safe.',
      scamVerdict: 'This call was confirmed as a fraudulent SCAM attack!',
      timelineTitle: 'Timeline of Detected Red Flags:',
      nextStepsTitle: 'Recommended Next Steps:',
      step1: 'If any banking details or OTPs were shared, contact your bank immediately.',
      step2: 'Dial National Cyber Crime Helpline 1930 to report the phone fraud.',
      step3: 'File a formal online report at the national cyber portal.',
      helplineBtn: 'Dial 1930 Helpline',
      portalBtn: 'Open cybercrime.gov.in',
      resetBtn: 'Test Another Call',
    },
  }[language]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto flex flex-col gap-6"
    >
      {/* Verdict Header Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border-2 shadow-2xl flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left ${
          isScam
            ? 'bg-rose-950/80 border-rose-500 shadow-rose-500/20 text-rose-100'
            : isSafe
            ? 'bg-emerald-950/80 border-emerald-500 shadow-emerald-500/20 text-emerald-100'
            : 'bg-amber-950/80 border-amber-500 text-amber-100'
        }`}
      >
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
            isScam ? 'bg-rose-600' : isSafe ? 'bg-emerald-600' : 'bg-amber-600'
          }`}
        >
          {isScam ? (
            <ShieldAlert className="w-12 h-12 text-white" />
          ) : (
            <ShieldCheck className="w-12 h-12 text-white" />
          )}
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-black/40 border border-white/20">
            {call.title}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
            {isScam ? labels.scamVerdict : labels.safeVerdict}
          </h2>
          <p className="text-sm font-medium opacity-90 mt-1">
            {callState.summary || `Final deterministic score: ${callState.score} points`}
          </p>
        </div>
      </div>

      {/* Flag Timeline (if scam flags were found) */}
      {callState.all_evidence.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-white">{labels.timelineTitle}</h3>
          </div>

          <div className="space-y-3">
            {callState.all_evidence.map((ev, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-slate-850 p-3.5 rounded-2xl border border-slate-800"
              >
                <span className="font-mono text-xs font-bold bg-slate-800 px-2 py-1 rounded-lg text-amber-300">
                  {Math.floor(ev.t)}s
                </span>
                <div>
                  <span className="text-xs font-black uppercase tracking-wide text-rose-400">
                    [{ev.type}]
                  </span>
                  <p className="text-sm text-slate-200 italic mt-0.5 font-sans">
                    "{ev.evidence}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What To Do Next (Helpline 1930 & Portal) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{labels.nextStepsTitle}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
            <span className="text-2xl font-black text-emerald-400">1</span>
            <p className="text-xs font-medium text-slate-300 mt-2">{labels.step1}</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
            <span className="text-2xl font-black text-amber-400">2</span>
            <p className="text-xs font-medium text-slate-300 mt-2">{labels.step2}</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
            <span className="text-2xl font-black text-rose-400">3</span>
            <p className="text-xs font-medium text-slate-300 mt-2">{labels.step3}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex flex-wrap gap-2.5">
            <a
              href="tel:1930"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{labels.helplineBtn}</span>
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{labels.portalBtn}</span>
            </a>
          </div>

          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-lg active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{labels.resetBtn}</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
