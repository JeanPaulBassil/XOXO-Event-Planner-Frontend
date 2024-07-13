import type { Metadata } from 'next'
import Header from '../_components/Header'
import { EventProvider } from './contexts/EventContext'

export const metadata: Metadata = {
  title: 'Calendars',
  description: 'View all your events in one place',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <EventProvider>
      <Header>{children}</Header>
    </EventProvider>
  )
}
