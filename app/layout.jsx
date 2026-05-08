import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Wellness Dashboard',
  description: 'Personal wellness tracker',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-stone-50 text-gray-900 min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
