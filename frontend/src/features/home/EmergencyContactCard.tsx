import React, { useState, useEffect } from 'react'
import { ShieldCheck, UserCheck, Phone, Edit2, Check, X } from 'lucide-react'
import { EmergencyContact, SupportedLanguage } from '../../lib/types'

interface Props {
  language: SupportedLanguage
  onContactChange?: (contact: EmergencyContact) => void
}

const STORAGE_KEY = 'scam_shield_contact'

const DEFAULT_CONTACT: EmergencyContact = {
  name: 'Ajay (Son)',
  relationship: 'Son',
  phone: '+91 98765 43210',
}

export const EmergencyContactCard: React.FC<Props> = ({ language, onContactChange }) => {
  const [contact, setContact] = useState<EmergencyContact>(DEFAULT_CONTACT)
  const [isEditing, setIsEditing] = useState(false)
  const [tempContact, setTempContact] = useState<EmergencyContact>(DEFAULT_CONTACT)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setContact(parsed)
        setTempContact(parsed)
        if (onContactChange) onContactChange(parsed)
      } else {
        if (onContactChange) onContactChange(DEFAULT_CONTACT)
      }
    } catch (e) {
      console.warn('Failed to parse contact from storage', e)
    }
  }, [onContactChange])

  const handleSave = () => {
    setContact(tempContact)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tempContact))
    setIsEditing(false)
    if (onContactChange) onContactChange(tempContact)
  }

  const handleCancel = () => {
    setTempContact(contact)
    setIsEditing(false)
  }

  const labels = {
    gu: {
      cardTitle: 'સાચવેલ પરિવારનો સંપર્ક (ઇમરજન્સી)',
      subtitle: 'જો કૉલમાં છેતરપિંડી જણાશે તો આ નંબર પર તરત ચેતવણી મોકલવામાં આવશે.',
      edit: 'બદલો',
      save: 'સાચવો',
      name: 'નામ / સંબંધ',
      phone: 'મોબાઈલ નંબર',
    },
    hi: {
      cardTitle: 'सुरक्षित पारिवारिक संपर्क (इमरजेंसी)',
      subtitle: 'कॉल में खतरा पाए जाने पर इस नंबर पर तुरंत अलर्ट भेजा जाएगा।',
      edit: 'बदलें',
      save: 'सुरक्षित करें',
      name: 'नाम / रिश्ता',
      phone: 'मोबाइल नंबर',
    },
    en: {
      cardTitle: 'Saved Family Emergency Contact',
      subtitle: 'If fraud is detected, an automatic alert is dispatched to this number.',
      edit: 'Edit',
      save: 'Save',
      name: 'Name / Relation',
      phone: 'Phone Number',
    },
  }[language]

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
          <UserCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-base">{labels.cardTitle}</h3>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Simulated SMS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{labels.subtitle}</p>

          {!isEditing ? (
            <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-sm">
              <span className="text-slate-200 font-semibold">{contact.name}</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {contact.phone}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 w-full">
              <input
                type="text"
                value={tempContact.name}
                onChange={(e) => setTempContact({ ...tempContact, name: e.target.value })}
                placeholder={labels.name}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={tempContact.phone}
                onChange={(e) => setTempContact({ ...tempContact, phone: e.target.value })}
                placeholder={labels.phone}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{labels.edit}</span>
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{labels.save}</span>
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
