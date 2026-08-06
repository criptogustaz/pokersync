import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./authService.js";

/* ==================================================================
   src/services/useFacets.js

   Busca as combinações position × action × street que existem de
   fato na base de spots, com a contagem de cada uma. O FilterDrawer
   usa isso para desabilitar opções sem dado real (ex: SB nunca tem
   'vs Open').

   Uso:
     const facets = useFacets();
     <FilterDrawer ... facets={facets} />

   Se a chamada falhar, devolve [] — o FilterDrawer já tem uma lista
   embutida de fallback para esse caso, então a tela nunca quebra.
===================================================================*/
export function useFacets() {
  const [facets, setFacets] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/drills/facets");
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      const data = await res.json();
      setFacets(Array.isArray(data) ? data : []);
    } catch (err) {
      // Falha silenciosa: o FilterDrawer cai no fallback embutido.
      setFacets([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return facets;
}
