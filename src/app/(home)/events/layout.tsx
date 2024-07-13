import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events',
  description: 'View all your events in one place',
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
