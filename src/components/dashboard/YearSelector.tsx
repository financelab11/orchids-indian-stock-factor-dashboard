'use client'
import { Calendar } from 'lucide-react'

interface Props {
  year: number
  availableYears: number[]
  onChange: (y: number) => void
  sticky?: boolean
}

export function YearSelector({ year, availableYears, onChange, sticky }: Props) {
  return (
    <div className={`flex items-center gap-2 ${sticky ? 'sticky top-0 z-30 bg-background/80 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-border/50' : ''}`}>
      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Year:</span>
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {availableYears.map(y => (
          <button
            key={y}
            onClick={() => onChange(y)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              y === year
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  )
}
