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
 * Converte a mão real sorteada pelo solver (ex: "AsKd", devolvida pela
 * API em hand.heroCards) no formato [{ rank, suit }] que PokerTable espera.
 * Essa é a mão de verdade — dentro do range e com a estratégia calculada
 * pelo TexasSolver, ao contrário do sorteio aleatório antigo.
 */
export function parseHeroCombo(comboStr) {
  if (typeof comboStr !== "string" || comboStr.length !== 4) {
    return [{ faceDown: true }, { faceDown: true }];
  }
  return [
    { rank: comboStr.slice(0, 1), suit: comboStr.slice(1, 2).toLowerCase() },
    { rank: comboStr.slice(2, 3), suit: comboStr.slice(3, 4).toLowerCase() },
  ];
}
