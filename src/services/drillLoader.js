import { apiFetch } from "./authService.js";
import { renderTableSkeleton, renderNetworkError } from "../components/TableSkeleton.js";

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

export async function loadDrillBatch(mountEl, onReady) {
  renderTableSkeleton(mountEl);
  try {
    const hands = await fetchWithRetry("/api/drills/batch?size=20");
    onReady(hands);
  } catch {
    renderNetworkError(mountEl, () => loadDrillBatch(mountEl, onReady));
  }
}
