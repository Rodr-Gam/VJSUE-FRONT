import { useState, type MouseEvent } from "react";
import { Archive } from "lucide-react";
import {
  financeArchiveService,
  getFinanceArchiveErrorMessage,
} from "../../../financeArchiveService";
import type { FinanceArchiveSubjectType } from "../../../types/financeArchive";

interface FinanceArchiveButtonProps {
  subjectType: FinanceArchiveSubjectType;
  subjectId: number;
  onArchived?: () => void;
  className?: string;
  label?: string;
}

export default function FinanceArchiveButton({
  subjectType,
  subjectId,
  onArchived,
  className = "id-action",
  label = "Archivar",
}: FinanceArchiveButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (
      !window.confirm(
        "¿Archivar este registro? Dejará de aparecer en el listado activo y podrás verlo en Finanzas → Archivados.",
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      await financeArchiveService.archive(subjectType, subjectId);
      onArchived?.();
    } catch (err) {
      window.alert(getFinanceArchiveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      title={label}
      aria-label={label}
      disabled={busy}
      onClick={handleClick}
    >
      <Archive size={14} aria-hidden />
    </button>
  );
}
