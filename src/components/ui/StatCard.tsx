import Card from './Card'

type StatCardProps = {
  title: string
  amount: string
  description?: string
  variant?: 'default' | 'dark'
  size?: 'default' | 'large'
}

function StatCard({
  title,
  amount,
  description,
  variant = 'default',
  size = 'default',
}: StatCardProps) {
  const titleColor = variant === 'dark' ? 'text-slate-300' : 'text-slate-500'

  const amountSize = size === 'large' ? 'text-4xl' : 'text-2xl'

  return (
    <Card variant={variant}>
      <p className={`text-sm font-medium ${titleColor}`}>{title}</p>

      <p className={`mt-3 font-semibold tracking-tight ${amountSize}`}>{amount}</p>

      {description && <p className={`mt-2 text-sm ${titleColor}`}>{description}</p>}
    </Card>
  )
}

export default StatCard
