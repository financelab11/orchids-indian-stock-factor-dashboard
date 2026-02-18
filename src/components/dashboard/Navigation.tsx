'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, GitCompare, Upload, Home, TrendingUp } from 'lucide-react'

const TABS = [
  { href: '/', label: 'Overview', icon: Home, description: 'All stocks' },
  { href: '/compare', label: 'Compare', icon: GitCompare, description: 'Side-by-side' },
  { href: '/upload', label: 'Upload', icon: Upload, description: 'Import data' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-pb md:hidden">
      <div className="flex">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : ''}`} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function SideNav() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-sidebar-border bg-sidebar min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <div className="font-bold text-sm text-sidebar-foreground leading-tight">Factor Lens</div>
          <div className="text-xs text-sidebar-foreground/50">Indian Equities</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 mb-2 mt-1">
          Dashboard
        </p>
        {TABS.map(({ href, label, icon: Icon, description }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div>{label}</div>
                <div className={`text-xs ${active ? 'text-sidebar-primary-foreground/70' : 'text-sidebar-foreground/40'}`}>
                  {description}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-sidebar-foreground/40" />
          <span className="text-xs text-sidebar-foreground/40">NSE / BSE Listed</span>
        </div>
      </div>
    </aside>
  )
}
