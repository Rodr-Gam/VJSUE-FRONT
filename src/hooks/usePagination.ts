import { useState, useMemo, useEffect } from "react";

/**
 * Pagina un array de items en el cliente.
 * Si el array cambia (por un filtro) y la página actual queda fuera
 * de rango, se reajusta automáticamente a la última página válida.
 *
 * Uso:
 *   const { currentPage, setCurrentPage, totalPages, paginated } =
 *     usePagination(flightsFiltrados, 10);
 */
export function usePagination<T>(items: T[], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginated = useMemo(
    () =>
      items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [items, currentPage, itemsPerPage],
  );

  return { currentPage, setCurrentPage, totalPages, paginated };
}
