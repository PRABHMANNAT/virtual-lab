"use client"

import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from '../../lib/utils'

export const Separator = ({ className, ...props }: React.ComponentProps<typeof SeparatorPrimitive.Root>) => (
  <SeparatorPrimitive.Root className={cn('shrink-0 bg-white/10', className)} {...props} />
)
