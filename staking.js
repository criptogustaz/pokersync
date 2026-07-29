// staking.js — ES6 module
// Regra de negócio: makeup é abatido ANTES de dividir lucro com o time.

const fmt = (v, cur = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cur }).format(v);

/* Estado do deal (viria da API / storage; mock inicial) */
const deal = { staking: false, share: 50, makeup: 1000, grossPnl: 4250, currency: 'BRL' };

/* Calcula corte do jogador considerando makeup */
function computeSplit({ grossPnl, makeup, share }) {
  if (grossPnl <= 0) return { mode: 'makeup', makeupLeft: makeup - grossPnl, mine: grossPnl, team: 0 };
  const afterMakeup = grossPnl - makeup;
  if (afterMakeup <= 0) return { mode: 'makeup', makeupLeft: makeup - grossPnl, mine: 0, team: 0 };
  const mine = makeup + afterMakeup * (share / 100); // jogador recupera makeup + seu %
  const team = afterMakeup * (1 - share / 100);
  return { mode: 'free', makeupLeft: 0, mine, team };
}

/* Renderiza card de Lucro/Prejuízo conforme visão + deal */
function renderPnl(view = 'global') {
  const card = document.getElementById('pnl-card');
  const value = document.getElementById('pnl-value');
  const scope = document.getElementById('pnl-scope');
  const subMakeup = document.getElementById('sub-makeup');
  const subSplit = document.getElementById('sub-split');
  const cur = deal.currency;

  if (!deal.staking) {
    card.dataset.mode = 'free';
    value.textContent = fmt(deal.grossPnl, cur);
    scope.textContent = 'Visão Global';
    subMakeup.hidden = true; subSplit.hidden = true;
    return;
  }

  const s = computeSplit(deal);
  const showMine = view === 'mine';
  scope.textContent = showMine ? 'Minha Parte' : 'Visão Global';
  value.textContent = fmt(showMine ? s.mine : deal.grossPnl, cur);
  card.dataset.mode = s.mode;

  if (s.mode === 'makeup') {
    subMakeup.hidden = false; subSplit.hidden = true;
    subMakeup.querySelector('strong').textContent = fmt(-s.makeupLeft, cur);
  } else {
    subMakeup.hidden = true; subSplit.hidden = false;
    subSplit.querySelectorAll('strong')[0].textContent = fmt(s.mine, cur);
    subSplit.querySelectorAll('strong')[1].textContent = fmt(s.team, cur);
  }
}

/* Filtro de visão (Global / Minha Parte) */
function initViewSwitch() {
  const pills = document.querySelectorAll('.view-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => { p.classList.remove('is-active'); p.setAttribute('aria-checked', 'false'); });
      pill.classList.add('is-active'); pill.setAttribute('aria-checked', 'true');
      renderPnl(pill.dataset.view);
    });
  });
}

/* Popover de contrato + toggle de staking */
function initDealPopover() {
  const header = document.querySelector('.page-header');
  const trigger = document.getElementById('deal-trigger');
  const pop = document.getElementById('deal-popover');
  const on = document.getElementById('staking-on');
  const fields = pop.querySelector('.deal-fields');
  const share = document.getElementById('deal-share');
  const makeup = document.getElementById('deal-makeup');
  const preview = document.getElementById('deal-preview');

  const togglePop = (open) => {
    pop.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
  };
  trigger.addEventListener('click', () => togglePop(pop.hidden));
  document.addEventListener('click', (e) => {
    if (!pop.hidden && !pop.contains(e.target) && !trigger.contains(e.target)) togglePop(false);
  });

  on.addEventListener('change', () => {
    deal.staking = on.checked;
    fields.dataset.locked = String(!on.checked);
    share.disabled = makeup.disabled = !on.checked;
    header.dataset.staking = on.checked ? 'on' : 'off';
    if (!on.checked) { // volta pra visão global ao desativar
      document.querySelector('.view-pill[data-view="global"]').click();
    }
    renderPnl(document.querySelector('.view-pill.is-active').dataset.view);
  });

  const syncDeal = () => {
    deal.share = Number(share.value) || 0;
    deal.makeup = Number(makeup.value) || 0;
    preview.textContent = `Jogador ${deal.share}% · Time ${100 - deal.share}%`;
    renderPnl(document.querySelector('.view-pill.is-active').dataset.view);
  };
  share.addEventListener('input', syncDeal);
  makeup.addEventListener('input', syncDeal);
}

export function initStaking() {
  initViewSwitch();
  initDealPopover();
  renderPnl('global');

  // Sincroniza com o filtro de moeda existente
  document.addEventListener('currencychange', (e) => {
    deal.currency = e.detail.currency;
    renderPnl(document.querySelector('.view-pill.is-active').dataset.view);
  });
}

document.addEventListener('DOMContentLoaded', initStaking);
