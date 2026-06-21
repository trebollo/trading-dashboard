'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { 
  Plus, Trash2, Copy, Download, Save, Code2, 
  Settings, TrendingUp, Target, Shield, Sparkles,
  Check, ChevronDown
} from 'lucide-react'
import { Indicator, IndicatorType, Strategy, FUTURES_CONTRACTS } from '@/types'
import { generatePineScript } from '@/lib/pine-generator'
import { StrategyStorage } from '@/lib/storage'
import { generateId } from '@/lib/utils'

const INDICATOR_TYPES: { value: IndicatorType; label: string; icon: string }[] = [
  { value: 'sma', label: 'Simple Moving Average', icon: '📈' },
  { value: 'ema', label: 'Exponential Moving Average', icon: '📊' },
  { value: 'rsi', label: 'Relative Strength Index', icon: '🎯' },
  { value: 'macd', label: 'MACD', icon: '〰️' },
  { value: 'bollinger', label: 'Bollinger Bands', icon: '📏' },
  { value: 'atr', label: 'Average True Range', icon: '📊' },
  { value: 'stochastic', label: 'Stochastic', icon: '🎲' },
  { value: 'adx', label: 'Average Directional Index', icon: '🧭' },
  { value: 'vwap', label: 'VWAP', icon: '📉' },
  { value: 'volume', label: 'Volume', icon: '📊' },
  { value: 'supertrend', label: 'SuperTrend', icon: '📈' },
]

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M']

export default function StrategyBuilder() {
  const [name, setName] = useState('My Strategy')
  const [symbol, setSymbol] = useState('MNQ')
  const [timeframe, setTimeframe] = useState('5m')
  const [description, setDescription] = useState('')
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [stopLoss, setStopLoss] = useState<number>(2)
  const [takeProfit, setTakeProfit] = useState<number>(5)
  const [riskPerTrade, setRiskPerTrade] = useState<number>(1)
  const [pineScript, setPineScript] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [showIndicatorSelect, setShowIndicatorSelect] = useState(false)

  const addIndicator = (type: IndicatorType) => {
    const defaultParams: Record<IndicatorType, Record<string, number>> = {
      sma: { period: 20 },
      ema: { period: 20 },
      rsi: { period: 14 },
      macd: { fast: 12, slow: 26, signal: 9 },
      bollinger: { period: 20, stdDev: 2 },
      atr: { period: 14 },
      stochastic: { k: 14, d: 3 },
      adx: { period: 14 },
      vwap: {},
      volume: {},
      supertrend: { period: 10, multiplier: 3 },
    }

    const newIndicator: Indicator = {
      id: generateId(),
      type,
      parameters: defaultParams[type],
    }
    setIndicators([...indicators, newIndicator])
    setShowIndicatorSelect(false)
  }

  const removeIndicator = (id: string) => {
    setIndicators(indicators.filter(i => i.id !== id))
  }

  const updateIndicatorParam = (id: string, param: string, value: number) => {
    setIndicators(indicators.map(i => 
      i.id === id 
        ? { ...i, parameters: { ...i.parameters, [param]: value } }
        : i
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

  const handleCopyScript = async () => {
    await navigator.clipboard.writeText(pineScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadScript = () => {
    const blob = new Blob([pineScript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.toLowerCase().replace(/\s+/g, '-')}.pine`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveStrategy = () => {
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
    StrategyStorage.save(strategy)
    setSavedMessage('Strategy saved!')
    setTimeout(() => setSavedMessage(''), 2000)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <div className="space-y-6">
        {/* Basic Configuration */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover-lift">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Strategy Configuration</CardTitle>
                <CardDescription>Set up your trading strategy parameters</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Strategy Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Strategy"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Symbol</label>
                <Select 
                  value={symbol} 
                  onChange={(e) => setSymbol(e.target.value)}
                  className="bg-background/50"
                >
                  {FUTURES_CONTRACTS.map(c => (
                    <option key={c.symbol} value={c.symbol}>
                      {c.symbol} - {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Timeframe</label>
                <Select 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="bg-background/50"
                >
                  {TIMEFRAMES.map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Risk per Trade (%)</label>
                <Input
                  type="number"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(parseFloat(e.target.value) || 1)}
                  min={0.1}
                  max={100}
                  step={0.1}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your strategy logic..."
                rows={2}
                className="bg-background/50 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover-lift">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Shield className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Risk Management</CardTitle>
                <CardDescription>Stop loss and take profit settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Stop Loss (%)
                </label>
                <Input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Take Profit (%)
                </label>
                <Input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Risk/Reward</label>
                <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/30">
                  <span className="text-sm font-medium">
                    {stopLoss > 0 ? (takeProfit / stopLoss).toFixed(2) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indicators */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Indicators</CardTitle>
                  <CardDescription>Add technical indicators to your strategy</CardDescription>
                </div>
              </div>
              
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowIndicatorSelect(!showIndicatorSelect)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                  <ChevronDown className="w-3 h-3" />
                </Button>
                
                {showIndicatorSelect && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-xl z-50 max-h-80 overflow-auto">
                    {INDICATOR_TYPES.map(ind => (
                      <button
                        key={ind.value}
                        onClick={() => addIndicator(ind.value)}
                        className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-2 text-sm"
                      >
                        <span>{ind.icon}</span>
                        <span>{ind.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {indicators.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No indicators added yet</p>
                <p className="text-xs mt-1">Click "Add" to add technical indicators</p>
              </div>
            ) : (
              <div className="space-y-3">
                {indicators.map((ind, index) => (
                  <div 
                    key={ind.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/30 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {INDICATOR_TYPES.find(t => t.value === ind.type)?.icon}
                      </span>
                      <span className="font-medium text-sm uppercase">{ind.type}</span>
                      <div className="flex gap-2">
                        {Object.entries(ind.parameters).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">{key}:</span>
                            <Input
                              type="number"
                              value={value as number}
                              onChange={(e) => updateIndicatorParam(ind.id, key, parseFloat(e.target.value) || 0)}
                              className="w-14 h-7 text-xs bg-background/50"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIndicator(ind.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleGenerateScript}
            className="flex-1 gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Pine Script
          </Button>
          <Button 
            onClick={handleSaveStrategy}
            variant="outline"
            size="lg"
            className="border-primary/30 hover:bg-primary/5"
          >
            <Save className="w-4 h-4" />
          </Button>
        </div>
        
        {savedMessage && (
          <div className="text-sm text-green-500 text-center animate-fade-in">
            ✓ {savedMessage}
          </div>
        )}
      </div>

      {/* Pine Script Output */}
      <Card className={`border-border/50 bg-card/50 backdrop-blur-sm ${pineScript ? 'hover-lift' : 'opacity-60'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Code2 className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Generated Pine Script</CardTitle>
                <CardDescription>Copy to TradingView Pine Editor</CardDescription>
              </div>
            </div>
            {pineScript && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyScript}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadScript}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pineScript ? (
            <pre className="code-block text-xs leading-relaxed max-h-[600px] overflow-auto">
              {pineScript}
            </pre>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Code2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Configure your strategy</p>
              <p className="text-xs mt-1">Then click "Generate Pine Script"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
