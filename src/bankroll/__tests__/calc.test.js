import { describe, it, expect } from "vitest";
import { invested, net, aggregate, evolutionSeries, groupStats } from "../calc.js";

const S = [
  { date: "2025-01-01", format: "MTT",  buyIn: 100, reentries: 1, cashout: 0 },   // inv 200, net -200
  { date: "2025-01-02", format: "MTT",  buyIn: 100, reentries: 0, cashout: 500 }, // inv 100, net +400
  { date: "2025-01-03", format: "Cash", buyIn: 200, reentries: 0, cashout: 150 }, // inv 200, net -50
];

describe("calc", () => {
  it("investido considera reentradas", () => {
    expect(invested(S[0])).toBe(200);
    expect(net(S[0])).toBe(-200);
  });
  it("agrega lucro, ROI e ITM corretamente", () => {
    const a = aggregate(S);
    expect(a.totalInvested).toBe(500);
    expect(a.profit).toBe(150);
    expect(a.roi).toBe(30);        // 150/500
    expect(a.itm).toBe(50);        // 1 de 2 torneios no dinheiro
  });
  it("série de evolução é o acumulado ordenado por data", () => {
    expect(evolutionSeries(S).map((p) => p.value)).toEqual([-200, 200, 150]);
  });
  it("groupStats ordena do pior para o melhor", () => {
    const g = groupStats(S, "format");
    expect(g[0].key).toBe("Cash");
    expect(g[0].net).toBe(-50);
    expect(g[1].key).toBe("MTT");
    expect(g[1].net).toBe(200);
  });
});
