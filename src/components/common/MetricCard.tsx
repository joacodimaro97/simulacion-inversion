import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Card, CardContent } from '@/components/ui/card'

interface MetricCardProps {
  title: string
  value: string
  subtitle?: ReactNode
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 'neutral',
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('animate-in transition-all hover:shadow-md', className)}>
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="shrink-0 rounded-lg bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p
          className={cn('mt-2 text-2xl font-bold tracking-tight', {
            'text-success': trend === 'up',
            'text-destructive': trend === 'down',
          })}
        >
          {value}
        </p>
        {subtitle &&
          (typeof subtitle === 'string' ? (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          ) : (
            subtitle
          ))}
      </CardContent>
    </Card>
  )
}
