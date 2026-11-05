import type { CurrencyCode, MoneyMinor } from './money.types'

export function formatMoney(amountMinor: MoneyMinor, currency: CurrencyCode): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100)
}
