'use client'
import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react'

export function UploadPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ message: string; inserted: number; errors: number } | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file) return
    setUploading(true); setError(''); setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
      setFile(null)
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const sampleCsvContent = `Ticker,Name,Sector,Industry,MarketCap,MarketCapBucket,Year,Quality,Value,Growth,Momentum,Profitability,FinalScore
TCS,Tata Consultancy Services,Technology,IT Services,1350000000000,Large Cap,2025,82,64,71,78,85,76
INFY,Infosys Ltd,Technology,IT Services,620000000000,Large Cap,2025,79,68,69,74,82,74`

  function downloadSample() {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_factor_scores.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5" /> Upload Excel / CSV Data
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your factor scores spreadsheet to update the database. Supports .xlsx and .csv files.
        </p>
      </div>

      {/* Format guide */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold mb-2">Required Columns</h3>
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          {['Ticker', 'Name', 'Sector', 'Industry', 'MarketCap', 'MarketCapBucket', 'Year', 'Quality', 'Value', 'Growth', 'Momentum', 'Profitability', 'FinalScore'].map(col => (
            <span key={col} className="font-mono bg-muted px-1.5 py-0.5 rounded">{col}</span>
          ))}
        </div>
        <button
          onClick={downloadSample}
          className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Download className="w-3.5 h-3.5" /> Download sample template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const dropped = e.dataTransfer.files[0]
          if (dropped) setFile(dropped)
        }}
        className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/20 cursor-pointer transition-colors"
      >
        <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
        {file ? (
          <div className="text-center">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium">Drop file here or click to browse</p>
            <p className="text-xs text-muted-foreground">.xlsx or .csv files</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv,.xls"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors"
      >
        {uploading ? 'Processing…' : 'Upload & Import'}
      </button>

      {result && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">{result.message}</p>
            <p className="text-xs mt-0.5">{result.inserted} rows imported · {result.errors} errors</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
