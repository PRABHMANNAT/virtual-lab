import React, { useEffect, useRef, useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

type ConsoleAction = { label:string; handler:()=>void }
export type ConsoleEntry = {
  id:string
  type:'ok'|'error'|'hint'
  lines:string[]
  timestamp:string
  actions?:ConsoleAction[]
}
type ConsoleEntryInput = string | { type?:'ok'|'error'|'hint'; lines:string[]; actions?:ConsoleAction[] }

const listeners: ((entry:ConsoleEntry)=>void)[] = []
export function logConsole(input:ConsoleEntryInput){
  const base = typeof input === 'string'
    ? { type:'ok' as const, lines:[input] }
    : input
  const entry:ConsoleEntry = {
    id:crypto.randomUUID(),
    type: base.type ?? 'ok',
    lines: base.lines ?? [],
    timestamp:new Date().toLocaleTimeString(),
    actions: base.actions
  }
  listeners.forEach(fn=> fn(entry))
}

export function useConsole(){
  const [entries, setEntries] = useState<ConsoleEntry[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    function handle(entry:ConsoleEntry){
      setEntries(prev => [...prev, entry])
      requestAnimationFrame(()=>{ if(ref.current){ ref.current.scrollTop = ref.current.scrollHeight } })
    }
    listeners.push(handle)
    return ()=>{ const idx = listeners.indexOf(handle); if(idx>=0) listeners.splice(idx,1) }
  },[])

  const Console = ()=> (
    <div ref={ref} className="h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm shadow-inner shadow-black/40">
      {entries.length===0 && (
        <div className="flex h-full items-center justify-center text-slate-500">Commands echo here with system hints.</div>
      )}
      {entries.map((entry,i)=>(
        <div key={entry.id} className="pb-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{entry.timestamp}</span>
            <Badge
              variant={entry.type==='error'?'outline':'glow'}
              className={entry.type==='error'?'text-red-200 border-red-500/40':'text-green-200'}
            >
              {entry.type}
            </Badge>
          </div>
          <div className="mt-2 space-y-1 text-slate-100">
            {entry.lines.map((line, idx)=> <div key={idx}>{line}</div>)}
          </div>
          {entry.actions && (
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.actions.map((action, idx)=>(
                <Button key={idx} variant="ghost" size="sm" onClick={action.handler}>{action.label}</Button>
              ))}
            </div>
          )}
          {i<entries.length-1 && <Separator className="my-4 h-px bg-white/5" />}
        </div>
      ))}
    </div>
  )

  return { Console }
}
