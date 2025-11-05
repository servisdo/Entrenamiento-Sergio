// ================================
//  BLOQUE 1 - ESTRUCTURA BASE
// ================================

// --- Accesos rápidos al DOM ---
const el = s => document.querySelector(s);
const planner = el("#planner");
const weekInput = el("#weekStart");

// --- Días de la semana ---
const DAY_NAMES = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const isWeekend = (i) => i === 5 || i === 6;

// ================================
//   SISTEMA DE ALMACENAMIENTO
// ================================
function loadAll() {
  try { return JSON.parse(localStorage.getItem("sergio-weeks") || "{}"); }
  catch { return {}; }
}
function saveAll(all) {
  localStorage.setItem("sergio-weeks", JSON.stringify(all));
}
function loadStateFor(weekStart) {
  return loadAll()[weekStart];
}
function saveStateFor(weekStart, state) {
  const all = loadAll();
  all[weekStart] = state;
  saveAll(all);
}
function setActiveWeek(w) {
  localStorage.setItem("sergio-active-week", w);
}
function getActiveWeek() {
  return localStorage.getItem("sergio-active-week");
}
function listWeeks() {
  return Object.keys(loadAll()).sort();
}

// ================================
//   PLANTILLAS DE BLOQUES
// ================================
function ex(name, target, sets = 3) {
  const s = [];
  for (let i = 0; i < sets; i++) s.push({ w: "", r: "" });
  return { name, target, sets: s };
}

// --- Calentamientos ---
function WU_Anterior() {
  return {
    type: "Calentamiento — Cara anterior",
    fixed: true,
    status: "none",
    exercises: [
      ex("Remo polea baja sentado", "3 x 15 ligero (movilidad hombros/core)", 0),
      ex("Sentadillas sin carga", "3 x 10", 0)
    ]
  };
}
function WU_Posterior() {
  return {
    type: "Calentamiento — Cara posterior",
    fixed: true,
    status: "none",
    exercises: [
      ex("Jalón al pecho polea alta", "3 x 10 ligero", 0),
      ex("Curl isquios máquina", "3 x 15 ligero", 0)
    ]
  };
}
function WU_HIIT() {
  return {
    type: "Calentamiento — HIIT",
    fixed: true,
    status: "none",
    exercises: [
      ex("Elíptica Z2 (110–120 ppm)", "10 min (hablar cómodo)", 0)
    ]
  };
}

// --- Bloques principales ---
function BL_Anterior() {
  return {
    type: "Cara anterior",
    status: "none",
    exercises: [
      ex("Press banca horizontal", "3 x 8–12"),
      ex("Elevaciones frontales polea baja", "3 x 10–12"),
      ex("Extensión de rodilla", "3 x 10"),
      ex("Curl bíceps polea baja", "3 x 10–12"),
      ex("Crunch polea alta", "3 x 12")
    ]
  };
}
function BL_Posterior() {
  return {
    type: "Cara posterior",
    status: "none",
    exercises: [
      ex("Pull-down polea alta", "3 x 10–12"),
      ex("Face pull polea media", "3 x 10–12"),
      ex("Extensión cadera polea baja (cada lado)", "3 x 10"),
      ex("Extensión tríceps polea alta", "3 x 10–12"),
      ex("Hiperextensión lumbar en máquina", "3 x 12")
    ]
  };
}
function BL_HIIT() {
  return {
    type: "HIIT",
    status: "none",
    exercises: [
      { name: "Puente glúteos isométrico", target: "45\" / 20\"", sets: [] },
      { name: "Remo invertido en barra", target: "45\" / 20\"", sets: [] },
      { name: "PM rumano con kettlebell", target: "45\" / 20\"", sets: [] },
      { name: "Zancada estática + press militar", target: "45\" / 20\"", sets: [] },
      { name: "Press Pallof isométrico", target: "45\" / 20\"", sets: [] },
      { name: "Bird-dog alterno", target: "45\" / 20\"", sets: [] },
      { name: "Rondas finales", target: "6–8 rondas: 2–3 burpees + 30\" skipping", sets: [] }
    ]
  };
}

// --- Enfriamiento ---
function COOLDOWN() {
  return {
    type: "Enfriamiento",
    fixed: true,
    status: "none",
    exercises: [
      ex("Cinta + estiramientos", "10 min", 0)
    ]
  };
}

// --- Caminata diaria ---
function WALK() {
  return {
    type: "Caminata diaria",
    walk: true,
    status: "none",
    walkData: { tiempo: "", distancia: "", fc: "", sensaciones: "" }
  };
}

// --- Entrenamiento libre ---
function LIBRE() {
  return {
    type: "Entrenamiento libre",
    kind: "libre",
    status: "none",
    custom: { tipo: "", distancia: "", tiempo: "", fc: "", sensaciones: "" },
    exercises: []
  };
}

// ================================
//   ESTRUCTURA SEMANAL
// ================================
function defaultPlan(weekStart) {
  return {
    weekStart,
    dayOffFlags: { "Sábado": false, "Domingo": false },
    days: [
      { name: "Lunes", blocks: [WALK(), WU_Anterior(), BL_Anterior(), COOLDOWN()] },
      { name: "Martes", blocks: [WALK()] },
      { name: "Miércoles", blocks: [WALK(), WU_HIIT(), BL_HIIT()] },
      { name: "Jueves", blocks: [WALK()] },
      { name: "Viernes", blocks: [WALK(), WU_Posterior(), BL_Posterior(), COOLDOWN()] },
      { name: "Sábado", blocks: [LIBRE()] },
      { name: "Domingo", blocks: [LIBRE()] }
    ],
    biometrics: {}
  };
}

// ================================
//   REPARACIÓN DE ESTRUCTURA
// ================================
function ensureWeekShape(weekStart) {
  const all = loadAll();
  const st = all[weekStart];
  if (!st || !Array.isArray(st.days) || st.days.length !== 7) {
    all[weekStart] = defaultPlan(weekStart);
    saveAll(all);
    return true; // reparado
  }
  return false; // ok
}

// ================================
//   BLOQUE 2 - INTERACCIÓN Y RENDERIZADO
// ================================
function init() {
  // Tabs inferiores
  document.querySelectorAll(".tab").forEach(t => {
    t.onclick = () => {
      document.querySelectorAll(".tab").forEach(x => {
        x.classList.remove("active");
        x.setAttribute("aria-selected", "false");
      });
      document.querySelectorAll(".tab-pane").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      t.setAttribute("aria-selected", "true");
      el("#tab-" + t.dataset.tab).classList.add("active");

      if (t.dataset.tab === "graficos") drawCharts();
      if (t.dataset.tab === "historial") renderHistory();
    };
    setTimeout(() => {
  console.log("⚙️ Forzando render tarde");
  render();
}, 100);
    // iOS/Safari a veces retrasa el pintado: forzamos render tras 100ms
setTimeout(render, 100);
  });

  // Navegación de semanas
  const prev = el("#prevWeek"), next = el("#nextWeek");
  if (prev) prev.onclick = () => shiftWeek(-7);
  if (next) next.onclick = () => shiftWeek(7);

  // Controles
  if (weekInput) weekInput.addEventListener("change", e => createWeekIfMissing(e.target.value, true));
  const newBtn = el("#newWeekBtn");
  if (newBtn) newBtn.onclick = () => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // lunes actual
    createWeekIfMissing(d.toISOString().slice(0, 10), true);
  };
  const dupBtn = el("#duplicateWeekBtn");
  if (dupBtn) dupBtn.onclick = duplicateWeek;
  const exAllBtn = el("#exportAllBtn");
  if (exAllBtn) exAllBtn.onclick = exportAll;
  const exRepBtn = el("#exportWeekReport");
  if (exRepBtn) exRepBtn.onclick = exportWeekReport;
  const imp = el("#importAllFile");
  if (imp) imp.addEventListener("change", importAll);
  const resetBtn = el("#resetBtn");
  if (resetBtn) resetBtn.onclick = resetAll;
  const expAll = el("#expandAll");
  if (expAll) expAll.onclick = () => toggleAll(true);
  const colAll = el("#collapseAll");
  if (colAll) colAll.onclick = () => toggleAll(false);
  const fab = el("#addBlockFab");
  if (fab) fab.onclick = () => addBlockForToday();

  // Biomarcadores
  const bioBtn = el("#saveBio");
  if (bioBtn) {
    bioBtn.onclick = () => {
      const wk = getActiveWeek();
      const st = loadStateFor(wk);
      st.biometrics = {
        peso: el("#peso")?.value || "",
        sueno: el("#sueno")?.value || "",
        energia: el("#energia")?.value || "",
        estres: el("#estres")?.value || "",
        fcr: el("#fcr")?.value || "",
        notas: el("#bioNotas")?.value || ""
      };
      saveStateFor(wk, st);
      drawCharts();
      alert("Biomarcadores guardados ✅");
    };
  }

  // Semana actual por defecto
  const today = new Date();
  const monday = new Date(today);
  const gd = today.getDay();
  monday.setDate(monday.getDate() + (gd === 0 ? -6 : 1 - gd));
  const wk = monday.toISOString().slice(0, 10);
  createWeekIfMissing(wk, true);
}

// Cambiar de semana
function shiftWeek(days) {
  const curStr = getActiveWeek();
  const cur = curStr ? new Date(curStr) : new Date();
  cur.setDate(cur.getDate() + days);
  createWeekIfMissing(cur.toISOString().slice(0, 10), true);
}

function createWeekIfMissing(weekStart, setActive) {
  const all = loadAll();
  if (!all[weekStart]) all[weekStart] = defaultPlan(weekStart);

  // Reparar estructura si está rota
  ensureWeekShape(weekStart);

  if (setActive) setActiveWeek(weekStart);
  if (weekInput) weekInput.value = weekStart;
  render();
  renderHistory();
}

// Render principal (con auto-inicialización)
function render() {
  const wk = getActiveWeek();

  // Si no hay semana activa, crear la de este lunes
  if (!wk) {
    const today = new Date();
    const monday = new Date(today);
    const gd = today.getDay();
    monday.setDate(monday.getDate() + (gd === 0 ? -6 : 1 - gd));
    const newWk = monday.toISOString().slice(0, 10);
    createWeekIfMissing(newWk, true);
    return;
  }

  // Asegurar estructura correcta; si está rota, regenerar y continuar
  const repaired = ensureWeekShape(wk);

  // Cargar estado (ya reparado si hiciera falta)
  let st = loadStateFor(wk);

  // Fallback duro: si por lo que sea sigue sin days, forzar plantilla
  if (!st || !Array.isArray(st.days) || st.days.length !== 7) {
    st = defaultPlan(wk);
    saveStateFor(wk, st);
  }

  const root = planner;
  if (!root) return;
  root.innerHTML = "";

  st.days.forEach((day, idx) => {
    const sec = document.createElement("section");
    sec.className = "day card";

    sec.innerHTML = `
      <h3>
        <span>${day.name}</span>
        <span class="summary-actions">
          <button class="btn small" data-idx="${idx}" data-act="summary">Resumen</button>
          <button class="btn small" data-idx="${idx}" data-act="toggle">Ver</button>
        </span>
      </h3>
      <div class="details" data-idx="${idx}"></div>
    `;

    root.appendChild(sec);
    renderDayBlocks(sec.querySelector(".details"), day, idx);
  });

  document.querySelectorAll("button[data-act='summary']").forEach(b => b.onclick = () => openDailySummary(+b.dataset.idx));
  document.querySelectorAll("button[data-act='toggle']").forEach(b => b.onclick = () => {
    const d = planner.querySelector(`.details[data-idx="${b.dataset.idx}"]`);
    d.classList.toggle("open");
  });

  attachBlockHandlers();
}
// ===== Stubs y utilidades =====
function duplicateWeek() {
  const cur = getActiveWeek();
  if (!cur) return alert("No hay semana activa");
  const d = new Date(cur);
  d.setDate(d.getDate() + 7);
  const next = d.toISOString().slice(0, 10);
  const st = JSON.parse(JSON.stringify(loadStateFor(cur)));
  st.weekStart = next;
  saveStateFor(next, st);
  setActiveWeek(next);
  if (weekInput) weekInput.value = next;
  render();
  alert("Semana duplicada ✅");
}

function exportWeekReport() {
  const wk = getActiveWeek();
  const st = loadStateFor(wk);
  if (!st) return alert("No hay datos de esta semana");
  let txt = `📅 Reporte semanal (${wk})\n\n`;
  st.days.forEach(day => {
    txt += `== ${day.name} ==\n`;
    day.blocks.forEach(b => {
      txt += `• ${b.type}\n`;
      if (b.walk && b.walkData) {
        const d = b.walkData;
        txt += `   - Tiempo: ${d.tiempo||"-"} min | Dist: ${d.distancia||"-"} km | FC: ${d.fc||"-"} | Sens.: ${d.sensaciones||"-"}\n`;
      } else if (b.kind === "libre" && b.custom) {
        const c = b.custom;
        txt += `   - Tipo: ${c.tipo||"-"} | Dist: ${c.distancia||"-"} | Tiempo: ${c.tiempo||"-"} | FC: ${c.fc||"-"} | Sens.: ${c.sensaciones||"-"}\n`;
      } else if (b.exercises) {
        b.exercises.forEach(ex => {
          const sets = (ex.sets||[]).map(s => s.w && s.r ? `${s.w}x${s.r}` : "").filter(Boolean).join(", ");
          txt += `   - ${ex.name} (${ex.target||""}) ${sets ? "→ " + sets : ""}\n`;
        });
      }
    });
    txt += `\n`;
  });
  const blob = new Blob([txt], {type:"text/plain"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `reporte_${wk}.txt`;
  a.click();
}

function toggleAll(open) {
  document.querySelectorAll(".details").forEach(d => {
    if (open) d.classList.add("open");
    else d.classList.remove("open");
  });
}

function addBlockForToday() {
  const wk = getActiveWeek();
  const st = loadStateFor(wk);
  const today = new Date();
  const gd = today.getDay(); // 0=domingo..6=sábado
  const idx = (gd + 6) % 7;  // 0=lunes..6=domingo
  st.days[idx].blocks.push(LIBRE());
  saveStateFor(wk, st);
  render();
  alert("Bloque libre añadido al día de hoy ✅");
}

// ================================
//  BLOQUE 3 - HISTORIAL, GRÁFICOS Y RESUMEN DIARIO
// ================================
function renderHistory() {
  const all = loadAll();
  const container = document.getElementById("history");
  if (!container) return;
  container.innerHTML = "";

  const weeks = listWeeks();
  if (!weeks.length) {
    container.innerHTML = "<p>No hay semanas registradas todavía.</p>";
    return;
  }

  weeks.forEach(w => {
    const wk = loadStateFor(w);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${w}</h3>
      <p>Días registrados: ${wk.days.length}</p>
      <button class="btn small" data-week="${w}">Ver</button>
    `;
    container.appendChild(card);
    card.querySelector("button").onclick = () => {
      setActiveWeek(w);
      if (weekInput) weekInput.value = w;
      render();
      const planTab = el('[data-tab="plan"]');
      if (planTab) planTab.click();
    };
  });
}

function drawCharts() {
  if (typeof Chart === "undefined") return;

  const ctxPeso = document.getElementById("pesoChart")?.getContext("2d");
  const ctxVol = document.getElementById("volChart")?.getContext("2d");
  const ctxWalkT = document.getElementById("walkTimeChart")?.getContext("2d");
  const ctxWalkD = document.getElementById("walkDistChart")?.getContext("2d");
  if (!ctxPeso || !ctxVol || !ctxWalkT || !ctxWalkD) return;

  const weeks = listWeeks();
  const all = loadAll();
  const pesos = [];
  const volumen = [];
  const walkTime = [];
  const walkDist = [];

  weeks.forEach(w => {
    const st = all[w];
    if (!st) return;
    const bio = st.biometrics || {};
    if (bio.peso) pesos.push({ x: w, y: +bio.peso });
    let vol = 0, t = 0, d = 0;
    st.days.forEach(dy => {
      dy.blocks.forEach(b => {
        if (b.walk && b.walkData) {
          t += +b.walkData.tiempo || 0;
          d += +b.walkData.distancia || 0;
        }
        if (b.exercises) {
          b.exercises.forEach(ex => {
            (ex.sets || []).forEach(s => {
              if (s.w && s.r) vol += (+s.w || 0) * (+s.r || 0);
            });
          });
        }
      });
    });
    volumen.push({ x: w, y: vol });
    walkTime.push({ x: w, y: t });
    walkDist.push({ x: w, y: d });
  });

  const opts = { responsive: true, scales: { x: { ticks: { color: "#333" } }, y: { beginAtZero: true } } };

  if (window._pesoChart) window._pesoChart.destroy();
  if (window._volChart) window._volChart.destroy();
  if (window._walkTChart) window._walkTChart.destroy();
  if (window._walkDChart) window._walkDChart.destroy();

  window._pesoChart = new Chart(ctxPeso, { type: "line", data: { datasets: [{ label: "Peso (kg)", data: pesos }] }, options: opts });
  window._volChart = new Chart(ctxVol, { type: "bar", data: { datasets: [{ label: "Volumen (kg·reps)", data: volumen }] }, options: opts });
  window._walkTChart = new Chart(ctxWalkT, { type: "bar", data: { datasets: [{ label: "Tiempo caminata (min)", data: walkTime }] }, options: opts });
  window._walkDChart = new Chart(ctxWalkD, { type: "bar", data: { datasets: [{ label: "Distancia caminata (km)", data: walkDist }] }, options: opts });
}

// ====== Resumen diario ======
function openDailySummary(idx) {
  const wk = getActiveWeek();
  const st = loadStateFor(wk);
  const day = st.days[idx];
  let txt = `📅 ${day.name} (${wk})\n\n`;

  day.blocks.forEach(b => {
    txt += `🟦 ${b.type}\n`;
    if (b.walk) {
      const d = b.walkData || {};
      txt += `  • Tiempo: ${d.tiempo || "-"} min\n  • Distancia: ${d.distancia || "-"} km\n  • FC media: ${d.fc || "-"} ppm\n  • Sensaciones: ${d.sensaciones || "-"}\n`;
    } else if (b.kind === "libre") {
      const c = b.custom || {};
      txt += `  • Tipo: ${c.tipo || "-"}\n  • Distancia: ${c.distancia || "-"}\n  • Tiempo: ${c.tiempo || "-"}\n  • FC media: ${c.fc || "-"}\n  • Sensaciones: ${c.sensaciones || "-"}\n`;
    } else {
      (b.exercises || []).forEach(ex => {
        txt += `  • ${ex.name}: ${ex.target || ""}`;
        const sets = (ex.sets || []).map(s => s.w && s.r ? `${s.w}x${s.r}` : "").filter(Boolean).join(", ");
        if (sets) txt += ` → ${sets}`;
        txt += "\n";
      });
    }
    txt += "\n";
  });

  const modal = document.getElementById("modalShare");
  if (!modal) return;
  modal.classList.remove("hidden");
  const ta = document.getElementById("shareTextarea");
  if (ta) ta.value = txt;

  const btnC = document.getElementById("shareCopy");
  const btnD = document.getElementById("shareDownload");
  const btnX = document.getElementById("shareClose");

  if (btnC) btnC.onclick = () => { navigator.clipboard.writeText(txt); alert("Resumen copiado ✅"); };
  if (btnD) btnD.onclick = () => {
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${day.name}_${wk}_resumen.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  if (btnX) btnX.onclick = () => modal.classList.add("hidden");
}

// ====== Exportar / Importar / Borrar ======
function exportAll() {
  const data = localStorage.getItem("sergio-weeks") || "{}";
  const blob = new Blob([data], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "entrenos_sergio.json";
  a.click();
}
function importAll(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      saveAll(data);
      alert("Datos importados correctamente ✅");
      render();
      renderHistory();
      drawCharts();
    } catch {
      alert("Error al importar");
    }
  };
  reader.readAsText(file);
}
function resetAll() {
  if (confirm("¿Seguro que quieres borrar todos los datos?")) {
    localStorage.removeItem("sergio-weeks");
    localStorage.removeItem("sergio-active-week");
    location.reload();
  }
}

// Inicializa al cargar
window.addEventListener("DOMContentLoaded", init);

// ====== PWA modo offline (registro SW) ======
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  });
}
