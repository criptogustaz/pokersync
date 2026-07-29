import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./authService.js";

async function fetchWithRetry(path, { retries = 2, backoff = 800 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await apiFetch(path);
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, backoff * (attempt + 1)));
    }
  }
}

/**
 * Hook React: busca lote de mãos com suporte a filtros.
 * Uso: const { hands, loading, error, reload } = useDrillBatch(20, filterQueryString);
 */
export function useDrillBatch(size = 20, filterQs = "") {
  const [hands, setHands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filterQs ? `size=${size}&${filterQs}` : `size=${size}`;
      const data = await fetchWithRetry(`/api/drills/batch?${qs}`);
      setHands(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [size, filterQs]);

  useEffect(() => {
    load();
  }, [load]);

  return { hands, loading, error, reload: load };
}
