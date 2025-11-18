"use client"

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'

export const Tabs = TabsPrimitive.Root

export const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      'flex items-center rounded-2xl border border-white/10 bg-white/5 p-1 text-slate-400 shadow-inner shadow-black/40 backdrop-blur-xl data-[orientation=vertical]:flex-col',
      className
    )}
    {...props}
  />
)

export const TabsTrigger = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      'relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-none border border-transparent',
      'data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-white/60 data-[state=active]:shadow-lg data-[state=active]:shadow-black/30',
      'text-slate-300',
      className
    )}
    {...props}
  />
)

export const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('mt-6 focus-visible:outline-none', className)} {...props} />
)
