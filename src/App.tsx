import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Command as CommandIcon,
  Download,
  Filter,
  FlaskConical,
  History,
  Orbit,
  Sparkles,
  Zap,
  Atom
} from 'lucide-react'
import { RC, type RCParams, formatFarads, formatOhms, clampRC } from './sim/rc'
import { Titration, type TitrationParams, clampTitration, eqVolume } from './sim/titration'
import { sampleIV, type OhmParams, clampOhm } from './sim/ohm'
import { parseCommand } from './lib/nlu'
import { Plot, type Series } from './components/Plot'
import { VoiceButton } from './components/VoiceButton'
import { useConsole, logConsole } from './components/Console'
import { Telemetry } from './lib/telemetry'
import { parseFarads, parseMolar, parseOhms, parseVolts, parseMilliLiters } from './lib/units'
import { getShape, listShapes, type VSEPRShapeId } from './sim/vsepr'
import { clampBlackHole, type BlackHoleParams, sampleDisk } from './sim/blackhole'
import { ThreeViewport } from './components/ThreeViewport'
import { AiPanel } from './components/AiPanel'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Slider } from './components/ui/slider'
import { Switch } from './components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion'
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover'
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from './components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'
import { Checkbox } from './components/ui/checkbox'
import { ScrollArea } from './components/ui/scroll-area'
import {
  Command as CommandContainer,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './components/ui/command'
import { Separator } from './components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group'

const DEMO_COMMAND = 'Set V = 5 V, R = 1 kΩ, C = 100 µF and plot capacitor voltage for 1 s'
const QUICK_COMMANDS = [
  'Plot capacitor voltage for 1 s',
  'Plot current for 5 s',
  'Double the resistance and plot current for 5 s',
  'Set V = 5 V, R = 2 kΩ, C = 100 µF and plot voltage for 1 s'
]
const HELPER_EXAMPLES = [
  'set V = 5 V, R = 1 kΩ',
  'plot capacitor voltage for 1 s',
  'double the resistance and plot current for 5 s'
]

type Mode = 'rc' | 'titr' | 'ohm' | 'vsepr' | 'bh'
type CourseCard = {
  id:string
  title:string
  description:string
  category:'Circuits'|'Chemistry'|'Relativity'|'Quantum'
  difficulty:'Beginner'|'Intermediate'|'Advanced'
  duration:string
  image:string
  tags:string[]
}
type CourseFilters = { categories:Set<string>; difficulty:Set<string> }

const NAV_ITEMS: { id:Mode; label:string; detail:string; icon:LucideIcon }[] = [
  { id:'rc', label:'RC Charging', detail:'Time-constant cockpit', icon:Zap },
  { id:'ohm', label:'Ohm’s Law', detail:'I-V sweeps & clamps', icon:Activity },
  { id:'titr', label:'Strong-acid titration', detail:'pH beakers & burettes', icon:FlaskConical },
  { id:'bh', label:'Black hole accretion', detail:'Relativistic disk shader', icon:Orbit },
  { id:'vsepr', label:'Atomic geometry', detail:'Orbital hologram', icon:Atom }
]

const COURSE_CATALOG: CourseCard[] = [
  {
    id:'rc101',
    title:'Charged Horizons',
    description:'Dial τ, reshape discharge curves, and benchmark safe surges.',
    category:'Circuits',
    difficulty:'Intermediate',
    duration:'12 min',
    image:'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    tags:['RC', 'Telemetry', 'Control']
  },
  {
    id:'chem201',
    title:'Neon Titration Suite',
    description:'Simulate precise burette drops with holographic pH overlays.',
    category:'Chemistry',
    difficulty:'Advanced',
    duration:'18 min',
    image:'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=1200&q=80',
    tags:['pH', 'Equivalence', 'Lab']
  },
  {
    id:'rel301',
    title:'Singularity Flight Deck',
    description:'Orbit the ISCO and sculpt accretion flow presets.',
    category:'Relativity',
    difficulty:'Intermediate',
    duration:'16 min',
    image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    tags:['Black hole', 'Spin', 'Shader']
  },
  {
    id:'geo105',
    title:'Orbital Alloys',
    description:'Explore VSEPR ligands with tactile R3F navigation.',
    category:'Quantum',
    difficulty:'Beginner',
    duration:'10 min',
    image:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    tags:['VSEPR', 'R3F', 'Molecule']
  }
]

const SUGGESTION_BY_MODE: Record<Mode,string> = {
  rc:'“Double the resistance and plot current for 5 s.”',
  titr:'“Run a strong‑acid titration and mark the equivalence point.”',
  ohm:'“Sweep to 12 V and export the I‑V CSV.”',
  vsepr:'“Describe trigonal bipyramidal geometry.”',
  bh:'“Spin up to 0.9 and plot disk intensity.”'
}

const FILTER_OPTIONS = {
  categories: ['Circuits','Chemistry','Relativity','Quantum'],
  difficulty: ['Beginner','Intermediate','Advanced']
}

const HISTORY_LIMIT = 8

export default function App(){
  const [mode, setMode] = useState<Mode>('rc')
  const [series, setSeries] = useState<Series[]>([])
  const { Console } = useConsole()
  const [rc, setRC] = useState<RCParams>({ V:5, R:1000, C:100e-6 })
  const [rcInputs, setRcInputs] = useState({ V:'5', R:formatOhms(1000), C:formatFarads(100e-6) })
  const [titr, setTitr] = useState<TitrationParams>({ acidC:0.1, acidV:50, baseC:0.1, markEq:true })
  const [titrInputs, setTitrInputs] = useState({ acidC:'0.1', acidV:'50', baseC:'0.1' })
  const [ohm, setOhm] = useState<OhmParams>({ R:1000, Vmax:10 })
  const [ohmInputs, setOhmInputs] = useState({ R:'1.000 kΩ', Vmax:'10' })
  const [shapeId, setShapeId] = useState<VSEPRShapeId>('tetrahedral')
  const shape = useMemo(()=> getShape(shapeId), [shapeId])
  const [bh, setBh] = useState<BlackHoleParams>({ mass:5, spin:0.7, accretion:1 })
  const [selectedLigand, setSelectedLigand] = useState<string|null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const [plotTab, setPlotTab] = useState<'chart'|'telemetry'>('chart')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [courseFilters, setCourseFilters] = useState<CourseFilters>(()=>({ categories:new Set(), difficulty:new Set() }))
  const cmdRef = useRef<HTMLInputElement>(null)
  const [overviewOpen, setOverviewOpen] = useState(false)

  useEffect(()=>{
    logConsole({ type:'hint', lines:['Set lab parameters, then type cinematic commands like “plot capacitor voltage for 1 s”.'] })
  },[])

  useEffect(()=>{
    setRcInputs({
      V: rc.V.toString(),
      R: formatOhms(rc.R),
      C: formatFarads(rc.C)
    })
  }, [rc])

  useEffect(()=>{
    setTitrInputs({
      acidC: `${titr.acidC}`,
      acidV: `${titr.acidV}`,
      baseC: `${titr.baseC}`
    })
  }, [titr])

  useEffect(()=>{
    setOhmInputs({ R: formatOhms(ohm.R), Vmax: `${ohm.Vmax}` })
  }, [ohm])

  useEffect(()=>{
    if(mode==='vsepr'){
      const sh = getShape(shapeId)
      setSeries([{ x:[0,1], y:[sh.bondAngle, sh.bondAngle], label:`Bond angle ≈ ${sh.bondAngle}°`, color:'#f9fafb' }])
      setSelectedLigand(null)
    }
  }, [shapeId, mode])

  useEffect(()=>{
    if(mode==='bh'){
      const disk = sampleDisk(bh)
      setSeries([{ x:disk.x, y:disk.y, label:'Disk intensity', color:'#f9fafb' }])
    }
  }, [bh, mode])

  useEffect(()=>{
    if(mode!=='vsepr') setSelectedLigand(null)
  }, [mode])

  useEffect(()=>{
    if(typeof window === 'undefined') return
    if(sessionStorage.getItem('vlab_demo_ran')==='1') return
    sessionStorage.setItem('vlab_demo_ran','1')
    logConsole({ type:'hint', lines:['Running a starter cinematic command…'] })
    if(cmdRef.current) cmdRef.current.value = DEMO_COMMAND
    runCommand(DEMO_COMMAND, { logCommand:false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const vEq = useMemo(()=> eqVolume(titr), [titr])
  const rcTau = useMemo(()=> rc.R*rc.C, [rc])

  const markers = useMemo(()=>{
    if(mode==='rc') return [{ x: rcTau, label:'τ', color:'#f97316' }]
    if(mode==='titr' && titr.markEq) return [{ x: vEq, label:'Eq', color:'#f97316' }]
    if(mode==='bh') return [{ x: 1 + (1 - bh.spin)*2, label:'ISCO', color:'#f97316' }]
    return []
  }, [mode, rcTau, vEq, titr.markEq, bh])

  const plotLabel = useMemo(()=>{
    if(mode==='rc') return 't (s)'
    if(mode==='titr') return 'Volume of base added (mL)'
    if(mode==='ohm') return 'Voltage (V)'
    if(mode==='bh') return 'r (r_g units)'
    return 'Parameter'
  }, [mode])

  const aiContext = useMemo(()=>{
    return [
      `Active lab: ${mode}`,
      `RC => V=${rc.V}V, R=${rc.R}Ω, C=${rc.C}F`,
      `Titration => acid ${titr.acidC} M @ ${titr.acidV} mL, base ${titr.baseC} M`,
      `Ohm => R=${ohm.R}Ω, Vmax=${ohm.Vmax}V`,
      `VSEPR => ${shape.title}`,
      `Black hole => mass=${bh.mass} Msun, spin=${bh.spin}, accretion=${bh.accretion}`
    ].join('\n')
  }, [mode, rc, titr, ohm, shape, bh])

  const heroStats = useMemo(()=>{
    if(mode==='rc'){
      return [
        { label:'τ (time constant)', value:`${rcTau.toFixed(4)} s` },
        { label:'I₀', value:`${(rc.V/rc.R).toExponential(3)} A` },
        { label:'Safety clamp', value:'≤0.1 A enforced' }
      ]
    }
    if(mode==='titr'){
      return [
        { label:'Equivalence', value:`${vEq.toFixed(2)} mL` },
        { label:'pH start', value:Titration.pH(0, titr).toFixed(2) },
        { label:'pH @1.5×eq', value:Titration.pH(vEq*1.5, titr).toFixed(2) }
      ]
    }
    if(mode==='ohm'){
      return [
        { label:'Resistance', value:formatOhms(ohm.R) },
        { label:'Vmax', value:`${ohm.Vmax.toFixed(1)} V` },
        { label:'Imax', value:`${(ohm.Vmax/ohm.R).toExponential(3)} A` }
      ]
    }
    if(mode==='vsepr'){
      return [
        { label:'Geometry', value:shape.title },
        { label:'Bond angle', value:`${shape.bondAngle}°` },
        { label:'Hybridization', value:shape.hybridization }
      ]
    }
    const isco = 1 + (1 - bh.spin)*2
    return [
      { label:'Mass', value:`${bh.mass.toFixed(1)} M☉` },
      { label:'Spin', value:bh.spin.toFixed(2) },
      { label:'ISCO', value:`${isco.toFixed(2)} r_g` }
    ]
  }, [mode, rcTau, rc, titr, vEq, ohm, shape, bh])

  const heroActions = useMemo(()=>{
    if(mode==='rc'){
      return [
        { label:'Half R', action:()=> setRC(clampRC({V:rc.V,R:rc.R*0.5,C:rc.C})) },
        { label:'Double R', action:()=> setRC(clampRC({V:rc.V,R:rc.R*2,C:rc.C})) },
        { label:'Boost V', action:()=> setRC(clampRC({V:Math.min(12, rc.V+1), R:rc.R, C:rc.C})) }
      ]
    }
    if(mode==='ohm'){
      return [
        { label:'Sweep 12 V', action:()=> setOhm(clampOhm({R:ohm.R, Vmax:12})) },
        { label:'Clamp 5 V', action:()=> setOhm(clampOhm({R:ohm.R, Vmax:5})) }
      ]
    }
    if(mode==='titr'){
      return [
        { label:'Mark Eq', action:()=> setTitr(clampTitration({...titr, markEq:true})) },
        { label:'Toggle marker', action:()=> setTitr(clampTitration({...titr, markEq:!titr.markEq})) }
      ]
    }
    if(mode==='vsepr'){
      return [
        { label:'Describe shape', action:()=> runCommand('Explain the current geometry and show bond angles') },
        { label:'Random shape', action:()=>{
          const shapes = listShapes()
          const pick = shapes[Math.floor(Math.random()*shapes.length)]
          setShapeId(pick.id)
        } }
      ]
    }
    return [
      { label:'High spin', action:()=> setBh(clampBlackHole({mass:bh.mass, spin:0.95, accretion:bh.accretion})) },
      { label:'Boost accretion', action:()=> setBh(clampBlackHole({mass:bh.mass, spin:bh.spin, accretion: bh.accretion*1.4})) }
    ]
  }, [mode, rc, titr, ohm, bh])

  const heroVisual = useMemo(()=>{
    if(mode==='vsepr'){
      return <ThreeViewport className="h-[360px] w-full" kind="vsepr" shape={shape} highlightId={selectedLigand || undefined} onSelect={id=> setSelectedLigand(id)} />
    }
    if(mode==='bh'){
      return <ThreeViewport className="h-[360px] w-full" kind="bh" blackHole={bh} />
    }
    const base = (content:React.ReactNode)=>(
      <div className="relative h-[360px] w-full overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/60 to-slate-950/40 shadow-aurora">
        <div className="grid-overlay"></div>
        <div className="absolute inset-0 flex items-center justify-center text-slate-200/80">{content}</div>
        <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-white/5"></div>
      </div>
    )
    if(mode==='rc'){
      return base(<svg viewBox="0 0 600 280" className="h-full w-full opacity-90" xmlns="http://www.w3.org/2000/svg">
        <path d="M60 140 H200 M400 140 H540" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round"/>
        <g>
          <rect x="45" y="100" width="30" height="80" rx="8" fill="#020617" stroke="#e5e7eb"/>
          <line x1="56" y1="110" x2="64" y2="110" stroke="#f9fafb" strokeWidth="2"/>
          <line x1="60" y1="106" x2="60" y2="114" stroke="#f9fafb" strokeWidth="2"/>
          <line x1="56" y1="170" x2="64" y2="170" stroke="#f9fafb" strokeWidth="2"/>
        </g>
        <path d="M200 140 h30 l10 -18 l20 36 l20 -36 l20 36 l20 -36 l10 18 h30" stroke="#f9fafb" strokeWidth="3" fill="none"/>
        <g>
          <line x1="400" y1="120" x2="400" y2="160" stroke="#f9fafb" strokeWidth="4"/>
          <line x1="420" y1="120" x2="420" y2="160" stroke="#f9fafb" strokeWidth="4"/>
        </g>
        <circle r="4" fill="#67e8f9">
          <animate attributeName="cx" from="70" to="530" dur="2s" repeatCount="indefinite" />
          <animate attributeName="cy" from="140" to="140" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>)
    }
    if(mode==='titr'){
      return base(<svg viewBox="0 0 600 280" className="h-full w-full opacity-90" xmlns="http://www.w3.org/2000/svg">
        <rect x="450" y="20" width="24" height="220" rx="8" fill="#020617" stroke="#9ca3af"/>
        <rect x="454" y="40" width="16" height="180" fill="#e5e7eb" opacity=".2"/>
        <circle cx="462" cy="225" r="6" fill="#f9fafb"/>
        <rect x="458" y="231" width="8" height="25" fill="#f9fafb"/>
        <path d="M120 50 h160 l-10 160 a40 30 0 0 1 -140 0 l-10 -160Z" fill="#020617" stroke="#9ca3af"/>
        <path d="M140 190 h120 a30 16 0 0 1 -100 0 Z" fill="#e5e7eb" opacity=".18"/>
        <circle cx="462" cy="60" r="4" fill="#f9fafb">
          <animate attributeName="cy" from="60" to="230" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="1" to="0" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>)
    }
    return base(<svg viewBox="0 0 600 280" className="h-full w-full opacity-90" xmlns="http://www.w3.org/2000/svg">
      <path d="M80 140 h80" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round"/>
      <rect x="160" y="110" width="80" height="60" rx="8" fill="#020617" stroke="#9ca3af"/>
      <path d="M240 140 h80" stroke="#e5e7eb" strokeWidth="3"/>
      <rect x="320" y="120" width="40" height="40" rx="4" fill="#020617" stroke="#e5e7eb"/>
      <rect x="320" y="132" width="16" height="16" fill="#e5e7eb">
        <animate attributeName="x" from="320" to="344" dur="1.6s" repeatCount="indefinite" />
      </rect>
      <path d="M360 140 h120" stroke="#e5e7eb" strokeWidth="3"/>
    </svg>)
  }, [mode, shape, selectedLigand, bh])

  const filteredCourses = useMemo(()=>{
    return COURSE_CATALOG.filter(course=>{
      if(courseFilters.categories.size && !courseFilters.categories.has(course.category)) return false
      if(courseFilters.difficulty.size && !courseFilters.difficulty.has(course.difficulty)) return false
      return true
    })
  }, [courseFilters])

  const presetLibrary = useMemo(()=>({
    rc: [
      { title:'Slow cinematic charge', description:'5 V · 1 kΩ · 100 µF', action:()=> setRC(clampRC({V:5,R:1000,C:100e-6})) },
      { title:'Fast burst', description:'5 V · 200 Ω · 10 µF', action:()=> setRC(clampRC({V:5,R:200,C:10e-6})) },
      { title:'Voltage ramp', description:'10 V · 2 kΩ · 220 µF', action:()=> setRC(clampRC({V:10,R:2000,C:220e-6})) }
    ],
    titr: [
      { title:'0.1 M / 50 mL', description:'Classic strong acid-base', action:()=> setTitr(clampTitration({acidC:0.1,acidV:50,baseC:0.1,markEq:true})) },
      { title:'0.05 M micro', description:'Delicate 25 mL run', action:()=> setTitr(clampTitration({acidC:0.05,acidV:25,baseC:0.1,markEq:true})) }
    ],
    ohm: [
      { title:'1 kΩ sweep', description:'10 V max safe', action:()=> setOhm(clampOhm({R:1000,Vmax:10})) },
      { title:'Lab PS', description:'470 Ω · 8 V', action:()=> setOhm(clampOhm({R:470,Vmax:8})) }
    ],
    vsepr: [
      { title:'Tetrahedral', description:'sp³ with 109.5°', action:()=> setShapeId('tetrahedral') },
      { title:'Trigonal bipyramidal', description:'sp³d with axial focus', action:()=> setShapeId('trigonal_bipyramidal') }
    ],
    bh: [
      { title:'Stellar remnant', description:'5 M☉ · spin 0.2', action:()=> setBh(clampBlackHole({mass:5, spin:0.2, accretion:1})) },
      { title:'Rapid Kerr', description:'8 M☉ · spin 0.95', action:()=> setBh(clampBlackHole({mass:8, spin:0.95, accretion:1.2})) }
    ]
  }), [setRC, setTitr, setOhm, setBh, setShapeId])

  function toggleFilter(group:'categories'|'difficulty', value:string){
    setCourseFilters(prev=>{
      const nextGroup = new Set(prev[group])
      if(nextGroup.has(value)) nextGroup.delete(value); else nextGroup.add(value)
      return { ...prev, [group]: nextGroup }
    })
  }

  function switchMode(m:Mode){
    setMode(m); setSeries([])
    logConsole({ type:'hint', lines:[`Switched to ${NAV_ITEMS.find(item=> item.id===m)?.label ?? ''}.`] })
    Telemetry.log({verb:'switched', object:m})
  }

  function handleParseFailure(original:string, recognized:string[], issues:string[]){
    const suggestion = repairCommand(original)
    const lines:string[] = []
    if(recognized.length){
      lines.push('I think you said:')
      recognized.forEach(r=> lines.push(`• ${r}`))
      if(issues.length){
        lines.push(`I couldn’t understand part of it (${issues[0]}).`)
      }else{
        lines.push('I couldn’t understand the rest of that command.')
      }
    }else{
      lines.push('I couldn’t turn that into a simulation step.')
      lines.push('Try a command like: set V = 5 V, R = 1 kΩ, C = 100 µF and plot capacitor voltage for 1 s.')
    }
    logConsole({
      type:'error',
      lines,
      actions: suggestion ? [{
        label:'Fix it for me',
        handler:()=>{
          if(cmdRef.current){ cmdRef.current.value = suggestion }
          logConsole({ type:'hint', lines:[`Fixing command to: ${suggestion}`] })
          runCommand(suggestion, { logCommand:false })
        }
      }] : undefined
    })
  }

  function runCommand(text:string, opts?:{ logCommand?:boolean }){
    if(!text.trim()) return
    const cleaned = text.trim()
    if(opts?.logCommand !== false){
      logConsole({ type:'ok', lines:[`Command → ${cleaned}`] })
      setCommandHistory(prev => [cleaned, ...prev.filter(item=> item!==cleaned)].slice(0, HISTORY_LIMIT))
    }
    const result = parseCommand(cleaned, mode)
    const acts = result.actions
    if(!acts.length){
      handleParseFailure(cleaned, result.recognized, result.issues)
      return
    }
    let acted = false
    for(const a of acts){
      if(a.kind==='switch'){
        switchMode(a.to)
        acted = true
      }else if(a.kind==='rc.set'){
        const next = clampRC({ V: a.V ?? rc.V, R: a.R ?? rc.R, C: a.C ?? rc.C })
        if(next.V!==rc.V || next.R!==rc.R || next.C!==rc.C){
          logConsole({ type:'ok', lines:['Updated circuit values.'] })
        }
        setRC(next); acted = true
      }else if(a.kind==='rc.scale'){
        const next = clampRC({ V: rc.V*(a.Vmul??1), R: rc.R*(a.Rmul??1), C: rc.C*(a.Cmul??1) })
        setRC(next); acted = true
      }else if(a.kind==='rc.plot'){
        const assumed = a.duration==null
        const dur = Math.max(0.01, Math.min(60, a.duration ?? 1))
        const dat = a.target==='current' ? RC.sampleCurrent(rc, dur, 600) : RC.sampleVoltage(rc, dur, 600)
        setSeries([{ x:dat.t, y:dat.y, label: a.target==='current'?'Current I (A)':'V_C (V)', color: a.target==='current'?'#ef4444':'#3b82f6' }])
        const tau = rc.R*rc.C
        const lines = [`Plotted ${a.target} for ${dur.toFixed(2)} s (τ=${tau.toFixed(4)} s).`]
        if(assumed) lines.push('Assuming plot duration = 1 s (default).')
        logConsole({ type:'ok', lines })
        Telemetry.log({verb:'plot', object:'rc_'+a.target, result:{duration:dur,tau}})
        acted = true
      }else if(a.kind==='rc.measure'){
        const v = RC.Vc(a.t, rc); const i = RC.I(a.t, rc)
        logConsole({ type:'ok', lines:[`Measurement at t=${a.t.toFixed(3)} s → V_C=${v.toFixed(4)} V, I=${i.toExponential(3)} A`] })
        Telemetry.log({verb:'measure', object:'rc', result:{t:a.t, Vc:v, I:i}})
        acted = true
      }else if(a.kind==='titr.set'){
        const next = clampTitration({ acidC: a.acidC ?? titr.acidC, acidV: a.acidV ?? titr.acidV, baseC: a.baseC ?? titr.baseC, markEq: titr.markEq })
        setTitr(next); acted = true
      }else if(a.kind==='titr.run'){
        const xs = []; const ys = []
        const maxV = Math.min(200, Math.max(20, vEq*1.6))
        const step = Math.max(0.25, maxV/200)
        for(let v=0; v<=maxV; v+=step){ xs.push(v); ys.push(Titration.pH(v, titr)) }
        setSeries([{ x:xs, y:ys, label:'pH', color:'#22c55e' }])
        if(titr.markEq){ Telemetry.markX(vEq); logConsole({ type:'ok', lines:[`Equivalence at ≈ ${vEq.toFixed(2)} mL, pH ≈ 7`] }) }
        const pass = Titration.sanity(xs, ys, vEq)
        logConsole({ type: pass?'ok':'hint', lines:[pass ? 'Curve passes analytic sanity checks (sigmoidal; jump near pH≈7).' : 'Curve sanity check failed — parameters may be extreme.'] })
        Telemetry.log({verb:'plot', object:'titration', result:{vEq}})
        acted = true
      }else if(a.kind==='titr.mark'){
        setTitr({...titr, markEq:a.on}); acted = true
      }else if(a.kind==='ohm.set'){
        const next = clampOhm({ R: a.R ?? ohm.R, Vmax: a.Vmax ?? ohm.Vmax })
        setOhm(next); acted = true
      }else if(a.kind==='ohm.plot'){
        const s = sampleIV(ohm, 300)
        setSeries([{ x:s.V, y:s.I, label:'I vs V', color:'#f97316' }])
        logConsole({ type:'ok', lines:[`Plotted I–V curve up to ${ohm.Vmax.toFixed(2)} V for R=${formatOhms(ohm.R)}.`] })
        Telemetry.log({verb:'plot', object:'ohm_iv', result:{R:ohm.R,Vmax:ohm.Vmax}})
        acted = true
      }else if(a.kind==='vsepr.select'){
        setShapeId(a.id); acted = true
        logConsole({ type:'ok', lines:[`Selected ${getShape(a.id).title}.`] })
      }else if(a.kind==='vsepr.describe'){
        const sh = getShape(shapeId)
        setSeries([{ x:[0,1], y:[sh.bondAngle, sh.bondAngle], label:`Bond angle ≈ ${sh.bondAngle}°`, color:'#f9fafb' }])
        logConsole({ type:'hint', lines:[`${sh.title}: hybridization ${sh.hybridization}, ideal bond angle ≈ ${sh.bondAngle}°, ${sh.description}`] })
        Telemetry.log({verb:'describe', object:'vsepr', result:{shape:sh.id}})
        acted = true
      }else if(a.kind==='bh.set'){
        const next = clampBlackHole({ mass: a.mass ?? bh.mass, spin: a.spin ?? bh.spin, accretion: a.accretion ?? bh.accretion })
        setBh(next); acted = true
      }else if(a.kind==='bh.plot'){
        const disk = sampleDisk(bh, 200)
        setSeries([{ x:disk.x, y:disk.y, label:'Disk intensity', color:'#f9fafb' }])
        logConsole({ type:'ok', lines:[`Accretion disk profile for ${bh.mass.toFixed(1)} M☉ black hole, spin ${bh.spin.toFixed(2)}.`] })
        Telemetry.log({verb:'plot', object:'blackhole', result:{mass:bh.mass, spin:bh.spin}})
        acted = true
      }else if(a.kind==='reset'){
        setSeries([])
        if(mode==='rc'){ setRC({V:5,R:1000,C:100e-6}) }
        else if(mode==='titr'){ setTitr({acidC:0.1,acidV:50,baseC:0.1,markEq:true}) }
        else if(mode==='ohm'){ setOhm({R:1000,Vmax:10}) }
        else if(mode==='vsepr'){ setShapeId('tetrahedral'); setSeries([]) }
        else if(mode==='bh'){ setBh({mass:5, spin:0.7, accretion:1}); setSeries([]) }
        logConsole({ type:'hint', lines:['Experiment reset to starter values.'] })
        Telemetry.log({verb:'reset', object:mode}); acted=true
      }
    }
    if(!acted){
      handleParseFailure(cleaned, result.recognized, result.issues)
    }
  }

  function onExample(){
    let example = ''
    if(mode==='rc'){
      example = 'Set V = 5 V, R = 1 kΩ, C = 100 µF and plot capacitor voltage for 1 s'
    }else if(mode==='titr'){
      example = 'Run a strong-acid titration and mark the equivalence point'
    }else if(mode==='ohm'){
      example = 'Set resistance to 1 kΩ and max voltage to 10 V, then plot the I-V curve'
    }else if(mode==='vsepr'){
      example = 'Explain tetrahedral hybridization and show the bond angles'
    }else if(mode==='bh'){
      example = 'Simulate a black hole with mass 5 solar masses, spin 0.7, plot the accretion disk profile'
    }
    if(!example) return
    if(cmdRef.current){
      cmdRef.current.value = example
    }
    runCommand(example)
  }

  function exportPlotCSV(){
    if(!series.length || !series[0].x.length) return
    const rows:string[] = ['series,x,y']
    series.forEach(s=>{
      for(let i=0;i<s.x.length;i++){
        rows.push(`${JSON.stringify(s.label)},${s.x[i]},${s.y[i]}`)
      }
    })
    const blob = new Blob([rows.join('\n')], {type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mode}-plot.csv`
    a.click()
    setTimeout(()=> URL.revokeObjectURL(url), 2000)
  }

  function exportPlotPNG(){
    const svg = document.querySelector('[data-plot-root="main-plot"] svg') as SVGSVGElement | null
    if(!svg || !series.length) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>${source}`], { type:'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = ()=>{
      const rect = svg.getBoundingClientRect()
      const canvas = document.createElement('canvas')
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      const ctx = canvas.getContext('2d')
      if(ctx){
        ctx.fillStyle = '#030712'
        ctx.fillRect(0,0,canvas.width,canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const png = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = png
        link.download = `${mode}-plot.png`
        link.click()
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  function onRcInputChange(field:'V'|'R'|'C', value:string){
    setRcInputs(prev => ({ ...prev, [field]: value }))
  }

  function commitRcField(field:'V'|'R'|'C'){
    let V = rc.V, R = rc.R, C = rc.C
    if(field==='V'){
      const parsed = parseVolts(rcInputs.V) ?? parseFloat(rcInputs.V)
      if(Number.isFinite(parsed)) V = parsed
    }else if(field==='R'){
      const parsed = parseOhms(rcInputs.R)
      if(parsed!=null) R = parsed
    }else if(field==='C'){
      const parsed = parseFarads(rcInputs.C)
      if(parsed!=null) C = parsed
    }
    const next = clampRC({V,R,C})
    setRC(next)
  }

  function onTitrInputChange(field:'acidC'|'acidV'|'baseC', value:string){
    setTitrInputs(prev => ({ ...prev, [field]: value }))
  }

  function commitTitrField(field:'acidC'|'acidV'|'baseC'){
    let { acidC, acidV, baseC } = titr
    if(field==='acidC'){
      const parsed = parseMolar(titrInputs.acidC) ?? parseFloat((titrInputs.acidC.match(/([-+]?\\d*\\.?\\d+)/)||[])[1])
      if(Number.isFinite(parsed)) acidC = parsed
    }else if(field==='acidV'){
      const parsed = parseMilliLiters(titrInputs.acidV) ?? parseFloat((titrInputs.acidV.match(/([-+]?\\d*\\.?\\d+)/)||[])[1])
      if(Number.isFinite(parsed)) acidV = parsed
    }else if(field==='baseC'){
      const parsed = parseMolar(titrInputs.baseC) ?? parseFloat((titrInputs.baseC.match(/([-+]?\\d*\\.?\\d+)/)||[])[1])
      if(Number.isFinite(parsed)) baseC = parsed
    }
    const next = clampTitration({acidC, acidV, baseC, markEq: titr.markEq})
    setTitr(next)
  }

  function onOhmInputChange(field:'R'|'Vmax', value:string){
    setOhmInputs(prev => ({ ...prev, [field]: value }))
  }

  function commitOhmField(field:'R'|'Vmax'){
    let { R, Vmax } = ohm
    if(field==='R'){
      const parsed = parseOhms(ohmInputs.R)
      if(parsed!=null) R = parsed
    }else{
      const v = parseFloat((ohmInputs.Vmax.match(/([-+]?\\d*\\.?\\d+)/)||[])[1])
      if(Number.isFinite(v)) Vmax = v
    }
    const next = clampOhm({ R, Vmax })
    setOhm(next)
  }

  function renderParameterPanel(){
    if(mode==='rc'){
      return (
        <div className="space-y-5">
          <div>
            <Label>Voltage (V)</Label>
            <div className="mt-2 space-y-3">
              <Slider value={[rc.V]} min={0} max={12} step={0.1} onValueChange={([value])=> setRC(clampRC({V:value ?? rc.V, R:rc.R, C:rc.C}))} />
              <Input value={rcInputs.V} onChange={e=> onRcInputChange('V', e.target.value)} onBlur={()=> commitRcField('V')} />
            </div>
          </div>
          <div>
            <Label>Resistance (Ω)</Label>
            <div className="mt-2 space-y-3">
              <Slider value={[Math.min(5000, rc.R)]} min={10} max={5000} step={10} onValueChange={([value])=> setRC(clampRC({V:rc.V, R:value ?? rc.R, C:rc.C}))} />
              <Input value={rcInputs.R} onChange={e=> onRcInputChange('R', e.target.value)} onBlur={()=> commitRcField('R')} />
            </div>
          </div>
          <div>
            <Label>Capacitance (F)</Label>
            <Input value={rcInputs.C} onChange={e=> onRcInputChange('C', e.target.value)} onBlur={()=> commitRcField('C')} />
            <ToggleGroup className="mt-3 flex flex-wrap gap-2" type="single">
              <ToggleGroupItem value="micro" onClick={()=> setRC(clampRC({V:rc.V,R:rc.R,C:100e-6}))}>100 µF</ToggleGroupItem>
              <ToggleGroupItem value="nano" onClick={()=> setRC(clampRC({V:rc.V,R:rc.R,C:1e-6}))}>1 µF</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )
    }
    if(mode==='titr'){
      return (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Acid concentration (M)</Label>
              <Input value={titrInputs.acidC} onChange={e=> onTitrInputChange('acidC', e.target.value)} onBlur={()=> commitTitrField('acidC')} />
            </div>
            <div>
              <Label>Acid volume (mL)</Label>
              <Input value={titrInputs.acidV} onChange={e=> onTitrInputChange('acidV', e.target.value)} onBlur={()=> commitTitrField('acidV')} />
            </div>
            <div>
              <Label>Base concentration (M)</Label>
              <Input value={titrInputs.baseC} onChange={e=> onTitrInputChange('baseC', e.target.value)} onBlur={()=> commitTitrField('baseC')} />
            </div>
            <div className="flex flex-col justify-end">
              <Label className="mb-2">Mark equivalence</Label>
              <Switch checked={titr.markEq} onCheckedChange={state=> setTitr(clampTitration({...titr, markEq:state}))} />
            </div>
          </div>
        </div>
      )
    }
    if(mode==='ohm'){
      return (
        <div className="space-y-4">
          <div>
            <Label>Resistance</Label>
            <Input value={ohmInputs.R} onChange={e=> onOhmInputChange('R', e.target.value)} onBlur={()=> commitOhmField('R')} />
          </div>
          <div>
            <Label>Vmax</Label>
            <div className="mt-2 space-y-2">
              <Slider value={[ohm.Vmax]} min={1} max={20} step={0.5} onValueChange={([value])=> setOhm(clampOhm({R:ohm.R, Vmax:value ?? ohm.Vmax}))} />
              <Input value={ohmInputs.Vmax} onChange={e=> onOhmInputChange('Vmax', e.target.value)} onBlur={()=> commitOhmField('Vmax')} />
            </div>
          </div>
        </div>
      )
    }
    if(mode==='vsepr'){
      return (
        <div className="space-y-4">
          <Label>Select geometry</Label>
          <Select value={shapeId} onValueChange={val=> setShapeId(val as VSEPRShapeId)}>
            <SelectTrigger>
              <SelectValue placeholder="Pick shape" />
            </SelectTrigger>
            <SelectContent>
              {listShapes().map(shape=>(
                <SelectItem key={shape.id} value={shape.id}>{shape.title} — {shape.hybridization}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <div>
          <Label>Mass (M☉)</Label>
          <Input type="number" step="0.1" value={bh.mass} onChange={e=> setBh(clampBlackHole({...bh, mass: parseFloat(e.target.value)||bh.mass }))} />
        </div>
        <div>
          <Label>Spin</Label>
          <Slider value={[bh.spin]} min={0} max={0.99} step={0.01} onValueChange={([value])=> setBh(clampBlackHole({...bh, spin: Number((value ?? bh.spin).toFixed(2)) }))} />
        </div>
        <div>
          <Label>Accretion</Label>
          <Slider value={[bh.accretion]} min={0.1} max={3} step={0.1} onValueChange={([value])=> setBh(clampBlackHole({...bh, accretion: Number((value ?? bh.accretion).toFixed(1)) }))} />
        </div>
      </div>
    )
  }

  function clearFilters(){
    setCourseFilters({ categories:new Set(), difficulty:new Set() })
  }

  function handleHistorySelect(cmd:string){
    if(cmdRef.current) cmdRef.current.value = cmd
    runCommand(cmd)
    setHistoryOpen(false)
  }

  return (
    <TooltipProvider>
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-grid-glow opacity-60 blur-3xl" />
        <main className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-8 px-4 py-10 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Badge variant="glow" className="text-[10px]">V-Lab / Quantum cockpit</Badge>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Live</span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Ferrari-grade scientific mission control</h1>
              <p className="mt-2 max-w-2xl text-slate-400">Layered glass panels, tactile sliders, and cinematic telemetry for RC circuits, titrations, quantum geometry, and relativistic discs.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Sheet open={presetOpen} onOpenChange={setPresetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="border border-white/10">
                    <LayersIcon /> Presets
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-md">
                  <SheetHeader>
                    <SheetTitle>Preset hangar</SheetTitle>
                    <SheetDescription>Load curated lab states for any simulation. Applying a preset keeps telemetry intact.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6 overflow-y-auto pr-2 text-left">
                    {(presetLibrary[mode] || []).map(preset=>(
                      <button key={preset.title} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/10" onClick={()=>{
                        preset.action()
                        setPresetOpen(false)
                      }}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{preset.title}</span>
                          <ArrowUpRight className="h-4 w-4 text-orange-400" />
                        </div>
                        <p className="mt-1 text-slate-400">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
              <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="border border-white/10">
                    <BookOpen className="mr-2 h-4 w-4" /> Help & macros
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Command palettes</DialogTitle>
                    <DialogDescription>Use these cinematic prompts as scaffolding. The parser already handles chaining and value extraction.</DialogDescription>
                  </DialogHeader>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {HELPER_EXAMPLES.map(example=>(
                      <div key={example} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                        {example}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="secondary" onClick={()=> Telemetry.download()}>
                <Download className="mr-2 h-4 w-4" /> Export telemetry
              </Button>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[260px,minmax(0,1fr),minmax(360px,0.9fr)]">
            <Card className="h-fit bg-slate-950/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-400" />
                  Experiment modules
                </CardTitle>
                <CardDescription>Select the lab deck to steer.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={mode} onValueChange={value=> switchMode(value as Mode)} orientation="vertical">
                  <TabsList className="flex w-full flex-col gap-2 bg-transparent p-0">
                    {NAV_ITEMS.map(item=>(
                      <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <item.icon className="h-4 w-4 text-blue-400" />
                        <div className="text-left">
                          <div className="font-semibold">{item.label}</div>
                          <div className="text-xs text-slate-400">{item.detail}</div>
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="mt-6 space-y-3 text-sm text-slate-400">
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
                    <span>Active lab</span>
                    <span className="font-semibold text-white">{NAV_ITEMS.find(item=> item.id===mode)?.label}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
                    <span>Console entries</span>
                    <span>{commandHistory.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <motion.div layout className="glass relative overflow-hidden p-6">
                <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
                  {heroVisual}
                  <div className="flex flex-col gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active experiment</p>
                      <h2 className="mt-2 text-2xl font-semibold">{NAV_ITEMS.find(item=> item.id===mode)?.label}</h2>
                      <p className="mt-1 text-sm text-slate-400">{SUGGESTION_BY_MODE[mode]}</p>
                    </div>
                    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                      {heroStats.map(stat=>(
                        <div key={stat.label} className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">{stat.label}</span>
                          <span className="font-semibold text-white">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {heroActions.map(action=>(
                        <Button key={action.label} variant="ghost" onClick={action.action}>{action.label}</Button>
                      ))}
                      <Button variant="outline" onClick={()=> setOverviewOpen(true)}>Cinematic overview</Button>
                    </div>
                    <Button variant="secondary" onClick={onExample}>Run cinematic example</Button>
                  </div>
                </div>
              </motion.div>

              <Card className="bg-slate-950/60">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Plot & Telemetry</CardTitle>
                      <CardDescription>Dark-theme line charts with export controls.</CardDescription>
                    </div>
                    <Tabs value={plotTab} onValueChange={value=> setPlotTab(value as 'chart'|'telemetry')}>
                      <TabsList className="gap-2 bg-white/5 p-1">
                        <TabsTrigger value="chart" className="px-4 py-2">Chart</TabsTrigger>
                        <TabsTrigger value="telemetry" className="px-4 py-2">Telemetry</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent className="mt-4">
                  {plotTab==='chart' ? (
                    <div className="h-[420px]">
                      <Plot
                        series={series}
                        xLabel={plotLabel}
                        vLines={markers}
                        emptyLabel="No plot yet. Run a command or load an example."
                        onEmptyAction={onExample}
                        onExportCsv={exportPlotCSV}
                        onExportPng={exportPlotPNG}
                        plotId="main-plot"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                      <p>Telemetry entries stream into the downloadable log. Latest stats:</p>
                      <ul className="mt-3 space-y-2 text-slate-400">
                        {heroStats.map(stat=>(
                          <li key={stat.label} className="flex items-center justify-between text-sm">
                            <span>{stat.label}</span>
                            <span className="text-white">{stat.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-slate-950/60">
                <CardHeader>
                  <CardTitle>Right control deck</CardTitle>
                  <CardDescription>Adjust lab values with Radix sliders & popovers.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible defaultValue="parameters">
                    <AccordionItem value="parameters">
                      <AccordionTrigger>Parameters</AccordionTrigger>
                      <AccordionContent>{renderParameterPanel()}</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card className="bg-slate-950/60">
                <CardHeader>
                  <CardTitle>Command console</CardTitle>
                  <CardDescription>Color-coded log streaming from mission control.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Console />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
            <div className="glass p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Command line</p>
                  <h3 className="text-2xl font-semibold text-white">Bottom runway</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <History className="mr-2 h-4 w-4" /> History
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <CommandContainer>
                        <CommandInput placeholder="Search commands…" />
                        <CommandList>
                          <CommandEmpty>No history yet.</CommandEmpty>
                          <CommandGroup heading="Recent">
                            {commandHistory.map(cmd=>(
                              <CommandItem key={cmd} onSelect={()=> handleHistorySelect(cmd)}>
                                <CommandIcon className="mr-2 h-3.5 w-3.5" />
                                {cmd}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </CommandContainer>
                    </PopoverContent>
                  </Popover>
                  <Button variant="ghost" size="sm" onClick={()=> runCommand('reset')}>Reset</Button>
                  <Button variant="ghost" size="sm" onClick={()=> Telemetry.download()}>Download log</Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_COMMANDS.map(cmd=>(
                  <Button key={cmd} variant="outline" size="sm" onClick={()=> runCommand(cmd)}>
                    <ChevronRight className="mr-1 h-3 w-3" /> {cmd}
                  </Button>
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <div className="flex-1">
                  <Input ref={cmdRef} placeholder="Type a cinematic command…" onKeyDown={e=>{ if(e.key==='Enter'){ runCommand((e.target as HTMLInputElement).value) } }} />
                </div>
                <div className="flex items-center gap-2">
                  <VoiceButton onText={(t)=> runCommand(t)} />
                  <Button onClick={()=> runCommand(cmdRef.current?.value||'')}>Run command</Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                <Button variant="ghost" size="sm" onClick={onExample}>Examples</Button>
                <span>Hint: {SUGGESTION_BY_MODE[mode]}</span>
              </div>
            </div>

            <AiPanel onCommand={runCommand} context={aiContext} />
          </div>

          <section className="grid gap-6 lg:grid-cols-[280px,1fr]">
            <Card className="bg-slate-950/60">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Refine the cinematic course browser.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                      <span>Category</span>
                      <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
                    </div>
                    <div className="space-y-2">
                      {FILTER_OPTIONS.categories.map(cat=>(
                        <label key={cat} className="flex items-center gap-3 text-sm text-slate-200">
                          <Checkbox checked={courseFilters.categories.has(cat)} onCheckedChange={()=> toggleFilter('categories', cat)} />
                          {cat}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-500">Difficulty</div>
                    <div className="space-y-2">
                      {FILTER_OPTIONS.difficulty.map(level=>(
                        <label key={level} className="flex items-center gap-3 text-sm text-slate-200">
                          <Checkbox checked={courseFilters.difficulty.has(level)} onCheckedChange={()=> toggleFilter('difficulty', level)} />
                          {level}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-950/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Course browser</CardTitle>
                    <CardDescription>Hover for glow-lift, launch cinematic labs.</CardDescription>
                  </div>
                  <Filter className="h-5 w-5 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[420px]">
                  <div className="grid gap-5 md:grid-cols-2 pr-2">
                    {filteredCourses.map(course=>(
                      <motion.div key={course.id} whileHover={{ scale:1.02 }} className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-blue-500/10">
                        <div className="relative h-36 overflow-hidden rounded-2xl">
                          <img src={course.image} alt={course.title} className="h-full w-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <Badge variant="glow" className="absolute left-3 top-3">{course.category}</Badge>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{course.difficulty}</span>
                            <span>{course.duration}</span>
                          </div>
                          <h3 className="mt-1 text-lg font-semibold text-white">{course.title}</h3>
                          <p className="text-sm text-slate-400">{course.description}</p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-blue-200">
                          {course.tags.map(tag=>(
                            <span key={tag} className="rounded-full border border-blue-400/40 px-3 py-1">{tag}</span>
                          ))}
                        </div>
                        <Button className="mt-4 w-full">
                          Launch <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                    {!filteredCourses.length && (
                      <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                        No courses match those filters.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </section>
        </main>
        <Dialog open={overviewOpen} onOpenChange={setOverviewOpen}>
          <DialogContent className="w-[95vw] max-w-5xl bg-slate-950/90">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-3xl text-white">Cinematic overview</DialogTitle>
              <DialogDescription className="text-sm text-slate-400">
                Preview each experiment deck in a larger format. Selecting a card switches the lab instantly.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              {NAV_ITEMS.map(item=>{
                const active = mode===item.id
                return (
                  <button
                    key={item.id}
                    className={`rounded-3xl border px-5 py-6 text-left transition ${active ? 'border-white bg-white text-black shadow-xl' : 'border-white/15 bg-white/5 text-white hover:border-white/40'}`}
                    onClick={()=>{
                      switchMode(item.id)
                      setOverviewOpen(false)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-lg font-semibold">
                        <item.icon className={`h-5 w-5 ${active ? 'text-black' : 'text-orange-400'}`} />
                        {item.label}
                      </div>
                      {active && <Badge variant="glow" className="text-xs uppercase tracking-[0.3em] text-black">Active</Badge>}
                    </div>
                    <p className={`mt-2 text-sm ${active ? 'text-gray-600' : 'text-slate-400'}`}>{item.detail}</p>
                    <p className={`mt-1 text-xs uppercase tracking-[0.3em] ${active ? 'text-gray-500' : 'text-slate-500'}`}>
                      {SUGGESTION_BY_MODE[item.id]}
                    </p>
                  </button>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

function LayersIcon(){
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3L3 9l9 6 9-6-9-6z" />
      <path d="M3 15l9 6 9-6" />
    </svg>
  )
}

function repairCommand(text:string){
  let next = text
  const replacements: Array<[RegExp,string]> = [
    [/curent/gi, 'current'],
    [/volatge/gi, 'voltage'],
    [/sec(onds?)?/gi, 's'],
    [/\buF\b/gi, 'µF'],
    [/\s+/g, ' ']
  ]
  replacements.forEach(([pattern, repl])=>{ next = next.replace(pattern, repl) })
  next = next.trim()
  return next === text.trim() ? null : next
}
