'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Plus, Trash2, Copy, Download, Save } from 'lucide-react'
import { Indicator, IndicatorType, Strategy } from '@/types'
import { generatePineScript, createStrategyFromForm } from '@/lib/pine-generator'
import { StrategyStorage } from '@/lib/storage'
import { generateId } from '@/lib/utils'

const INDICATOR_TYPES: { value: IndicatorType; label: string }[] = [
  { value: 'sma', label: 'Simple Moving Average (SMA)' },
  { value: 'ema', label: 'Exponential Moving Average (EMA)' },
  { value: 'rsi', label: 'Relative Strength Index (RSI)' },
  { value: 'macd', label: 'MACD' },
  { value: 'bollinger', label: 'Bollinger Bands' },
  { value: 'atr', label: 'Average True Range (ATR)' },
  { value: 'stochastic', label: 'Stochastic' },
  { value: 'adx', label: 'Average Directional Index (ADX)' },
  { value: 'vwap', label: 'VWAP' },
  { value: 'volume', label: 'Volume' },
  { value: 'supertrend', label: 'SuperTrend' },
]

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M']

export default function StrategyBuilder() {
  const [name, setName] = useState('My Strategy')
  const [symbol, setSymbol] = useState('MNQ')
  const [timeframe, setTimeframe] = useState('5m')
  const [description, setDescription] = useState('')
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [stopLoss, setStopLoss] = useState<number | undefined>(undefined)
  const [takeProfit, setTakeProfit] = useState<number | undefined>(undefined)
  const [riskPerTrade, setRiskPerTrade] = useState<number>(10)
  const [pineScript, setPineScript] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const addIndicator = () => {
    const newIndicator: Indicator = {
      id: generateId(),
      type: 'sma',
      parameters: { period: 20 },
    }
    setIndicators([...indicators, newIndicator])
  }

  const removeIndicator = (id: string) => {
    setIndicators(indicators.filter(i => i.id !== id))
  }

  const updateIndicator = (id: string, updates: Partial<Indicator>) => {
    setIndicators(indicators.map(i => 
      i.id === id ? { ...i, ...updates } : i
    ))
  }

  const handleGenerateScript = () => {
    const strategy: Strategy = {
      id: generateId(),
      name,
      symbol,
      timeframe,
      description,
      indicators,
      stopLoss,
      takeProfit,
      riskPerTrade,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const script = generatePineScript(strategy)
    setPineScript(script)
  }

  const handleSaveStrategy = () => {
    const strategy = createStrategyFromForm(
      name,
      symbol,
      timeframe,
      indicators,
      stopLoss,
      takeProfit,
      riskPerTrade,
      description
    )
    StrategyStorage.save(strategy)
    setSavedMessage('Strategy saved successfully!')
    setTimeout(() => setSavedMessage(''), 3000)
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(pineScript)
  }

  const handleDownloadScript = () => {
    const blob = new Blob([pineScript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.toLowerCase().replace(/\s+/g, '-')}.pine`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strategy Configuration */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Strategy Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Strategy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Symbol</label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="MNQ"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Timeframe</label>
              <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                {TIMEFRAMES.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your strategy..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Stop Loss %</label>
              <Input
                type="number"
                value={stopLoss || ''}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || undefined)}
                placeholder="1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Take Profit %</label>
              <Input
                type="number"
                value={takeProfit || ''}
                onChange={(e) => setTakeProfit(parseFloat(e.target.value) || undefined)}
                placeholder="3.0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Risk/Trade %</label>
              <Input
                type="number"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(parseFloat(e.target.value) || 10)}
                placeholder="10"
              />
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Indicators</label>
            <Button variant="outline" size="sm" onClick={addIndicator}>
              <Plus className="w-4 h-4 mr-2" />
              Add Indicator
            </Button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {indicators.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No indicators added. Click "Add Indicator" to configure your strategy.
              </p>
            ) : (
              indicators.map((indicator) => (
                <Card key={indicator.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Select
                        value={indicator.type}
                        onChange={(e) => updateIndicator(indicator.id, { type: e.target.value as IndicatorType })}
                        className="flex-1"
                      >
                        {INDICATOR_TYPES.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIndicator(indicator.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <IndicatorParams
                      type={indicator.type}
                      params={indicator.parameters}
                      onChange={(params) => updateIndicator(indicator.id, { parameters: params })}
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button onClick={handleGenerateScript}>
          Generate Pine Script
        </Button>
        <Button variant="outline" onClick={handleSaveStrategy}>
          <Save className="w-4 h-4 mr-2" />
          Save Strategy
        </Button>
        {savedMessage && (
          <span className="text-sm text-profit">{savedMessage}</span>
        )}
      </div>

      {/* Generated Script */}
      {pineScript && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Pine Script</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyScript}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadScript}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <CardDescription>
              Copy this script and paste it into TradingView Pine Editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
              {pineScript}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Component for indicator-specific parameters
function IndicatorParams({
  type,
  params,
  onChange,
}: {
  type: IndicatorType
  params: Record<string, number | string | boolean>
  onChange: (params: Record<string, number | string | boolean>) => void
}) {
  const handleParamChange = (key: string, value: number | string | boolean) => {
    onChange({ ...params, [key]: value })
  }

  switch (type) {
    case 'sma':
    case 'ema':
    case 'rsi':
    case 'atr':
      return (
        <div>
          <label className="text-xs text-muted-foreground">Period</label>
          <Input
            type="number"
            value={(params.period as number) || 20}
            onChange={(e) => handleParamChange('period', parseInt(e.target.value))}
            className="h-8"
          />
        </div>
      )
    case 'macd':
      return (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Fast</label>
            <Input
              type="number"
              value={(params.fastPeriod as number) || 12}
              onChange={(e) => handleParamChange('fastPeriod', parseInt(e.target.value))}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Slow</label>
            <Input
              type="number"
              value={(params.slowPeriod as number) || 26}
              onChange={(e) => handleParamChange('slowPeriod', parseInt(e.target.value))}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Signal</label>
            <Input
              type="number"
              value={(params.signalPeriod as number) || 9}
              onChange={(e) => handleParamChange('signalPeriod', parseInt(e.target.value))}
              className="h-8"
            />
          </div>
        </div>
      )
    case 'bollinger':
      return (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Period</label>
            <Input
              type="number"
              value={(params.period as number) || 20}
              onChange={(e) => handleParamChange('period', parseInt(e.target.value))}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Std Dev</label>
            <Input
              type="number"
              step="0.5"
              value={(params.stdDev as number) || 2}
              onChange={(e) => handleParamChange('stdDev', parseFloat(e.target.value))}
              className="h-8"
            />
          </div>
        </div>
      )
    case 'stochastic':
      return (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">K Period</label>
            <Input
              type="number"
              value={(params.kPeriod as number) || 14}
              onChange={(e) => handleParamChange('kPeriod', parseInt(e.target.value))}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">D Period</label>
            <Input
              type="number"
              value={(params.dPeriod as number) || 3}
              onChange={(e) => handleParamChange('dPeriod', parseInt(e.target.value))}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Overbought</label>
            <Input
              type="number"
              value={(params.overbought as number) || 80}
              onChange={(e) => handleParamChange('overbought', parseInt(e.target.value))}
              className="h-8"
            />
          </div>
        </div>
      )
    case 'supertrend':
      return (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Factor</label>
            <Input
              type="number"
              step="0.5"
              value={(params.factor as number) || 3}
              onChange={(e) => handleParamChange('factor', parseFloat(e.target.value))}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">ATR Period</label>
            <Input
              type="number"
              value={(params.atrPeriod as number) || 10}
              onChange={(e) => handleParamChange('atrPeriod', parseInt(e.target.value))}
              className="h-8"
            />
          </div>
        </div>
      )
    default:
      return null
  }
}
