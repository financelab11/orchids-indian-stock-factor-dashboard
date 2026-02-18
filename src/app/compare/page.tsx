'use client'
import { useState, useEffect } from 'react'
import { FactorComparison } from '@/components/dashboard/FactorComparison'
import { YearSelector } from '@/components/dashboard/YearSelector'

export default function ComparePage() {
  const [year, setYear] = useState(2024)
  const [availableYears, setAvailableYears] = useState<number[]>([2020, 2021, 2022, 2023, 2024])

  useEffect(() => {
    fetch('/api/years').then(r => r.json()).then(d => {
      if (d.years?.length) {
        setAvailableYears(d.years)
        setYear(d.years[d.years.length - 1])
      }
    })
  }, [])

  return (
    <div className="px-4 md:px-6 py-6 flex flex-col gap-4">
      <YearSelector year={year} availableYears={availableYears} onChange={setYear} />
      <FactorComparison year={year} />
    </div>
  )
}
