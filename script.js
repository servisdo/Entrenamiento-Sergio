// 🔧 Desregistrar SW temporalmente para evitar caché
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations && navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
}
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
//   BLOQUE 2 - INTERACCIÓN Y RENDERIZADO
// ================================

// Inicialización general
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
    const st = loadStateFor(getActiveWeek());
alert("✅ Semana activa: " + getActiveWeek() + " | días: " + (st?.days?.length || 0));
  });

  // Navegación de semanas
  el("#prevWeek").onclick = () => shiftWeek(-7);
  el("#nextWeek").onclick = () => shiftWeek(7);

  // Controles
  weekInput.addEventListener("change", e => createWeekIfMissing(e.target.value, true));
  el("#newWeekBtn").onclick = () => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // lunes actual
    createWeekIfMissing(d.toISOString().slice(0, 10), true);
  };
  el("#duplicateWeekBtn").onclick = duplicateWeek;
  el("#exportAllBtn").onclick = exportAll;
  el("#exportWeekReport").onclick = exportWeekReport;
  el("#importAllFile").addEventListener("change", importAll);
  el("#resetBtn").onclick = resetAll;
  el("#expandAll").onclick = () => toggleAll(true);
  el("#collapseAll").onclick = () => toggleAll(false);
  el("#addBlockFab").onclick = () => addBlockForToday();

  // Biomarcadores (si existen los inputs)
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
      alert("Biomarcadores guardados ✅");
      drawCharts();
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
  if (setActive) setActiveWeek(weekStart);
  if (weekInput) weekInput.value = weekStart;
  render();
  renderHistory();
}

// Render principal (con auto-inicialización)
function render() {
  const wk = getActiveWeek();
  let st = wk ? loadStateFor(wk) : null;

  if (!wk || !st) {
    const today = new Date();
    const monday = new Date(today);
    const gd = today.getDay();
    monday.setDate(monday.getDate() + (gd === 0 ? -6 : 1 - gd));
    const newWk = monday.toISOString().slice(0, 10);
    createWeekIfMissing(newWk, true);
    return;
  }

  const root = planner;
  root.innerHTML = "";
planner.insertAdjacentHTML('beforeend','<div class="card" style="padding:12px">DEBUG: render() vivo</div>');
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

// ===== Stubs y utilidades seguras =====
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
  const gd = today.getDay(); // 0=domingo..6=sabado
  const idx = (gd + 6) % 7; // 0=lunes..6=domingo
  st.days[idx].blocks.push(LIBRE());
  saveStateFor(wk, st);
  render();
  alert("Bloque libre añadido al día de hoy ✅");
}

// Render de cada día
function renderDayBlocks(container, day, idx) {
  container.innerHTML = "";

  day.blocks.forEach((block, bIdx) => {
    const wrap = document.createElement("div");
    wrap.className = "block " + (block.status === "done" ? "done" : block.status === "notdone" ? "notdone" : "");

    const showNotDone = !isWeekend(idx);
    const notDoneBtn = showNotDone ? `<button class="btn small" data-idx="${idx}" data-bidx="${bIdx}" data-act="notdone">No completado</button>` : "";
    const completed = `<label><input type="checkbox" ${block.status === "done" ? "checked" : ""} data-idx="${idx}" data-bidx="${bIdx}" class="doneToggle"> Completado</label>`;

    // --- Caminata ---
    if (block.walk) {
      const wd = block.walkData || { tiempo: "", distancia: "", fc: "", sensaciones: "" };
      wrap.innerHTML = `
        <header><strong>${block.type}</strong>
          <div class="controls state-toggle">
            ${completed}${notDoneBtn}
          </div>
        </header>
        <div class="walk">
          <label>Tiempo (min)<input type="number" step="1" class="walkInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="tiempo" value="${wd.tiempo}"></label>
          <label>Distancia (km)<input type="number" step="0.01" class="walkInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="distancia" value="${wd.distancia}"></label>
          <label>FC media (ppm)<input type="number" step="1" class="walkInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="fc" value="${wd.fc}"></label>
          <label style="grid-column:1/-1;">Sensaciones<textarea rows="3" class="walkText" data-idx="${idx}" data-bidx="${bIdx}" data-field="sensaciones">${wd.sensaciones}</textarea></label>
        </div>
      `;
    }

    // --- Entrenamiento libre ---
    else if (block.kind === "libre") {
      const c = block.custom || { tipo: "", distancia: "", tiempo: "", fc: "", sensaciones: "" };
      wrap.innerHTML = `
        <header><strong>${block.type}</strong>
          <div class="controls state-toggle">
            ${completed}
            <button class="btn small" data-idx="${idx}" data-bidx="${bIdx}" data-act="addEx">Añadir ejercicio</button>
          </div>
        </header>
        <div class="walk">
          <label>Tipo de entrenamiento<input type="text" class="freeInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="tipo" value="${c.tipo}"></label>
          <label>Distancia<input type="text" class="freeInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="distancia" value="${c.distancia}"></label>
          <label>Tiempo<input type="text" class="freeInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="tiempo" value="${c.tiempo}"></label>
          <label>FC media (ppm)<input type="number" class="freeInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="fc" value="${c.fc}"></label>
          <label style="grid-column:1/-1;">Sensaciones<textarea rows="3" class="freeText" data-idx="${idx}" data-bidx="${bIdx}" data-field="sensaciones">${c.sensaciones}</textarea></label>
        </div>
      `;
    }

    // --- Bloques normales ---
    else {
      const maxSets = Math.max(0, ...(block.exercises || []).map(ex => (ex.sets || []).length));
      const thead = `<th>Ejercicio</th><th>Objetivo</th>` +
        Array.from({ length: maxSets }, (_, i) => `<th>Set ${i + 1}</th>`).join("");

      const rows = (block.exercises || []).map((ex, eIdx) => {
        const cols = Array.from({ length: maxSets }, (_, i) => {
          const s = (ex.sets || [])[i] || { w: "", r: "" };
          return `<td contenteditable class="cell" data-idx="${idx}" data-bidx="${bIdx}" data-eidx="${eIdx}" data-sidx="${i}">${s.w && s.r ? `${s.w} x ${s.r}` : ""}</td>`;
        }).join("");
        return `<tr><td contenteditable class="exName" data-idx="${idx}" data-bidx="${bIdx}" data-eidx="${eIdx}">${ex.name}</td><td contenteditable class="exTarget" data-idx="${idx}" data-bidx="${bIdx}" data-eidx="${eIdx}">${ex.target}</td>${cols}</tr>`;
      }).join("");

      wrap.innerHTML = `
        <header><strong>${block.type}</strong>
          <div class="controls state-toggle">
            ${completed}${notDoneBtn}
            <button class="btn small" data-idx="${idx}" data-bidx="${bIdx}" data-act="notes">Sensaciones</button>
          </div>
        </header>
        <table class="ex-table"><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table>
      `;
    }

    container.appendChild(wrap);
  });
}

// ===== Eventos básicos =====
function attachBlockHandlers() {
  document.querySelectorAll(".doneToggle").forEach(chk => {
    chk.addEventListener("change", e => {
      const c = e.target, wk = getActiveWeek(), st = loadStateFor(wk);
      const b = st.days[c.dataset.idx].blocks[c.dataset.bidx];
      b.status = c.checked ? "done" : "none";
      saveStateFor(wk, st);
      render();
    });
  });

  document.querySelectorAll("button[data-act='notdone']").forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.idx, j = +btn.dataset.bidx, wk = getActiveWeek(), st = loadStateFor(wk);
      st.days[i].blocks[j].status = "notdone";
      saveStateFor(wk, st);
      render();
    };
  });

  document.querySelectorAll(".walkInput,.walkText,.freeInput,.freeText").forEach(inp => {
    inp.addEventListener("input", e => {
      const i = e.target, wk = getActiveWeek(), st = loadStateFor(wk);
      const b = st.days[i.dataset.idx].blocks[i.dataset.bidx];
      const field = i.dataset.field;
      if (b.walkData) b.walkData[field] = i.value;
      if (b.custom) b.custom[field] = i.value;
      saveStateFor(wk, st);
    });
  });
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
  // Si no está Chart.js, salir sin romper nada
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
