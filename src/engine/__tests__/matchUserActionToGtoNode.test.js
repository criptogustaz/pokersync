import { describe, it, expect } from "vitest";
import { matchUserActionToGtoNode } from "../matchUserActionToGtoNode.js";

const nodes = [
  { action: "RAISE", sizing: 2.5, ev: 1.2 },
  { action: "RAISE", sizing: 3.0, ev: 1.1 },
  { action: "FOLD", sizing: 0, ev: 0.0 },
];

describe("matchUserActionToGtoNode", () => {
  it("retorna PERFECT em jogada exata", () => {
    const r = matchUserActionToGtoNode({ action: "RAISE", sizing: 2.5 }, nodes);
    expect(r.verdict).toBe("PERFECT");
    expect(r.evLoss).toBe(0);
  });

  it("mapeia 2.7bb dentro da tolerancia sem falso blunder", () => {
    const r = matchUserActionToGtoNode({ action: "RAISE", sizing: 2.7 }, nodes);
    expect(r.verdict).toBe("PERFECT");
    expect(r.node.sizing).toBe(2.5);
  });

  it("retorna BLUNDER com perda exata de EV", () => {
    const r = matchUserActionToGtoNode({ action: "FOLD", sizing: 0 }, nodes);
    expect(r.verdict).toBe("BLUNDER");
    expect(r.evLoss).toBe(1.2);
  });
});
