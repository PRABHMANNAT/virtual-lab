"use client"

import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '../../lib/utils'

export const Switch = ({ className, ...props }: React.ComponentProps<typeof SwitchPrimitives.Root>) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/10 bg-white/10 transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 data-[state=checked]:bg-green-500/80',
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb className="pointer-events-none block h-5 w-5 translate-x-1 rounded-full bg-white shadow-lg transition-transform data-[state=checked]:translate-x-5" />
  </SwitchPrimitives.Root>
)
