import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  message: string
  action?: ReactNode
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex h-48 flex-col items-center justify-center gap-4">
        <p className="text-center text-sm text-muted-foreground">{message}</p>
        {action}
      </CardContent>
    </Card>
  )
}
