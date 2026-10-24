import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, MessageSquare, X } from 'lucide-react'
import { AlertSentEvent, SupportedLanguage } from '../../lib/types'

interface Props {
  alert: AlertSentEvent | null
  language: SupportedLanguage
  onDismiss: () => void
}

export const AlertSentToast: React.FC<Props> = ({ alert, language, onDismiss }) => {
  if (!alert) return null

  const title =
    language === 'gu'
      ? 'પરિવારને ચેતવણી મોકલી દેવાઈ છે'
      : language === 'hi'
      ? 'परिवार को सुरक्षा अलर्ट भेजा गया'
      : 'Emergency Alert Sent to Family'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-6 right-6 z-50 max-w-md w-full bg-slate-900 border-2 border-emerald-500 rounded-3xl p-4 shadow-2xl flex items-start justify-between gap-3 text-white"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-emerald-300">{title}</h4>
              <span className="text-[10px] font-black uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                Simulated
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-snug font-sans">
              "{alert.message}"
            </p>
            <div className="text-[11px] font-mono text-emerald-400 mt-1 font-semibold">
              To: {alert.contact}
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
