import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Event',
  description: 'Create a new event',
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
