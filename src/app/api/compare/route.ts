import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { tickers, year } = body as { tickers: string[]; year?: number }

  if (!tickers || tickers.length < 2 || tickers.length > 5) {
    return NextResponse.json({ error: 'Provide 2–5 tickers' }, { status: 400 })
  }

  // Resolve year
  let yearId: number
  let yearValue: number
  if (year) {
    const { data } = await supabase.from('years').select('id, year').eq('year', year).single()
    if (!data) return NextResponse.json({ error: 'Year not found' }, { status: 404 })
    yearId = data.id
    yearValue = data.year
  } else {
    const { data } = await supabase.from('years').select('id, year').order('year', { ascending: false }).limit(1).single()
    yearId = data!.id
    yearValue = data!.year
  }

  const { data: factors } = await supabase
    .from('factors')
    .select('id, name, weight, display_order')
    .order('display_order')

  const results = []
  for (const ticker of tickers) {
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .single()

    if (!company) continue

    const { data: factorScores } = await supabase
      .from('factor_scores')
      .select('factor_id, score')
      .eq('company_id', company.id)
      .eq('year_id', yearId)

    const { data: finalScore } = await supabase
      .from('final_scores')
      .select('final_score')
      .eq('company_id', company.id)
      .eq('year_id', yearId)
      .single()

    const fsMap: Record<string, number> = {}
    factorScores?.forEach((fs: { factor_id: string; score: number }) => {
      fsMap[fs.factor_id] = fs.score
    })

    results.push({
      company,
      factorScores: factors?.map((f: { id: string; name: string; weight: number; display_order: number }) => ({
        factorId: f.id,
        factorName: f.name,
        score: fsMap[f.id] ?? 0,
      })) ?? [],
      finalScore: finalScore?.final_score ?? 0,
    })
  }

  return NextResponse.json({ year: yearValue, companies: results, factors })
}
