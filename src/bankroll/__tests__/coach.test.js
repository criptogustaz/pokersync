import { describe, it, expect } from "vitest";
import { buildCoachTips, drawdownBuyIns } from "../coach.js";

describe("coach", () => {
  it("sem dados retorna dica informativa", () => {
    const t = buildCoachTips([]);
    expect(t[0].id).toBe("empty");
  });
  it("detecta downswing >= 20 buy-ins como blunder de banca", () => {
    const s = [
      { date: "2025-02-01", format: "MTT", buyIn: 10, reentries: 0,  cashout: 110 }, // +100 (pico)
      { date: "2025-02-02", format: "MTT", buyIn: 10, reentries: 20, cashout: 0 },   // -210 -> dd 210 / avg 10 = 21bi
    ];
    expect(Math.round(drawdownBuyIns(s, 10))).toBe(21);
    const dd = buildCoachTips(s).find((x) => x.id === "dd");
    expect(dd.level).toBe("bad");
  });
  it("sinaliza momentum positivo em banca lucrativa e estável", () => {
    const s = [{ date: "2025-03-01", format: "Spin", buyIn: 10, reentries: 0, cashout: 30 }]; // +20, dd 0
    expect(buildCoachTips(s).some((x) => x.id === "up" && x.level === "good")).toBe(true);
  });
});
