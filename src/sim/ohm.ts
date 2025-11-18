export type OhmParams = { R:number; Vmax:number }

export function clampOhm(p:OhmParams): OhmParams {
  let { R, Vmax } = p
  R = Math.min(1e6, Math.max(1, R))
  Vmax = Math.min(50, Math.max(0.1, Vmax))
  return { R, Vmax }
}

export function sampleIV(p:OhmParams, N=200){
  const x:number[] = []
  const y:number[] = []
  for(let i=0;i<=N;i++){
    const V = p.Vmax * (i/N)
    x.push(V)
    y.push(V/p.R)
  }
  return { V:x, I:y }
}

