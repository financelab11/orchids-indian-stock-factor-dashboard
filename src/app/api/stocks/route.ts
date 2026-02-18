import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const yearParam = searchParams.get('year')
  const search = searchParams.get('search') || ''
  const sector = searchParams.get('sector') || ''
  const marketCapBucket = searchParams.get('market_cap_bucket') || ''
  const sortBy = searchParams.get('sort_by') || 'final_score'
  const sortOrder = searchParams.get('sort_order') || 'desc'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('page_size') || '50')
  const offset = (page - 1) * pageSize

  // Resolve year_id
  let yearId: number | null = null
  if (yearParam) {
    const { data: yearData } = await supabase
      .from('years')
      .select('id')
      .eq('year', parseInt(yearParam))
      .single()
    yearId = yearData?.id ?? null
  } else {
    // Latest year
    const { data: yearData } = await supabase
      .from('years')
      .select('id, year')
      .order('year', { ascending: false })
      .limit(1)
      .single()
    yearId = yearData?.id ?? null
  }

  if (!yearId) {
    return NextResponse.json({ error: 'Year not found' }, { status: 404 })
  }

  // Build companies query
  let companiesQuery = supabase
    .from('companies')
    .select('*', { count: 'exact' })

  if (search) {
    companiesQuery = companiesQuery.or(`ticker.ilike.%${search}%,name.ilike.%${search}%`)
  }
  if (sector) {
    companiesQuery = companiesQuery.eq('sector', sector)
  }
  if (marketCapBucket) {
    companiesQuery = companiesQuery.eq('market_cap_bucket', marketCapBucket)
  }

  const { data: companies, count } = await companiesQuery

  if (!companies || companies.length === 0) {
    return NextResponse.json({ stocks: [], total: 0 })
  }

  const companyIds = companies.map((c: { id: string }) => c.id)

  // Fetch factor scores for all these companies in this year
  const { data: factorScores } = await supabase
    .from('factor_scores')
    .select('company_id, factor_id, score, factors(name)')
    .in('company_id', companyIds)
    .eq('year_id', yearId)

  // Fetch final scores
  const { data: finalScores } = await supabase
    .from('final_scores')
    .select('company_id, final_score')
    .in('company_id', companyIds)
    .eq('year_id', yearId)

  // Build response map
  const factorScoreMap: Record<string, Record<string, number>> = {}
  const finalScoreMap: Record<string, number> = {}

    factorScores?.forEach((fs: { company_id: string; factor_id: string; score: number; factors: { name: string }[] | { name: string } | null }) => {
      if (!factorScoreMap[fs.company_id]) factorScoreMap[fs.company_id] = {}
      const factorsData = fs.factors
      const factorName = Array.isArray(factorsData) ? factorsData[0]?.name : (factorsData as { name: string } | null)?.name || fs.factor_id
      factorScoreMap[fs.company_id][factorName || fs.factor_id] = fs.score
    })

  finalScores?.forEach((fs: { company_id: string; final_score: number }) => {
    finalScoreMap[fs.company_id] = fs.final_score
  })

  let stocks = companies.map((company: {
    id: string
    ticker: string
    name: string
    sector: string
    industry: string
    market_cap: number
    market_cap_bucket: string
  }) => ({
    company,
    factorScores: factorScoreMap[company.id] || {},
    finalScore: finalScoreMap[company.id] ?? 0,
  }))

  // Sort
  stocks.sort((a: { factorScores: Record<string, number>; finalScore: number }, b: { factorScores: Record<string, number>; finalScore: number }) => {
    let aVal: number, bVal: number
    if (sortBy === 'final_score') {
      aVal = a.finalScore
      bVal = b.finalScore
    } else {
      aVal = a.factorScores[sortBy] ?? 0
      bVal = b.factorScores[sortBy] ?? 0
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  // Paginate
  const paginated = stocks.slice(offset, offset + pageSize)

  return NextResponse.json({ stocks: paginated, total: count ?? companies.length })
}
