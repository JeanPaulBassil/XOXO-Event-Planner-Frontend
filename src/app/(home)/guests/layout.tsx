import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guests',
  description: 'View all your guests in one place',
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
