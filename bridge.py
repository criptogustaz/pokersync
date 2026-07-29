"""
bridge.py  (ferramenta OFFLINE — roda no seu PC, não na Vercel)

Ponte em lote entre o PokerSync e o console_solver do TexasSolver (versão Qt).
Gera comandos no formato de parameters/toy_parameters, executa o solver e
exporta solutions.json no shape { spot_id: [ {action, sizing, ev} ] }.
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
# Helpers de range
# ---------------------------------------------------------------------------

def weight_range(hands: str, weight: float = 1.0) -> str:
    """Converte 'AA,KK,AKs' -> 'AA:1.000,KK:1.000,AKs:1.000' (formato exigido)."""
    out = []
    for h in hands.split(","):
        h = h.strip()
        if not h:
            continue
        out.append(h if ":" in h else f"{h}:{weight:.3f}")
    return ",".join(out)


# ---------------------------------------------------------------------------
# Estruturas
# ---------------------------------------------------------------------------

@dataclass
class Scenario:
    board: List[str]
    pot: float
    effective_stack: float
    oop_range: str
    ip_range: str
    bet_sizes: List[float] = field(default_factory=lambda: [50.0, 100.0])
    allin_threshold: float = 0.67
    accuracy: float = 0.5
    max_iteration: int = 200
    thread_num: int = 8
    spot_id: Optional[str] = None

    def signature(self) -> str:
        raw = json.dumps(
            {"board": sorted(self.board), "pot": self.pot, "stack": self.effective_stack,
             "oop": self.oop_range, "ip": self.ip_range, "sizes": sorted(self.bet_sizes)},
            sort_keys=True)
        return hashlib.sha1(raw.encode()).hexdigest()[:12]


@dataclass
class GtoNode:
    action: str
    sizing: float
    ev: float
    freq: float = 0.0


# ---------------------------------------------------------------------------
# Bridge
# ---------------------------------------------------------------------------


def _weighted_range(range_str: str) -> str:
    """Garante o formato 'MAO:peso' exigido pelo console_solver.
    'AA,KK,AKs' -> 'AA:1.000,KK:1.000,AKs:1.000'. Preserva pesos já informados."""
    hands = [h.strip() for h in range_str.split(",") if h.strip()]
    out = []
    for h in hands:
        out.append(h if ":" in h else f"{h}:1.000")
    return ",".join(out)


class TexasSolverBridge:
    DEFAULT_EXECUTABLE = r"C:\TexasSolver\console_solver.exe"

    def __init__(self, executable_path: str = DEFAULT_EXECUTABLE, timeout: int = 300) -> None:
        self.executable_path: Path = Path(executable_path)
        self.timeout: int = timeout

    def validate_executable(self) -> bool:
        return self.executable_path.is_file()

    # -- Input (formato toy_parameters da versão Qt) ---------------------

    def _build_command_script(self, s: Scenario, output_path: Path) -> str:
        oop = _weighted_range(s.oop_range)
        ip = _weighted_range(s.ip_range)
        sizes = ",".join(str(int(x)) for x in s.bet_sizes)
        lines = [
            f"set_pot {s.pot}",
            f"set_effective_stack {s.effective_stack}",
            f"set_board {','.join(s.board)}",
            f"set_range_oop {oop}",
            f"set_range_ip {ip}",
        ]
        # bet/raise/allin por posição e rua (segue o padrão do toy_parameters)
        for pos in ("oop", "ip"):
            for street in ("flop", "turn", "river"):
                lines.append(f"set_bet_sizes {pos},{street},bet,{sizes}")
                lines.append(f"set_bet_sizes {pos},{street},raise,{sizes}")
                lines.append(f"set_bet_sizes {pos},{street},allin")
        lines += [
            f"set_allin_threshold {s.allin_threshold}",
            "build_tree",
            f"set_thread_num {s.thread_num}",
            f"set_accuracy {s.accuracy}",
            f"set_max_iteration {s.max_iteration}",
            "set_print_interval 10",
            "start_solve",
            "set_dump_rounds 2",
            f"dump_result {str(output_path)}",
        ]
        return "\n".join(lines) + "\n"

    # -- Execução --------------------------------------------------------

    def _run_solver(self, script: str, output_path: Path) -> Dict:
        # roda a partir da pasta do solver (para achar resources/ranges)
        solver_dir = self.executable_path.parent
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False,
                                         encoding="ascii", dir=str(solver_dir)) as tmp:
            tmp.write(script)
            input_file = Path(tmp.name)
        try:
            creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0) if os.name == "nt" else 0
            proc = subprocess.run(
                [str(self.executable_path), "-i", input_file.name],
                capture_output=True, text=True, timeout=self.timeout,
                check=False, creationflags=creationflags, cwd=str(solver_dir),
            )
            if not output_path.exists():
                raise RuntimeError(
                    f"console_solver não gerou o dump.\n"
                    f"--- STDOUT ---\n{proc.stdout[-800:]}\n--- STDERR ---\n{proc.stderr[-400:]}"
                )
            return json.loads(output_path.read_text(encoding="utf-8"))
        finally:
            input_file.unlink(missing_ok=True)

    # -- Parsing ---------------------------------------------------------

    @staticmethod
    def _split_action_label(label: str) -> tuple[str, float]:
        parts = str(label).strip().split()
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
        # Nó raiz: actions + strategy.strategy { combo: [freqs] }. Sem EV no dump.
        strat = raw.get("strategy", {})
        actions: List[str] = strat.get("actions") or raw.get("actions") or []
        combos: Dict[str, List[float]] = strat.get("strategy", {})

        n = len(actions)
        totals = [0.0] * n
        for freqs in combos.values():
            for i in range(min(n, len(freqs))):
                totals[i] += float(freqs[i])
        denom = max(len(combos), 1)

        nodes: List[GtoNode] = []
        for i in range(n):
            action, sizing = cls._split_action_label(actions[i])
            freq = round(totals[i] / denom, 4)
            nodes.append(GtoNode(action=action, sizing=sizing, ev=0.0, freq=freq))
        return nodes

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
        return [GtoNode("CHECK", 0.0, 1.05), GtoNode("BET", size, 1.2), GtoNode("FOLD", 0.0, 0.0)]

    def solve_batch(self, scenarios: List[Scenario]) -> Dict[str, Dict]:
        """Resolve os spots (deduplicando iguais) e retorna, por spot_id:
        { board, pot, effective_stack, gto_nodes:[{action,sizing,ev,freq}] }."""
        cache: Dict[str, List[GtoNode]] = {}
        out: Dict[str, Dict] = {}
        total = len(scenarios)

        for idx, sc in enumerate(scenarios, 1):
            sig = sc.signature()
            if sig not in cache:
                print(f"[{idx}/{total}] solving spot {sig} ...")
                cache[sig] = self.solve(sc)
            else:
                print(f"[{idx}/{total}] spot {sig} (cache)")
            key = sc.spot_id or sig
            out[key] = {
                "board": sc.board,
                "pot": sc.pot,
                "effective_stack": sc.effective_stack,
                "gto_nodes": [asdict(n) for n in cache[sig]],
            }

        print(f"Concluído: {len(out)} spots ({len(cache)} solves únicos).")
        return out

    def export_solutions(self, scenarios: List[Scenario], out_path: str = "solutions.json") -> Path:
        data = self.solve_batch(scenarios)
        p = Path(out_path)
        p.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Escrito: {p.resolve()}")
        return p


def load_scenarios(path: str) -> List[Scenario]:
    items = json.loads(Path(path).read_text(encoding="utf-8"))
    return [Scenario(**item) for item in items]


if __name__ == "__main__":
    bridge = TexasSolverBridge()
    print("Executável válido:", bridge.validate_executable())

    scenarios = [
        Scenario(
            spot_id="hand_0001",
            board=["Qs", "Jh", "2h"], pot=50, effective_stack=200,
            oop_range="AA,KK,QQ,JJ,AKs,AQs,KQs,JTs",
            ip_range="AA,TT,99,A5s,KJs,QTs,T9s,76s",
            bet_sizes=[50.0, 100.0],
        ),
    ]
    bridge.export_solutions(scenarios, "solutions.json")
