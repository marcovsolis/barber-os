'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpTooltipProps {
  text: string
  /** 'top' | 'bottom' | 'left' | 'right' — default 'top' */
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function HelpTooltip({ text, position = 'top', className }: HelpTooltipProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!visible) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setVisible(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [visible])

  const positionClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top:    'top-full left-1/2 -translate-x-1/2 border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800',
    left:   'left-full top-1/2 -translate-y-1/2 border-l-gray-800',
    right:  'right-full top-1/2 -translate-y-1/2 border-r-gray-800',
  }

  return (
    <span
      ref={ref}
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(v => !v)}
    >
      <HelpCircle className="h-4 w-4 cursor-pointer text-gray-400 hover:text-brand-500 transition-colors" />

      {visible && (
        <span
          className={cn(
            'absolute z-50 w-56 rounded-lg bg-gray-800 px-3 py-2 text-xs text-gray-100 shadow-xl',
            positionClasses[position]
          )}
        >
          {text}
          {/* Arrow */}
          <span
            className={cn(
              'absolute border-4 border-transparent',
              arrowClasses[position]
            )}
          />
        </span>
      )}
    </span>
  )
}
