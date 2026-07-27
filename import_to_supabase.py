"""
import_to_supabase.py  (roda no seu PC, uma vez, após gerar solutions.json)

Lê solutions.json ({ spot_id: [ {action, sizing, ev} ] }) e grava os gtoNodes
na coluna `gto_nodes` (jsonb) da tabela de drills no Supabase, via UPSERT por spot_id.

Pré-requisitos:
  pip install supabase
  Variáveis de ambiente (NÃO commitar):
    SUPABASE_URL         -> URL do projeto (Settings > API)
    SUPABASE_SERVICE_KEY -> service_role key (NÃO a anon; só use localmente)

SQL para criar a coluna (rode uma vez no SQL Editor do Supabase):
    alter table drills add column if not exists gto_nodes jsonb;
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

TABLE = "drills"          # ajuste se o nome da sua tabela for outro
ID_COLUMN = "spot_id"     # coluna que identifica o spot/mão


def main(solutions_path: str = "solutions.json") -> None:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        sys.exit("Defina SUPABASE_URL e SUPABASE_SERVICE_KEY no ambiente antes de rodar.")

    try:
        from supabase import create_client
    except ImportError:
        sys.exit("Instale a lib: pip install supabase")

    data = json.loads(Path(solutions_path).read_text(encoding="utf-8"))
    client = create_client(url, key)

    rows = [{ID_COLUMN: spot_id, "gto_nodes": nodes} for spot_id, nodes in data.items()]

    # UPSERT em blocos para não estourar payload
    CHUNK = 200
    total = 0
    for i in range(0, len(rows), CHUNK):
        batch = rows[i : i + CHUNK]
        client.table(TABLE).upsert(batch, on_conflict=ID_COLUMN).execute()
        total += len(batch)
        print(f"upsert {total}/{len(rows)}")

    print(f"OK: {total} spots gravados em {TABLE}.gto_nodes")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "solutions.json")
