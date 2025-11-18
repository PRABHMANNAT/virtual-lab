import { expect, test } from 'vitest'
import { Titration, clampTitration, eqVolume } from './titration'

test('eq near pH 7', ()=>{
  const p = clampTitration({acidC:0.1, acidV:50, baseC:0.1})
  const vEq = eqVolume(p)
  const pH = Titration.pH(vEq, p)
  expect(Math.abs(pH - 7)).toBeLessThan(1e-6)
})

test('monotonic pH increase', ()=>{
  const p = {acidC:0.1, acidV:25, baseC:0.1}
  const xs:number[]=[]; const ys:number[]=[]
  const vEq = eqVolume(p)
  for(let v=0; v<=vEq*1.6; v+=0.5){ xs.push(v); ys.push(Titration.pH(v, p as any)) }
  for(let i=1;i<ys.length;i++){ expect(ys[i]).toBeGreaterThanOrEqual(ys[i-1]-1e-9) }
})
