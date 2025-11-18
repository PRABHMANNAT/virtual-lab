import * as React from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'glow'
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  const base =
    variant === 'outline'
      ? 'border border-white/20 text-slate-200'
      : variant === 'glow'
        ? 'bg-blue-600/20 text-blue-200 shadow-[0_0_25px_rgba(30,64,175,0.4)]'
        : 'bg-white/10 text-white'
  return (
    <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-widest', base, className)} {...props} />
  )
}
