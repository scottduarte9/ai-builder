'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/body', label: 'Body' },
  { href: '/victories', label: 'Victories' },
  { href: '/templates', label: 'Templates' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-20"
         style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between" style={{ height: '52px' }}>
        <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xs leading-none">✦</span>
          <span className="tracking-tight">Wellness</span>
        </span>
        <div className="flex items-center gap-0.5">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  active
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-stone-500 hover:text-gray-800 hover:bg-stone-100'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
