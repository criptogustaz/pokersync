import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   POKERSYNC — Training Mode v3
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── 4-Color Deck ───────────────────────────────────────────────────────────
const SUIT = {
  spades:   { fg: "#1a1a1a", glow: "#666",    g: "♠" },
  hearts:   { fg: "#e02020", glow: "#ff6666", g: "♥" },
  diamonds: { fg: "#1a7fdd", glow: "#66b3ff", g: "♦" },
  clubs:    { fg: "#158a3e", glow: "#55dd88", g: "♣" },
};

// ─── Position Colors ────────────────────────────────────────────────────────
const POS_CFG = {
  BB:      { bg: "#991b1b", ring: "#fca5a5" },
  SB:      { bg: "#92400e", ring: "#fbbf24" },
  BTN:     { bg: "#6d28d9", ring: "#a78bfa" },
  CO:      { bg: "#3b0764", ring: "#c4b5fd" },
  HJ:      { bg: "#1e3a5f", ring: "#60a5fa" },
  MP:      { bg: "#065f46", ring: "#34d399" },
  "UTG+1": { bg: "#075985", ring: "#38bdf8" },
  UTG:     { bg: "#075985", ring: "#38bdf8" },
};

// ─── Chip tiers ─────────────────────────────────────────────────────────────
const CHIP_TIERS = [
  { bg: "#e8e8e8", rim: "#bbb", center: "#f4f4f4", min: 0,   max: 0.9  },
  { bg: "#cc2222", rim: "#8b0000", center: "#ee5555", min: 1,   max: 4.9  },
  { bg: "#1e8a3e", rim: "#0f5c28", center: "#3cc466", min: 5,   max: 24.9 },
  { bg: "#1a5fbb", rim: "#0d3d7a", center: "#3d8ee8", min: 25,  max: 99.9 },
  { bg: "#1c1c1c", rim: "#000",    center: "#444",    min: 100, max: 9999 },
];
const getChip = (bb) => CHIP_TIERS.find(c => bb >= c.min && bb <= c.max) || CHIP_TIERS[0];

// ─── Seat angles: Hero(BB)=270°=bottom, clockwise ──────────────────────────
const ANGLES = [270, 226, 182, 138, 90, 42, 358, 315];
const EX = 42, EY = 36;
const seatPos = (a) => {
  const r = a * Math.PI / 180;
  return { x: 50 + EX * Math.cos(r), y: 50 + EY * Math.sin(r) };
};

// ─── Player data ────────────────────────────────────────────────────────────
const mkCard = (r, s, v = false) => ({ rank: r, suit: s, visible: v });
const PLAYERS = [
  { id:0, pos:"BB",   stack:60,  cards:[mkCard("A","spades",true), mkCard("K","hearts",true)],  hero:true,  dealer:false, active:true,  bet:1,   folded:false },
  { id:7, pos:"SB",   stack:67,  cards:[mkCard("5","spades"),      mkCard("6","hearts")],       hero:false, dealer:false, active:true,  bet:0.5, folded:false },
  { id:6, pos:"BTN",  stack:83,  cards:[mkCard("A","clubs"),       mkCard("K","diamonds")],     hero:false, dealer:true,  active:true,  bet:0,   folded:false },
  { id:5, pos:"CO",   stack:44,  cards:[mkCard("J","hearts"),      mkCard("10","clubs")],       hero:false, dealer:false, active:false, bet:0,   folded:false },
  { id:4, pos:"HJ",   stack:105, cards:[mkCard("K","clubs"),       mkCard("Q","diamonds")],     hero:false, dealer:false, active:true,  bet:3,   folded:false },
  { id:3, pos:"MP",   stack:38,  cards:[mkCard("9","diamonds"),    mkCard("9","clubs")],        hero:false, dealer:false, active:false, bet:0,   folded:true  },
  { id:2, pos:"UTG+1",stack:72,  cards:[mkCard("Q","hearts"),      mkCard("J","spades")],       hero:false, dealer:false, active:true,  bet:3,   folded:false },
  { id:1, pos:"UTG",  stack:49,  cards:[mkCard("7","clubs"),       mkCard("2","diamonds")],     hero:false, dealer:false, active:false, bet:0,   folded:true  },
];

const BOARD = [
  mkCard("A","diamonds",true), mkCard("K","spades",true), mkCard("7","hearts",true),
  mkCard("2","clubs",false),   mkCard("J","diamonds",false),
];

const bb = v => v % 1 === 0 ? `${v}` : v.toFixed(1);

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Logo SVG (recreation of original) ──────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
        {/* Back card */}
        <rect x="10" y="4" width="24" height="32" rx="3" stroke="#fff" strokeWidth="2.2" fill="none" transform="rotate(-12 22 20)" />
        {/* Front card */}
        <rect x="14" y="8" width="24" height="32" rx="3" stroke="#fff" strokeWidth="2.2" fill="none" transform="rotate(6 26 24)" />
        {/* Spade on front card */}
        <g transform="translate(24,22) rotate(6) scale(0.7)">
          <path d="M0,-8 C-4,-4 -8,0 -8,4 C-8,7 -5,9 -2,8 C-1,7.5 0,7 0,7 C0,7 1,7.5 2,8 C5,9 8,7 8,4 C8,0 4,-4 0,-8Z" fill="#fff"/>
          <path d="M0,6 C-1,8 -2,11 -3,12 L3,12 C2,11 1,8 0,6Z" fill="#fff"/>
        </g>
        {/* Speed lines */}
        <line x1="38" y1="18" x2="44" y2="18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        <line x1="39" y1="22" x2="46" y2="22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        <line x1="38" y1="26" x2="44" y2="26" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      </svg>
      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 22, letterSpacing: "0.22em", color: "#fff", lineHeight: 1 }}>
        <span style={{ fontWeight: 700 }}>POKER</span>
        <span style={{ fontWeight: 300 }}>SYNC</span>
      </span>
    </div>
  );
}

// ─── 3D Chip SVG ────────────────────────────────────────────────────────────
function Chip3D({ amountBB, size = 22 }) {
  const c = getChip(amountBB);
  const rx = size * 0.5, ry = size * 0.28, depth = size * 0.22;
  const cx = size / 2, cyT = ry + 1, cyB = cyT + depth, H = cyB + ry + 2;
  const uid = `ch${c.min}-${size}`;
  return (
    <svg width={size} height={H} viewBox={`0 0 ${size} ${H}`} style={{ flexShrink: 0, display: "block" }}>
      <defs>
        <linearGradient id={`s${uid}`} x1="0%" x2="100%"><stop offset="0%" stopColor={c.rim}/><stop offset="30%" stopColor={c.bg}/><stop offset="70%" stopColor={c.bg}/><stop offset="100%" stopColor={c.rim}/></linearGradient>
        <radialGradient id={`f${uid}`} cx="40%" cy="35%" r="65%"><stop offset="0%" stopColor={c.center}/><stop offset="55%" stopColor={c.bg}/><stop offset="100%" stopColor={c.rim}/></radialGradient>
      </defs>
      <ellipse cx={cx} cy={cyB} rx={rx} ry={ry} fill={c.rim}/>
      <path d={`M${cx-rx},${cyT}L${cx-rx},${cyB}a${rx},${ry} 0 0 0 ${rx*2},0L${cx+rx},${cyT}a${rx},${ry} 0 0 1 ${-rx*2},0`} fill={`url(#s${uid})`}/>
      {[...Array(8)].map((_,i)=>{const a=(i/8)*Math.PI;const x1=cx+rx*Math.cos(Math.PI+a);return<line key={i} x1={x1} y1={cyT+ry*.15} x2={x1} y2={cyB-ry*.15} stroke="rgba(255,255,255,.55)" strokeWidth={.8}/>})}
      <ellipse cx={cx} cy={cyT} rx={rx} ry={ry} fill={`url(#f${uid})`} stroke={c.rim} strokeWidth={.8}/>
      <ellipse cx={cx} cy={cyT} rx={rx*.72} ry={ry*.72} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth={.8}/>
      <ellipse cx={cx} cy={cyT} rx={rx*.46} ry={ry*.46} fill={c.center} stroke="rgba(255,255,255,.3)" strokeWidth={.5}/>
      <ellipse cx={cx-rx*.15} cy={cyT-ry*.28} rx={rx*.28} ry={ry*.14} fill="rgba(255,255,255,.22)"/>
    </svg>
  );
}

function ChipStack({ amountBB, count = 3, size = 18 }) {
  const ry = size*.28, depth = size*.22, chipH = ry*2+depth+3, slice = depth;
  const stackH = chipH + slice*(count-1);
  return (
    <div style={{ position:"relative", width:size, height:stackH, flexShrink:0 }}>
      {[...Array(count)].map((_,i)=>(
        <div key={i} style={{ position:"absolute", top:(count-1-i)*slice, left:0, filter:`brightness(${.7+(i/Math.max(count-1,1))*.3})` }}>
          <Chip3D amountBB={amountBB} size={size}/>
        </div>
      ))}
    </div>
  );
}

// ─── Countdown Clock (only on hero) ─────────────────────────────────────────
function Clock({ seconds, total = 30 }) {
  const sz = 38;
  const col = seconds > 15 ? "#2ecc71" : seconds > 8 ? "#f59e0b" : "#ef4444";
  const cx = sz/2, cy = sz/2, R = sz/2-2, rA = sz/2-5;
  const circ = 2*Math.PI*rA, dash = circ*(seconds/total);
  const elapsed = total - seconds;
  const ang = (elapsed/total)*360-90;
  const hx = cx + R*.65*Math.cos(ang*Math.PI/180);
  const hy = cy + R*.65*Math.sin(ang*Math.PI/180);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, flexShrink:0 }}>
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
        <circle cx={cx} cy={cy} r={R} fill="rgba(0,0,0,.85)" stroke="rgba(255,255,255,.1)" strokeWidth={1}/>
        {[...Array(12)].map((_,i)=>{const a=(i*30-90)*Math.PI/180;const mj=i%3===0;const r0=mj?R-4:R-2.5;return<line key={i} x1={cx+r0*Math.cos(a)} y1={cy+r0*Math.sin(a)} x2={cx+R*Math.cos(a)} y2={cy+R*Math.sin(a)} stroke={mj?"rgba(255,255,255,.35)":"rgba(255,255,255,.15)"} strokeWidth={mj?1.2:.7}/>;
        })}
        <circle cx={cx} cy={cy} r={rA} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={2.5}/>
        <circle cx={cx} cy={cy} r={rA} fill="none" stroke={col} strokeWidth={2.5} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} style={{ transition:"stroke-dasharray 1s linear, stroke .4s" }}/>
        <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={col} strokeWidth={1.2} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={1.8} fill={col}/>
      </svg>
      <span style={{ fontSize:12, fontWeight:900, color:col, fontFamily:"'JetBrains Mono',monospace", lineHeight:1, textShadow: seconds<=10?`0 0 8px ${col}88`:"none" }}>{seconds}s</span>
    </div>
  );
}

// ─── Card (NO face figures — all cards show suit glyph center) ───────────────
function CardFace({ card, w, h }) {
  if (!card.visible) return (
    <div style={{ width:w, height:h, borderRadius:Math.max(3,w*.1), background:"linear-gradient(145deg,#143320,#081910)", border:"1.5px solid rgba(46,204,113,.22)", boxShadow:"0 3px 10px rgba(0,0,0,.8)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:3, borderRadius:3, border:"1px solid rgba(46,204,113,.14)", backgroundImage:"repeating-linear-gradient(45deg,rgba(46,204,113,.04) 0,rgba(46,204,113,.04) 2px,transparent 2px,transparent 7px)" }}/>
      <span style={{ fontSize:h*.3, color:"rgba(46,204,113,.14)", fontFamily:"serif" }}>♠</span>
    </div>
  );

  const s = SUIT[card.suit];
  const isBlack = card.suit === "spades";
  const padV = Math.max(2, Math.round(h*.05));
  const padH = Math.max(2, Math.round(w*.08));
  const rSz = Math.min(14, Math.max(7, Math.round(h*.18)));
  const gSm = Math.min(11, Math.max(5, Math.round(rSz*.8)));
  const usedV = 2*(rSz+gSm+3)+2*padV;
  const gLg = Math.max(gSm+4, Math.min(w*.75, h-usedV));
  const outline = isBlack ? "0.5px #555" : "none";

  return (
    <div style={{ width:w, height:h, borderRadius:Math.max(3,w*.1), background:"linear-gradient(160deg,#fefffe,#f0f7eb)", border:`1.5px solid ${isBlack?"#99aaa0":s.fg+"99"}`, boxShadow:`0 5px 20px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.7) inset, 0 0 14px ${s.glow}44`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between", padding:`${padV}px ${padH}px`, userSelect:"none", overflow:"hidden", boxSizing:"border-box" }}>
      <div style={{ alignSelf:"flex-start", display:"flex", flexDirection:"column", alignItems:"center", lineHeight:1, gap:1 }}>
        <span style={{ fontSize:rSz, fontWeight:900, color:s.fg, fontFamily:"'Rajdhani',sans-serif", lineHeight:1, WebkitTextStroke:outline }}>{card.rank}</span>
        <span style={{ fontSize:gSm, color:s.fg, fontFamily:"serif", lineHeight:1, WebkitTextStroke:outline }}>{s.g}</span>
      </div>
      {/* ALL cards: central suit glyph only */}
      <span style={{ fontSize:gLg, color:s.fg, fontFamily:"serif", lineHeight:1, filter:`drop-shadow(0 2px 8px ${s.glow}bb)`, WebkitTextStroke:outline }}>{s.g}</span>
      <div style={{ alignSelf:"flex-end", display:"flex", flexDirection:"column", alignItems:"center", lineHeight:1, gap:1, transform:"rotate(180deg)" }}>
        <span style={{ fontSize:rSz, fontWeight:900, color:s.fg, fontFamily:"'Rajdhani',sans-serif", lineHeight:1, WebkitTextStroke:outline }}>{card.rank}</span>
        <span style={{ fontSize:gSm, color:s.fg, fontFamily:"serif", lineHeight:1, WebkitTextStroke:outline }}>{s.g}</span>
      </div>
    </div>
  );
}

// ─── Flying Chip Animation ──────────────────────────────────────────────────
function FlyingChips({ chips, onDone }) {
  return (
    <>
      <style>{`
        @keyframes flyChip {
          0% { transform: translate(0,0) scale(1); opacity:1; }
          80% { opacity:1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(.5); opacity:0; }
        }
      `}</style>
      {chips.map(c => (
        <div key={c.id} style={{
          position:"fixed", left:c.from.x, top:c.from.y, zIndex:9999, pointerEvents:"none",
          "--dx": `${c.to.x - c.from.x}px`, "--dy": `${c.to.y - c.from.y}px`,
          animation: `flyChip .45s cubic-bezier(.4,0,.2,1) forwards`,
          animationDelay: `${c.delay||0}ms`,
        }} onAnimationEnd={() => onDone(c.id)}>
          <Chip3D amountBB={c.amountBB} size={22}/>
        </div>
      ))}
    </>
  );
}

// ─── Seat ───────────────────────────────────────────────────────────────────
function Seat({ player, angle, seatRef, countdown }) {
  const { x, y } = seatPos(angle);
  const cfg = POS_CFG[player.pos];
  const isH = player.hero;
  const avatarSz = isH ? 50 : 36;
  const cW = isH ? 38 : 20;
  const cH = isH ? 54 : 28;
  const chipSz = isH ? 20 : 16;

  const showCard = (card) => player.hero ? { ...card, visible:true } : player.folded ? card : { ...card, visible:false };

  return (
    <div ref={seatRef} style={{
      position:"absolute", left:`${x}%`, top:`${y}%`, transform:"translate(-50%,-50%)",
      zIndex: isH?20:6, display:"flex", flexDirection:"column", alignItems:"center", gap:4,
      pointerEvents:"none",
      filter: player.folded ? "grayscale(.85) opacity(.3)" : "none",
      transition: "filter .3s",
    }}>
      {/* Dealer button */}
      {player.dealer && (
        <div style={{ position:"absolute", top:-4, right: isH ? -8 : -6, zIndex:30, width:20, height:20, borderRadius:"50%", background:"linear-gradient(135deg,#ffe033,#f59e0b)", border:"2px solid #fff", boxShadow:"0 2px 10px rgba(0,0,0,.7), 0 0 12px rgba(250,200,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:900, color:"#1a0a00", fontFamily:"'Rajdhani',sans-serif" }}>D</div>
      )}

      {/* Avatar row: clock (hero only) + circle */}
      <div style={{ display:"flex", alignItems:"center", gap: isH ? 8 : 0 }}>
        {isH && countdown !== undefined && <Clock seconds={countdown} total={30}/>}
        <div style={{
          width:avatarSz, height:avatarSz, borderRadius:"50%",
          background: isH ? "linear-gradient(135deg,#2ecc71,#14a348)" : `linear-gradient(145deg,${cfg.bg}ee,${cfg.bg})`,
          border:`${isH?3:2}px solid ${player.active && !player.folded ? cfg.ring : "rgba(255,255,255,.07)"}`,
          boxShadow: player.active && !player.folded ? `0 0 18px ${cfg.ring}88, 0 0 6px ${cfg.ring}44` : "0 3px 12px rgba(0,0,0,.7)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize: isH ? 16 : 12, fontWeight:900, color:"#fff",
          fontFamily:"'Rajdhani',sans-serif", letterSpacing:".05em", flexShrink:0,
        }}>
          {player.pos}
        </div>
      </div>

      {/* Stack — bigger text */}
      <div style={{
        fontSize: isH ? 15 : 12, color:"#2ecc71",
        fontFamily:"'JetBrains Mono',monospace", fontWeight:700, lineHeight:1,
        textShadow:"0 0 10px rgba(46,204,113,.4)",
        display:"flex", alignItems:"baseline", gap:3,
      }}>
        <span style={{ fontSize: isH ? 18 : 14, fontWeight:900 }}>{bb(player.stack)}</span>
        <span style={{ opacity:.6, fontSize: isH ? 12 : 10 }}>BB</span>
      </div>

      {/* Hole cards */}
      {!player.folded && (
        <div style={{ display:"flex", gap:4 }}>
          <CardFace card={showCard(player.cards[0])} w={cW} h={cH}/>
          <CardFace card={showCard(player.cards[1])} w={cW} h={cH}/>
        </div>
      )}

      {/* Bet chip + amount */}
      {player.bet > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
          <ChipStack amountBB={player.bet} count={Math.min(3, Math.max(1, Math.ceil(player.bet/3)))} size={chipSz}/>
          <div style={{ padding:"2px 8px", borderRadius:99, background:"#f8c300", color:"#000", fontSize: isH?12:9, fontWeight:900, fontFamily:"'JetBrains Mono',monospace", boxShadow:"0 2px 8px rgba(0,0,0,.8)", whiteSpace:"nowrap" }}>
            {bb(player.bet)} BB
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Poker Table ────────────────────────────────────────────────────────────
function PokerTable({ players, heroSeatRef, potRef, countdown }) {
  const pot = players.reduce((s,p)=>s+p.bet, 0);
  return (
    <div style={{ position:"relative", width:"100%", paddingBottom:"72%", overflow:"visible" }}>
      {/* Rail */}
      <div style={{ position:"absolute", top:"9%", left:"5%", right:"5%", bottom:"9%", borderRadius:"50%", background:"linear-gradient(145deg,#52341a 0%,#2e1c0b 55%,#1a0d04 100%)", boxShadow:"0 14px 70px rgba(0,0,0,.98), inset 0 3px 8px rgba(255,200,80,.06), 0 0 0 2px rgba(255,220,120,.07) inset" }}>
        {/* Felt */}
        <div style={{ position:"absolute", inset:14, borderRadius:"50%", background:"radial-gradient(ellipse at 50% 35%,#22753d 0%,#134826 50%,#08240f 100%)", boxShadow:"inset 0 10px 50px rgba(0,0,0,.75), inset 0 0 140px rgba(0,0,0,.45)", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:"6%", borderRadius:"50%", border:"1px solid rgba(255,255,255,.04)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", left:"50%", top:"13%", transform:"translateX(-50%)", fontSize:10, fontWeight:900, letterSpacing:".55em", color:"rgba(255,255,255,.04)", fontFamily:"'Rajdhani',sans-serif", whiteSpace:"nowrap", pointerEvents:"none" }}>POKERSYNC</div>

          {/* Board */}
          <div style={{ position:"absolute", left:"50%", top:"42%", transform:"translate(-50%,-62%)", display:"flex", flexDirection:"column", alignItems:"center", gap:7 }}>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:".25em", color:"rgba(255,255,255,.18)", fontFamily:"'JetBrains Mono',monospace" }}>FLOP · TURN · RIVER</div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              {BOARD.map((card,i)=>(
                <div key={i} style={{ position:"relative" }}>
                  <CardFace card={card} w={46} h={66}/>
                  {!card.visible && <div style={{ position:"absolute", bottom:4, left:0, right:0, textAlign:"center", fontSize:7, color:"rgba(46,204,113,.2)", fontFamily:"'JetBrains Mono',monospace" }}>{i===3?"TURN":"RIVER"}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Pot */}
          <div ref={potRef} style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,28px)", display:"flex", alignItems:"center", gap:7, padding:"5px 16px", borderRadius:99, background:"rgba(248,195,0,.1)", border:"1px solid rgba(248,195,0,.28)" }}>
            <Chip3D amountBB={pot} size={18}/>
            <span style={{ fontSize:15, fontWeight:900, color:"#f8c300", fontFamily:"'JetBrains Mono',monospace" }}>{bb(pot)} BB</span>
          </div>
        </div>
      </div>

      {/* Seats */}
      {players.map((p,i)=>(
        <Seat key={p.id} player={p} angle={ANGLES[i]} seatRef={p.hero ? heroSeatRef : undefined} countdown={p.hero ? countdown : undefined}/>
      ))}
    </div>
  );
}

// ─── Betting Controls (3 fixed sizes only, no slider) ───────────────────────
const SIZES = [
  { label: "½ POT",  mult: 0.5  },
  { label: "¾ POT",  mult: 0.75 },
  { label: "POT",    mult: 1    },
];

function BettingControls({ pot, heroStack, onAction }) {
  const callAmt = 2;
  const btnFont = { fontFamily:"'Rajdhani',sans-serif", fontWeight:900, letterSpacing:".08em", cursor:"pointer", transition:"transform .1s, box-shadow .15s" };

  return (
    <div style={{ background:"rgba(0,0,0,.6)", border:"1px solid rgba(46,204,113,.14)", borderRadius:16, padding:16, display:"flex", flexDirection:"column", gap:12 }}>
      {/* Raise size presets */}
      <div style={{ display:"flex", gap:8 }}>
        {SIZES.map(s => {
          const val = Math.max(callAmt*2, Math.min(heroStack, Math.round(pot*s.mult*2)/2));
          return (
            <button key={s.label} onClick={() => onAction("raise", val)} style={{
              flex:1, padding:"10px 0", borderRadius:10, fontSize:13, ...btnFont,
              background:"rgba(46,204,113,.08)", color:"#2ecc71",
              border:"1px solid rgba(46,204,113,.2)",
              boxShadow:"0 2px 10px rgba(0,0,0,.4)",
            }}>
              <div>{s.label}</div>
              <div style={{ fontSize:10, opacity:.6, marginTop:2 }}>{bb(val)} BB</div>
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        <button onClick={() => onAction("fold")} style={{
          padding:"14px 0", borderRadius:11, fontSize:15, ...btnFont,
          background:"linear-gradient(160deg,#3d1010,#1e0808)", color:"#f87171",
          border:"1px solid rgba(248,113,113,.28)", boxShadow:"0 4px 14px rgba(0,0,0,.6)",
        }}>FOLD</button>

        <button onClick={() => onAction("call", callAmt)} style={{
          padding:"14px 0", borderRadius:11, fontSize:15, ...btnFont,
          background:"linear-gradient(160deg,#153d22,#0a2214)", color:"#2ecc71",
          border:"1px solid rgba(46,204,113,.33)", boxShadow:"0 4px 14px rgba(0,0,0,.6)",
        }}>
          <div>CALL</div>
          <div style={{ fontSize:10, marginTop:2, opacity:.7 }}>{callAmt} BB</div>
        </button>

        <button onClick={() => onAction("allin", heroStack)} style={{
          padding:"14px 0", borderRadius:11, fontSize:15, ...btnFont,
          background:"linear-gradient(135deg,#7c3aed,#4c1d95)", color:"#e9d5ff",
          border:"1px solid rgba(167,139,250,.3)", boxShadow:"0 4px 20px rgba(124,58,237,.4)",
        }}>
          <div>ALL IN</div>
          <div style={{ fontSize:10, marginTop:2, opacity:.7 }}>{heroStack} BB</div>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════
let flyId = 0;

export default function App() {
  const [players, setPlayers] = useState(PLAYERS);
  const [countdown, setCountdown] = useState(30);
  const [flyChips, setFlyChips] = useState([]);
  const heroSeatEl = useRef(null);
  const potEl = useRef(null);

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => setCountdown(c => c <= 1 ? 30 : c - 1), 1000);
    return () => clearInterval(id);
  }, []);

  const heroPlayer = players.find(p => p.hero);
  const pot = players.reduce((s,p) => s + p.bet, 0);

  const handleAction = useCallback((type, amount) => {
    if (type === "fold") {
      setPlayers(prev => prev.map(p => p.hero ? { ...p, folded: true } : p));
      setCountdown(30);
      return;
    }
    if (type === "check") { setCountdown(30); return; }

    const betBB = type === "call" ? 2 : (amount || 0);
    const actual = Math.min(betBB, heroPlayer.stack);

    // Spawn flying chips
    if (heroSeatEl.current && potEl.current) {
      const hr = heroSeatEl.current.getBoundingClientRect();
      const pr = potEl.current.getBoundingClientRect();
      const numChips = Math.min(6, Math.max(2, Math.ceil(actual / 5)));
      for (let i = 0; i < numChips; i++) {
        const id = ++flyId;
        setTimeout(() => {
          setFlyChips(prev => [...prev, {
            id,
            from: { x: hr.left + hr.width/2 - 11 + (i - numChips/2)*4, y: hr.top + hr.height/2 - 11 },
            to:   { x: pr.left + pr.width/2 - 11, y: pr.top + pr.height/2 - 11 },
            amountBB: actual,
            delay: i * 50,
          }]);
        }, i * 50);
      }
    }

    setTimeout(() => {
      setPlayers(prev => prev.map(p => p.hero ? { ...p, bet: p.bet + actual, stack: p.stack - actual } : p));
      setCountdown(30);
    }, 400);
  }, [heroPlayer]);

  const removeChip = useCallback((id) => {
    setFlyChips(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <div style={{ minHeight:"100vh", width:"100%", background:"#000000", fontFamily:"'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;500;600;700&family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@400;600;700;900&display=swap');`}</style>

      {/* Header */}
      <header style={{ position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", background:"rgba(0,0,0,.97)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <Logo/>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:99, background:"rgba(46,204,113,.07)", border:"1px solid rgba(46,204,113,.14)" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#2ecc71" }}/>
          <span style={{ fontSize:10, fontWeight:800, color:"#2ecc71", fontFamily:"'JetBrains Mono',monospace", letterSpacing:".06em" }}>TRAINING · MTT 40bb</span>
        </div>
      </header>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"12px" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Table */}
          <div style={{ borderRadius:20, padding:16, background:"rgba(12,24,16,.6)", border:"1px solid rgba(46,204,113,.1)" }}>
            <PokerTable
              players={players}
              heroSeatRef={el => { heroSeatEl.current = el; }}
              potRef={el => { potEl.current = el; }}
              countdown={countdown}
            />
          </div>

          {/* Betting */}
          <BettingControls pot={pot} heroStack={heroPlayer.stack} onAction={handleAction}/>
        </div>
      </div>

      {/* Flying chips overlay */}
      <FlyingChips chips={flyChips} onDone={removeChip}/>
    </div>
  );
}
