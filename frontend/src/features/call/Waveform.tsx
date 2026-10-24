import React from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { Level } from '../../lib/types'

interface Props {
  isActive: boolean
  level: Level
}

const BARS = [28, 45, 65, 85, 30, 95, 40, 75, 55, 90, 35, 70, 50, 80, 25, 60]

export const Waveform: React.FC<Props> = ({ isActive, level }) => {
  const barColor =
    level === 'SCAM'
      ? 'bg-rose-500'
      : level === 'SUSPICIOUS'
      ? 'bg-amber-400'
      : 'bg-emerald-400'

  return (
    <div className="flex items-center gap-1.5 h-10 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 shadow-inner">
      <Activity className="w-4 h-4 text-slate-400 mr-1.5 shrink-0" />
      <div className="flex items-center gap-1 h-full">
        {BARS.map((height, i) => (
          <motion.div
            key={i}
            animate={
              isActive
                ? {
                    height: [`${height * 0.25}%`, `${height}%`, `${height * 0.35}%`],
                  }
                : { height: '20%' }
            }
            transition={{
              repeat: Infinity,
              duration: 0.7 + (i % 5) * 0.15,
              ease: 'easeInOut',
            }}
            className={`w-1 rounded-full ${barColor} transition-colors duration-300`}
            style={{ minHeight: '6px' }}
          />
        ))}
      </div>
      <span className="text-[11px] text-slate-400 font-mono ml-2 font-semibold">
        {isActive ? 'Live 16kHz' : 'Idle'}
      </span>
    </div>
  )
}
