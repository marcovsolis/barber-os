'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { COUNTRIES } from '@/lib/countries'

interface DialCodePickerProps {
  value:    string          // e.g. "+506"
  onChange: (v: string) => void
  className?: string
}

export function DialCodePicker({ value, onChange, className = '' }: DialCodePickerProps) {
  const [open, setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref               = useRef<HTMLDivElement>(null)

  const selected = COUNTRIES.find(c => c.dialCode === value) ?? COUNTRIES[0]

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const filtered = search
    ? COUNTRIES.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.dialCode.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 whitespace-nowrap"
        style={{ minWidth: '100px' }}
      >
        <span style={{ fontSize: '18px', lineHeight: 1 }}>{selected.flag}</span>
        <span className="font-medium text-brand-900">{selected.dialCode}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar país…"
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent"
            />
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-gray-400 text-center">Sin resultados</p>
            )}
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c.dialCode)
                  setOpen(false)
                  setSearch('')
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                  c.code === selected.code ? 'bg-accent/5 text-accent font-medium' : 'text-brand-900'
                }`}
              >
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{c.flag}</span>
                <span className="flex-1 truncate">{c.label}</span>
                <span className="text-xs text-gray-400 shrink-0">{c.dialCode}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
