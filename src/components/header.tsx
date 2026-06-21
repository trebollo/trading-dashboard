'use client'

import { TrendingUp, Download, Github, Zap } from 'lucide-react'
import { Button } from './ui/button'
import { useState, useEffect } from 'react'

export function Header() {
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleExportData = () => {
    const data = {
      strategies: JSON.parse(localStorage.getItem('trading_strategies') || '[]'),
      backtests: JSON.parse(localStorage.getItem('trading_backtests') || '[]')
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trebollo-trading-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
      scrolled
        ? 'border-border/60 bg-background/90 backdrop-blur-xl shadow-lg shadow-background/20'
        : 'border-border/20 bg-background/60 backdrop-blur-md'
    }`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-blue-600/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/25">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-1.5">
              <span className="text-gradient">Trebollo</span>
              <span className="text-muted-foreground font-normal">Trading</span>
            </h1>
            <div className="flex items-center gap-1.5 -mt-0.5">
              <Zap className="w-2.5 h-2.5 text-yellow-500" />
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                AI-Powered Strategy Lab
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => window.open('https://github.com/trebollo/trading-dashboard', '_blank')}
          >
            <Github className="h-4 w-4" />
            <span className="hidden md:inline">GitHub</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
