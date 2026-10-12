'use client'

import { ShoppingBag, Camera, Send, MapPin, UtensilsCrossed, MessageCircle, Play,
  MessageSquare, Search, CreditCard, Film, Phone, Map as MapIcon, Youtube,
  Code, Clapperboard, Keyboard, Image as ImageIcon, Cpu, Globe, Rocket, Package,
  type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  ShoppingBag, Camera, Send, MapPin, UtensilsCrossed, MessageCircle, Play,
  MessageSquare, Search, CreditCard, Film, Phone, Map: MapIcon, Youtube,
  Code, Clapperboard, Keyboard, Image: ImageIcon, Cpu, Globe, Rocket, Package,
}

const COLORS: Record<string, string> = {
  emerald: 'from-emerald-400 to-emerald-600',
  rose: 'from-rose-400 to-rose-600',
  pink: 'from-pink-500 to-rose-500',
  sky: 'from-sky-400 to-sky-600',
  blue: 'from-blue-400 to-blue-600',
  red: 'from-red-500 to-red-700',
  violet: 'from-violet-400 to-violet-600',
  teal: 'from-teal-400 to-teal-600',
  slate: 'from-slate-500 to-slate-700',
  orange: 'from-orange-400 to-orange-600',
}

export function AppIcon({
  type,
  color,
  size = 'md',
  className,
}: {
  type: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const Icon = ICONS[type] ?? Package
  const gradient = COLORS[color] ?? COLORS.emerald
  const sizes = { sm: 'size-9 rounded-[10px]', md: 'size-11 rounded-xl', lg: 'size-16 rounded-2xl' }
  const iconSizes = { sm: 'size-4', md: 'size-5', lg: 'size-7' }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-br shadow-sm',
        gradient,
        sizes[size],
        className
      )}
    >
      <Icon className={cn('text-white', iconSizes[size])} strokeWidth={2.2} />
    </div>
  )
}
