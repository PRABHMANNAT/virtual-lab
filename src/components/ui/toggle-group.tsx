"use client"

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cn } from '../../lib/utils'

export const ToggleGroup = ToggleGroupPrimitive.Root

export const ToggleGroupItem = ({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) => (
  <ToggleGroupPrimitive.Item
    className={cn(
      'rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition',
      'data-[state=on]:border-blue-400 data-[state=on]:text-white data-[state=on]:bg-blue-500/30',
      className
    )}
    {...props}
  />
)
