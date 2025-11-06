// ================================
//  CONFIGURACIÓN / UTILIDADES
// ================================
const el = s => document.querySelector(s);
const planner = el("#planner");
const weekInput = el("#weekStart");
const DAY_NAMES = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const isWeekend = (i) => i === 5 || i === 6;

function parseISO(d){ const [y,m,dd]=d.split("-").map(Number); return new Date(y, m-1, dd); }
function addDays(date, n){ const d=new Date(date); d.setDate(d.getDate()+n); return d; }
function ddmm(d){ const x=new Date(d); const dd=String(x.getDate()).padStart(2,"0"); const mm=String(x.getMonth()+1).padStart(2,"0"); return `${dd}/${mm}`; }
function esDayShort(d){ return ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][new Date(d).getDay()]; }

// ----- Tabs: helpers -----
function activeTabName() {
  const t = document.querySelector(".tab.active");
  return t ? t.dataset.tab : "plan";
}
function showTab(tabName) {
  document.querySelectorAll(".tab").forEach(x => {
    const isActive = x.dataset.tab === tabName;
    x.classList.toggle("active", isActive);
    x.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  document.querySelectorAll(".tab-pane").forEach(p => {
    p.classList.toggle("active", p.id === "tab-" + tabName);
  });
  if (tabName === "plan") render();
  else if (tabName === "historial") renderHistory();
  else if (tabName === "graficos") drawCharts();
}

// ---- Almacenamiento (localStorage) ----
function loadAll() {
  try { return JSON.parse(localStorage.getItem("sergio-weeks") || "{}"); }
  catch { return {}; }
}
function saveAll(all) { localStorage.setItem("sergio-weeks", JSON.stringify(all)); }
function loadStateFor(weekStart) { return loadAll()[weekStart]; }
function saveStateFor(weekStart, state) { const all = loadAll(); all[weekStart] = state; saveAll(all); }
function setActiveWeek(w) { localStorage.setItem("sergio-active-week", w); }
function getActiveWeek() { return localStorage.getItem("sergio-active-week"); }
function listWeeks() { return Object.keys(loadAll()).sort(); }

// ================================
//  PLANTILLAS DE BLOQUES
// ================================
function ex(name, target, sets = 3) {
  const s = [];
  for (let i = 0; i < sets; i++) s.push({ w: "", r: "" });
  return { name, target, sets: s };
}

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
function COOLDOWN() {
  return { type: "Enfriamiento", fixed: true, status: "none", exercises: [ ex("Cinta + estiramientos", "10 min", 0) ] };
}
function CARDIO() {
  return {
    type: "Cardio",
    cardio: true,
    status: "none",
    cardioData: { modalidad: "Caminata", tiempo: "", distancia: "", fc: "", sensaciones: "" }
  };
}
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
function defaultPlan(weekStart) {
  return {
    weekStart,
    days: [
      { name: "Lunes",     blocks: [CARDIO(), WU_Anterior(),  BL_Anterior(),  COOLDOWN()] },
      { name: "Martes",    blocks: [CARDIO()] },
      { name: "Miércoles", blocks: [CARDIO(), WU_HIIT(),      BL_HIIT()] }, // sin enfriamiento
      { name: "Jueves",    blocks: [CARDIO()] },
      { name: "Viernes",   blocks: [CARDIO(), WU_Posterior(), BL_Posterior(), COOLDOWN()] },
      { name: "Sábado",    blocks: [LIBRE()] },
      { name: "Domingo",   blocks: [LIBRE()] }
    ],
    biometrics: {}
  };
}
function ensureWeekShape(weekStart) {
  const all = loadAll();
  const st = all[weekStart];
  if (!st || !Array.isArray(st.days) || st.days.length !== 7) {
    all[weekStart] = defaultPlan(weekStart);
    saveAll(all);
    return true;
  }
  return false;
}

// ================================
//  INICIALIZACIÓN
// ================================
function init() {
  document.addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (!t) return;
    e.preventDefault();
    const name = t.dataset.tab || "plan";
    showTab(name);
  });

  el("#prevWeek")?.addEventListener("click", () => shiftWeek(-7));
  el("#nextWeek")?.addEventListener("click", () => shiftWeek(7));
  weekInput?.addEventListener("change", e => createWeekIfMissing(e.target.value, true));

  el("#newWeekBtn")?.addEventListener("click", () => {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    createWeekIfMissing(d.toISOString().slice(0,10), true);
  });
  el("#duplicateWeekBtn")?.addEventListener("click", duplicateWeek);
  el("#exportAllBtn")?.addEventListener("click", exportAll);
  el("#exportWeekReport")?.addEventListener("click", exportWeekReport);
  el("#importAllFile")?.addEventListener("change", importAll);
  el("#resetBtn")?.addEventListener("click", resetAll);
  el("#expandAll")?.addEventListener("click", () => toggleAll(true));
  el("#collapseAll")?.addEventListener("click", () => toggleAll(false));
  el("#addBlockFab")?.addEventListener("click", () => addBlockForToday());
  el("#saveBio")?.addEventListener("click", saveBiomarkers);

  const today = new Date();
  const monday = new Date(today);
  const gd = today.getDay();
  monday.setDate(monday.getDate() + (gd === 0 ? -6 : 1 - gd));
  const wk = monday.toISOString().slice(0,10);
  createWeekIfMissing(wk, true);

  const activeBtn = document.querySelector(".tab.active");
  const initial = activeBtn ? activeBtn.dataset.tab : "plan";
  showTab(initial);
}
function shiftWeek(days) {
  const curStr = getActiveWeek();
  const cur = curStr ? new Date(curStr) : new Date();
  cur.setDate(cur.getDate() + days);
  createWeekIfMissing(cur.toISOString().slice(0,10), true);
}
function createWeekIfMissing(weekStart, setActive) {
  const all = loadAll();
  if (!all[weekStart]) all[weekStart] = defaultPlan(weekStart);
  ensureWeekShape(weekStart);
  if (setActive) setActiveWeek(weekStart);
  if (weekInput) weekInput.value = weekStart;
  const tab = activeTabName();
  if (tab === "plan") render();
  else if (tab === "historial") renderHistory();
  else if (tab === "graficos") drawCharts();
}

// ================================
//  RENDER DEL PLAN (con FECHA por día)
// ================================
function render() {
  const wk = getActiveWeek();
  if (!wk) return;
  ensureWeekShape(wk);
  const st = loadStateFor(wk);
  if (!planner) return;
  planner.innerHTML = "";

  const base = parseISO(st.weekStart || wk);

  st.days.forEach((day, idx) => {
    const dateStr = addDays(base, idx).toISOString().slice(0,10);
    const nice = ddmm(dateStr);

    const sec = document.createElement("section");
    sec.className = "day card";

    sec.innerHTML = `
      <h3>
        <span>${day.name} — ${nice}</span>
        <span class="summary-actions">
          <button class="btn small" data-idx="${idx}" data-act="summary">Resumen</button>
          <button class="btn small" data-idx="${idx}" data-act="toggle">Ver</button>
        </span>
      </h3>
      <div class="details open" data-idx="${idx}"></div>
    `;

    planner.appendChild(sec);
    renderDayBlocks(sec.querySelector(".details"), day, idx);
  });

  document.querySelectorAll("button[data-act='summary']").forEach(b => b.onclick = () => openDailySummary(+b.dataset.idx));
  document.querySelectorAll("button[data-act='toggle']").forEach(b => b.onclick = () => {
    const d = planner.querySelector(`.details[data-idx="${b.dataset.idx}"]`);
    d.classList.toggle("open");
  });

  attachBlockHandlers();
}

function renderDayBlocks(container, day, idx) {
  container.innerHTML = "";
  day.blocks.forEach((block, bIdx) => {
    const wrap = document.createElement("div");
    wrap.className = "block";
    if (block.status === "done") wrap.style.background = "#d6f8d6";
    else if (block.status === "notdone") wrap.style.background = "#f9d6d6";
    else wrap.style.background = "";

    const showNotDone = !isWeekend(idx);
    const notDoneBtn = showNotDone ? `<button class="btn small" data-idx="${idx}" data-bidx="${bIdx}" data-act="notdone">No completado</button>` : "";
    const completed = `<label><input type="checkbox" ${block.status === "done" ? "checked" : ""} data-idx="${idx}" data-bidx="${bIdx}" class="doneToggle"> Completado</label>`;

    if (block.cardio || block.walk) {
      if (!block.cardio) {
        block.type = "Cardio"; block.cardio = true;
        block.cardioData = Object.assign(
          { modalidad: "Caminata", tiempo: "", distancia: "", fc: "", sensaciones: "" },
          block.walkData || {}
        );
      }
      const cd = block.cardioData || { modalidad: "Caminata", tiempo: "", distancia: "", fc: "", sensaciones: "" };
      wrap.innerHTML = `
        <header><strong>🏃 ${block.type}</strong>
          <div class
