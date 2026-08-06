/* ==================================================================
   src/utils/parseBoard.js

   CORREÇÃO: estas funções devolviam objetos { rank, suit } / { faceDown:
   true }, mas o Card.jsx atual do projeto espera uma STRING crua no
   formato "Ah" (ele mesmo faz card.slice(0,-1) / card.slice(-1) para
   separar rank e naipe) e `null` para slot vazio. Passar um objeto
   causava "e.slice is not a function" assim que uma mão real chegava
   ao PokerTable. Agora os dois utils só normalizam/preenchem — sem
   trocar o formato do dado.
===================================================================*/

/**
 * Normaliza o board vindo do banco (array de strings como ['Qs','Jh','2d'])
 * para o formato que Card.jsx espera: strings cruas ("Ah"), preenchidas
 * com null até 5 posições (flop/turn/river ainda não distribuídos).
 */
export function parseBoard(boardArr) {
  if (!Array.isArray(boardArr)) return Array(5).fill(null);
  const cards = boardArr.map((s) => {
    const str = String(s).trim();
    return str.length >= 2 ? str : null;
  });
  while (cards.length < 5) cards.push(null);
  return cards;
}

/**
 * Converte a mão real sorteada pelo solver (ex: "AsKd", devolvida pela
 * API em hand.heroCards) em duas strings cruas ["As","Kd"] — o formato
 * que Card.jsx espera.
 */
export function parseHeroCombo(comboStr) {
  if (typeof comboStr !== "string" || comboStr.length !== 4) {
    return [null, null];
  }
  return [comboStr.slice(0, 2), comboStr.slice(2, 4)];
}
