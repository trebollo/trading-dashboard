'use client'

import { TrendingUp, Download, Moon, Sun, Github } from 'lucide-react'
import { Button } from './ui/button'
import { useState, useEffect } from 'react'

export function Header() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-500 shadow-lg shadow-primary/20">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-gradient">Trebollo</span>
              <span className="text-muted-foreground font-normal ml-1">Trading</span>
            </h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-wider uppercase">
              Strategy Dashboard
            </p>
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
            className="gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
