import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  variant?: 'default' | 'dark'
}

function Card({ children, variant = 'default' }: CardProps) {
  const styles =
    variant === 'dark'
      ? 'bg-slate-900 text-white shadow-sm'
      : 'border border-slate-200 bg-white text-slate-900 shadow-sm'

  return <div className={`rounded-2xl p-6 ${styles}`}>{children}</div>
}

export default Card
