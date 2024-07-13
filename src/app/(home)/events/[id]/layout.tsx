import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'View Event Details',
  description: 'View the details of an event',
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
