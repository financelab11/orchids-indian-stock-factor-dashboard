'use client'
import { useState, useCallback } from 'react'
import { Plus, X, GitCompare, Search } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts'
import { ScoreBadge } from './ScoreBadge'
import { useRouter } from 'next/navigation'

interface FactorScore { factorId: string; factorName: string; score: number }
interface Company { ticker: string; name: string; sector: string; market_cap: number; market_cap_bucket: string }
interface CompareResult { company: Company; factorScores: FactorScore[]; finalScore: number }

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444']

interface Props { year: number }

export function FactorComparison({ year }: Props) {
  const router = useRouter()
  const [tickers, setTickers] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [results, setResults] = useState<CompareResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addTicker() {
    const t = input.trim().toUpperCase()
    if (!t || tickers.includes(t) || tickers.length >= 5) return
    setTickers(prev => [...prev, t])
    setInput('')
    setResults(null)
  }

  function removeTicker(t: string) {
    setTickers(prev => prev.filter(x => x !== t))
    setResults(null)
  }

  const compare = useCallback(async () => {
    if (tickers.length < 2) { setError('Add at least 2 tickers'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers, year }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResults(data.companies)
    } catch {
      setError('Failed to compare')
    } finally {
      setLoading(false)
    }
  }, [tickers, year])

  // Build radar data
  const radarData = results
    ? results[0]?.factorScores.map(fs => {
        const entry: Record<string, string | number> = { factor: fs.factorName }
        results.forEach(r => {
          const match = r.factorScores.find(f => f.factorId === fs.factorId)
          entry[r.company.ticker] = match?.score ?? 0
        })
        return entry
      })
    : []

  // Build bar data (factor-by-factor)
  const barData = results
    ? results[0]?.factorScores.map(fs => {
        const entry: Record<string, string | number> = { factor: fs.factorName }
        results.forEach(r => {
          const match = r.factorScores.find(f => f.factorId === fs.factorId)
          entry[r.company.ticker] = match?.score ?? 0
        })
        return entry
      })
    : []

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <GitCompare className="w-5 h-5" /> Compare Stocks
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Add 2–5 tickers to compare side-by-side factor scores</p>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Enter ticker (e.g. TCS)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTicker() }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={addTicker}
          disabled={tickers.length >= 5}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Ticker chips */}
      {tickers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tickers.map((t, i) => (
            <span
              key={t}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium border"
              style={{ borderColor: COLORS[i], color: COLORS[i], background: `${COLORS[i]}15` }}
            >
              {t}
              <button onClick={() => removeTicker(t)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            onClick={compare}
            disabled={tickers.length < 2 || loading}
            className="px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Comparing…' : 'Compare'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="flex flex-col gap-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {results.map((r, i) => (
              <button
                key={r.company.ticker}
                onClick={() => router.push(`/stocks/${r.company.ticker}?year=${year}`)}
                className="rounded-xl border border-border bg-card p-3 text-left hover:shadow-md transition-all group"
                style={{ borderTopColor: COLORS[i], borderTopWidth: 3 }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm" style={{ color: COLORS[i] }}>{r.company.ticker}</span>
                  <ScoreBadge score={r.finalScore} size="sm" />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.company.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.company.sector}</div>
              </button>
            ))}
          </div>

          {/* Radar */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Factor Profile Comparison</h3>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} outerRadius={90}>
                <PolarGrid stroke="currentColor" className="text-border" />
                <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" />
                {results.map((r, i) => (
                  <Radar
                    key={r.company.ticker}
                    name={r.company.ticker}
                    dataKey={r.company.ticker}
                    stroke={COLORS[i]}
                    fill={COLORS[i]}
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                ))}
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Grouped bar chart */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Side-by-Side Factor Scores</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 0, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border opacity-50" />
                <XAxis dataKey="factor" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                {results.map((r, i) => (
                  <Bar key={r.company.ticker} dataKey={r.company.ticker} fill={COLORS[i]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table comparison */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Factor</th>
                  {results.map((r, i) => (
                    <th key={r.company.ticker} className="text-center px-4 py-2.5 font-medium" style={{ color: COLORS[i] }}>
                      {r.company.ticker}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results[0]?.factorScores.map(fs => (
                  <tr key={fs.factorId} className="border-b border-border/50">
                    <td className="px-4 py-2.5 font-medium text-sm">{fs.factorName}</td>
                    {results.map(r => {
                      const match = r.factorScores.find(f => f.factorId === fs.factorId)
                      return (
                        <td key={r.company.ticker} className="px-4 py-2.5 text-center">
                          <ScoreBadge score={match?.score ?? 0} size="sm" />
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr className="bg-muted/20 font-semibold">
                  <td className="px-4 py-2.5">Final Score</td>
                  {results.map(r => (
                    <td key={r.company.ticker} className="px-4 py-2.5 text-center">
                      <ScoreBadge score={r.finalScore} size="md" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!results && tickers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <GitCompare className="w-10 h-10 mx-auto opacity-30 mb-2" />
          <p className="text-sm">Add tickers above to compare factor scores</p>
          <p className="text-xs mt-1 opacity-70">Try: TCS, INFY, HCLTECH</p>
        </div>
      )}
    </div>
  )
}
