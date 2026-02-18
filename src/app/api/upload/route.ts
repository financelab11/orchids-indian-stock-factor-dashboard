import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import * as XLSX from 'xlsx'

/**
 * Excel Upload ETL
 * Expected sheet format: "FactorScores"
 * Columns: Ticker, Name, Sector, Industry, MarketCap, MarketCapBucket, Year,
 *          Quality, Value, Growth, Momentum, Profitability, FinalScore
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Empty sheet' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Upsert years
    const uniqueYears = [...new Set(rows.map((r) => Number(r.Year || r.year)).filter(Boolean))]
    for (const year of uniqueYears) {
      await supabase.from('years').upsert({ year }, { onConflict: 'year' })
    }

    // Get year id map
    const { data: yearRows } = await supabase.from('years').select('id, year')
    const yearMap: Record<number, number> = {}
    yearRows?.forEach((y: { id: number; year: number }) => { yearMap[y.year] = y.id })

    // Get factor map
    const { data: factorRows } = await supabase.from('factors').select('id, name')
    const factorMap: Record<string, string> = {}
    factorRows?.forEach((f: { id: string; name: string }) => { factorMap[f.name.toLowerCase()] = f.id })

    let inserted = 0
    let errors = 0

    for (const row of rows) {
      const ticker = String(row.Ticker || row.ticker || '').trim().toUpperCase()
      const name = String(row.Name || row.name || ticker)
      const sector = String(row.Sector || row.sector || 'Unknown')
      const industry = String(row.Industry || row.industry || 'Unknown')
      const marketCap = Number(row.MarketCap || row.market_cap || 0)
      const marketCapBucket = String(row.MarketCapBucket || row.market_cap_bucket || 'Unknown')
      const year = Number(row.Year || row.year)
      const finalScore = Number(row.FinalScore || row.final_score || 0)

      if (!ticker || !year) continue

      // Upsert company
      const { data: company, error: compErr } = await supabase
        .from('companies')
        .upsert({ ticker, name, sector, industry, market_cap: marketCap, market_cap_bucket: marketCapBucket }, { onConflict: 'ticker' })
        .select('id')
        .single()

      if (compErr || !company) { errors++; continue }

      const yearId = yearMap[year]
      if (!yearId) { errors++; continue }

      // Upsert final score
      await supabase.from('final_scores').upsert(
        { company_id: company.id, year_id: yearId, final_score: finalScore },
        { onConflict: 'company_id,year_id' }
      )

      // Upsert factor scores
      const factorColumns = ['Quality', 'Value', 'Growth', 'Momentum', 'Profitability']
      for (const col of factorColumns) {
        const score = Number(row[col] || 0)
        const factorId = factorMap[col.toLowerCase()]
        if (factorId) {
          await supabase.from('factor_scores').upsert(
            { company_id: company.id, factor_id: factorId, year_id: yearId, score },
            { onConflict: 'company_id,factor_id,year_id' }
          )
        }
      }
      inserted++
    }

    return NextResponse.json({ message: `Processed ${inserted} rows, ${errors} errors`, inserted, errors })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
  }
}
