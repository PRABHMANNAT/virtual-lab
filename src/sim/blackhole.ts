export type BlackHoleParams = {
  mass:number // solar masses
  spin:number // 0..0.99
  accretion:number // arbitrary rate scale
}

export function clampBlackHole(p:BlackHoleParams): BlackHoleParams{
  return {
    mass: Math.min(10, Math.max(0.1, p.mass)),
    spin: Math.min(0.99, Math.max(0, p.spin)),
    accretion: Math.min(5, Math.max(0.1, p.accretion))
  }
}

export function sampleDisk(params:BlackHoleParams, N=400){
  const { mass, spin, accretion } = params
  const x:number[] = []
  const y:number[] = []
  const rMin = 1 + (1 - spin) * 2 // approximate ISCO relative units
  const rMax = 30
  for(let i=0;i<=N;i++){
    const r = rMin + (rMax-rMin)*i/N
    const intensity = accretion * Math.pow(r, -2) * Math.pow(mass, -0.5)
    x.push(r)
    y.push(intensity)
  }
  return { x, y }
}
