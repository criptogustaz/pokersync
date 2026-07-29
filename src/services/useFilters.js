import { useState, useCallback, useMemo } from "react";

const DEFAULTS = {
  solution: null,       // "MTT" | "Cash" | null (qualquer)
  format: null,         // "HeadsUP" | "ChipEV" | "ICM" | null
  stack: null,          // number | null
  position: null,       // "UTG" | "CO" | ... | null
  street: "Ambos",      // "Pré-Flop" | "Pós-Flop" | "Ambos"
  action: "Qualquer",   // "RFI" | "vs Open" | ... | "Qualquer"
};

/**
 * Hook centralizado de filtros do Modo Treino.
 * Retorna { filters, set, reset, queryString, activeCount }.
 */
export function useFilters() {
  const [filters, setFilters] = useState({ ...DEFAULTS });

  const set = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? DEFAULTS[key] : value,
    }));
  }, []);

  const reset = useCallback(() => setFilters({ ...DEFAULTS }), []);

  // Conta quantos filtros estão ativos (diferem do default)
  const activeCount = useMemo(() => {
    let count = 0;
    for (const k of Object.keys(DEFAULTS)) {
      if (filters[k] !== DEFAULTS[k]) count++;
    }
    return count;
  }, [filters]);

  // Query string para o endpoint de batch
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.solution) params.set("solution", filters.solution);
    if (filters.format) params.set("format", filters.format);
    if (filters.stack) params.set("stack", String(filters.stack));
    if (filters.position) params.set("position", filters.position);
    if (filters.street !== "Ambos") params.set("street", filters.street);
    if (filters.action !== "Qualquer") params.set("action", filters.action);
    return params.toString();
  }, [filters]);

  return { filters, set, reset, activeCount, queryString };
}
