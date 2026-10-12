'use client'

import { SOURCE_LABELS, SOURCE_COLORS, type AppSource } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SourceBadge({ source, className }: { source: AppSource; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
        SOURCE_COLORS[source],
        className
      )}
    >
      {SOURCE_LABELS[source]}
    </span>
  )
}
