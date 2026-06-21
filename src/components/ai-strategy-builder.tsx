'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Textarea } from './ui/textarea'
import {
  Send, Bot, User, Sparkles, Copy, Download, Check,
  Code2, Brain, Zap, RefreshCw
} from 'lucide-react'
import { AgentMessage, processAgentPrompt, getAgentGreeting } from '@/lib/ai-strategy-agent'

export default function AIStrategyBuilder() {
  const [messages, setMessages] = useState<AgentMessage[]>([getAgentGreeting()])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPineScript, setCurrentPineScript] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
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

    // Simulate thinking delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))

    const agentResponse = processAgentPrompt(userMessage.content, messages)
    setMessages(prev => [...prev, agentResponse])

    if (agentResponse.pineScript) {
      setCurrentPineScript(agentResponse.pineScript)
    }

    setIsProcessing(false)
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
    setMessages([getAgentGreeting()])
    setCurrentPineScript(null)
    setInput('')
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Chat Interface */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm flex flex-col h-[700px]">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Brain className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Strategy Agent</CardTitle>
                <CardDescription>Describe your strategy in natural language</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
              <RefreshCw className="w-3 h-3" />
              Reset
            </Button>
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
                  <Zap className="w-4 h-4 text-purple-500 animate-pulse" />
                  <span className="text-sm text-muted-foreground">Analyzing strategy...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="p-4 border-t border-border/30">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your trading strategy..."
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
      <Card className={`border-border/50 bg-card/50 backdrop-blur-sm flex flex-col h-[700px] ${
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
                <CardDescription>Auto-generated from AI analysis</CardDescription>
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
              <Sparkles className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Describe your strategy to the AI agent</p>
              <p className="text-xs mt-1">Pine Script will be generated automatically</p>
            </div>
          )}
        </CardContent>
      </Card>
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
