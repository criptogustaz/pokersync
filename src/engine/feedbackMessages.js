/**
 * Formata um valor de sizing removendo casas decimais desnecessárias.
 * Ex: 140.0 → "140" | 142.5 → "142.5" | 87.25 → "87.25"
 */
export function formatSizing(value) {
  if (value === null || value === undefined || isNaN(value)) return "";
  const rounded = Math.round(value * 100) / 100; // evita erro de ponto flutuante
  return String(rounded);
}

/**
 * Banco de frases por veredito, com badge e variações de texto.
 * Uma frase é escolhida aleatoriamente a cada análise pra não repetir sempre a mesma.
 */
const FEEDBACK_MESSAGES = {
  OTIMA: {
    badges: ["Boa escolha", "Mandou bem", "Isso aí"],
    texts: [
      "Você jogou exatamente como devia aqui.",
      "Essa é a linha certa, mandou bem.",
      "Jogada sólida, dentro do que a estratégia pede.",
    ],
  },
  ACEITAVEL: {
    badges: ["Jogada válida", "Dá pro gasto", "Também rola"],
    texts: [
      "Não é a linha mais forte, mas ainda faz parte do jogo certo.",
      "Essa jogada também é usada, só não é a favorita da estratégia.",
      "Válida, mas dá pra apertar um pouco mais aqui.",
    ],
  },
  ERRO_LEVE: {
    badges: ["Quase lá", "Por pouco", "Quase isso"],
    texts: [
      "Essa jogada quase não aparece na estratégia ideal. O forte aqui é {ACAO} ({FREQ}%).",
      "Foi por pouco — a mão pede mais {ACAO} do que isso.",
      "Chegou perto, mas o padrão certo aqui é {ACAO}.",
    ],
  },
  ERRO_GRAVE: {
    badges: ["Fora da jogada certa", "Não rolou", "Escapou dessa"],
    texts: [
      "Nessa mão, o jogo certo é {ACAO}. {ACAO_ESCOLHIDA} quase nunca é a jogada aqui.",
      "Essa fugiu do padrão — a estratégia manda {ACAO} praticamente sempre.",
      "Aqui era pra apostar, não pra {ACAO_ESCOLHIDA}. Guarda essa mão.",
    ],
  },
  UNKNOWN: {
    badges: ["Sem dados"],
    texts: ["Não conseguimos comparar essa jogada com a estratégia agora."],
  },
};

/**
 * Monta o feedback final pro veredito recebido de matchUserActionToGtoNode.
 *
 * verdict: "OTIMA" | "ACEITAVEL" | "ERRO_LEVE" | "ERRO_GRAVE" | "UNKNOWN"
 * topAction: string da ação mais frequente, ex "BET 140,000000"
 * topFreq: número entre 0 e 1
 * chosenAction: nome legível da ação que o jogador escolheu, ex "Check"
 */
export function getFeedbackMessage(verdict, { topAction, topFreq, chosenAction } = {}) {
  const set = FEEDBACK_MESSAGES[verdict] || FEEDBACK_MESSAGES.UNKNOWN;

  const badge = set.badges[Math.floor(Math.random() * set.badges.length)];
  let text = set.texts[Math.floor(Math.random() * set.texts.length)];

  if (topAction) {
    const [type, rawSizing] = String(topAction).trim().split(/\s+/);
    const acaoLegivel = rawSizing
      ? `${type.charAt(0)}${type.slice(1).toLowerCase()} ${formatSizing(parseFloat(rawSizing.replace(",", ".")) / 100)}`
      : `${type.charAt(0)}${type.slice(1).toLowerCase()}`;

    text = text
      .replace(/{ACAO}/g, acaoLegivel)
      .replace(/{FREQ}/g, topFreq ? Math.round(topFreq * 100) : "")
      .replace(/{ACAO_ESCOLHIDA}/g, chosenAction ?? "essa jogada");
  }

  return { badge, text };
}
