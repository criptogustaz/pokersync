"""
modules/solver/bridge.py  (ferramenta OFFLINE — roda no seu PC, não na Vercel)

Ponte em lote entre o PokerSync e o executável local do TexasSolver.

Fluxo:
  spots (lista) -> deduplica -> TexasSolver resolve cada spot único ->
  extrai gtoNodes -> escreve solutions.json (pronto para importar no banco).

O JSON de saída usa EXATAMENTE o shape que src/engine/matchUserActionToGtoNode.js
consome: cada nó = { "action": str, "sizing": float, "ev": float }.
sizing = 0 para CHECK / FOLD / CALL.

Enquanto o binário real não está plugado, cai em mock automaticamente se o
executável não for encontrado, permitindo validar o pipeline ponta a ponta.
"""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
import tempfile
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Dict, List, Optional


# ---------------------------------------------------------------------------
# Estruturas
# ---------------------------------------------------------------------------

@dataclass
class Scenario:
    """Um spot a resolver."""
    board: List[str]
    pot: float
    effective_stack: float
    oop_range: str
    ip_range: str
    bet_sizes: List[float] = field(default_factory=lambda: [50.0])  # % do pot
    allin_threshold: float = 0.67
    accuracy: float = 0.5
    max_iteration: int = 200
    thread_num: int = 8
    spot_id: Optional[str] = None  # id lógico da mão/spot (para o banco)

    def signature(self) -> str:
        """Assinatura para deduplicar spots idênticos."""
        raw = json.dumps(
            {
                "board": sorted(self.board),
                "pot": self.pot,
                "stack": self.effective_stack,
                "oop": self.oop_range,
                "ip": self.ip_range,
                "sizes": sorted(self.bet_sizes),
            },
            sort_keys=True,
        )
        return hashlib.sha1(raw.encode()).hexdigest()[:12]


@dataclass
class GtoNode:
    """Nó de solução no shape consumido pelo matchUserActionToGtoNode.js."""
    action: str      # "CHECK" | "BET" | "RAISE" | "CALL" | "FOLD"
    sizing: float    # 0 para CHECK/FOLD/CALL
    ev: float


# ---------------------------------------------------------------------------
# Bridge
# ---------------------------------------------------------------------------

class TexasSolverBridge:
    DEFAULT_EXECUTABLE = "./texassolver/console_solver.exe"

    def __init__(self, executable_path: str = DEFAULT_EXECUTABLE, timeout: int = 300) -> None:
        self.executable_path: Path = Path(executable_path)
        self.timeout: int = timeout

    # -- Validação -------------------------------------------------------

    def validate_executable(self) -> bool:
        return self.executable_path.is_file()

    # -- Input -----------------------------------------------------------

    def _build_command_script(self, s: Scenario, output_path: Path) -> str:
        lines: List[str] = [
            f"set_pot {s.pot}",
            f"set_effective_stack {s.effective_stack}",
            f"set_board {','.join(s.board)}",
            f"set_range_oop {s.oop_range}",
            f"set_range_ip {s.ip_range}",
        ]
        sizes = ",".join(str(x) for x in s.bet_sizes)
        for pos in ("oop", "ip"):
            for street in ("flop", "turn", "river"):
                lines.append(f"set_bet_sizes {pos},{street},bet,{sizes}")
        lines += [
            f"set_allin_threshold {s.allin_threshold}",
            "build_tree",
            f"set_thread_num {s.thread_num}",
            f"set_accuracy {s.accuracy}",
            f"set_max_iteration {s.max_iteration}",
            "set_print_interval 0",
            "start_solve",
            "set_dump_rounds 2",
            f"dump_result {output_path.as_posix()}",
        ]
        return "\n".join(lines) + "\n"

    # -- Execução --------------------------------------------------------

    def _run_solver(self, script: str, output_path: Path) -> Dict:
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as tmp:
            tmp.write(script)
            input_file = Path(tmp.name)
        try:
            creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0) if os.name == "nt" else 0
            subprocess.run(
                [str(self.executable_path), "-i", str(input_file)],
                capture_output=True, text=True, timeout=self.timeout,
                check=True, creationflags=creationflags,
            )
            return json.loads(output_path.read_text(encoding="utf-8"))
        finally:
            input_file.unlink(missing_ok=True)

    # -- Parsing ---------------------------------------------------------

    @staticmethod
    def _split_action_label(label: str) -> tuple[str, float]:
        """
        Converte o rótulo do solver em (action, sizing).
        Ex.: "BET 50" -> ("BET", 50.0) ; "CHECK" -> ("CHECK", 0.0).
        NOTE: 'sizing' sai na mesma unidade que o solver reporta (% do pot).
        Ajuste aqui se o app espera bb em vez de % do pot.
        """
        parts = label.strip().split()
        action = parts[0].upper()
        sizing = 0.0
        if len(parts) > 1:
            try:
                sizing = float(parts[1])
            except ValueError:
                sizing = 0.0
        return action, sizing

    @classmethod
    def _parse_nodes(cls, raw: Dict) -> List[GtoNode]:
        """Extrai gtoNodes (action, sizing, ev) do JSON bruto do solver."""
        strat = raw.get("strategy", {})
        actions: List[str] = strat.get("actions", [])
        combos: Dict[str, List[float]] = strat.get("strategy", {})
        evs: List[float] = raw.get("ev_by_action") or []

        n = len(actions)
        freq_totals = [0.0] * n
        for freqs in combos.values():
            for i in range(min(n, len(freqs))):
                freq_totals[i] += float(freqs[i])
        denom = max(len(combos), 1)

        nodes: List[GtoNode] = []
        for i in range(n):
            action, sizing = cls._split_action_label(actions[i])
            # EV por ação: usa ev_by_action se houver; senão EV do spot ponderado pela freq.
            if i < len(evs):
                ev = float(evs[i])
            else:
                ev = round(float(raw.get("ev", 0.0)) * (freq_totals[i] / denom), 4)
            nodes.append(GtoNode(action=action, sizing=sizing, ev=round(ev, 4)))
        return nodes

    # -- Solve único -----------------------------------------------------

    def solve(self, scenario: Scenario) -> List[GtoNode]:
        with tempfile.TemporaryDirectory() as d:
            output_path = Path(d) / "result.json"
            if not self.validate_executable():
                return self._mock_nodes(scenario)
            script = self._build_command_script(scenario, output_path)
            raw = self._run_solver(script, output_path)
            return self._parse_nodes(raw)

    @staticmethod
    def _mock_nodes(scenario: Scenario) -> List[GtoNode]:
        size = scenario.bet_sizes[0] if scenario.bet_sizes else 50.0
        return [
            GtoNode(action="CHECK", sizing=0.0, ev=1.05),
            GtoNode(action="BET", sizing=size, ev=1.20),
            GtoNode(action="FOLD", sizing=0.0, ev=0.0),
        ]

    # -- Solve em LOTE ---------------------------------------------------

    def solve_batch(self, scenarios: List[Scenario]) -> Dict[str, List[Dict]]:
        """
        Resolve uma lista de spots, deduplicando os idênticos.
        Retorna { spot_id: [ {action, sizing, ev}, ... ] }.
        """
        cache: Dict[str, List[GtoNode]] = {}
        out: Dict[str, List[Dict]] = {}
        total = len(scenarios)

        for idx, sc in enumerate(scenarios, 1):
            sig = sc.signature()
            if sig not in cache:
                print(f"[{idx}/{total}] solving spot {sig} ...")
                cache[sig] = self.solve(sc)
            else:
                print(f"[{idx}/{total}] spot {sig} (cache)")
            key = sc.spot_id or sig
            out[key] = [asdict(n) for n in cache[sig]]

        print(f"Concluído: {len(out)} spots ({len(cache)} solves únicos).")
        return out

    def export_solutions(self, scenarios: List[Scenario], out_path: str = "solutions.json") -> Path:
        data = self.solve_batch(scenarios)
        p = Path(out_path)
        p.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Escrito: {p.resolve()}")
        return p


# ---------------------------------------------------------------------------
# Carregamento de spots a partir de um arquivo (spots.json)
# ---------------------------------------------------------------------------

def load_scenarios(path: str) -> List[Scenario]:
    """Lê spots.json (lista de objetos) e devolve List[Scenario]."""
    items = json.loads(Path(path).read_text(encoding="utf-8"))
    return [Scenario(**item) for item in items]


# ---------------------------------------------------------------------------
# Teste prático (mock data)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    bridge = TexasSolverBridge()
    print("Executável válido:", bridge.validate_executable())

    # Lista de spots fictícia (substitua por load_scenarios("spots.json") depois).
    scenarios = [
        Scenario(
            spot_id="hand_0001",
            board=["As", "Kd", "5c"], pot=100, effective_stack=500,
            oop_range="AA,KK,QQ,AKs,AKo", ip_range="AA,55,A5s,K5s,76s,J9s",
            bet_sizes=[50.0],
        ),
        Scenario(
            spot_id="hand_0002",
            board=["Th", "9h", "2c"], pot=60, effective_stack=400,
            oop_range="JJ,TT,99,QJs,KTs", ip_range="AA,22,T9s,87s,A2s",
            bet_sizes=[33.0, 75.0],
        ),
        # duplicata do primeiro spot com outro id -> resolvido 1x, aplicado aos 2
        Scenario(
            spot_id="hand_0003",
            board=["As", "Kd", "5c"], pot=100, effective_stack=500,
            oop_range="AA,KK,QQ,AKs,AKo", ip_range="AA,55,A5s,K5s,76s,J9s",
            bet_sizes=[50.0],
        ),
    ]

    path = bridge.export_solutions(scenarios, "solutions.json")
    print("\n=== Prévia solutions.json ===")
    print(path.read_text(encoding="utf-8")[:600])
