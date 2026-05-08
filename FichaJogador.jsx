import { useState, useEffect, useCallback } from "react";

// ─── Constantes ────────────────────────────────────────────────────────────────

const ATTRS = [
  { id: "forca",     nome: "Força",       star: false, custo: 1 },
  { id: "speed",     nome: "Speed",       star: false, custo: 1 },
  { id: "int",       nome: "Inteligência",star: false, custo: 1 },
  { id: "tecnica",   nome: "Técnica",     star: false, custo: 1 },
  { id: "sabedoria", nome: "Sabedoria",   star: false, custo: 1 },
  { id: "percepcao", nome: "Percepção",   star: true,  custo: 2 },
  { id: "dominio",   nome: "Domínio",     star: true,  custo: 2 },
  { id: "respeito",  nome: "Respeito",    star: true,  custo: 2 },
];

const CLASSES = ["TREINADOR", "PESQUISADOR", "RANGER", "COORDENADOR", "ESPECIALISTA"];

const XP_TABLE = [20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240];

const INITIAL_TEAM = [
  { nome: "Cottonee", nivel: 1 },
  { nome: "Chimchar", nivel: 5 },
  { nome: "Meowth",   nivel: 5 },
  { nome: "Bonsly",   nivel: 1 },
  { nome: "Yamask",   nivel: 5 },
];

const INITIAL_ATTRS = Object.fromEntries(ATTRS.map((a) => [a.id, 1]));

// ─── Subcomponentes SVG ─────────────────────────────────────────────────────────

const Pokeball = ({ size = 36, style }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={style}>
    <circle cx="20" cy="20" r="19" stroke="#FFDA00" strokeWidth="1.5" />
    <line x1="1" y1="20" x2="39" y2="20" stroke="#FFDA00" strokeWidth="1.2" />
    <path d="M1 20a19 19 0 0 1 38 0" fill="rgba(255,218,0,0.08)" />
    <circle cx="20" cy="20" r="5.5" stroke="#FFDA00" strokeWidth="1.5" fill="#0b0e1a" />
    <circle cx="20" cy="20" r="2.5" fill="#FFDA00" />
  </svg>
);

const MiniPokeball = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="14" cy="14" r="13" stroke="#FFDA00" strokeWidth="1" />
    <line x1="1" y1="14" x2="27" y2="14" stroke="#FFDA00" strokeWidth="0.8" />
    <path d="M1 14a13 13 0 0 1 26 0" fill="rgba(255,218,0,0.06)" />
    <circle cx="14" cy="14" r="4" stroke="#FFDA00" strokeWidth="1" fill="#0b0e1a" />
    <circle cx="14" cy="14" r="1.8" fill="#FFDA00" />
  </svg>
);

// ─── Estilos globais injetados ──────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Oxanium:wght@300;400;500;600;700&family=Press+Start+2P&display=swap');

  .ficha-root *, .ficha-root *::before, .ficha-root *::after {
    box-sizing: border-box;
  }
  .ficha-root input[type=number]::-webkit-inner-spin-button,
  .ficha-root input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .ficha-root input[type=number] { -moz-appearance: textfield; }

  .ficha-root input, .ficha-root select {
    background: #0e1220;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 6px;
    color: #F0EEE8;
    font-family: 'Oxanium', sans-serif;
    font-size: 15px;
    font-weight: 500;
    padding: 10px 14px;
    width: 100%;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    -webkit-appearance: none;
    appearance: none;
  }
  .ficha-root input:focus, .ficha-root select:focus {
    border-color: rgba(255,218,0,.4);
    box-shadow: 0 0 0 3px rgba(255,218,0,.06);
  }
  .ficha-root select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238A91A8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 12px;
    padding-right: 36px;
    cursor: pointer;
  }

  @keyframes fichaFadeSlide {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ficha-card-anim { animation: fichaFadeSlide .35s ease both; }
  .ficha-card-anim:nth-child(1) { animation-delay: .05s; }
  .ficha-card-anim:nth-child(2) { animation-delay: .10s; }
  .ficha-card-anim:nth-child(3) { animation-delay: .15s; }
  .ficha-card-anim:nth-child(4) { animation-delay: .20s; }
  .ficha-card-anim:nth-child(5) { animation-delay: .25s; }
  .ficha-card-anim:nth-child(6) { animation-delay: .30s; }

  .ficha-attr-card:hover { border-color: rgba(255,218,0,.2) !important; }
  .ficha-team-slot:hover { border-color: rgba(255,218,0,.2) !important; }
  .ficha-add-btn:hover   { opacity: .85; }
  .ficha-add-btn:active  { transform: scale(.96); }
  .ficha-btn-main:hover  { filter: brightness(1.12); }
  .ficha-btn-main:active { transform: scale(.97); }
  .ficha-btn-outline:hover { border-color: rgba(255,218,0,.3) !important; color: #FFDA00 !important; }
`;

// ─── Componente principal ───────────────────────────────────────────────────────

export default function FichaJogador() {
  const [nome, setNome]         = useState("Paulo");
  const [classe, setClasse]     = useState("TREINADOR");
  const [nivel, setNivel]       = useState(1);
  const [xp, setXp]             = useState(0);
  const [xpInput, setXpInput]   = useState("");
  const [dinheiro, setDinheiro] = useState(0);
  const [pontos, setPontos]     = useState(20);
  const [attrs, setAttrs]       = useState(INITIAL_ATTRS);
  const [saved, setSaved]       = useState(false);

  // Injeta fonte + keyframes uma única vez
  useEffect(() => {
    if (document.getElementById("ficha-global-styles")) return;
    const tag = document.createElement("style");
    tag.id = "ficha-global-styles";
    tag.textContent = GLOBAL_STYLES;
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);

  const xpNecessario = XP_TABLE[Math.min(nivel - 1, XP_TABLE.length - 1)];
  const xpPct        = Math.min(100, (xp / xpNecessario) * 100);

  const hp      = 20 + attrs.forca + nivel * 2;
  const stamina = 20 + attrs.forca + nivel * 2;
  const hab     = Math.max(1, Math.floor((attrs.int + attrs.tecnica) / 4));

  const ganharXP = useCallback(() => {
    const val = parseInt(xpInput);
    if (!val || val <= 0) return;

    let novoXp    = xp + val;
    let novoNivel = nivel;

    while (novoXp >= XP_TABLE[Math.min(novoNivel - 1, XP_TABLE.length - 1)] && novoNivel < 10) {
      novoXp -= XP_TABLE[Math.min(novoNivel - 1, XP_TABLE.length - 1)];
      novoNivel++;
    }
    setXp(novoXp);
    setNivel(novoNivel);
    setXpInput("");
  }, [xp, nivel, xpInput]);

  const addAttr = useCallback((id, custo) => {
    if (pontos < custo) return;
    setAttrs((prev) => ({ ...prev, [id]: prev[id] + 1 }));
    setPontos((p) => p - custo);
  }, [pontos]);

  const setAttrManual = useCallback((id, raw, custo) => {
    const novo = Math.max(1, parseInt(raw) || 1);
    const diff = novo - attrs[id];
    const custoDiff = diff * custo;
    if (diff > 0 && pontos < custoDiff) return;
    setAttrs((prev) => ({ ...prev, [id]: novo }));
    setPontos((p) => p - custoDiff);
  }, [attrs, pontos]);

  const resetar = () => {
    if (!window.confirm("Resetar todos os atributos base?")) return;
    setAttrs(INITIAL_ATTRS);
    setPontos(20);
  };

  const salvar = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  // ── Estilos inline reutilizáveis ──────────────────────────────────────────────

  const s = {
    root: {
      background: "#0b0e1a",
      color: "#F0EEE8",
      fontFamily: "'Rajdhani', sans-serif",
      minHeight: "100vh",
      padding: "2rem 1rem",
      position: "relative",
    },
    bg: {
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      background: "radial-gradient(ellipse 60% 40% at 80% 10%, rgba(255,218,0,.04) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 10% 90%, rgba(79,195,247,.04) 0%, transparent 60%)",
    },
    page: { maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 },
    card: {
      background: "#111525",
      border: "1px solid rgba(255,255,255,.07)",
      borderRadius: 16,
      padding: "1.5rem",
      marginBottom: "1rem",
      position: "relative",
      overflow: "hidden",
    },
    cardLine: {
      position: "absolute", top: 0, left: 0, right: 0, height: 2,
      background: "linear-gradient(90deg, transparent, rgba(255,218,0,.4), transparent)",
    },
    cardTitle: {
      fontFamily: "'Oxanium', sans-serif",
      fontSize: 11, fontWeight: 600, letterSpacing: "0.2em",
      textTransform: "uppercase", color: "#FFDA00",
      marginBottom: "1.25rem",
      display: "flex", alignItems: "center", gap: 8,
    },
    label: {
      fontFamily: "'Oxanium', sans-serif",
      fontSize: 11, letterSpacing: "0.18em",
      textTransform: "uppercase", color: "#4A5068",
      marginBottom: 6,
    },
    raised: {
      background: "#171d35",
      border: "1px solid rgba(255,255,255,.07)",
      borderRadius: 10,
      padding: "1rem 1.25rem",
    },
  };

  return (
    <div className="ficha-root" style={s.root}>
      <div style={s.bg} />

      <div style={s.page}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <Pokeball size={36} />
          <div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#FFDA00", letterSpacing: "0.08em", lineHeight: 1.7 }}>
              FICHA DO TREINADOR
            </div>
            <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 12, color: "#4A5068", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Sistema de RPG Pokémon
            </div>
          </div>
        </div>

        {/* ── Identidade ── */}
        <div className="ficha-card-anim" style={s.card}>
          <div style={s.cardLine} />
          <div style={s.cardTitle}>Identidade</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "end" }}>
            <div>
              <div style={s.label}>Nome do Personagem</div>
              <input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <div style={s.label}>Classe</div>
              <select value={classe} onChange={(e) => setClasse(e.target.value)} style={{ width: "auto", minWidth: 180 }}>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Experiência e Nível ── */}
        <div className="ficha-card-anim" style={s.card}>
          <div style={s.cardLine} />
          <div style={s.cardTitle}>Experiência e Nível</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#FFDA00", background: "rgba(255,218,0,.08)", border: "1px solid rgba(255,218,0,.2)", borderRadius: 6, padding: "6px 12px" }}>
              NÍVEL {nivel}
            </div>
            <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 12, color: "#8A91A8", letterSpacing: "0.1em" }}>
              {xp} / {xpNecessario} XP
            </div>
          </div>
          {/* Barra de XP */}
          <div style={{ background: "#0e1220", borderRadius: 99, height: 8, overflow: "hidden", marginBottom: "1rem", border: "1px solid rgba(255,255,255,.07)" }}>
            <div style={{ height: "100%", width: `${xpPct}%`, borderRadius: 99, background: "linear-gradient(90deg, #b89d00, #FFDA00)", transition: "width .6s cubic-bezier(.34,1.56,.64,1)", position: "relative" }}>
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 16, background: "rgba(255,255,255,.3)", filter: "blur(3px)" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number" value={xpInput} min={0}
              onChange={(e) => setXpInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ganharXP()}
              placeholder="Quantidade de XP"
            />
            <button className="ficha-btn-main" onClick={ganharXP} style={btnMain}>+ XP</button>
          </div>
        </div>

        {/* ── Recursos ── */}
        <div className="ficha-card-anim" style={s.card}>
          <div style={s.cardLine} />
          <div style={s.cardTitle}>Recursos</div>
          <div style={s.label}>Pokédólares</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 18, fontWeight: 700, color: "#FFDA00", background: "rgba(255,218,0,.08)", border: "1px solid rgba(255,218,0,.2)", borderRadius: 6, padding: "8px 14px" }}>₽</div>
            <input type="number" value={dinheiro} min={0} onChange={(e) => setDinheiro(Number(e.target.value))} style={{ width: 160 }} />
          </div>
        </div>

        {/* ── Atributos Derivados ── */}
        <div className="ficha-card-anim" style={s.card}>
          <div style={s.cardLine} />
          <div style={s.cardTitle}>Atributos Derivados</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
            <DerivedStat label="HP Máximo"      value={hp}      color="#FF4655" />
            <DerivedStat label="Stamina Máxima" value={stamina} color="#4FC3F7" />
            <DerivedStat label="Habilidade"     value={hab}     color="#4ADE80" />
          </div>
        </div>

        {/* ── Atributos Base ── */}
        <div className="ficha-card-anim" style={s.card}>
          <div style={s.cardLine} />
          <div style={s.cardTitle}>Atributos Base</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem", fontFamily: "'Oxanium', sans-serif", fontSize: 13, color: "#8A91A8" }}>
            Pontos disponíveis:
            <span style={{ background: "rgba(167,139,250,.12)", border: "1px solid rgba(167,139,250,.25)", borderRadius: 99, color: "#a78bfa", fontWeight: 700, fontSize: 14, padding: "2px 12px" }}>
              {pontos}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {ATTRS.map((a) => (
              <AttrCard
                key={a.id}
                attr={a}
                value={attrs[a.id]}
                pontosDisponiveis={pontos}
                onAdd={() => addAttr(a.id, a.custo)}
                onChange={(v) => setAttrManual(a.id, v, a.custo)}
              />
            ))}
          </div>
        </div>

        {/* ── Ações ── */}
        <div className="ficha-card-anim" style={{ display: "flex", gap: 10, marginBottom: "1rem" }}>
          <button
            className="ficha-btn-main"
            onClick={salvar}
            style={{ ...btnMain, padding: "12px 28px", fontSize: 14, borderRadius: 10, background: saved ? "#4ADE80" : "#FFDA00", color: saved ? "#0b0e1a" : "#0b0e1a", transition: "background .3s" }}
          >
            {saved ? "✓ Salvo!" : "Salvar ficha"}
          </button>
          <button
            className="ficha-btn-outline"
            onClick={resetar}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: "#8A91A8", cursor: "pointer", fontFamily: "'Oxanium', sans-serif", fontSize: 14, fontWeight: 700, padding: "12px 20px", letterSpacing: "0.08em", transition: "border-color .2s, color .2s" }}
          >
            Resetar atributos
          </button>
        </div>

        {/* ── Time ── */}
        <div className="ficha-card-anim" style={s.card}>
          <div style={s.cardLine} />
          <div style={s.cardTitle}>Time Principal</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const poke = INITIAL_TEAM[i];
              return (
                <div
                  key={i}
                  className="ficha-team-slot"
                  style={{ background: "#171d35", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, transition: "border-color .2s", opacity: poke ? 1 : 0.3 }}
                >
                  {poke ? (
                    <>
                      <MiniPokeball />
                      <div>
                        <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 13, fontWeight: 600, color: "#F0EEE8", lineHeight: 1.2 }}>{poke.nome}</div>
                        <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 11, color: "#4A5068", marginTop: 1 }}>Nv. {poke.nivel}</div>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 12, color: "#4A5068", textAlign: "center", width: "100%" }}>— vazio —</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Subcomponentes ─────────────────────────────────────────────────────────────

function DerivedStat({ label, value, color }) {
  return (
    <div style={{ background: "#171d35", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: "1rem 1.25rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: color }} />
      <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A91A8", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 20, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function AttrCard({ attr, value, pontosDisponiveis, onAdd, onChange }) {
  const podeAdicionar = pontosDisponiveis >= attr.custo;
  const corBtn = attr.custo > 1
    ? { bg: "rgba(255,218,0,.08)", border: "rgba(255,218,0,.25)", color: "#FFDA00" }
    : { bg: "rgba(167,139,250,.12)", border: "rgba(167,139,250,.25)", color: "#a78bfa" };

  return (
    <div className="ficha-attr-card" style={{ background: "#171d35", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: 12, transition: "border-color .2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A91A8" }}>
          {attr.nome}{attr.star && " ⭐"}
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#FFDA00" }}>{value}</div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          type="number" value={value} min={1}
          onChange={(e) => onChange(e.target.value)}
          style={{ textAlign: "center", padding: "6px 8px", fontSize: 14, minWidth: 0 }}
        />
        <button
          className="ficha-add-btn"
          onClick={onAdd}
          disabled={!podeAdicionar}
          style={{ background: corBtn.bg, border: `1px solid ${corBtn.border}`, borderRadius: 6, color: corBtn.color, cursor: podeAdicionar ? "pointer" : "not-allowed", fontFamily: "'Oxanium', sans-serif", fontSize: 10, fontWeight: 700, padding: "6px 8px", transition: "opacity .15s, transform .1s", whiteSpace: "nowrap", flexShrink: 0, opacity: podeAdicionar ? 1 : 0.35 }}
        >
          +1 <span style={{ opacity: .6, fontSize: 9 }}>({attr.custo}pt)</span>
        </button>
      </div>
    </div>
  );
}

// ─── Estilo reutilizável para botão principal ────────────────────────────────────

const btnMain = {
  background: "#FFDA00",
  border: "none",
  borderRadius: 6,
  color: "#0b0e1a",
  cursor: "pointer",
  fontFamily: "'Oxanium', sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.1em",
  padding: "0 18px",
  transition: "filter .15s, transform .1s",
  whiteSpace: "nowrap",
  flexShrink: 0,
};
