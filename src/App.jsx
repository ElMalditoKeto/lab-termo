import React, { useState, useEffect } from 'react';

// ─── DENSITY kg/m³ for film consumption ───────────────────────────────────────
const DENSITY_PVC  = 1380; // PVC termocontraíble típico
const DENSITY_PETG = 1270;

const PRESETS = [
  { n:'CC 3×2 PET',    botT:3,botL:2,dia:70.5,alt:211.5,altCil:105,tapa:30.1,solape:70, micron:50,canales:2,modo:'inverso',bobina:645,tipoFilm:'arte', paso:740 },
  { n:'Lata 330ml 3×2',botT:3,botL:2,dia:66,  alt:122,  altCil:100,tapa:54,  solape:60, micron:50,canales:2,modo:'inverso',bobina:560,tipoFilm:'cristal',paso:500 },
  { n:'PET 500ml 3×2', botT:3,botL:2,dia:65,  alt:230,  altCil:145,tapa:28,  solape:70, micron:50,canales:2,modo:'inverso',bobina:580,tipoFilm:'arte', paso:770 },
  { n:'Agua 1.5L 2×2', botT:2,botL:2,dia:91,  alt:300,  altCil:190,tapa:38,  solape:80, micron:60,canales:2,modo:'inverso',bobina:560,tipoFilm:'arte', paso:900 },
];

// ─── SMALL COMPONENTS ──────────────────────────────────────────────────────────

function SectionHeader({ num, label }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2"
         style={{ borderBottom: '1px solid #e5e5e5', background: '#fafafa' }}>
      <span className="text-[9px] font-mono font-black text-white bg-[#E61C24] px-1.5 py-0.5 leading-none">
        {num}
      </span>
      <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[3px]">{label}</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
      {children}
    </div>
  );
}

const inp = "w-full bg-white border border-gray-300 px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#E61C24] rounded-none transition-colors";
const inpRed = "w-full bg-red-50 border border-[#E61C24] px-2 py-1.5 text-sm font-mono font-bold text-[#CC0000] focus:outline-none rounded-none";
const inpAmber = "w-full bg-amber-50 border border-amber-400 px-2 py-1.5 text-sm font-mono font-bold text-amber-800 focus:outline-none rounded-none";

// ─── TOGGLE BUTTON PAIR ────────────────────────────────────────────────────────
function Toggle({ value, onChange, options }) {
  return (
    <div className="flex" style={{ border: '1px solid #d1d5db' }}>
      {options.map(({ val, label }) => (
        <button key={val} onClick={() => onChange(val)}
          className="flex-1 py-1.5 text-[10px] font-mono font-bold transition-colors"
          style={{
            background: value === val ? '#111111' : '#ffffff',
            color:      value === val ? '#ffffff' : '#6b7280',
          }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── VALIDATION ────────────────────────────────────────────────────────────────
function validate(f) {
  const warns = [];
  if (f.altCil > f.alt)       warns.push(`Alt. cilíndrica (${f.altCil}) > alt. total (${f.alt})`);
  if (f.tapa >= f.dia)        warns.push(`Ø tapa (${f.tapa}) ≥ Ø botella (${f.dia})`);
  if (f.solape < 20)          warns.push('Solape < 20 mm — riesgo de apertura');
  if (f.botT < 1 || f.botL < 1) warns.push('Disposición mínima: 1×1');
  if (f.micron < 30)          warns.push('Espesor < 30 µm — fuera de rango habitual');
  return warns;
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {

  // ── INPUTS ──
  const [botT,     setBotT]     = useState(3);
  const [botL,     setBotL]     = useState(2);
  const [dia,      setDia]      = useState(70.5);
  const [alt,      setAlt]      = useState(211.5);
  const [altCil,   setAltCil]   = useState(105);
  const [tapa,     setTapa]     = useState(30.1);
  const [solape,   setSolape]   = useState(70);
  const [micron,   setMicron]   = useState(50);
  const [canales,  setCanales]  = useState(2);
  const [modo,     setModo]     = useState('inverso');
  const [orejaM,   setOrejaM]   = useState(55.5);
  const [bobinaM,  setBobinaM]  = useState(645);
  const [tipoFilm, setTipoFilm] = useState('arte');
  const [pasoArte, setPasoArte] = useState(740);
  const [producto, setProducto] = useState('');
  const [cliente,  setCliente]  = useState('');

  // producción
  const [cantPacks,    setCantPacks]    = useState(1000);
  const [metrosBobina, setMetrosBobina] = useState(3000);
  const [densidad,     setDensidad]     = useState(DENSITY_PVC);

  // UI
  const [configs,   setConfigs]  = useState(() => { try { return JSON.parse(localStorage.getItem('lt_v2') || '[]'); } catch { return []; } });
  const [cfgName,   setCfgName]  = useState('');
  const [showSave,  setShowSave] = useState(false);
  const [showLoad,  setShowLoad] = useState(false);

  // ── CALCULATED ──
  const [packT,       setPackT]      = useState(0);
  const [packL,       setPackL]      = useState(0);
  const [oreja,       setOreja]      = useState(0);
  const [canal,       setCanal]      = useState(0);
  const [bobTotal,    setBobTotal]   = useState(0);
  const [corte,       setCorte]      = useState(0);
  const [totalSReal,  setTotalSReal] = useState(0);
  const [pts,         setPts]        = useState({ A:0,B:0,C:0,D:0,E:0,F:0 });

  useEffect(() => {
    const pT = botT * dia;
    const pL = botL * dia;
    setPackT(pT);
    setPackL(pL);

    let orC, canC, bobC;
    if (modo === 'directo') {
      orC  = orejaM;
      canC = pT + orC * 2;
      bobC = canC * canales;
    } else {
      bobC = bobinaM;
      canC = bobC / canales;
      orC  = (canC - pT) / 2;
    }
    setOreja(Math.max(0, orC));
    setCanal(canC);
    setBobTotal(bobC);

    const anchoTop = (botL - 1) * dia + tapa;
    const wT  = (dia - tapa) / 2;
    const hT  = Math.max(0, alt - altCil);
    const lT  = Math.sqrt(hT * hT + wT * wT);

    const A = pL / 2 + solape / 2;
    const B = A + altCil;
    const C = B + lT;
    const D = C + anchoTop;
    const E = D + lT;
    const F = E + altCil;
    const totalS = F + pL / 2 + solape / 2;

    setTotalSReal(totalS);
    setPts({ A, B, C, D, E, F });
    setCorte(tipoFilm === 'arte' ? pasoArte : totalS);
  }, [botT,botL,dia,alt,altCil,tapa,solape,orejaM,bobinaM,tipoFilm,pasoArte,canales,modo]);

  // ── DERIVED PRODUCTION ──
  const mLinPack    = corte / 1000;
  const m2Pack      = (bobTotal / 1000) * (corte / 1000);
  const kgPack      = m2Pack * (micron / 1_000_000) * densidad;
  const packsEnBobina = metrosBobina > 0 ? Math.floor((metrosBobina * 1000) / corte) : 0;
  const mLinLote    = cantPacks * mLinPack;
  const kgLote      = cantPacks * kgPack;
  const deltaArte   = pasoArte - totalSReal;
  const warnings    = validate({ altCil, alt, tapa, dia, solape, botT, botL, micron });

  // ── CONFIG PERSISTENCE ──
  const applyConfig = (p) => {
    setBotT(p.botT);   setBotL(p.botL);   setDia(p.dia);
    setAlt(p.alt);     setAltCil(p.altCil); setTapa(p.tapa);
    setSolape(p.solape); setMicron(p.micron); setCanales(p.canales);
    setModo(p.modo);
    setBobinaM(p.bobina   ?? p.bobinaM  ?? 645);
    setTipoFilm(p.tipoFilm ?? p.tf       ?? 'arte');
    setPasoArte(p.paso    ?? p.pasoArte  ?? 740);
    if (p.modo === 'directo') setOrejaM(p.orejaM ?? 55.5);
  };

  const saveConfig = () => {
    if (!cfgName.trim()) return;
    const c = {
      n: cfgName, t: new Date().toLocaleDateString('es-AR'),
      botT,botL,dia,alt,altCil,tapa,solape,micron,canales,modo,
      orejaM,bobinaM,tipoFilm,pasoArte,bobina:bobinaM,paso:pasoArte,tf:tipoFilm,
    };
    const nc = [...configs, c];
    setConfigs(nc);
    localStorage.setItem('lt_v2', JSON.stringify(nc));
    setCfgName(''); setShowSave(false);
  };

  const deleteCfg = (i) => {
    const nc = configs.filter((_, j) => j !== i);
    setConfigs(nc);
    localStorage.setItem('lt_v2', JSON.stringify(nc));
  };

  // ── SVG PLAN VIEW ──
  const ML = 95, MR = 90, MT = 50, MB = 60;
  const packXStart = (corte - packL) / 2;
  const today = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });

  const solapeHalf = solape / 2;
  const wT = (dia - tapa) / 2;
  const hT = Math.max(0, alt - altCil);

  // Build side film path showing each bottle's neck peak
  const sideFilmParts = [
    `M ${-solapeHalf} ${alt}`,
    `L 0 ${alt}`,
    `L 0 ${alt - altCil}`,
  ];
  for (let i = 0; i < botL; i++) {
    const neckLeft  = i * dia + (dia - tapa) / 2;
    const neckRight = i * dia + (dia + tapa) / 2;
    sideFilmParts.push(`L ${neckLeft} 0`);
    sideFilmParts.push(`L ${neckRight} 0`);
    if (i < botL - 1) sideFilmParts.push(`L ${(i + 1) * dia} ${alt - altCil}`);
  }
  sideFilmParts.push(`L ${packL} ${alt - altCil}`);
  sideFilmParts.push(`L ${packL} ${alt}`);
  sideFilmParts.push(`L ${packL + solapeHalf} ${alt}`);
  const sideFilmPath = sideFilmParts.join(' ');

  const sidePoints = [
    ['A', -solapeHalf,                          alt,          -1],
    ['B', 0,                                     alt - altCil, -1],
    ['C', (dia - tapa) / 2,                     0,            -1],
    ['D', (botL - 1) * dia + (dia + tapa) / 2,  0,             1],
    ['E', packL,                                 alt - altCil,  1],
    ['F', packL + solapeHalf,                    alt,           1],
  ];

  // ── RENDER ──
  return (
    <div className="min-h-screen p-4" style={{ background: '#1a1a1a' }}>
      <div className="max-w-[1500px] mx-auto">

        {/* ══ DRAWING SHEET ══════════════════════════════════════════════════════ */}
        <div className="print-sheet bg-white" style={{ border: '2px solid #111', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>

          {/* ── HEADER ── */}
          <div className="no-print" style={{ borderBottom: '2px solid #111' }}>
            <div className="flex items-stretch flex-wrap">

              {/* Logo Coca-Cola style */}
              <div className="flex items-center gap-0" style={{ borderRight: '2px solid #111' }}>
                <div className="px-5 py-3" style={{ background: '#E61C24' }}>
                  <div className="text-2xl font-black text-white leading-none tracking-tight">LAB</div>
                  <div className="text-2xl font-black text-white leading-none tracking-tight">TERMO</div>
                </div>
                <div className="px-4 py-3 bg-white">
                  <div className="text-[8px] font-mono text-gray-400 uppercase tracking-[4px]">Film</div>
                  <div className="text-[8px] font-mono text-gray-400 uppercase tracking-[4px]">Termocontraíble</div>
                  <div className="text-[8px] font-mono text-gray-400 uppercase tracking-[4px]">Calculador</div>
                </div>
              </div>

              {/* Presets */}
              <div className="px-4 py-2 flex flex-col justify-center" style={{ borderRight: '1px solid #e5e5e5' }}>
                <div className="text-[8px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">Presets</div>
                <div className="flex gap-1 flex-wrap">
                  {PRESETS.map((p, i) => (
                    <button key={i} onClick={() => applyConfig(p)}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold transition-colors"
                      style={{ border: '1px solid #d1d5db', background: '#fff', color: '#374151' }}
                      onMouseEnter={e => { e.target.style.background='#E61C24'; e.target.style.color='#fff'; e.target.style.borderColor='#E61C24'; }}
                      onMouseLeave={e => { e.target.style.background='#fff'; e.target.style.color='#374151'; e.target.style.borderColor='#d1d5db'; }}>
                      {p.n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save/Load */}
              <div className="px-4 py-2 flex flex-col justify-center" style={{ borderRight: '1px solid #e5e5e5' }}>
                <div className="text-[8px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">Configuraciones</div>
                <div className="flex gap-1">
                  <button onClick={() => { setShowSave(!showSave); setShowLoad(false); }}
                    className="px-2.5 py-1 text-[10px] font-mono font-bold transition-colors"
                    style={{ border: '1px solid #16a34a', color: '#16a34a', background: '#fff' }}>
                    + Guardar
                  </button>
                  <button onClick={() => { setShowLoad(!showLoad); setShowSave(false); }}
                    className="px-2.5 py-1 text-[10px] font-mono font-bold transition-colors"
                    style={{ border: '1px solid #2563eb', color: '#2563eb', background: '#fff' }}>
                    Cargar ({configs.length})
                  </button>
                </div>
              </div>

              {/* Print */}
              <div className="px-4 py-2 flex items-center ml-auto">
                <button onClick={() => window.print()}
                  className="px-4 py-2 text-[10px] font-mono font-bold text-white transition-colors"
                  style={{ background: '#111', border: '1px solid #111' }}>
                  ▤ IMPRIMIR / PDF
                </button>
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="px-4 py-2 flex gap-3 items-center flex-wrap"
                   style={{ background: '#fff7ed', borderTop: '1px solid #fed7aa' }}>
                <span className="text-[9px] font-mono font-black text-amber-700 uppercase tracking-wider">⚠ Advertencias:</span>
                {warnings.map((w, i) => (
                  <span key={i} className="text-[9px] font-mono text-amber-700 border border-amber-300 px-2 py-0.5 bg-white">{w}</span>
                ))}
              </div>
            )}

            {/* Save dialog */}
            {showSave && (
              <div className="px-4 py-2 flex gap-2 items-center flex-wrap"
                   style={{ background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
                <span className="text-[10px] font-mono text-gray-600">Nombre:</span>
                <input value={cfgName} onChange={e => setCfgName(e.target.value)}
                  placeholder="ej: CC 3×2 PET Córdoba"
                  onKeyDown={e => e.key === 'Enter' && saveConfig()}
                  className="border border-gray-400 px-2 py-1 text-sm font-mono w-64 focus:outline-none" />
                <button onClick={saveConfig}
                  className="px-3 py-1 text-white text-[10px] font-mono font-bold"
                  style={{ background: '#16a34a' }}>Guardar</button>
                <button onClick={() => setShowSave(false)}
                  className="px-3 py-1 text-white text-[10px] font-mono"
                  style={{ background: '#9ca3af' }}>×</button>
              </div>
            )}

            {/* Load dialog */}
            {showLoad && (
              <div className="px-4 py-2" style={{ background: '#eff6ff', borderTop: '1px solid #bfdbfe' }}>
                {configs.length === 0
                  ? <span className="text-[10px] font-mono text-gray-500">Sin configuraciones guardadas.</span>
                  : <div className="flex flex-wrap gap-2">
                      {configs.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white px-2 py-1"
                             style={{ border: '1px solid #bfdbfe' }}>
                          <button onClick={() => { applyConfig(c); setShowLoad(false); }}
                            className="text-[10px] font-mono text-blue-700 hover:text-blue-900">
                            {c.n} <span className="text-gray-400 text-[9px]">({c.t})</span>
                          </button>
                          <button onClick={() => deleteCfg(i)}
                            className="text-red-400 hover:text-red-600 text-xs leading-none">✕</button>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}
          </div>

          {/* ── BODY ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', borderBottom: '2px solid #111' }}>

            {/* ─────────── LEFT — INPUTS ─────────── */}
            <div style={{ borderRight: '2px solid #111', background: '#fafafa' }}>

              {/* 01 DISPOSICIÓN */}
              <div style={{ borderBottom: '1px solid #e5e5e5' }}>
                <SectionHeader num="01" label="Disposición" />
                <div className="p-3 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Bot. Transv. (Y)">
                      <input type="number" value={botT} onChange={e => setBotT(+e.target.value)} className={inp} />
                    </Field>
                    <Field label="Bot. Long. (X)">
                      <input type="number" value={botL} onChange={e => setBotL(+e.target.value)} className={inp} />
                    </Field>
                  </div>
                  <Field label="Ø Botella (mm)">
                    <input type="number" step="0.1" value={dia} onChange={e => setDia(+e.target.value)} className={inp} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Alt. Total (mm)">
                      <input type="number" step="0.1" value={alt} onChange={e => setAlt(+e.target.value)} className={inp} />
                    </Field>
                    <Field label="Alt. Cilíndrica">
                      <input type="number" step="0.1" value={altCil}
                        onChange={e => setAltCil(+e.target.value)}
                        className={altCil > alt ? `${inp} border-red-500 bg-red-50` : inp} />
                    </Field>
                  </div>
                  <Field label="Ø Tapa / Cuello (mm)">
                    <input type="number" step="0.1" value={tapa} onChange={e => setTapa(+e.target.value)} className={inpRed} />
                  </Field>
                </div>
              </div>

              {/* 02 DIMENSIONAMIENTO */}
              <div style={{ borderBottom: '1px solid #e5e5e5' }}>
                <SectionHeader num="02" label="Dimensionamiento" />
                <div className="p-3 space-y-2.5">
                  <Field label="Horno">
                    <select value={canales} onChange={e => setCanales(+e.target.value)} className={inp}>
                      <option value={1}>Monocanal</option>
                      <option value={2}>Doble Canal</option>
                    </select>
                  </Field>
                  <Field label="Solape Inferior (mm)">
                    <input type="number" step="0.1" value={solape} onChange={e => setSolape(+e.target.value)} className={inp} />
                  </Field>

                  {/* Modo cálculo */}
                  <div className="p-2.5" style={{ border: '1px solid #fcd34d', background: '#fffbeb' }}>
                    <div className="text-[8px] font-mono font-bold text-amber-700 uppercase tracking-wider mb-2">
                      Modo de Cálculo
                    </div>
                    <Toggle
                      value={modo}
                      onChange={setModo}
                      options={[{ val:'directo', label:'ESTÁNDAR' }, { val:'inverso', label:'ING. INVERSA' }]}
                    />
                    <div className="mt-2">
                      {modo === 'directo'
                        ? <Field label="Oreja manual (mm)">
                            <input type="number" step="0.1" value={orejaM} onChange={e => setOrejaM(+e.target.value)} className={inpAmber} />
                          </Field>
                        : <Field label="Bobina Total (mm)">
                            <input type="number" step="0.1" value={bobinaM} onChange={e => setBobinaM(+e.target.value)} className={inpAmber} />
                          </Field>
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* 03 MATERIAL */}
              <div style={{ borderBottom: '1px solid #e5e5e5' }}>
                <SectionHeader num="03" label="Material" />
                <div className="p-3 space-y-2.5">
                  <Toggle
                    value={tipoFilm}
                    onChange={setTipoFilm}
                    options={[{ val:'cristal', label:'CRISTAL' }, { val:'arte', label:'CON ARTE' }]}
                  />
                  {tipoFilm === 'arte' && (
                    <Field label="Paso taco a taco (mm)">
                      <input type="number" value={pasoArte} onChange={e => setPasoArte(+e.target.value)}
                        className="w-full bg-yellow-50 border border-yellow-400 px-2 py-1.5 text-sm font-mono font-bold focus:outline-none rounded-none" />
                    </Field>
                  )}
                  <Field label="Espesor Film (µm)">
                    <input type="number" value={micron} onChange={e => setMicron(+e.target.value)} className={inp} />
                  </Field>
                  <Field label="Densidad Film">
                    <select value={densidad} onChange={e => setDensidad(+e.target.value)} className={inp}>
                      <option value={DENSITY_PVC}>PVC — 1380 kg/m³</option>
                      <option value={DENSITY_PETG}>PETG — 1270 kg/m³</option>
                    </select>
                  </Field>
                </div>
              </div>

              {/* 04 PRODUCCIÓN */}
              <div>
                <SectionHeader num="04" label="Producción" />
                <div className="p-3 space-y-2.5">
                  <Field label="Cantidad de packs">
                    <input type="number" value={cantPacks} onChange={e => setCantPacks(+e.target.value)} className={inp} />
                  </Field>
                  <Field label="Long. bobina disponible (m)">
                    <input type="number" value={metrosBobina} onChange={e => setMetrosBobina(+e.target.value)} className={inp} />
                  </Field>
                  {/* quick results */}
                  <div className="space-y-1.5 pt-1" style={{ borderTop: '1px solid #e5e5e5' }}>
                    {[
                      { label:'Packs en bobina',        val: packsEnBobina.toLocaleString('es-AR'),    unit:'packs' },
                      { label:`Metro lin. para ${cantPacks.toLocaleString()} packs`, val: mLinLote.toFixed(1), unit:'m' },
                      { label:`kg para ${cantPacks.toLocaleString()} packs`,         val: kgLote.toFixed(2),  unit:'kg' },
                    ].map(({ label, val, unit }) => (
                      <div key={label} className="flex justify-between items-baseline">
                        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">{label}</span>
                        <span className="text-sm font-mono font-black text-gray-900">
                          {val}<span className="text-[9px] font-normal text-gray-400 ml-0.5">{unit}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ─────────── RIGHT — DRAWING ─────────── */}
            <div className="p-4 space-y-4 bg-white">

              {/* ── HERO NUMBERS — Coca-Cola style ── */}
              <div className="grid grid-cols-3" style={{ border: '2px solid #111' }}>
                {[
                  {
                    label: 'FOLIENBREITE (A)',
                    value: bobTotal.toFixed(1),
                    sub:   canales > 1 ? `${canales} canales × ${canal.toFixed(1)} mm` : 'Monocanal',
                    accent: true,
                  },
                  {
                    label: 'RAPPORTLÄNGE (S)',
                    value: corte.toFixed(1),
                    sub:   tipoFilm === 'arte' ? 'Arte: paso fijado' : 'Cristal: desarrollo óptimo',
                    accent: false,
                    warn:  tipoFilm === 'arte' && Math.abs(deltaArte) > 5,
                    warnTxt: `Δ ${deltaArte >= 0 ? '+' : ''}${deltaArte.toFixed(1)} mm vs real`,
                  },
                  {
                    label: 'OREJAS (c/lado)',
                    value: oreja.toFixed(1),
                    sub:   modo === 'inverso' ? 'Calculadas — Ing. Inversa' : 'Definidas manualmente',
                    accent: false,
                    green: true,
                  },
                ].map(({ label, value, sub, accent, green, warn, warnTxt }, i) => (
                  <div key={label}
                    className="p-4 flex flex-col justify-between"
                    style={{
                      background: accent ? '#E61C24' : '#fff',
                      borderRight: i < 2 ? '1px solid #111' : 'none',
                    }}>
                    <div className="text-[8px] font-mono uppercase tracking-[2px]"
                         style={{ color: accent ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>{label}</div>
                    <div className="font-mono font-black leading-none my-2"
                         style={{
                           fontSize: '38px',
                           color: accent ? '#fff' : green ? '#059669' : '#111',
                         }}>
                      {value}
                    </div>
                    <div>
                      <div className="text-[9px] font-mono" style={{ color: accent ? 'rgba(255,255,255,0.6)' : '#9ca3af' }}>{sub}</div>
                      {warn && <div className="text-[9px] font-mono font-bold text-amber-600 mt-0.5">{warnTxt}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── PLAN VIEW SVG ── */}
              <div style={{ border: '1px solid #d1d5db' }}>
                <div className="px-3 py-1.5 flex justify-between items-center"
                     style={{ borderBottom: '1px solid #e5e5e5', background: '#fafafa' }}>
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[3px]">
                    PLAN VIEW — {canales === 1 ? 'Monocanal' : 'Doble Canal'} — Sentido horizontal
                  </span>
                  <span className="text-[8px] font-mono text-gray-400">
                    {corte.toFixed(0)} × {bobTotal.toFixed(0)} mm
                  </span>
                </div>
                <svg
                  width="100%"
                  style={{ maxHeight: '340px', display: 'block' }}
                  viewBox={`${-ML} ${-MT} ${corte + ML + MR} ${bobTotal + MT + MB}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    {[['mD','#1e293b'],['mB','#2563eb'],['mG','#059669'],['mR','#E61C24']].map(([id, fill]) => (
                      <marker key={id} id={id} viewBox="0 0 10 10" refX="9" refY="5"
                        markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={fill} />
                      </marker>
                    ))}
                    <pattern id="pg" width="25" height="25" patternUnits="userSpaceOnUse">
                      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                    </pattern>
                  </defs>

                  <rect x={-ML} y={-MT} width={corte + ML + MR} height={bobTotal + MT + MB} fill="url(#pg)" />
                  <rect x={0} y={0} width={corte} height={bobTotal} fill="#fef2f2" stroke="#d1d5db" strokeWidth="0.5" />

                  {canales === 2 && <>
                    <line x1={0} y1={canal} x2={corte} y2={canal}
                      stroke="#2563eb" strokeWidth="1.5" strokeDasharray="8,5" />
                    <text x={corte * 0.62} y={canal - 5}
                      fill="#2563eb" fontSize="9" fontFamily="monospace" fontWeight="bold"
                      letterSpacing="1" textAnchor="middle">FOLIENSCHNITT / CORTE LONG.</text>
                  </>}

                  {Array.from({ length: canales }).map((_, ci) => (
                    <g key={ci}>
                      <rect x={packXStart} y={ci * canal + oreja} width={packL} height={packT}
                        fill="none" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="5,3" />
                      {Array.from({ length: botL }).map((_, xi) =>
                        Array.from({ length: botT }).map((_, yi) => (
                          <circle key={`${ci}-${xi}-${yi}`}
                            cx={packXStart + xi * dia + dia / 2}
                            cy={ci * canal + oreja + yi * dia + dia / 2}
                            r={dia / 2 - 1.5}
                            fill="white" stroke="#475569" strokeWidth="1.5" />
                        ))
                      )}
                    </g>
                  ))}

                  <line x1={0}     y1={-MT + 5} x2={0}     y2={bobTotal + 16} stroke="#E61C24" strokeWidth="2.5" />
                  <line x1={corte} y1={-MT + 5} x2={corte} y2={bobTotal + 16} stroke="#E61C24" strokeWidth="2" strokeDasharray="7,5" />
                  <text x={-8} y={bobTotal * 0.6} fill="#E61C24" fontSize="9" fontFamily="monospace" fontWeight="bold"
                    textAnchor="middle" transform={`rotate(-90, -8, ${bobTotal * 0.6})`}>SCHNITT ①</text>
                  <text x={corte + 8} y={bobTotal * 0.6} fill="#E61C24" fontSize="9" fontFamily="monospace" fontWeight="bold"
                    textAnchor="middle" transform={`rotate(-90, ${corte + 8}, ${bobTotal * 0.6})`}>SCHNITT ②</text>

                  <line x1={corte * 0.12} y1={-32} x2={corte * 0.88} y2={-32}
                    stroke="#475569" strokeWidth="1.5" markerEnd="url(#mD)" />
                  <text x={corte / 2} y={-37} fill="#475569" fontSize="9" textAnchor="middle"
                    fontFamily="monospace" letterSpacing="1.5">LAUFRICHTUNG / SENTIDO DE MARCHA</text>

                  {/* Left dimension lines */}
                  <line x1={-ML+5} y1={0}            x2={-8}  y2={0}            stroke="#ddd" strokeWidth="0.5" />
                  <line x1={-ML+5} y1={oreja}         x2={-44} y2={oreja}         stroke="#ddd" strokeWidth="0.5" />
                  <line x1={-ML+5} y1={oreja+packT}   x2={-44} y2={oreja+packT}   stroke="#ddd" strokeWidth="0.5" />
                  <line x1={-ML+5} y1={canal}         x2={-8}  y2={canal}         stroke="#ddd" strokeWidth="0.5" />
                  {canales === 2 && <line x1={-ML+5} y1={bobTotal} x2={-8} y2={bobTotal} stroke="#ddd" strokeWidth="0.5" />}

                  {oreja > 8 && <>
                    <line x1={-74} y1={0} x2={-74} y2={oreja}
                      stroke="#059669" strokeWidth="1.2" markerStart="url(#mG)" markerEnd="url(#mG)" />
                    <rect x={-93} y={oreja/2-8} width={36} height={16} fill="white" />
                    <text x={-75} y={oreja/2+4} fill="#059669" fontSize="11" fontFamily="monospace"
                      fontWeight="bold" textAnchor="middle">{oreja.toFixed(1)}</text>
                  </>}

                  <line x1={-74} y1={oreja} x2={-74} y2={oreja+packT}
                    stroke="#111" strokeWidth="1.2" markerStart="url(#mD)" markerEnd="url(#mD)" />
                  <rect x={-93} y={oreja+packT/2-8} width={36} height={16} fill="white" />
                  <text x={-75} y={oreja+packT/2+4} fill="#111" fontSize="11" fontFamily="monospace"
                    fontWeight="bold" textAnchor="middle">{packT.toFixed(0)}</text>

                  {oreja > 8 && <>
                    <line x1={-74} y1={oreja+packT} x2={-74} y2={canal}
                      stroke="#059669" strokeWidth="1.2" markerStart="url(#mG)" markerEnd="url(#mG)" />
                    <rect x={-93} y={oreja+packT+oreja/2-8} width={36} height={16} fill="white" />
                    <text x={-75} y={oreja+packT+oreja/2+4} fill="#059669" fontSize="11" fontFamily="monospace"
                      fontWeight="bold" textAnchor="middle">{oreja.toFixed(1)}</text>
                  </>}

                  <line x1={-22} y1={0} x2={-22} y2={canal}
                    stroke="#2563eb" strokeWidth="2" markerStart="url(#mB)" markerEnd="url(#mB)" />
                  <rect x={-46} y={canal/2-10} width={48} height={20} fill="white" stroke="#2563eb" strokeWidth="0.8" />
                  <text x={-22} y={canal/2+5} fill="#2563eb" fontSize="12" fontFamily="monospace"
                    fontWeight="bold" textAnchor="middle">{canal.toFixed(1)}</text>

                  {/* Right: total bobina */}
                  <line x1={corte+MR-10} y1={0} x2={corte+MR-10} y2={bobTotal}
                    stroke="#2563eb" strokeWidth="2.5" markerStart="url(#mB)" markerEnd="url(#mB)" />
                  <rect x={corte+MR-60} y={bobTotal/2-13} width={63} height={26}
                    fill="white" stroke="#2563eb" strokeWidth="1.5" />
                  <text x={corte+MR-29} y={bobTotal/2+1} fill="#2563eb" fontSize="11"
                    fontFamily="monospace" fontWeight="bold" textAnchor="middle">A</text>
                  <text x={corte+MR-29} y={bobTotal/2+13} fill="#2563eb" fontSize="10"
                    fontFamily="monospace" textAnchor="middle">{bobTotal.toFixed(0)}</text>

                  {/* Bottom: S */}
                  <line x1={0}     y1={bobTotal+2} x2={0}     y2={bobTotal+MB-4} stroke="#E61C24" strokeWidth="0.7" strokeDasharray="3,3" />
                  <line x1={corte} y1={bobTotal+2} x2={corte} y2={bobTotal+MB-4} stroke="#E61C24" strokeWidth="0.7" strokeDasharray="3,3" />
                  <line x1={0} y1={bobTotal+MB-8} x2={corte} y2={bobTotal+MB-8}
                    stroke="#E61C24" strokeWidth="2" markerStart="url(#mR)" markerEnd="url(#mR)" />
                  <rect x={corte/2-65} y={bobTotal+MB-20} width={130} height={20}
                    fill="white" stroke="#E61C24" strokeWidth="1" />
                  <text x={corte/2} y={bobTotal+MB-7} fill="#E61C24" fontSize="12"
                    fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    S = {corte.toFixed(1)} mm
                  </text>
                </svg>
              </div>

              {/* ── BOTTOM ROW ── */}
              <div className="grid grid-cols-4 gap-3 pt-3" style={{ borderTop: '1px solid #e5e5e5' }}>

                {/* 1. A-F TABLE */}
                <div>
                  <div className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[3px] mb-2">
                    Mapeo del Arte
                  </div>
                  <table className="w-full text-sm font-mono border-collapse"
                         style={{ border: '1.5px solid #111' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #111' }}>
                        <th className="px-2 py-1 font-normal text-xs text-center" style={{ borderRight:'1px solid #111' }}>0—</th>
                        <th className="px-2 py-1 font-bold text-right" style={{ borderRight:'1.5px solid #111' }}>mm</th>
                        <th className="px-2 py-1 font-normal text-xs text-center" style={{ borderRight:'1px solid #111' }}>0—</th>
                        <th className="px-2 py-1 font-bold text-right">mm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[['A','D'],['B','E'],['C','F']].map(([l, r]) => (
                        <tr key={l} style={{ borderBottom: '1px solid #e5e5e5' }}>
                          <td className="px-2 py-1.5 text-center font-black" style={{ borderRight:'1px solid #111' }}>{l}</td>
                          <td className="px-2 py-1.5 text-right" style={{ borderRight:'1.5px solid #111' }}>{pts[l].toFixed(2)}</td>
                          <td className="px-2 py-1.5 text-center font-black" style={{ borderRight:'1px solid #111' }}>{r}</td>
                          <td className="px-2 py-1.5 text-right">{pts[r].toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-[9px] font-mono text-gray-400 mt-1">
                    Desarrollo real: {totalSReal.toFixed(2)} mm
                  </div>
                  {tipoFilm === 'arte' && (
                    <div className={`text-[9px] font-mono mt-0.5 font-bold ${Math.abs(deltaArte) > 5 ? 'text-amber-600' : 'text-gray-400'}`}>
                      Δ arte/real: {deltaArte >= 0 ? '+' : ''}{deltaArte.toFixed(2)} mm
                    </div>
                  )}
                </div>

                {/* 2. PERFIL LATERAL — corregido */}
                <div>
                  <div className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[3px] mb-2">
                    Vista Lateral / Seitenansicht
                  </div>
                  <div className="border border-gray-200 bg-white overflow-hidden">
                    <svg width="100%" style={{ maxHeight:'165px', display:'block' }}
                      viewBox={`${-solape/2-35} -15 ${packL + solape + 60} ${alt + 30}`}
                      preserveAspectRatio="xMidYMid meet">
                      {Array.from({ length: botL }).map((_, i) => (
                        <path key={i}
                          d={`M ${i*dia} ${alt} L ${i*dia} ${alt-altCil}
                              L ${i*dia+dia/2-tapa/2} 0 L ${i*dia+dia/2+tapa/2} 0
                              L ${i*dia+dia} ${alt-altCil} L ${i*dia+dia} ${alt} Z`}
                          fill="none" stroke="#94a3b8" strokeWidth="1.2" />
                      ))}
                      <path d={sideFilmPath} fill="none" stroke="#E61C24" strokeWidth="2.5" strokeLinejoin="round" />
                      {/* solape brackets */}
                      <line x1={-solape/2} y1={alt} x2={0} y2={alt} stroke="#E61C24" strokeWidth="2.5" strokeDasharray="4,3" />
                      <line x1={packL} y1={alt} x2={packL+solape/2} y2={alt} stroke="#E61C24" strokeWidth="2.5" strokeDasharray="4,3" />
                      {sidePoints.map(([l, cx, cy, side]) => (
                        <g key={l}>
                          <circle cx={cx} cy={cy} r="3.5" fill="#E61C24" />
                          <text x={cx + side * 9} y={cy + 4} fill="#E61C24" fontSize="11" fontWeight="bold"
                            fontFamily="monospace" textAnchor={side < 0 ? 'end' : 'start'}>{l}</text>
                        </g>
                      ))}
                      <text x={packL / 2} y={alt + 14} fill="#059669" fontSize="9"
                        textAnchor="middle" fontFamily="monospace">0 / S/SS</text>
                    </svg>
                  </div>
                </div>

                {/* 3. 3D BOBINA */}
                <div>
                  <div className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[3px] mb-2">
                    Esquema Bobina
                  </div>
                  <div className="border border-gray-200 bg-white overflow-hidden">
                    <svg width="100%" style={{ maxHeight:'165px', display:'block' }}
                      viewBox="0 0 260 178" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <marker id="a3d" viewBox="0 0 10 10" refX="9" refY="5"
                          markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#475569" />
                        </marker>
                      </defs>
                      <g transform="translate(8,4)">
                        <path d="M 68 18 L 183 50 A 17 35 0 0 1 183 120 L 68 88 A 17 35 0 0 0 68 18 Z"
                          fill="#fef2f2" stroke="#94a3b8" strokeWidth="1.5" />
                        <path d="M 68 88 L 183 120 L 128 166 L 13 134 Z"
                          fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" opacity="0.85" />
                        <ellipse cx="183" cy="85" rx="17" ry="35" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                        <ellipse cx="183" cy="85" rx="5"  ry="10" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                        <ellipse cx="68"  cy="53" rx="17" ry="35" fill="#fef2f2" stroke="#94a3b8" strokeWidth="1.5" />
                        <line x1="13" y1="134" x2="128" y2="166"
                          stroke="#2563eb" strokeWidth="1.5" markerStart="url(#a3d)" markerEnd="url(#a3d)" />
                        <text x="66" y="157" fill="#2563eb" fontSize="11" fontWeight="bold"
                          fontFamily="monospace" transform="rotate(14,66,157)" textAnchor="middle">
                          (A) {bobTotal.toFixed(0)}
                        </text>
                        <line x1="128" y1="166" x2="183" y2="115"
                          stroke="#E61C24" strokeWidth="1.5" markerStart="url(#a3d)" markerEnd="url(#a3d)" />
                        <text x="160" y="147" fill="#E61C24" fontSize="11" fontWeight="bold"
                          fontFamily="monospace" transform="rotate(-44,160,147)" textAnchor="middle">
                          (S) {corte.toFixed(0)}
                        </text>
                        <line x1="13" y1="100" x2="128" y2="132"
                          stroke="#2563eb" strokeWidth="1.5" strokeDasharray="5,3" />
                        <text x="66" y="107" fill="#2563eb" fontSize="8"
                          fontFamily="monospace" transform="rotate(14,66,107)" textAnchor="middle">Schnitt</text>
                      </g>
                    </svg>
                  </div>
                </div>

                {/* 4. CONSUMO */}
                <div>
                  <div className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[3px] mb-2">
                    Consumo de Film
                  </div>
                  <div className="border border-gray-200 bg-white p-3 space-y-2">
                    {[
                      { label:'m lin. / pack', val: mLinPack.toFixed(3),  unit:'m'   },
                      { label:'m² / pack',     val: m2Pack.toFixed(4),    unit:'m²'  },
                      { label:'kg / pack',     val: kgPack.toFixed(4),    unit:'kg'  },
                      { label:'Espesor',       val: String(micron),       unit:'µm'  },
                    ].map(({ label, val, unit }) => (
                      <div key={label}>
                        <div className="text-[8px] font-mono text-gray-400 uppercase tracking-wider">{label}</div>
                        <div className="text-lg font-mono font-black text-gray-900 leading-tight">
                          {val}<span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 border border-gray-200 bg-white p-2">
                    <div className="text-[8px] font-mono text-gray-400 uppercase tracking-widest mb-1">Laufrichtung</div>
                    <svg width="100%" height="42" viewBox="0 0 155 42">
                      <ellipse cx="18" cy="21" rx="13" ry="19" fill="#fee2e2" stroke="#94a3b8" strokeWidth="1.5" />
                      <ellipse cx="18" cy="21" rx="4"  ry="6"  fill="#fca5a5" stroke="#94a3b8" />
                      <line x1="31" y1="21" x2="143" y2="21" stroke="#374151" strokeWidth="1.5" />
                      <polygon points="135,15 150,21 135,27" fill="#374151" />
                      <text x="88" y="13" fill="#374151" fontSize="8" textAnchor="middle" fontFamily="monospace">HORNO →</text>
                      <text x="88" y="35" fill="#9ca3af" fontSize="7" textAnchor="middle" fontFamily="monospace">
                        {tipoFilm === 'arte' ? 'DECORADO' : 'CRISTAL S/E'}
                      </text>
                    </svg>
                  </div>
                </div>

              </div>{/* end bottom row */}
            </div>{/* end right column */}
          </div>{/* end body grid */}

          {/* ── TITLE BLOCK ── */}
          <div className="grid text-sm"
               style={{ borderTop: '2px solid #111', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr' }}>
            {[
              {
                label: 'Producto / Werk',
                content: (
                  <input value={producto} onChange={e => setProducto(e.target.value)} placeholder="—"
                    className="w-full bg-transparent font-mono font-bold text-sm focus:outline-none no-print" />
                ),
              },
              {
                label: 'Cliente / Kunde',
                content: (
                  <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="—"
                    className="w-full bg-transparent font-mono font-bold text-sm focus:outline-none no-print" />
                ),
              },
              { label: 'Fecha / Datum',         content: <span className="font-mono font-bold text-sm">{today}</span> },
              { label: 'Maßstab / Escala — Stärke', content: <span className="font-mono font-bold text-sm">S/E — {micron}µm</span> },
              {
                label: 'Material / Kanal',
                content: (
                  <span className="font-mono font-bold text-sm">
                    {tipoFilm === 'arte' ? 'DECORADO' : 'CRISTAL'} — {canales > 1 ? '2-CANAL' : '1-CANAL'}
                  </span>
                ),
                last: true,
              },
            ].map(({ label, content, last }, i) => (
              <div key={i} className="p-2" style={{ borderRight: last ? 'none' : '1px solid #d1d5db' }}>
                <div className="text-[7px] font-mono text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                {content}
              </div>
            ))}
          </div>

          {/* Red bottom bar */}
          <div style={{ height: '4px', background: '#E61C24' }} />

        </div>{/* end drawing sheet */}
      </div>
    </div>
  );
}