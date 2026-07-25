// app/api/drills/next/route.ts
//
// GET /api/drills/next?stack=25&position=BTN&potType=3BET&street=RIVER&exclude=srp-01,srp-02
//
// Contrato: ou devolve um drill cuja resposta é confiável, ou devolve 404 com
// motivo. Nunca devolve um drill heurístico como se fosse gabarito — é o mesmo
// princípio do motor: melhor "nada encontrado" do que um falso positivo.

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma, Position, PotType, Street, Confidence, MathMethod } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

/* ---------------------------------------------------------------------------
   1. VALIDAÇÃO DA ENTRADA
   Query param é entrada de usuário. Nada chega ao banco sem passar por aqui.
   ------------------------------------------------------------------------ */
const QuerySchema = z.object({
  // stack tolera faixa: ?stack=25 pega drills entre 20 e 30bb
  stack: z.coerce.number().int().min(1).max(500).optional(),
  stackTolerance: z.coerce.number().int().min(0).max(100).default(5),
  position: z.nativeEnum(Position).optional(),
  villainPosition: z.nativeEnum(Position).optional(),
  potType: z.nativeEnum(PotType).optional(),
  street: z.nativeEnum(Street).optional(),
  texture: z.string().min(2).max(120).optional(),
  // ids já vistos nesta sessão, para não repetir
  exclude: z.string().max(2000).optional()
    .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 200) : [])),
  // por padrão só o que é calculável; passe includeHeuristic=1 para estudo livre
  includeHeuristic: z.coerce.boolean().default(false),
}).strict();   // parâmetro desconhecido é erro, não é ignorado

/* ---------------------------------------------------------------------------
   2. MONTAGEM DO FILTRO
   ------------------------------------------------------------------------ */
function montarWhere(q: z.infer<typeof QuerySchema>): Prisma.DrillWhereInput {
  const where: Prisma.DrillWhereInput = { isActive: true };

  // O filtro de confiança é o coração da rota: sem ele, dado heurístico
  // vazaria para o usuário como se fosse verdade calculada.
  if (!q.includeHeuristic) {
    where.mathMethod = { in: [MathMethod.EXACT_ENUMERATION, MathMethod.NASH_EQUILIBRIUM, MathMethod.SOLVER_IMPORT] };
    where.confidence = { in: [Confidence.EXACT, Confidence.EXACT_GIVEN_RANGE] };
  }

  if (q.stack !== undefined) {
    where.stackBbs = {
      gte: new Prisma.Decimal(Math.max(1, q.stack - q.stackTolerance)),
      lte: new Prisma.Decimal(q.stack + q.stackTolerance),
    };
  }
  if (q.position) where.heroPosition = q.position;
  if (q.villainPosition) where.villainPosition = q.villainPosition;
  if (q.potType) where.potType = q.potType;
  if (q.street) where.street = q.street;
  if (q.texture) where.boardTexture = { contains: q.texture, mode: "insensitive" };
  if (q.exclude.length) where.id = { notIn: q.exclude };

  return where;
}

/* ---------------------------------------------------------------------------
   3. SORTEIO
   count + skip aleatório: uma consulta barata e uniformemente distribuída,
   sem ORDER BY random() varrendo a tabela inteira.
   ------------------------------------------------------------------------ */
async function sortearDrill(where: Prisma.DrillWhereInput) {
  const total = await prisma.drill.count({ where });
  if (total === 0) return { total, drill: null };

  const skip = Math.floor(Math.random() * total);
  const [drill] = await prisma.drill.findMany({
    where,
    skip,
    take: 1,
    include: { options: { orderBy: { ordering: "asc" } } },
  });
  return { total, drill };
}

/* ---------------------------------------------------------------------------
   4. FORMATAÇÃO PARA O FRONTEND
   A resposta correta NÃO vai junto — senão qualquer um lê no devtools. O
   frontend envia a escolha para POST /api/drills/answer e recebe o veredito.
   ------------------------------------------------------------------------ */
function formatar(d: NonNullable<Awaited<ReturnType<typeof sortearDrill>>["drill"]>) {
  const n = (x: Prisma.Decimal) => Number(x);
  return {
    id: d.id,
    hand: d.heroHand.split(" "),
    board: d.board.split(" "),
    street: d.street,
    hero: { position: d.heroPosition, stackBbs: n(d.stackBbs) },
    villain: { position: d.villainPosition, betBbs: n(d.betBbs), betPctPot: d.betPctPot },
    pot: { bbs: n(d.potBbs), afterBetBbs: n(d.potBbs) + n(d.betBbs), spr: n(d.spr) },
    context: {
      potType: d.potType,
      boardTexture: d.boardTexture,
      note: d.scenarioNote,
      potOddsNeededPct: n(d.potOddsNeededPct),   // o preço é público: é o que se treina
    },
    options: d.options.map((o) => ({
      id: o.id,
      action: o.action,
      amountBbs: n(o.amountBbs),
      // isCorrect e evBbs ficam de fora de propósito
    })),
    provenance: {
      method: d.mathMethod,
      confidence: d.confidence,
      caveat: d.caveat,
    },
  };
}

/* ---------------------------------------------------------------------------
   5. HANDLER
   ------------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  const bruto = Object.fromEntries(req.nextUrl.searchParams.entries());

  const parsed = QuerySchema.safeParse(bruto);
  if (!parsed.success) {
    return NextResponse.json({
      error: "PARAMETROS_INVALIDOS",
      message: "Um ou mais filtros são inválidos.",
      issues: parsed.error.issues.map((i) => ({ campo: i.path.join("."), problema: i.message })),
    }, { status: 400 });
  }

  const q = parsed.data;

  try {
    const where = montarWhere(q);
    const { total, drill } = await sortearDrill(where);

    if (!drill) {
      // 404 explicando o motivo, para o frontend poder afrouxar o filtro
      const semFiltroDeConfianca = await prisma.drill.count({
        where: { ...where, mathMethod: undefined, confidence: undefined },
      });
      return NextResponse.json({
        error: "NENHUM_DRILL_ENCONTRADO",
        message: semFiltroDeConfianca > 0
          ? "Existem cenários com estes filtros, mas nenhum com precisão garantida."
          : "Nenhum cenário corresponde a estes filtros.",
        filtrosAplicados: q,
        candidatosSemFiltroDeConfianca: semFiltroDeConfianca,
      }, { status: 404 });
    }

    return NextResponse.json(
      { drill: formatar(drill), poolSize: total },
      { status: 200, headers: { "Cache-Control": "no-store" } },   // sorteio nunca é cacheado
    );

  } catch (e) {
    // Fail-safe: erro de banco não vaza stack trace nem devolve dado pela metade
    console.error("[GET /api/drills/next]", e);
    return NextResponse.json(
      { error: "FALHA_INTERNA", message: "Não foi possível buscar um cenário agora." },
      { status: 500 },
    );
  }
}

/* ===========================================================================
   ROTA COMPANHEIRA — app/api/drills/answer/route.ts
   Fica aqui como referência: é ela que guarda a resposta e devolve o veredito.
   Mover para o próprio arquivo antes de usar.
   =========================================================================

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const AnswerSchema = z.object({
  drillId: z.string().min(1).max(64),
  optionId: z.string().min(1).max(64),
  timeMs: z.number().int().min(0).max(600000),
  sessionId: z.string().min(1).max(64).optional(),
}).strict();

export async function POST(req: NextRequest) {
  const parsed = AnswerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "PAYLOAD_INVALIDO" }, { status: 400 });
  }
  const { drillId, optionId, timeMs, sessionId } = parsed.data;
  const userId = await pegarUsuarioDaSessao(req);          // sua autenticação aqui
  if (!userId) return NextResponse.json({ error: "NAO_AUTENTICADO" }, { status: 401 });

  const drill = await prisma.drill.findUnique({
    where: { id: drillId }, include: { options: true },
  });
  if (!drill) return NextResponse.json({ error: "DRILL_INEXISTENTE" }, { status: 404 });

  const escolhida = drill.options.find((o) => o.id === optionId);
  if (!escolhida) return NextResponse.json({ error: "OPCAO_INEXISTENTE" }, { status: 400 });

  const correta = drill.options.find((o) => o.isCorrect)!;
  const acertou = escolhida.id === correta.id;
  // custo do erro = diferença de EV entre a melhor ação e a escolhida
  const evPerdido = acertou ? 0 : Number(correta.evBbs) - Number(escolhida.evBbs);

  await prisma.drillResponse.create({
    data: {
      userId, drillId, sessionId,
      chosenOptionId: escolhida.id,
      chosenAction: escolhida.action,
      isCorrect: acertou,
      evLostBbs: new Prisma.Decimal(Math.max(0, evPerdido).toFixed(2)),
      timeMs,
      snapshotPosition: drill.heroPosition,
      snapshotPotType: drill.potType,
      snapshotStreet: drill.street,
      snapshotStackBbs: drill.stackBbs,
      snapshotTexture: drill.boardTexture,
    },
  });

  // só DEPOIS de registrar é que o gabarito é revelado
  return NextResponse.json({
    correct: acertou,
    correctAction: correta.action,
    evLostBbs: Number(Math.max(0, evPerdido).toFixed(2)),
    math: {
      equityPct: Number(drill.equityPct),
      potOddsNeededPct: Number(drill.potOddsNeededPct),
      marginPp: Number(drill.marginPp),
    },
    villainRange: {
      value: drill.rangeValueNotation,
      worse: drill.rangeWorseNotation,
      totalCombos: drill.rangeTotalCombos,
    },
    explanation: drill.explanation,
    caveat: drill.caveat,
  });
}
========================================================================== */
