import type { AccountState, ScheduledPaymentStatus } from "../../../types/finance";
import type { SupplierAccountState } from "../../../types/supplierFinance";
import {
  accountStateBadgeClass,
  accountStateLabel,
  scheduledStatusBadgeClass,
  scheduledStatusLabel,
  supplierAccountStateBadgeClass,
  supplierAccountStateLabel,
} from "../../../utils/financeLabels";

export function AccountStateBadge({ state }: { state: AccountState }) {
  const label = accountStateLabel[state] ?? state;
  const className = accountStateBadgeClass[state] ?? "adm-badge adm-badge--info";
  return <span className={className}>{label}</span>;
}

export function SupplierAccountStateBadge({
  state,
}: {
  state: SupplierAccountState;
}) {
  const label = supplierAccountStateLabel[state] ?? state;
  const className =
    supplierAccountStateBadgeClass[state] ?? "adm-badge adm-badge--info";
  return <span className={className}>{label}</span>;
}

export function ScheduledStatusBadge({
  status,
}: {
  status: ScheduledPaymentStatus;
}) {
  const label = scheduledStatusLabel[status] ?? status;
  const className =
    scheduledStatusBadgeClass[status] ?? "adm-badge adm-badge--info";
  return <span className={className}>{label}</span>;
}
