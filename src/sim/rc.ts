export type RCParams = { V:number; R:number; C:number }
export function clampRC(p:RCParams): RCParams {
  let {V,R,C} = p
  V = Math.min(12, Math.max(0, V))
  R = Math.min(1e6, Math.max(10, R))
  C = Math.min(0.1, Math.max(1e-9, C))
  // enforce peak current ≤ 100 mA
  if(V/R > 0.1){ R = Math.max(R, V/0.1) }
  return {V,R,C}
}
export function tau(p:RCParams){ return p.R * p.C }
export function Vc(t:number, p:RCParams){ return p.V * (1 - Math.exp(-t / (p.R * p.C))) }
export function I(t:number, p:RCParams){ return (p.V/p.R) * Math.exp(-t / (p.R * p.C)) }
export function sampleVoltage(p:RCParams, duration:number, N=600){
  const t:number[] = [], y:number[] = []
  for(let i=0;i<=N;i++){ const tt = i/N*duration; t.push(tt); y.push(Vc(tt,p)) }
  return { t, y }
}
export function sampleCurrent(p:RCParams, duration:number, N=600){
  const t:number[] = [], y:number[] = []
  for(let i=0;i<=N;i++){ const tt = i/N*duration; t.push(tt); y.push(I(tt,p)) }
  return { t, y }
}
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
export const RC = { tau, Vc, I, sampleVoltage, sampleCurrent }
