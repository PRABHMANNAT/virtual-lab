import { parseFarads, parseMolar, parseOhms, parseVolts } from './units'
import { listShapes } from '../sim/vsepr'
import type { VSEPRShapeId } from '../sim/vsepr'

export type Mode = 'rc'|'titr'|'ohm'|'vsepr'|'bh'
type Action =
  | { kind:'switch', to: Mode }
  | { kind:'reset' }
  | { kind:'rc.set', V?:number, R?:number, C?:number }
  | { kind:'rc.scale', Vmul?:number, Rmul?:number, Cmul?:number }
  | { kind:'rc.plot', target:'voltage'|'current', duration?:number }
  | { kind:'rc.measure', t:number }
  | { kind:'titr.set', acidC?:number, acidV?:number, baseC?:number }
  | { kind:'titr.run' }
  | { kind:'titr.mark', on:boolean }
  | { kind:'ohm.set', R?:number, Vmax?:number }
  | { kind:'ohm.plot' }
  | { kind:'vsepr.select', id:VSEPRShapeId }
  | { kind:'vsepr.describe' }
  | { kind:'bh.set', mass?:number, spin?:number, accretion?:number }
  | { kind:'bh.plot' }

export type ParseDiagnostics = {
  actions: Action[]
  recognized: string[]
  issues: string[]
}

const TYPO_HINTS: Record<string,string> = {
  curent:'current',
  volatge:'voltage',
  resistence:'resistance',
  capitance:'capacitance',
  milisecond:'millisecond'
}

export function parseCommand(text:string, mode:Mode): ParseDiagnostics{
  const normalized = text.replace(/[,;]+/g,' and ')
  const lower = normalized.toLowerCase()
  const actions: Action[] = []
  const recognized: string[] = []
  const issues: string[] = []

  if(/reset/.test(lower)) actions.push({kind:'reset'})

  // infer target domain from text, fall back to current mode
  const titrHint = /titr|titration|acid|ph\b/.test(lower)
  const ohmHint = /ohm\b|ohm's|ohms law|ohm law|i[-\s]?v\b/.test(lower)
  const vseprHint = /vsepr|geometry|hybrid|bond angle|molecule/.test(lower)
  const bhHint = /black hole|event horizon|accretion|disk|relativity/.test(lower)
  const rcHint = /\brc\b|resistor|resistance|capacitor|capacitance|voltage|current/.test(lower)
  let inferred: Mode | null = null
  if(titrHint) inferred = 'titr'
  else if(vseprHint) inferred = 'vsepr'
  else if(bhHint) inferred = 'bh'
  else if(ohmHint) inferred = 'ohm'
  else if(rcHint) inferred = 'rc'

  // "create" acts as a soft hint toward a domain if not already inferred
  if(/create/.test(lower) && !inferred){
    inferred = mode
  }

  const domain: Mode = inferred ?? mode
  if(inferred && inferred !== mode){
    actions.push({kind:'switch', to: inferred})
  }

  // connect: wiring is implicit; no concrete action needed
  if(/connect/.test(lower)){
    // virtual wiring implicit; nothing to do
  }

  if(domain==='rc'){
    // set V, R, C
    const Vm = text.match(/v\s*[=:]?\s*([-+]?\d*\.?\d+)\s*v/i)
    const Rm = text.match(/(?:r|resistance)\s*[=:]?\s*([-+]?\d*\.?\d+)\s*([kMnumµ]?)\s*(?:ohms?|Ω)/i)
    const Cm = text.match(/(?:c|capacitance)\s*[=:]?\s*([-+]?\d*\.?\d+)\s*([numµm]?)\s*f/i)
    if(Vm || Rm || Cm){
      const a: any = { kind:'rc.set' }
      if(Vm){ a.V = parseFloat(Vm[1]); if(!Number.isNaN(a.V)) recognized.push(`V = ${a.V} V`) }
      if(Rm){
        const val = parseFloat(Rm[1]); const p = Rm[2]||''; const s = `${val} ${p}Ω`; const parsed = parseOhms(s)
        if(parsed!=null){ a.R = parsed; recognized.push(`R = ${formatVal(val,p)}Ω`) }
      }
      if(Cm){
        const val = parseFloat(Cm[1]); let p = Cm[2]||''; if(p==='u') p='µ'; const s = `${val} ${p}F`; const parsed = parseFarads(s)
        if(parsed!=null){ a.C = parsed; recognized.push(`C = ${val} ${p||''}F`) }
      }
      actions.push(a as Action)
    }
    if(/double(?: the)? resistance/.test(lower)){ actions.push({kind:'rc.scale', Rmul:2}); recognized.push('Double resistance') }
    if(/half(?:e)?(?: the)? resistance/.test(lower)){ actions.push({kind:'rc.scale', Rmul:0.5}); recognized.push('Half resistance') }
    if(/double(?: the)? capacitance/.test(lower)){ actions.push({kind:'rc.scale', Cmul:2}); recognized.push('Double capacitance') }
    if(/half(?:e)?(?: the)? capacitance/.test(lower)){ actions.push({kind:'rc.scale', Cmul:0.5}); recognized.push('Half capacitance') }
    if(/double(?: the)? voltage/.test(lower)){ actions.push({kind:'rc.scale', Vmul:2}); recognized.push('Double voltage') }

    const durM = normalized.match(/for\s*([-+]?\d*\.?\d+)\s*(s|sec|secs|second|seconds)/i)
    const dur = durM ? parseFloat(durM[1]) : undefined
    if(/plot .*current|plot current/i.test(lower)){ actions.push({kind:'rc.plot', target:'current', duration:dur}); recognized.push(`Plot current${dur?` for ${dur} s`:''}`) }
    if(/plot .*voltage|plot vc|plot capacitor voltage|plot voltage/i.test(lower)){ actions.push({kind:'rc.plot', target:'voltage', duration:dur}); recognized.push(`Plot voltage${dur?` for ${dur} s`:''}`) }

    const meas = normalized.match(/measure.*t\s*=?\s*([-+]?\d*\.?\d+)\s*(?:s|sec|seconds?)/i) || normalized.match(/measure at\s*([-+]?\d*\.?\d+)\s*(?:s|sec|seconds?)/i)
    if(meas){ const t = parseFloat(meas[1]); if(!Number.isNaN(t)){ actions.push({kind:'rc.measure', t}); recognized.push(`Measure at t = ${t} s`) } }
    if(/start|run|go/.test(lower) && !actions.find(a=>a.kind==='rc.plot')) actions.push({kind:'rc.plot', target:'voltage'})
  }else if(domain==='titr'){
    const acidM = normalized.match(/acid(?:\s*concentration)?\s*[=:]?\s*([-+]?\d*\.?\d+)\s*M/i)
    const acidVM = normalized.match(/acid.*?volume\s*[=:]?\s*([-+]?\d*\.?\d+)\s*mL/i)
    const baseM = normalized.match(/base(?:\s*concentration)?\s*[=:]?\s*([-+]?\d*\.?\d+)\s*M/i)
    if(acidM || acidVM || baseM){
      const a:any = {kind:'titr.set'}
      if(acidM){ a.acidC = parseFloat(acidM[1]); recognized.push(`Acid = ${a.acidC} M`) }
      if(acidVM){ a.acidV = parseFloat(acidVM[1]); recognized.push(`Acid volume = ${a.acidV} mL`) }
      if(baseM){ a.baseC = parseFloat(baseM[1]); recognized.push(`Base = ${a.baseC} M`) }
      actions.push(a as Action)
    }
    if(/mark the equivalence/.test(lower)) actions.push({kind:'titr.mark', on:true})
    if(/unmark.*equivalence/.test(lower)) actions.push({kind:'titr.mark', on:false})
    if(/run.*titration|start.*titration|plot.*ph/i.test(lower)){ actions.push({kind:'titr.run'}); recognized.push('Run titration') }
  }else if(domain==='ohm'){
    // Ohm's law: sweep V from 0 to Vmax for fixed R
    const Rm = normalized.match(/resistance\s*[=:]?\s*([-+]?\d*\.?\d+)\s*([kMnumµ]?)\s*(?:ohms?|Ω)/i)
    const Vm = normalized.match(/up to\s*([-+]?\d*\.?\d+)\s*v/i) || normalized.match(/max(?:imum)?\s*voltage\s*[=:]?\s*([-+]?\d*\.?\d+)\s*v/i)
    if(Rm || Vm){
      const a:any = { kind:'ohm.set' }
      if(Rm){
        const val = parseFloat(Rm[1]); const p = Rm[2]||''; const s = `${val} ${p}Ω`; const parsed = parseOhms(s); if(parsed!=null){ a.R = parsed; recognized.push(`R = ${formatVal(val,p)}Ω`) }
      }
      if(Vm){ a.Vmax = parseFloat(Vm[1]); recognized.push(`Vmax = ${a.Vmax} V`) }
      actions.push(a as Action)
    }
    if(/plot.*i[-\s]?v|plot current.*voltage|plot.*ohm/i.test(lower)){ actions.push({kind:'ohm.plot'}); recognized.push('Plot I-V') }
    if(/start|run|go/.test(lower) && !actions.find(a=>a.kind==='ohm.plot')) actions.push({kind:'ohm.plot'})
  }else if(domain==='vsepr'){
    const shapes = listShapes()
    const match = shapes.find(s=> lower.includes(s.id.replace('_',' ')) || lower.includes(s.title.split('(')[0].trim().toLowerCase()))
    if(match){ actions.push({kind:'vsepr.select', id:match.id}); recognized.push(`Select geometry ${match.title}`) }
    if(/describe|explain|angle|show/.test(lower)){ actions.push({kind:'vsepr.describe'}); recognized.push('Describe geometry') }
  }else{
    const massMatch = normalized.match(/mass\s*[=:]?\s*([-+]?\d*\.?\d+)/i)
    const spinMatch = normalized.match(/spin\s*[=:]?\s*([-+]?\d*\.?\d+)/i)
    const accrMatch = normalized.match(/accretion(?:\s*rate)?\s*[=:]?\s*([-+]?\d*\.?\d+)/i)
    if(massMatch || spinMatch || accrMatch){
      actions.push({
        kind:'bh.set',
        mass: massMatch? parseFloat(massMatch[1]) : undefined,
        spin: spinMatch? parseFloat(spinMatch[1]) : undefined,
        accretion: accrMatch? parseFloat(accrMatch[1]) : undefined
      })
      recognized.push('Adjust black hole parameters')
    }
    if(/plot|render|simulate/.test(lower)){ actions.push({kind:'bh.plot'}); recognized.push('Plot accretion disk') }
    if(/start|run|go/.test(lower) && !actions.find(a=>a.kind==='bh.plot')) actions.push({kind:'bh.plot'})
  }

  Object.entries(TYPO_HINTS).forEach(([miss, correct])=>{
    if(lower.includes(miss)) issues.push(`possible typo in "${miss}" → "${correct}"`)
  })

  return { actions, recognized, issues }
}

function formatVal(val:number, prefix:string){
  return prefix ? `${val} ${prefix}` : val.toString()
}
