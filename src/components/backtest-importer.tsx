'use client'

import { useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { BacktestResult } from '@/types'
import { importTradingViewCSV, validateCSV } from '@/lib/tv-importer'
import { BacktestStorage } from '@/lib/storage'

interface BacktestImporterProps {
  onBacktestImported?: (backtest: BacktestResult) => void
}

export default function BacktestImporter({ onBacktestImported }: BacktestImporterProps) {
  const [strategyName, setStrategyName] = useState('')
  const [initialCapital, setInitialCapital] = useState(10000)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setSuccess(null)
      
      // Preview first few lines
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const lines = content.split('\n').slice(0, 5)
        setPreview(lines.join('\n'))
      }
      reader.readAsText(selectedFile)
    }
  }, [])

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import')
      return
    }

    if (!strategyName.trim()) {
      setError('Please enter a strategy name')
      return
    }

    setImporting(true)
    setError(null)
    setSuccess(null)

    try {
      const content = await file.text()
      
      // Validate CSV
      const validation = validateCSV(content)
      if (!validation.valid) {
        setError(`Invalid CSV: ${validation.errors.join(', ')}`)
        setImporting(false)
        return
      }

      // Import the CSV
      const backtest = importTradingViewCSV(content, strategyName, initialCapital)
      
      if (!backtest) {
        setError('Failed to parse CSV file. Please check the format.')
        setImporting(false)
        return
      }

      // Save to storage
      BacktestStorage.save(backtest)
      
      // Call the callback if provided
      onBacktestImported?.(backtest)
      
      setSuccess(`Successfully imported ${backtest.trades.length} trades for "${strategyName}"`)
      setFile(null)
      setPreview(null)
      setStrategyName('')
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Strategy Name</label>
            <Input
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              placeholder="My Strategy Backtest"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Initial Capital ($)</label>
            <Input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 10000)}
              placeholder="10000"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">TradingView CSV File</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : 'Click to upload CSV file'}
                </span>
              </label>
            </div>
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? 'Importing...' : 'Import Backtest'}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">File Preview</h3>
            {preview ? (
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto h-[200px] overflow-y-auto">
                {preview}
              </pre>
            ) : (
              <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground h-[200px] flex items-center justify-center">
                No file selected
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-loss/10 text-loss rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 p-3 bg-profit/10 text-profit rounded-lg">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{success}</span>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Import Instructions</CardTitle>
          <CardDescription>
            How to export and import your TradingView backtest results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Run your strategy backtest in TradingView</li>
            <li>Click on the "Strategy Tester" panel</li>
            <li>Click the "List of Trades" tab at the bottom</li>
            <li>Click "Export" button (or right-click and "Save as CSV")</li>
            <li>Upload the downloaded CSV file here</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
