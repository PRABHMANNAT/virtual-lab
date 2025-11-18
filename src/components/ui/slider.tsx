"use client"

import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '../../lib/utils'

export const Slider = ({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) => (
  <SliderPrimitive.Root
    className={cn('relative flex h-4 w-full touch-none select-none items-center', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-white/10">
      <SliderPrimitive.Range className="absolute h-full bg-blue-500" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-white/40 bg-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" />
  </SliderPrimitive.Root>
)
