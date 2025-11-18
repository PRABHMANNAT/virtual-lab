import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from 'recharts'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

export type Series = { x:number[]; y:number[]; label:string; color?:string }
type VLine = { x:number; color?:string; label?:string }

type PlotProps = {
  series:Series[]
  xLabel:string
  vLines?:VLine[]
  emptyLabel?:string
  onEmptyAction?:()=>void
  onExportCsv?:()=>void
  onExportPng?:()=>void
  plotId?:string
}

export function Plot({ series, xLabel, vLines, emptyLabel, onEmptyAction, onExportCsv, onExportPng, plotId }:PlotProps){
  const hasData = !!(series?.length && series[0]?.x.length)

  const data = useMemo(()=>{
    if(!series || !series.length) return []
    const rowCount = Math.max(...series.map(s=> s.x.length))
    return Array.from({length:rowCount}).map((_, idx)=>{
      const baseX = series.find(s=> s.x[idx]!=null)?.x[idx] ?? idx
      const row: Record<string, number | null> = { x: Number(baseX?.toFixed(6) ?? idx) }
      series.forEach((s, sIdx)=>{
        row[`s${sIdx}`] = s.y[idx] ?? null
      })
      return row
    })
  }, [series])

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/40 p-4 shadow-inner shadow-black/50 backdrop-blur-2xl" data-plot-root={plotId}>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {series.map((s, idx)=>(
            <Badge key={s.label} variant="glow" className="text-[10px]">
              <span className="mr-2 inline-flex h-2 w-6 rounded-full" style={{background:s.color || '#6be7d9'}} />
              {s.label}
            </Badge>
          ))}
        </div>
        <div className="hidden gap-2 md:flex">
          <Button variant="ghost" size="sm" onClick={onExportCsv}>CSV</Button>
          <Button variant="ghost" size="sm" onClick={onExportPng}>PNG</Button>
        </div>
      </div>
      <div className="relative flex-1">
        {!hasData && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-sm text-slate-400">
            <p>{emptyLabel || 'No plot yet. Run a command to see data.'}</p>
            {onEmptyAction && <Button variant="ghost" size="sm" className="mt-3" onClick={onEmptyAction}>Demo</Button>}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
            <XAxis dataKey="x" tick={{ fill:'#94a3b8', fontSize:12 }} stroke="rgba(148,163,184,0.2)" label={{ value:xLabel, position:'insideBottomRight', offset:-6, fill:'#cbd5f5' }} />
            <YAxis tick={{ fill:'#94a3b8', fontSize:12 }} stroke="rgba(148,163,184,0.2)" />
            <ChartTooltip contentStyle={{ background:'rgba(3,7,18,0.9)', border:'1px solid rgba(148,163,184,0.2)', borderRadius:16 }} labelFormatter={(val)=>`${xLabel} ${val}`} />
            {series.map((s, idx)=>(
              <Line
                key={s.label}
                type="monotone"
                dataKey={`s${idx}`}
                stroke={s.color || '#6be7d9'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            ))}
            {vLines?.map(line=>(
              <ReferenceLine key={line.label || line.x} x={line.x} stroke={line.color || '#c7f284'} strokeDasharray="4 3" label={{ position:'top', fill:line.color || '#c7f284', value:line.label }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-2 md:hidden">
        <Button variant="ghost" size="sm" className="flex-1" onClick={onExportCsv}>CSV</Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={onExportPng}>PNG</Button>
      </div>
    </div>
  )
}
