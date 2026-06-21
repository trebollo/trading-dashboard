'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Textarea } from './ui/textarea'
import {
  Send, Bot, User, Sparkles, Copy, Download, Check,
  Code2, Brain, Zap, RefreshCw, AlertCircle, Settings, ExternalLink
} from 'lucide-react'

interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
  pineScript?: string
}

interface APIResponse {
  success: boolean
  data?: {
    analysis: string
    strategyName: string
    description: string
    indicators: string[]
    entryRules: string[]
    exitRules: string[]
    riskManagement: {
      stopLoss?: string
      takeProfit?: string
      positionSizing?: string
    }
    suggestions: string[]
    pineScript: string
  }
  error?: string
}

function getGreetingMessage(): AgentMessage {
  return {
    id: 'greeting',
    role: 'agent',
    content: `**AI Strategy Builder** - Powered by Claude\n\nDescribe the trading strategy you want to build in natural language. I use advanced AI to analyze your requirements and generate production-ready PineScript v5 code.\n\n**What I can do:**\n- Design complex multi-indicator strategies\n- Optimize entry/exit conditions\n- Configure risk management (stop loss, take profit, position sizing)\n- Support any symbol (MNQ, MES, NQ, ES, crypto, forex)\n- Generate complete, ready-to-use PineScript code\n\n**Examples:**\n- "Build a momentum scalping strategy for MNQ using EMA 9/21 crossover with RSI filter and ATR-based stop loss"\n- "I want a mean reversion strategy with Bollinger Bands on ES 15min that only trades during high volume"\n- "Create a trend following strategy using SuperTrend and ADX for NQ 1hour with 2:1 risk reward"\n\nDescribe your strategy and I will analyze, build, and optimize it for you.`,
    timestamp: new Date().toISOString(),
  }
}

export default function AIStrategyBuilder() {
  const [messages, setMessages] = useState<AgentMessage[]>([getGreetingMessage()])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPineScript, setCurrentPineScript] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)
    setApiError(null)

    try {
      const response = await fetch('/api/ai/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage.content,
          conversationHistory: messages.filter(m => m.id !== 'greeting'),
        }),
      })

      const result: APIResponse = await response.json()

      if (!response.ok) {
        if (result.error === 'API_KEY_NOT_CONFIGURED') {
          setShowConfig(true)
          const errorMessage: AgentMessage = {
            id: `error-${Date.now()}`,
            role: 'agent',
            content: '**Configuration Required**\n\nThe Anthropic API key is not configured. Please set the `ANTHROPIC_API_KEY` environment variable in your Vercel project settings to enable AI strategy generation.\n\nClick the configuration icon above for setup instructions.',
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, errorMessage])
        } else {
          const errorMessage: AgentMessage = {
            id: `error-${Date.now()}`,
            role: 'agent',
            content: `**Error**\n\n${result.error || 'An unexpected error occurred. Please try again.'}\n\nIf the problem persists, check your API key configuration.`,
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, errorMessage])
          setApiError(result.error || 'Unknown error')
        }
        return
      }

      if (result.success && result.data) {
        const { data } = result

        // Build formatted response
        let responseContent = ''

        if (data.analysis) {
          responseContent += `${data.analysis}\n\n`
        }

        if (data.strategyName) {
          responseContent += `**Strategy: ${data.strategyName}**\n`
        }

        if (data.description) {
          responseContent += `${data.description}\n\n`
        }

        if (data.indicators && data.indicators.length > 0) {
          responseContent += `**Indicators:**\n`
          data.indicators.forEach(ind => {
            responseContent += `- ${ind}\n`
          })
          responseContent += '\n'
        }

        if (data.entryRules && data.entryRules.length > 0) {
          responseContent += `**Entry Rules:**\n`
          data.entryRules.forEach(rule => {
            responseContent += `- ${rule}\n`
          })
          responseContent += '\n'
        }

        if (data.exitRules && data.exitRules.length > 0) {
          responseContent += `**Exit Rules:**\n`
          data.exitRules.forEach(rule => {
            responseContent += `- ${rule}\n`
          })
          responseContent += '\n'
        }

        if (data.riskManagement) {
          const rm = data.riskManagement
          if (rm.stopLoss || rm.takeProfit || rm.positionSizing) {
            responseContent += `**Risk Management:**\n`
            if (rm.stopLoss) responseContent += `- Stop Loss: ${rm.stopLoss}\n`
            if (rm.takeProfit) responseContent += `- Take Profit: ${rm.takeProfit}\n`
            if (rm.positionSizing) responseContent += `- Position Sizing: ${rm.positionSizing}\n`
            responseContent += '\n'
          }
        }

        if (data.suggestions && data.suggestions.length > 0) {
          responseContent += `**Suggestions for Improvement:**\n`
          data.suggestions.forEach(sug => {
            responseContent += `- ${sug}\n`
          })
          responseContent += '\n'
        }

        if (data.pineScript) {
          responseContent += `The Pine Script code has been generated and is ready to copy to TradingView.`
        }

        const agentMessage: AgentMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: responseContent,
          timestamp: new Date().toISOString(),
          pineScript: data.pineScript || undefined,
        }

        setMessages(prev => [...prev, agentMessage])

        if (data.pineScript) {
          setCurrentPineScript(data.pineScript)
        }
      }
    } catch (error) {
      console.error('AI Strategy Builder error:', error)
      const errorMessage: AgentMessage = {
        id: `error-${Date.now()}`,
        role: 'agent',
        content: '**Connection Error**\n\nCould not connect to the AI service. Please check your internet connection and try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
      setApiError('Connection failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopyScript = async () => {
    if (!currentPineScript) return
    await navigator.clipboard.writeText(currentPineScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadScript = () => {
    if (!currentPineScript) return
    const blob = new Blob([currentPineScript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-strategy.pine'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setMessages([getGreetingMessage()])
    setCurrentPineScript(null)
    setInput('')
    setApiError(null)
    setShowConfig(false)
  }

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      {showConfig && (
        <Card className="border-yellow-500/30 bg-yellow-500/5 backdrop-blur-sm animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-500 mb-2">API Configuration Required</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  To enable AI strategy generation, add your Anthropic API key to your environment variables:
                </p>
                <div className="bg-background/80 rounded-lg p-3 font-mono text-xs mb-3 border border-border/50">
                  <p className="text-muted-foreground"># In your Vercel project settings or .env.local file:</p>
                  <p className="text-foreground mt-1">ANTHROPIC_API_KEY=sk-ant-api03-your-key-here</p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Get an API key <ExternalLink className="w-3 h-3" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfig(false)}
                    className="text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chat Interface */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm flex flex-col h-[700px]">
          <CardHeader className="pb-3 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Brain className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Strategy Agent</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Powered by Claude
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConfig(!showConfig)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="API Configuration"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-fade-in ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'agent' && (
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-500" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                    message.role === 'user'
                      ? 'bg-primary/20 text-foreground ml-auto'
                      : 'bg-muted/50 text-foreground'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {formatMessageContent(message.content)}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-500" />
                </div>
                <div className="bg-muted/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">Analyzing and generating strategy...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          <div className="p-4 border-t border-border/30">
            {apiError && (
              <div className="flex items-center gap-2 text-xs text-destructive mb-2 px-1">
                <AlertCircle className="w-3 h-3" />
                <span>Last request failed. Try again or check configuration.</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your trading strategy in natural language..."
                className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-background/50"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="self-end gradient-primary text-primary-foreground"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>

        {/* Pine Script Output */}
        <Card className={`border-border/50 bg-card/50 backdrop-blur-sm flex flex-col h-[700px] transition-all duration-300 ${
          currentPineScript ? 'hover-lift' : 'opacity-60'
        }`}>
          <CardHeader className="pb-3 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Code2 className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Generated Pine Script</CardTitle>
                  <CardDescription>Ready for TradingView</CardDescription>
                </div>
              </div>
              {currentPineScript && (
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
          <CardContent className="flex-1 overflow-hidden p-4">
            {currentPineScript ? (
              <pre className="code-block text-xs leading-relaxed h-full overflow-auto">
                {currentPineScript}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <div className="relative">
                  <Sparkles className="w-16 h-16 mb-4 opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 animate-ping" />
                  </div>
                </div>
                <p className="text-sm font-medium">Waiting for your strategy...</p>
                <p className="text-xs mt-1 text-center max-w-[250px]">
                  Describe your trading idea and AI will generate professional PineScript v5 code
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Simple markdown-like formatting for agent messages
 */
function formatMessageContent(content: string): React.ReactNode {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <strong key={i} className="block font-semibold text-foreground mt-2 mb-1">
          {line.replace(/\*\*/g, '')}
        </strong>
      )
    } else if (line.startsWith('- ')) {
      elements.push(
        <span key={i} className="block pl-3 text-muted-foreground">
          {line}
        </span>
      )
    } else if (line === '') {
      elements.push(<br key={i} />)
    } else {
      // Handle inline bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g)
      elements.push(
        <span key={i} className="block">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="font-semibold text-foreground">{part.replace(/\*\*/g, '')}</strong>
            }
            return part
          })}
        </span>
      )
    }
  })

  return <>{elements}</>
}
