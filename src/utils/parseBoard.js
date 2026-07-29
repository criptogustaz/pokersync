/**
 * Converte o board vindo do banco (array de strings como ['Qs','Jh','2d'])
 * para o formato que PokerTable/Card esperam: [{ rank, suit }].
 * Preenche até 5 cartas com { faceDown: true } quando necessário (flop/turn).
 */
export function parseBoard(boardArr) {
  if (!Array.isArray(boardArr)) return Array(5).fill({ faceDown: true });

  const cards = boardArr.map((s) => {
    const str = String(s).trim();
    if (str.length < 2) return { faceDown: true };
    return {
      rank: str.slice(0, -1), // "10" ou "A", etc.
      suit: str.slice(-1).toLowerCase(),
    };
  });

  while (cards.length < 5) cards.push({ faceDown: true });
  return cards;
}

/**
 * Gera 2 cartas aleatórias de hero (para exibição — o solver não exporta hero cards).
 * Evita cartas que já estão no board.
 */
export function randomHeroCards(boardArr) {
  const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
  const SUITS = ["h", "d", "c", "s"];
  const used = new Set((boardArr || []).map((c) => String(c).trim()));

  const deck = [];
  for (const r of RANKS) for (const s of SUITS) {
    const card = `${r}${s}`;
    if (!used.has(card)) deck.push(card);
  }

  // Fisher-Yates parcial — só precisamos de 2
  for (let i = deck.length - 1; i > deck.length - 3 && i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.slice(-2).map((s) => ({ rank: s.slice(0, -1), suit: s.slice(-1) }));
}
