import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Event',
  description: 'Edit an existing event',
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
