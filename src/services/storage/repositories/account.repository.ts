import type { Account } from '../../../domain/accounts/account.types'

export interface AccountRepository {
  getAll(): Promise<Account[]>
  getById(id: string): Promise<Account | null>
  save(account: Account): Promise<void>
  delete(id: string): Promise<void>
}
