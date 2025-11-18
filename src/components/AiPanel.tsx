import React, { useState } from 'react'
import { Sparkles, Play } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

type Props = {
  onCommand:(cmd:string)=>void
  context:string
}

const SYSTEM_PROMPT = `You are the orchestration AI for V-Lab.
You control five simulations (RC charging, Ohm's law, strong-acid titration, molecular geometry via VSEPR, and black hole accretion) by emitting natural-language commands that the existing parser already understands.
Always respond ONLY with JSON resembling:
{"commands":["command one","command two"],"explanation":"short reason"}
Commands must be actionable (e.g., "Set V = 5 V..." or "Run a strong-acid titration...").
Prefer a single command when possible; when multiple steps are needed, return multiple strings in the "commands" array.`

export function AiPanel({ onCommand, context }:Props){
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'error'>('idle')
  const [result, setResult] = useState<{commands:string[], explanation:string} | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [autoRun, setAutoRun] = useState(true)

  async function ask(){
    if(!prompt.trim()) return
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if(!apiKey){
      setStatus('error')
      setErrorMsg('Set VITE_OPENAI_API_KEY in your .env.local before asking the tutor.')
      return
    }
    try{
      setStatus('loading'); setErrorMsg(''); setResult(null)
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model:'gpt-4o-mini',
          temperature:0.2,
          messages:[
            { role:'system', content: SYSTEM_PROMPT },
            { role:'user', content: `Context:\n${context}\n\nUser request:\n${prompt}` }
          ]
        })
      })
      if(!res.ok){
        throw new Error(`OpenAI error ${res.status}`)
      }
      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content
      const payload = JSON.parse(content || '{}')
      const commands: string[] = Array.isArray(payload.commands)
        ? payload.commands.filter((c:string)=> typeof c === 'string' && c.trim())
        : typeof payload.command==='string' ? [payload.command] : []
      if(!commands.length){
        throw new Error('Tutor response missing commands. Try again.')
      }
      const explanation = typeof payload.explanation==='string' ? payload.explanation : ''
      setResult({commands, explanation})
      setStatus('idle')
      if(autoRun){
        commands.forEach((cmd,idx)=> setTimeout(()=> onCommand(cmd), idx*150))
      }
    }catch(err:any){
      console.error(err)
      setStatus('error')
      setErrorMsg(err?.message || 'Unable to reach AI tutor.')
    }
  }

  return (
    <Card className="overflow-hidden border-white/5 bg-slate-950/70">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-orange-400" />
            Quantum Tutor
          </CardTitle>
          <CardDescription>Ask for cinematic lab guides or have the AI emit commands.</CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          Auto-run
          <Switch checked={autoRun} onCheckedChange={setAutoRun} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={prompt}
          onChange={e=> setPrompt(e.target.value)}
          placeholder="Ask e.g. “Stabilize the RC discharge and show τ overlays.”"
        />
        <div className="flex flex-wrap gap-3">
          <Button onClick={ask} disabled={status==='loading'} className="flex-1 min-w-[120px]">
            {status==='loading' ? 'Coordinating…' : 'Ask tutor'}
          </Button>
          <Button variant="ghost" onClick={()=> setPrompt('Set V = 5 V, R = 2 kΩ, plot current for 2 s')}>
            Quick prompt
          </Button>
        </div>
        {result && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white">
            <div className="space-y-2">
              {result.commands.map((cmd,i)=>(
                <div key={i} className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/40 px-3 py-2">
                  <span>{cmd}</span>
                  <Button size="sm" variant="ghost" onClick={()=> onCommand(cmd)}>
                    <Play className="mr-1 h-3.5 w-3.5" />
                    Run
                  </Button>
                </div>
              ))}
            </div>
            {result.explanation && <p className="mt-3 text-slate-300">{result.explanation}</p>}
            {!autoRun && (
              <Button className="mt-3 w-full" variant="secondary" onClick={()=> result.commands.forEach(cmd=> onCommand(cmd))}>
                Execute sequence
              </Button>
            )}
          </div>
        )}
        {status==='error' && errorMsg && <div className="rounded-2xl border border-red-500/40 bg-red-500/20 px-3 py-2 text-sm text-red-200">{errorMsg}</div>}
      </CardContent>
    </Card>
  )
}
