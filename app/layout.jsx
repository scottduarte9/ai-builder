import './globals.css'
import { Inter } from 'next/font/google'
import Nav from '@/app/components/Nav'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Wellness Dashboard',
  description: 'Personal wellness tracker',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="text-gray-900 min-h-screen font-sans antialiased" style={{ backgroundColor: '#f2efe9' }}>
        <Nav />
        {children}
      </body>
    </html>
  )
}
