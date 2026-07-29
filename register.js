// register.js — ES6 module

/* Filtro de moeda: emite 'currencychange' para os cards recalcularem */
export function initCurrencySwitch(root = document) {
  const pills = root.querySelectorAll('.currency-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => {
        p.classList.remove('is-active');
        p.setAttribute('aria-checked', 'false');
      });
      pill.classList.add('is-active');
      pill.setAttribute('aria-checked', 'true');

      document.dispatchEvent(
        new CustomEvent('currencychange', { detail: { currency: pill.dataset.currency } })
      );
    });
  });
}

/* Abas internas do card (Sessão / Transação) */
export function initRegisterTabs(root = document) {
  const tabs = root.querySelectorAll('#register-card .tab');
  const panels = root.querySelectorAll('#register-card .panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      panels.forEach((panel) => {
        const active = panel.id === tab.getAttribute('aria-controls');
        panel.classList.toggle('is-hidden', !active);
        panel.hidden = !active;
      });
    });
  });
}

/* Exemplo de consumo do filtro (recalcula somente esta tela) */
export function initScreen(root = document) {
  initCurrencySwitch(root);
  initRegisterTabs(root);

  document.addEventListener('currencychange', (e) => {
    const { currency } = e.detail;
    // TODO: recalcular apenas os cards desta tela com base em `currency`
    console.debug('[PokerSync] moeda ativa:', currency);
  });
}

document.addEventListener('DOMContentLoaded', () => initScreen());
