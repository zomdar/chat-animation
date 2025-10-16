import './globals.css'
import { Inter, Esteban } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const esteban = Esteban({ subsets: ['latin'], weight: '400', variable: '--font-esteban' })

export const metadata = {
  title: 'Chat Application',
  description: 'Real-time chat application with AI',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${esteban.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
