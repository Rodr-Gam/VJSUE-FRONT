import type { Account, AccountState, PartialPayment, ScheduledPayment } from "../types/finance";

function getPartialPayments(account: Account): PartialPayment[] {
  const raw = account as Account & { partialPayments?: PartialPayment[] };
  return raw.partial_payments ?? raw.partialPayments ?? [];
}

function getScheduledPayments(account: Account): ScheduledPayment[] {
  const raw = account as Account & { scheduledPayments?: ScheduledPayment[] };
  return raw.scheduled_payments ?? raw.scheduledPayments ?? [];
}

export function computePaidAmount(payments: PartialPayment[]): number {
  return payments.reduce((sum, payment) => {
    const amount = Number(payment.amount) || 0;
    return payment.transaction_type === "refund" ? sum - amount : sum + amount;
  }, 0);
}

export function normalizeAccount(account: Account): Account {
  const payments = getPartialPayments(account);
  const scheduled = getScheduledPayments(account);
  const total = Number(account.total_amount) || 0;

  let paid: number;
  if (Number.isFinite(Number(account.paid_amount))) {
    paid = Number(account.paid_amount);
  } else if (payments.length > 0) {
    paid = computePaidAmount(payments);
  } else if (account.state === "paid") {
    paid = total;
  } else {
    paid = 0;
  }

  let balance: number;
  if (Number.isFinite(Number(account.balance_due))) {
    balance = Number(account.balance_due);
  } else {
    balance = Math.max(0, total - paid);
  }

  return {
    ...account,
    partial_payments: payments,
    scheduled_payments: scheduled,
    paid_amount: paid,
    balance_due: balance,
  };
}

export function normalizeAccounts(accounts: Account[]): Account[] {
  return accounts.map(normalizeAccount);
}

export function extractEmbeddedAccount(data: unknown): Account | null {
  if (!data || typeof data !== "object") return null;
  const account = (data as Record<string, unknown>).account;
  if (!account || typeof account !== "object") return null;
  return normalizeAccount(account as Account);
}

export function buildClientAccountFallback(
  reservationId: number,
  totalAmount?: string | number | null,
  state: AccountState = "pending",
): Account {
  const total = Number(totalAmount) || 0;
  return {
    id: 0,
    reservation_id: reservationId,
    total_amount: total,
    state,
    paid_amount: 0,
    balance_due: total,
    partial_payments: [],
    scheduled_payments: [],
  };
}
