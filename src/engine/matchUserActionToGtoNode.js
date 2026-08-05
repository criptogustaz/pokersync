// Faixas de frequência para classificar a qualidade da decisão.
// Ajustáveis conforme feedback de uso real do Modo Treino.
const FREQ_OTIMA = 0.40;
const FREQ_ACEITAVEL = 0.15;
const FREQ_ERRO_LEVE = 0.05;

// Mesma tolerância de sizing já usada antes: aceita bets/raises dentro
// de ±15% do tamanho do nó mais próximo como "a mesma ação".
const SIZING_TOLERANCE = 0.15;

/**
 * Converte uma string de ação do solver (ex: "BET 450,000000" ou "CHECK")
 * em { type, sizing }. Ações sem tamanho (CHECK, CALL, FOLD) têm sizing = 0.
 */
function parseActionString(raw) {
  const parts = raw.trim().split(/\s+/);
  const type = parts[0].toUpperCase();
  const sizing = parts[1] ? parseFloat(parts[1].replace(",", ".")) : 0;
  return { type, sizing };
}

/**
 * Classifica a frequência da ação escolhida em uma faixa de qualidade.
 */
function classifyFrequency(freq) {
  if (freq >= FREQ_OTIMA) return "OTIMA";
  if (freq >= FREQ_ACEITAVEL) return "ACEITAVEL";
  if (freq >= FREQ_ERRO_LEVE) return "ERRO_LEVE";
  return "ERRO_GRAVE";
}

/**
 * userAction: { action: "CHECK" | "BET" | "CALL" | "RAISE" | "FOLD", sizing?: number }
 * gtoNode: { actions: string[], player: number, strategy: { [combo]: number[] } }
 * heroCards: string, ex "AsKd" — precisa bater com uma chave em gtoNode.strategy
 *
 * Retorna: { verdict: "OTIMA" | "ACEITAVEL" | "ERRO_LEVE" | "ERRO_GRAVE" | "UNKNOWN",
 *            chosenFreq, topFreq, topAction }
 */
export function matchUserActionToGtoNode(userAction, gtoNode, heroCards) {
  if (!gtoNode || !Array.isArray(gtoNode.actions) || gtoNode.actions.length === 0) {
    return { verdict: "UNKNOWN", chosenFreq: 0, topFreq: 0, topAction: null };
  }

  const comboFreqs = gtoNode.strategy?.[heroCards];
  if (!Array.isArray(comboFreqs) || comboFreqs.length !== gtoNode.actions.length) {
    return { verdict: "UNKNOWN", chosenFreq: 0, topFreq: 0, topAction: null };
  }

  const parsedActions = gtoNode.actions.map(parseActionString);

  const candidates = parsedActions
    .map((a, i) => ({ ...a, index: i }))
    .filter((a) => a.type === userAction.action.toUpperCase());

  let chosenIndex = -1;
  if (candidates.length === 1) {
    chosenIndex = candidates[0].index;
  } else if (candidates.length > 1) {
    const withDiff = candidates.map((c) => {
      const diff =
        c.sizing === 0
          ? Math.abs(c.sizing - (userAction.sizing ?? 0))
          : Math.abs(c.sizing - (userAction.sizing ?? 0)) / c.sizing;
      return { ...c, diff };
    });
    withDiff.sort((a, b) => a.diff - b.diff);
    if (withDiff[0].diff <= SIZING_TOLERANCE) {
      chosenIndex = withDiff[0].index;
    }
  }

  const chosenFreq = chosenIndex >= 0 ? comboFreqs[chosenIndex] : 0;

  const topIndex = comboFreqs.reduce(
    (best, freq, i) => (freq > comboFreqs[best] ? i : best),
    0
  );
  const topFreq = comboFreqs[topIndex];
  const topAction = gtoNode.actions[topIndex];

  const verdict = classifyFrequency(chosenFreq);

  return { verdict, chosenFreq, topFreq, topAction };
}

