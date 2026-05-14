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
    <nav className="bg-white border-b border-stone-100 sticky top-0 z-20">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-12">
        <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <span className="text-emerald-500">✦</span> Wellness
        </span>
        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-stone-500 hover:text-gray-700 hover:bg-stone-50'
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
