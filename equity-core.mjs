/**
 * Núcleo de cálculo exato para spots decididos por equity.
 * Carta = 0..51, rank = c>>2 (0='2' .. 12='A'), naipe = c&3 ('s','h','d','c').
 */
export const RANKS = "23456789TJQKA";
export const SUITS = "shdc";

export const carta = (txt) => RANKS.indexOf(txt[0]) * 4 + SUITS.indexOf(txt[1]);
export const texto = (c) => RANKS[c >> 2] + SUITS[c & 3];

/* ---------------------------------------------------------------------------
   Avaliador de 7 cartas. Devolve inteiro: maior = melhor.
   categoria<<20 | desempates
   ------------------------------------------------------------------------ */
export function avaliar7(cs) {
  const rc = new Int8Array(13), sc = new Int8Array(4);
  const srank = [0, 0, 0, 0];
  let mask = 0;
  for (let i = 0; i < 7; i++) {
    const r = cs[i] >> 2, s = cs[i] & 3;
    rc[r]++; sc[s]++; srank[s] |= 1 << r; mask |= 1 << r;
  }

  const retaDe = (m) => {
    for (let hi = 12; hi >= 4; hi--) {
      const need = (1 << hi) | (1 << (hi - 1)) | (1 << (hi - 2)) | (1 << (hi - 3)) | (1 << (hi - 4));
      if ((m & need) === need) return hi;
    }
    const roda = (1 << 12) | 1 | 2 | 4 | 8;   // A,2,3,4,5
    return (m & roda) === roda ? 3 : -1;
  };

  let fs = -1;
  for (let s = 0; s < 4; s++) if (sc[s] >= 5) fs = s;
  if (fs >= 0) {
    const sf = retaDe(srank[fs]);
    if (sf >= 0) return (8 << 20) | sf;      // straight flush
  }

  let quad = -1, trinca = -1, par1 = -1, par2 = -1;
  for (let r = 12; r >= 0; r--) {
    if (rc[r] === 4 && quad < 0) quad = r;
    else if (rc[r] === 3) { if (trinca < 0) trinca = r; else if (par1 < 0) par1 = r; }
    else if (rc[r] === 2) { if (par1 < 0) par1 = r; else if (par2 < 0) par2 = r; }
  }

  if (quad >= 0) {
    let k = -1;
    for (let r = 12; r >= 0; r--) if (r !== quad && rc[r]) { k = r; break; }
    return (7 << 20) | (quad << 4) | k;
  }
  if (trinca >= 0 && par1 >= 0) return (6 << 20) | (trinca << 4) | par1;

  if (fs >= 0) {                              // flush comum
    let sco = 5 << 20, t = 0;
    for (let r = 12; r >= 0 && t < 5; r--) if (srank[fs] & (1 << r)) { sco |= r << (4 * (4 - t)); t++; }
    return sco;
  }

  const st = retaDe(mask);
  if (st >= 0) return (4 << 20) | st;

  if (trinca >= 0) {
    let sco = (3 << 20) | (trinca << 8), t = 0;
    for (let r = 12; r >= 0 && t < 2; r--) if (r !== trinca && rc[r]) { sco |= r << (4 * (1 - t)); t++; }
    return sco;
  }
  if (par1 >= 0 && par2 >= 0) {
    let k = -1;
    for (let r = 12; r >= 0; r--) if (r !== par1 && r !== par2 && rc[r]) { k = r; break; }
    return (2 << 20) | (par1 << 8) | (par2 << 4) | k;
  }
  if (par1 >= 0) {
    let sco = (1 << 20) | (par1 << 12), t = 0;
    for (let r = 12; r >= 0 && t < 3; r--) if (r !== par1 && rc[r]) { sco |= r << (4 * (2 - t)); t++; }
    return sco;
  }
  let sco = 0, t = 0;
  for (let r = 12; r >= 0 && t < 5; r--) if (rc[r]) { sco |= r << (4 * (4 - t)); t++; }
  return sco;
}

/* ---------------------------------------------------------------------------
   Range: notação "AKs, QQ, T9o, 76s" → combos, descontando cartas mortas.
   ------------------------------------------------------------------------ */
export function expandirRange(notacao, mortas = []) {
  const bloq = new Set(mortas);
  const combos = [];
  for (const item of notacao.split(",").map((s) => s.trim()).filter(Boolean)) {
    // combo específico com naipes: "AhKh", "Td9d"
    const esp = /^([2-9TJQKA])([shdc])([2-9TJQKA])([shdc])$/.exec(item);
    if (esp) {
      const c1 = RANKS.indexOf(esp[1]) * 4 + SUITS.indexOf(esp[2]);
      const c2 = RANKS.indexOf(esp[3]) * 4 + SUITS.indexOf(esp[4]);
      if (c1 === c2) throw new Error(`combo repetido: "${item}"`);
      if (!bloq.has(c1) && !bloq.has(c2)) combos.push([c1, c2]);
      continue;
    }
    const m = /^([2-9TJQKA])([2-9TJQKA])([so])?$/.exec(item);
    if (!m) throw new Error(`notação de range inválida: "${item}"`);
    const [, r1, r2, tipo] = m;
    const a = RANKS.indexOf(r1), b = RANKS.indexOf(r2);
    if (a === b) {
      if (tipo) throw new Error(`par não aceita sufixo: "${item}"`);
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
        const c1 = a * 4 + i, c2 = a * 4 + j;
        if (!bloq.has(c1) && !bloq.has(c2)) combos.push([c1, c2]);
      }
    } else if (tipo === "s") {
      for (let s = 0; s < 4; s++) {
        const c1 = a * 4 + s, c2 = b * 4 + s;
        if (!bloq.has(c1) && !bloq.has(c2)) combos.push([c1, c2]);
      }
    } else if (tipo === "o") {
      for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) {
        if (x === y) continue;
        const c1 = a * 4 + x, c2 = b * 4 + y;
        if (!bloq.has(c1) && !bloq.has(c2)) combos.push([c1, c2]);
      }
    } else {
      throw new Error(`mão sem par precisa de sufixo s ou o: "${item}"`);
    }
  }
  return combos;
}

/* ---------------------------------------------------------------------------
   Equity exata no RIVER: board completo, só comparar mãos feitas.
   ------------------------------------------------------------------------ */
export function equityRiver(heroi, board, rangeCombos) {
  if (board.length !== 5) throw new Error("river exige 5 cartas de board");
  const meu = avaliar7([...heroi, ...board]);
  let ganha = 0, empata = 0, perde = 0;
  for (const [v1, v2] of rangeCombos) {
    const dele = avaliar7([v1, v2, ...board]);
    if (meu > dele) ganha++; else if (meu === dele) empata++; else perde++;
  }
  const total = ganha + empata + perde;
  if (total === 0) throw new Error("range vazia depois dos bloqueadores");
  return { equity: (ganha + empata / 2) / total, ganha, empata, perde, total };
}

/* ---------------------------------------------------------------------------
   Equity exata no TURN: enumera todas as cartas de river possíveis.
   ------------------------------------------------------------------------ */
export function equityTurn(heroi, board, rangeCombos) {
  if (board.length !== 4) throw new Error("turn exige 4 cartas de board");
  const usadas = new Set([...heroi, ...board]);
  let acc = 0, casos = 0;
  for (const [v1, v2] of rangeCombos) {
    if (usadas.has(v1) || usadas.has(v2)) continue;
    const bloq = new Set([...usadas, v1, v2]);
    let g = 0, e = 0, n = 0;
    for (let r = 0; r < 52; r++) {
      if (bloq.has(r)) continue;
      const meu = avaliar7([...heroi, ...board, r]);
      const dele = avaliar7([v1, v2, ...board, r]);
      if (meu > dele) g++; else if (meu === dele) e++; else n++;
    }
    acc += (g + e / 2) / (g + e + n);
    casos++;
  }
  if (casos === 0) throw new Error("range vazia depois dos bloqueadores");
  return { equity: acc / casos, combos: casos };
}

/** Pot odds: fração do pote final que a chamada representa. */
export function potOdds(pagar, poteAntesDaChamada) {
  return pagar / (poteAntesDaChamada + pagar);
}
