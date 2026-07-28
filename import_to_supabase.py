"""
import_to_supabase.py  (roda no seu PC, após gerar solutions.json)

Lê solutions.json no formato:
  { spot_id: { board, pot, effective_stack, gto_nodes:[{action,sizing,ev,freq}] } }
e faz UPSERT na tabela `drills` do Supabase (mão completa + solução).

Pré-requisitos:
  pip install supabase
  Variáveis de ambiente (NÃO commitar):
    SUPABASE_URL         -> URL do projeto (Settings > API)
    SUPABASE_SERVICE_ROLE_KEY -> service_role key (só localmente)

Schema esperado (já criado):
  drills(spot_id text pk, board text[], pot numeric, effective_stack numeric, gto_nodes jsonb)
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

TABLE = "drills"
ID_COLUMN = "spot_id"


def main(solutions_path: str = "solutions.json") -> None:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente antes de rodar.")

    try:
        from supabase import create_client
    except ImportError:
        sys.exit("Instale a lib: pip install supabase")

    data = json.loads(Path(solutions_path).read_text(encoding="utf-8"))
    if not data:
        sys.exit("solutions.json vazio — nada para importar.")

    client = create_client(url, key)

    rows = []
    for spot_id, spot in data.items():
        # compat: aceita tanto o formato novo (dict com metadados)
        # quanto o antigo (lista só de gto_nodes).
        if isinstance(spot, list):
            rows.append({ID_COLUMN: spot_id, "gto_nodes": spot})
        else:
            rows.append({
                ID_COLUMN: spot_id,
                "board": spot.get("board"),
                "pot": spot.get("pot"),
                "effective_stack": spot.get("effective_stack"),
                "gto_nodes": spot.get("gto_nodes"),
            })

    CHUNK = 200
    total = 0
    for i in range(0, len(rows), CHUNK):
        batch = rows[i : i + CHUNK]
        client.table(TABLE).upsert(batch, on_conflict=ID_COLUMN).execute()
        total += len(batch)
        print(f"upsert {total}/{len(rows)}")

    print(f"OK: {total} mãos gravadas em {TABLE}.")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "solutions.json")
