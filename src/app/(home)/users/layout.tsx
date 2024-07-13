import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Users',
  description: 'Manage all your users',
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
