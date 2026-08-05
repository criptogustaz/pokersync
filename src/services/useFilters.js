import { useState, useCallback, useMemo } from "react";

// Só as dimensões que existem de verdade nos dados hoje. solution/format/stack
// não entram porque todo spot no banco é MTT/ChipEV/40bb — não há o que filtrar.
const DEFAULTS = {
  position: null, // "BB" | "BTN" | "SB" | null (qualquer)
  action: null,   // "vs Open" | "3-Bet" | null (qualquer)
  street: null,   // "Flop" | "Turn" | "River" | null (qualquer)
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
    if (filters.position) params.set("position", filters.position);
    if (filters.action) params.set("action", filters.action);
    if (filters.street) params.set("street", filters.street);
    return params.toString();
  }, [filters]);

  return { filters, set, reset, activeCount, queryString };
}
