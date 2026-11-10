import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Para no romper la paginación cuando totalPages es 0 (lista vacía) */
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  // Si no hay nada que paginar, no mostramos el control.
  if (totalPages <= 1) return null;

  return (
    <div className={`R-pagination flex justify-center items-center gap-4 mt-4 ${className}`}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="R-button-p cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={20} className="text-white" />
      </button>
      <span className="text-sm">
        Página {currentPage} de {totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="R-button-p cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={20} className="text-white" />
      </button>
    </div>
  );
}
