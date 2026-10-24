import React from 'react'
import { SupportedLanguage } from '../../lib/types'
import { Languages } from 'lucide-react'

interface Props {
  currentLang: SupportedLanguage
  onSelectLang: (lang: SupportedLanguage) => void
}

export const LanguageSwitcher: React.FC<Props> = ({ currentLang, onSelectLang }) => {
  const languages: { code: SupportedLanguage; label: string; sub: string }[] = [
    { code: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' },
    { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { code: 'en', label: 'English', sub: 'English' },
  ]

  return (
    <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 shadow-md">
      <div className="px-2 text-slate-400 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
        <Languages className="w-4 h-4 text-emerald-400" />
        <span>ભાષા / Language:</span>
      </div>
      <div className="flex gap-1.5">
        {languages.map((l) => {
          const isActive = currentLang === l.code
          return (
            <button
              key={l.code}
              onClick={() => onSelectLang(l.code)}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.02]'
                  : 'bg-slate-700/70 text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-sm font-extrabold">{l.label}</span>
              <span className="text-[10px] font-medium opacity-80">{l.sub}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
