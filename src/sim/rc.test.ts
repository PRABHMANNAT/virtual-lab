import { expect, test } from 'vitest'
import { RC, clampRC, tau } from './rc'

test('rc tau and Vc(τ)=~0.632V', ()=>{
  const p = clampRC({V:5, R:1000, C:100e-6})
  const T = tau(p)
  const Vc = RC.Vc(T, p)
  expect(Math.abs(Vc - 5*(1-1/Math.E))).toBeLessThan(1e-3)
})

test('current clamp ≤ 0.1 A', ()=>{
  const p = clampRC({V:12, R:10, C:1e-3})
  expect(p.V/p.R).toBeLessThanOrEqual(0.1+1e-12)
})
