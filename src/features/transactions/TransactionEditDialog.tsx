import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import type { UpdateTransactionInput } from '../../services/transactions/transaction.service.types'

import TransactionForm from './TransactionForm'

interface TransactionEditDialogProps {
  transaction: Transaction
  accounts: Account[]
  onUpdateTransaction: (id: string, input: UpdateTransactionInput) => Promise<Transaction>
  onClose: () => void
}

function TransactionEditDialog({
  transaction,
  accounts,
  onUpdateTransaction,
  onClose,
}: TransactionEditDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-transaction-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <TransactionForm
          mode="edit"
          accounts={accounts}
          transaction={transaction}
          onUpdateTransaction={onUpdateTransaction}
          onCancelEdit={onClose}
        />
      </section>
    </div>
  )
}

export default TransactionEditDialog
