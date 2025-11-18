import React, { useEffect, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { Button } from './ui/button'
import { logConsole } from './Console'

export function VoiceButton({ onText }:{ onText:(t:string)=>void }){
  const [active, setActive] = useState(false)
  const recRef = useRef<any>(null)

  function toggle(){
    if(active){
      try{ recRef.current?.stop?.() }catch{}
      setActive(false)
      return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if(!SR){
      logConsole({ type:'hint', lines:['Speech recognition not supported in this browser. Try typing your command.'] })
      return
    }
    const rec = new SR(); rec.lang='en-US'; rec.interimResults=false; rec.maxAlternatives=1
    rec.onresult = (e:any)=>{ const t = e.results[0][0].transcript; logConsole({ type:'hint', lines:['[voice] '+t] }); onText(t) }
    rec.onend = ()=> setActive(false)
    rec.start(); setActive(true); recRef.current = rec
  }

  useEffect(()=>{
    return ()=>{ try{ recRef.current?.stop?.() }catch{} }
  },[])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={active ? 'bg-blue-500 text-white hover:bg-blue-500' : 'border border-white/40 text-white'}
    >
      <Mic className="h-4 w-4" />
    </Button>
  )
}
