// agent.js — ES6 module
// Desktop Agent: robô que o jogador instala na máquina e importa sessões
// automaticamente. Recurso pago — bloqueado temporariamente.

const AGENT_STATE = { unlocked: false }; // trocar para true quando o plano PRO liberar

function applyLockState(btn) {
  const locked = !AGENT_STATE.unlocked;
  btn.classList.toggle('is-locked', locked);
  btn.setAttribute('aria-disabled', String(locked));
}

export function initAgentButton() {
  const btn = document.getElementById('agent-trigger');
  if (!btn) return;
  applyLockState(btn);

  btn.addEventListener('click', () => {
    if (!AGENT_STATE.unlocked) {
      // Gancho para abrir modal de planos/upsell no futuro
      document.dispatchEvent(new CustomEvent('upgraderequest', {
        detail: { feature: 'desktop-agent' }
      }));
      return;
    }
    // Fluxo real (quando liberado): iniciar/parar sincronização do agente
    document.dispatchEvent(new CustomEvent('agentsync', { detail: { action: 'toggle' } }));
  });
}

export function setAgentUnlocked(value) {
  AGENT_STATE.unlocked = !!value;
  const btn = document.getElementById('agent-trigger');
  if (btn) applyLockState(btn);
}

document.addEventListener('DOMContentLoaded', initAgentButton);
