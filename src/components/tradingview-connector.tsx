'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import {
  Wifi, WifiOff, Copy, Check, RefreshCw, Bell,
  ChevronDown, ChevronUp, Zap, Shield, Clock,
  ExternalLink, AlertCircle
} from 'lucide-react'
import {
  getWebhookConfig,
  getConnectionStatus,
  getWebhookEvents,
  generateAlertTemplate,
  generateWebhookPineScript,
  WebhookEvent,
  ConnectionStatus,
} from '@/lib/webhook-handler'
import { BacktestResult } from '@/types'

interface TradingViewConnectorProps {
  onBacktestImported?: (backtest: BacktestResult) => void
}

export default function TradingViewConnector({ onBacktestImported }: TradingViewConnectorProps) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [showSetup, setShowSetup] = useState(true)
  const [showEvents, setShowEvents] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedTemplate, setCopiedTemplate] = useState(false)
  const [copiedPine, setCopiedPine] = useState(false)

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const refreshStatus = () => {
    const connectionStatus = getConnectionStatus()
    setStatus(connectionStatus)
    setEvents(getWebhookEvents())
  }

  const handleCopyUrl = async () => {
    if (!status) return
    await navigator.clipboard.writeText(status.webhookUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const handleCopyTemplate = async () => {
    if (!status) return
    const template = generateAlertTemplate(status.secretToken)
    await navigator.clipboard.writeText(template)
    setCopiedTemplate(true)
    setTimeout(() => setCopiedTemplate(false), 2000)
  }

  const handleCopyPineSetup = async () => {
    const pine = generateWebhookPineScript('My Strategy')
    await navigator.clipboard.writeText(pine)
    setCopiedPine(true)
    setTimeout(() => setCopiedPine(false), 2000)
  }

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (!status) return null

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status.isConnected ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                {status.isConnected ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">TradingView Connection</CardTitle>
                <CardDescription>
                  {status.isConnected
                    ? 'Receiving webhook data from TradingView'
                    : 'Waiting for first webhook signal'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${
                status.isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`} />
              <span className={`text-sm font-medium ${
                status.isConnected ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {status.isConnected ? 'Connected' : 'Awaiting Signal'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Events</span>
              </div>
              <span className="text-lg font-bold">{status.totalEvents}</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Last Signal</span>
              </div>
              <span className="text-sm font-medium">
                {status.lastReceived ? formatTimeAgo(status.lastReceived) : 'Never'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Auth</span>
              </div>
              <span className="text-sm font-medium text-green-500">Secured</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Guide */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowSetup(!showSetup)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Automated Setup</CardTitle>
                <CardDescription>Configure TradingView webhooks in 3 steps</CardDescription>
              </div>
            </div>
            {showSetup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </CardHeader>

        {showSetup && (
          <CardContent className="space-y-6">
            {/* Step 1: Webhook URL */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
                <h4 className="font-medium">Webhook URL</h4>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Copy this URL and paste it in TradingView&apos;s alert webhook field.
              </p>
              <div className="ml-8 flex gap-2">
                <div className="flex-1 p-3 rounded-lg bg-muted/50 font-mono text-xs break-all border border-border/30">
                  {status.webhookUrl}
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyUrl} className="flex-shrink-0">
                  {copiedUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Step 2: Alert Message Template */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
                <h4 className="font-medium">Alert Message Template</h4>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Copy this JSON template and paste it in TradingView&apos;s alert message field.
              </p>
              <div className="ml-8">
                <pre className="p-3 rounded-lg bg-muted/50 font-mono text-xs overflow-x-auto border border-border/30 max-h-[200px] overflow-y-auto">
                  {generateAlertTemplate(status.secretToken)}
                </pre>
                <Button variant="outline" size="sm" onClick={handleCopyTemplate} className="mt-2 gap-2">
                  {copiedTemplate ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Template
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Step 3: Create Alert in TradingView */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">3</span>
                <h4 className="font-medium">Create Alert in TradingView</h4>
              </div>
              <div className="ml-8 space-y-2">
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                  <li>Open your strategy chart in TradingView</li>
                  <li>Right-click on the strategy &rarr; &quot;Add Alert...&quot;</li>
                  <li>Under &quot;Condition&quot;, select your strategy</li>
                  <li>Choose &quot;Order fills only&quot; for the trigger</li>
                  <li>Check &quot;Webhook URL&quot; and paste the URL from Step 1</li>
                  <li>In the &quot;Message&quot; field, paste the template from Step 2</li>
                  <li>Click &quot;Create&quot; - alerts will now auto-send to your dashboard</li>
                </ol>
                <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-500">
                      Webhooks require TradingView Pro, Pro+, or Premium plan. 
                      Alerts will automatically fire whenever your strategy generates a trade signal.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pine Script Setup Helper */}
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Pine Script Integration Notes</h4>
                <Button variant="outline" size="sm" onClick={handleCopyPineSetup} className="gap-2">
                  {copiedPine ? (
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
              </div>
              <pre className="p-3 rounded-lg bg-muted/50 font-mono text-xs overflow-x-auto border border-border/30 max-h-[150px] overflow-y-auto">
                {generateWebhookPineScript('My Strategy')}
              </pre>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Recent Events */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowEvents(!showEvents)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Bell className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Recent Webhook Events</CardTitle>
                <CardDescription>
                  {events.length > 0 ? `${events.length} events received` : 'No events yet'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); refreshStatus() }}>
                <RefreshCw className="w-3 h-3" />
              </Button>
              {showEvents ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </CardHeader>

        {showEvents && (
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No webhook events received yet</p>
                <p className="text-xs mt-1">Events will appear here when TradingView sends alerts</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {events.slice(0, 20).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        event.payload.action === 'buy' || event.payload.action === 'long'
                          ? 'bg-green-500'
                          : event.payload.action === 'sell' || event.payload.action === 'short'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">
                          {event.payload.action.toUpperCase()} {event.payload.symbol}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.payload.strategy} @ ${event.payload.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {event.payload.pnl !== undefined && (
                        <p className={`text-sm font-medium ${event.payload.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {event.payload.pnl >= 0 ? '+' : ''}${event.payload.pnl.toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(event.receivedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
