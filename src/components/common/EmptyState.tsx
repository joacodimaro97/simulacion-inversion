import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex h-48 items-center justify-center">
        <p className="text-center text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}
