-- Adiciona colunas de filtro na tabela drills.
-- Rodar no Supabase SQL Editor.

ALTER TABLE drills
  ADD COLUMN IF NOT EXISTS solution  text,     -- 'MTT' | 'Cash'
  ADD COLUMN IF NOT EXISTS format    text,     -- 'HeadsUP' | 'ChipEV' | 'ICM'
  ADD COLUMN IF NOT EXISTS stack_bb  int,      -- effective stack em BB
  ADD COLUMN IF NOT EXISTS position  text,     -- 'UTG' | 'CO' | 'BU' | 'SB' | 'BB' etc.
  ADD COLUMN IF NOT EXISTS street    text,     -- 'Pré-Flop' | 'Pós-Flop'
  ADD COLUMN IF NOT EXISTS action    text;     -- 'RFI' | 'vs Open' | 'vs 3-Bet' etc.

-- Índices para performance dos filtros
CREATE INDEX IF NOT EXISTS idx_drills_solution ON drills (solution);
CREATE INDEX IF NOT EXISTS idx_drills_position ON drills (position);
CREATE INDEX IF NOT EXISTS idx_drills_stack    ON drills (stack_bb);
CREATE INDEX IF NOT EXISTS idx_drills_action   ON drills (action);

COMMENT ON COLUMN drills.solution IS 'Tipo: MTT ou Cash';
COMMENT ON COLUMN drills.format   IS 'HeadsUP, ChipEV ou ICM';
COMMENT ON COLUMN drills.stack_bb IS 'Stack efetivo em big blinds';
COMMENT ON COLUMN drills.position IS 'Posição do herói: UTG, CO, BU, SB, BB etc.';
COMMENT ON COLUMN drills.street   IS 'Pré-Flop ou Pós-Flop';
COMMENT ON COLUMN drills.action   IS 'Cenário: RFI, vs Open, vs 3-Bet etc.';
