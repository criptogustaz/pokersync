const KEY = "pokersync.bankroll.v1";

export function loadState(fallback) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveState(state) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* silencioso: modo privado/sem storage não deve quebrar o app */
  }
}
