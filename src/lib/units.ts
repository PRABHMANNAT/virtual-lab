export function parseVolts(s:string){ const m = s.match(/([-+]?\d*\.?\d+)\s*V/i); return m? parseFloat(m[1]): null }
export function parseOhms(s:string){
  s = s.replace(/ohms?/i,'Ω').replace(/k ?ohm/i,'kΩ').replace(/M ?ohm/i,'MΩ')
  const m = s.match(/([-+]?\d*\.?\d+)(?:\s*(n|u|µ|m|k|M))?\s*Ω/i)
  if(!m) return null
  let v = parseFloat(m[1])
  const p = (m[2]||'')
  if(p==='M') v*=1e6
  else if(p==='k') v*=1e3
  else if(p==='m') v*=1e-3
  else if(p==='u' || p==='µ') v*=1e-6
  else if(p==='n') v*=1e-9
  return v
}
export function parseFarads(s:string){
  s = s.replace(/micro/i,'µ')
  const m = s.match(/([-+]?\d*\.?\d+)(?:\s*(n|u|µ|m))?\s*F/i)
  if(!m) return null
  let v = parseFloat(m[1])
  const p = (m[2]||'').toLowerCase()
  if(p==='m') v*=1e-3
  else if(p==='u' || p==='µ') v*=1e-6
  else if(p==='n') v*=1e-9
  return v
}
export function parseMolar(s:string){ const m = s.match(/([-+]?\d*\.?\d+)\s*M\b/i); return m? parseFloat(m[1]) : null }
export function parseMilliLiters(s:string){ const m = s.match(/([-+]?\d*\.?\d+)\s*mL\b/i); return m? parseFloat(m[1]) : null }

export function formatOhms(R:number){
  if(R>=1e6) return (R/1e6).toFixed(3)+' MΩ'
  if(R>=1e3) return (R/1e3).toFixed(3)+' kΩ'
  return R.toFixed(0)+' Ω'
}
export function formatFarads(C:number){
  if(C>=1e-3) return (C*1e3).toFixed(2)+' mF'
  if(C>=1e-6) return (C*1e6).toFixed(1)+' µF'
  if(C>=1e-9) return (C*1e9).toFixed(1)+' nF'
  return C.toExponential(2)+' F'
}
