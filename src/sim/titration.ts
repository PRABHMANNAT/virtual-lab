export type TitrationParams = { acidC:number; acidV:number; baseC:number; markEq?:boolean }
export function clampTitration(p:TitrationParams): TitrationParams {
  let {acidC, acidV, baseC} = p
  if(!(acidC>=0.001 && acidC<=1.0)) acidC = Math.min(1.0, Math.max(0.001, acidC))
  if(!(baseC>=0.001 && baseC<=1.0)) baseC = Math.min(1.0, Math.max(0.001, baseC))
  if(!(acidV>=5 && acidV<=200)) acidV = Math.min(200, Math.max(5, acidV))
  return { ...p, acidC, acidV, baseC }
}
export function eqVolume(p:TitrationParams){ return (p.acidC * (p.acidV/1000) / p.baseC) * 1000 } // mL
export const Titration = {
  pH(vBase_mL:number, p:TitrationParams){
    const Va = p.acidV/1000
    const nA0 = p.acidC * Va
    const nB = p.baseC * (vBase_mL/1000)
    const Vtot = Va + (vBase_mL/1000)
    if(nB < nA0){
      const H = (nA0 - nB)/Vtot
      return -Math.log10(H)
    }else if (Math.abs(nB - nA0) < 1e-12){
      return 7.0
    }else{
      const OH = (nB - nA0)/Vtot
      const pOH = -Math.log10(OH)
      return 14 - pOH
    }
  },
  sanity(xs:number[], ys:number[], vEq:number){
    for(let i=1;i<ys.length;i++){ if(ys[i] < ys[i-1]-1e-6) return false }
    let idx = xs.findIndex(v=> v>vEq)
    if(idx<2 || idx>ys.length-3) return false
    const dy = ys[idx+1]-ys[idx-1], dx = xs[idx+1]-xs[idx-1]
    const slope = dy/dx
    return slope>0.2 // rough steepness check
  }
}
