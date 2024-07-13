import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to XOXO Events',
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
