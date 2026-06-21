'use client'

import { useState, useEffect } from 'react'
import {
  Home,
  Brain,
  LayoutGrid,
  Wifi,
  Upload,
  BarChart3,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Database,
  LineChart,
} from 'lucide-react'

export type NavSection =
  | 'home'
  | 'ai-builder'
  | 'builder'
  | 'connector'
  | 'import'
  | 'results'
  | 'compare'

interface NavItem {
  id: NavSection
  label: string
  icon: React.ReactNode
}

interface NavGroup {
  label: string
  icon: React.ReactNode
  items: NavItem[]
}

interface SidebarProps {
  activeSection: NavSection
  onSectionChange: (section: NavSection) => void
  backtestCount?: number
}

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed'

export function Sidebar({ activeSection, onSectionChange, backtestCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
  }

  const navGroups: NavGroup[] = [
    {
      label: 'Strategy',
      icon: <Sparkles className="w-3 h-3" />,
      items: [
        { id: 'ai-builder', label: 'AI Builder', icon: <Brain className="w-4 h-4" /> },
        { id: 'builder', label: 'Manual Builder', icon: <LayoutGrid className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Data',
      icon: <Database className="w-3 h-3" />,
      items: [
        { id: 'connector', label: 'TradingView', icon: <Wifi className="w-4 h-4" /> },
        { id: 'import', label: 'Import CSV', icon: <Upload className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Analysis',
      icon: <LineChart className="w-3 h-3" />,
      items: [
        { id: 'results', label: 'Results', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'compare', label: 'Compare', icon: <GitCompare className="w-4 h-4" /> },
      ],
    },
  ]

  if (!mounted) return null

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Toggle button */}
        <div className="flex items-center justify-end p-2 border-b border-border/20">
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {/* Home */}
          <NavButton
            active={activeSection === 'home'}
            collapsed={collapsed}
            icon={<Home className="w-4 h-4" />}
            label="Dashboard"
            onClick={() => onSectionChange('home')}
          />

          {/* Groups */}
          {navGroups.map(group => (
            <div key={group.label} className="pt-3">
              {!collapsed && (
                <div className="flex items-center gap-1.5 px-3 mb-1.5">
                  <span className="text-muted-foreground/60">{group.icon}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                    {group.label}
                  </span>
                </div>
              )}
              {collapsed && (
                <div className="flex justify-center mb-1.5">
                  <div className="w-6 h-px bg-border/40" />
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavButton
                    key={item.id}
                    active={activeSection === item.id}
                    collapsed={collapsed}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => onSectionChange(item.id)}
                    badge={item.id === 'results' && backtestCount > 0 ? backtestCount : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-lg">
        <div className="flex items-center justify-around py-2 px-1">
          <MobileNavButton
            active={activeSection === 'home'}
            icon={<Home className="w-5 h-5" />}
            label="Home"
            onClick={() => onSectionChange('home')}
          />
          <MobileNavButton
            active={activeSection === 'ai-builder'}
            icon={<Brain className="w-5 h-5" />}
            label="AI"
            onClick={() => onSectionChange('ai-builder')}
          />
          <MobileNavButton
            active={activeSection === 'builder'}
            icon={<LayoutGrid className="w-5 h-5" />}
            label="Builder"
            onClick={() => onSectionChange('builder')}
          />
          <MobileNavButton
            active={activeSection === 'connector' || activeSection === 'import'}
            icon={<Upload className="w-5 h-5" />}
            label="Data"
            onClick={() => onSectionChange('connector')}
          />
          <MobileNavButton
            active={activeSection === 'results' || activeSection === 'compare'}
            icon={<BarChart3 className="w-5 h-5" />}
            label="Results"
            onClick={() => onSectionChange('results')}
            badge={backtestCount > 0 ? backtestCount : undefined}
          />
        </div>
      </nav>
    </>
  )
}

interface NavButtonProps {
  active: boolean
  collapsed: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
  badge?: number
}

function NavButton({ active, collapsed, icon, label, onClick, badge }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full flex items-center gap-3 rounded-lg transition-all duration-200
        ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'}
        ${
          active
            ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm shadow-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
        }
      `}
      title={collapsed ? label : undefined}
    >
      <span className={active ? 'text-primary' : ''}>{icon}</span>
      {!collapsed && (
        <span className="text-sm font-medium truncate flex-1 text-left">{label}</span>
      )}
      {!collapsed && badge !== undefined && (
        <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/20 text-primary font-semibold">
          {badge}
        </span>
      )}
      {collapsed && badge !== undefined && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
      )}
    </button>
  )
}

interface MobileNavButtonProps {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
  badge?: number
}

function MobileNavButton({ active, icon, label, onClick, badge }: MobileNavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors
        ${active ? 'text-primary' : 'text-muted-foreground'}
      `}
    >
      {icon}
      <span className="text-[9px] font-medium">{label}</span>
      {badge !== undefined && (
        <span className="absolute -top-0.5 right-0.5 w-4 h-4 flex items-center justify-center text-[8px] rounded-full bg-primary text-primary-foreground font-bold">
          {badge}
        </span>
      )}
    </button>
  )
}
