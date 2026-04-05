'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'

interface ExportButtonProps {
  data?: any
  filename?: string
  onExport?: (format: string) => void
}

export default function ExportButton({ data, filename = 'report', onExport }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format: string) => {
    setExporting(true)
    
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (onExport) {
      onExport(format)
    } else {
      // Default export behavior
      console.log(`Exporting ${filename} as ${format}`)
      
      if (format === 'csv' && data) {
        // Simple CSV export
        const headers = Object.keys(data[0] || {}).join(',')
        const rows = data.map((row: any) => Object.values(row).join(',')).join('\n')
        const csv = `${headers}\n${rows}`
        
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    }
    
    setExporting(false)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <Download className="h-4 w-4" />
        Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              )}
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 text-red-400" />
              )}
              Export as PDF
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 text-blue-400" />
              )}
              Export as JSON
            </button>
          </div>
        </>
      )}
    </div>
  )
}
