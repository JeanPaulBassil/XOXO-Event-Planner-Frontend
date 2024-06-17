'use client'

import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/api/utils/GetQueryClient'

export default function ReactQueryClientProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
