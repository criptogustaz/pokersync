export function renderTableSkeleton(mountEl) {
  mountEl.innerHTML = `
    <div class="poker-skeleton" role="status" aria-label="Carregando lote de mãos">
      <div class="poker-skeleton__table"></div>
      <div class="poker-skeleton__row">
        <div class="poker-skeleton__card"></div>
        <div class="poker-skeleton__card"></div>
      </div>
    </div>`;
}

export function renderNetworkError(mountEl, onRetry) {
  mountEl.innerHTML = `
    <div class="net-error" role="alert">
      <p>Conexão instável. Seu progresso da sessão foi preservado.</p>
      <button class="net-error__btn" data-retry>Tentar novamente</button>
    </div>`;
  const btn = mountEl.querySelector("[data-retry]");
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Reconectando…";
    await onRetry();
  });
}
