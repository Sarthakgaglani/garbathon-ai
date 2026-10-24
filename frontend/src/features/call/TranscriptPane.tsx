import React, { useEffect, useRef } from 'react'
import { MessageSquareText } from 'lucide-react'
import { ChunkAnalysis, DetectedFlag } from '../../lib/types'

interface Props {
  chunks: ChunkAnalysis[]
  speakerClaim?: string | null
  allFlags: DetectedFlag[]
  title: string
}

export const TranscriptPane: React.FC<Props> = ({
  chunks,
  speakerClaim,
  allFlags,
  title,
}) => {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chunks])

  // Helper to highlight flagged evidence phrases in transcript
  const renderHighlightedText = (text: string) => {
    if (!text) return null
    return <span>{text}</span>
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-slate-200 text-base">{title}</h3>
        </div>
        {speakerClaim && (
          <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full font-medium">
            દાવા કરનાર: {speakerClaim}
          </span>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-base leading-relaxed">
        {chunks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
            વાતચીત શરૂ થવાની રાહ જોઈ રહ્યા છીએ... (Waiting for conversation...)
          </div>
        ) : (
          chunks.map((chunk, idx) => {
            const hasFlags = chunk.flags && chunk.flags.length > 0
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl transition-all ${
                  hasFlags
                    ? 'bg-rose-950/30 border border-rose-800/50 text-rose-100'
                    : 'bg-slate-800/40 border border-slate-700/30 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-400">
                    સેગમેન્ટ #{idx + 1} ({idx * 5}s - {(idx + 1) * 5}s)
                  </span>
                  {hasFlags && (
                    <span className="bg-rose-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                      જોખમી સંકેત (Alert)
                    </span>
                  )}
                </div>
                <p className="text-base font-normal tracking-wide">
                  {renderHighlightedText(chunk.transcript)}
                </p>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
