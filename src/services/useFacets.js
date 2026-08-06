import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./authService.js";

/* ==================================================================
   src/services/useFacets.js  (v2 — com retry)

   Busca as combinações position × action × street que existem de
   fato na base, com a contagem de cada uma. O FilterDrawer usa isso
   para desabilitar opções sem dado real (ex: SB nunca tem 'vs Open').

   MUDANÇA: a v1 falhava com 500/UNAUTHENTICATED em produção porque
   disparava no mount, antes do token de auth terminar de carregar —
   e não tinha retry para se recuperar. O useDrillBatch já tinha esse
   retry (fetchWithRetry); aqui replicamos o mesmo padrão.

   Uso:
     const facets = useFacets();
     <FilterDrawer ... facets={facets} />

   Se todas as tentativas falharem, devolve [] — o FilterDrawer cai
   no fallback embutido e a tela nunca quebra.
===================================================================*/

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

export function useFacets() {
  const [facets, setFacets] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await fetchWithRetry("/api/drills/facets");
      setFacets(Array.isArray(data) ? data : []);
    } catch (err) {
      // Falha silenciosa após todas as tentativas: o FilterDrawer
      // cai no fallback embutido.
      setFacets([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return facets;
}
