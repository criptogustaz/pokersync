// calculator.js — ES6 module

const fmt = (v, cur = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cur }).format(v);

const state = { bankroll: 10000, minBuyins: 20, currency: 'BRL' };

/* Regra: buy-in máx = banca / buy-ins mínimos.
   Status é relativo à folga sobre a regra do próprio jogador. */
function compute() {
  const maxBuyin = state.minBuyins > 0 ? state.bankroll / state.minBuyins : 0;
  const buyinsHeld = maxBuyin > 0 ? state.bankroll / maxBuyin : 0; // == minBuyins na regra
  let status = 'safe', msg = 'Dentro da sua gestão de banca.';
  if (state.bankroll <= 0 || state.minBuyins <= 0) {
    status = 'danger'; msg = 'Informe banca e regra de buy-ins.';
  } else if (buyinsHeld < state.minBuyins) {
    status = 'danger'; msg = 'Subrolled: abaixo da sua regra.';
  } else if (buyinsHeld < state.minBuyins * 1.2) {
    status = 'warn'; msg = 'No limite — considere descer de stake.';
  }
  return { maxBuyin, status, msg };
}

function render() {
  const box = document.getElementById('calc-result');
  const { maxBuyin, status, msg } = compute();
  document.getElementById('calc-maxbuyin').textContent = fmt(maxBuyin, state.currency);
  document.getElementById('calc-status').textContent = msg;
  box.dataset.status = status;
}

function setMinBuyins(value, { fromCustom = false } = {}) {
  state.minBuyins = Number(value) || 0;
  const pills = document.querySelectorAll('.buyin-pill');
  pills.forEach((p) => {
    const active = !fromCustom && Number(p.dataset.buyins) === state.minBuyins;
    p.classList.toggle('is-active', active);
    p.setAttribute('aria-checked', String(active));
  });
  render();
}

function initCalculator() {
  const trigger = document.getElementById('calc-trigger');
  const pop = document.getElementById('calc-popover');
  const bankroll = document.getElementById('calc-bankroll');
  const custom = document.getElementById('calc-custom');
  const save = document.getElementById('calc-save');

  const togglePop = (open) => {
    pop.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
  };
  trigger.addEventListener('click', () => togglePop(pop.hidden));
  document.addEventListener('click', (e) => {
    if (!pop.hidden && !pop.contains(e.target) && !trigger.contains(e.target)) togglePop(false);
  });

  bankroll.addEventListener('input', () => { state.bankroll = Number(bankroll.value) || 0; render(); });

  document.querySelectorAll('.buyin-pill').forEach((pill) => {
    pill.addEventListener('click', () => { custom.value = ''; setMinBuyins(pill.dataset.buyins); });
  });
  custom.addEventListener('input', () => {
    if (custom.value) setMinBuyins(custom.value, { fromCustom: true });
  });

  save.addEventListener('click', () => {
    // preferência do jogador (persistir na API/storage do app)
    document.dispatchEvent(new CustomEvent('buyinrulechange', { detail: { minBuyins: state.minBuyins } }));
    save.textContent = 'Regra salva ✓';
    setTimeout(() => (save.textContent = 'Salvar como minha regra'), 1500);
  });

  document.addEventListener('currencychange', (e) => { state.currency = e.detail.currency; render(); });

  render();
}

document.addEventListener('DOMContentLoaded', initCalculator);
export { initCalculator };
