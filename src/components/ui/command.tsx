"use client"

import * as React from 'react'
import { DialogProps } from '@radix-ui/react-dialog'
import { Command as CommandPrimitive } from 'cmdk'
import { Dialog, DialogContent } from './dialog'
import { cn } from '../../lib/utils'

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 text-slate-100 shadow-[0_30px_120px_rgba(5,6,10,0.85)] backdrop-blur-3xl',
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

export const CommandDialog = ({ children, ...props }: DialogProps) => (
  <Dialog {...props}>
    <DialogContent className="overflow-hidden border-0 bg-transparent shadow-none">{children}</DialogContent>
  </Dialog>
)

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center px-4">
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-14 w-full rounded-none bg-transparent text-base placeholder:text-slate-500 focus-visible:outline-none',
        className
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn('flex-1 overflow-auto px-2 py-2', className)} {...props} />
))
CommandList.displayName = CommandPrimitive.List.displayName

export const CommandEmpty = (props: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>) => (
  <CommandPrimitive.Empty className="px-4 py-6 text-center text-sm text-slate-500" {...props} />
)

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group ref={ref} className={cn('overflow-hidden rounded-2xl px-2 py-3 text-xs uppercase tracking-[0.3em]', className)} {...props} />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center rounded-2xl px-3 py-3 text-sm text-slate-100 outline-none transition aria-selected:bg-white/10',
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

export const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn('my-2 h-px bg-white/10', className)} {...props} />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

export const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('ml-auto text-xs tracking-widest text-slate-500', className)} {...props} />
)
