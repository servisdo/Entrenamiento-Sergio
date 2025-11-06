// ================================
//  UTILIDADES Y CONFIG
// ================================
const el = s => document.querySelector(s);
const planner = el("#planner");
const weekInput = el("#weekStart");
const DAY_NAMES = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const isWeekend = (i) => i === 5 || i === 6;

const fmtDate = (d) => {
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
const iso = (d) => d.toISOString().slice(0,10);
const parseISO = (s) => { const [y,m,dd]=s.split("-").map(Number); return new Date(y,m-1,dd); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

// Tabs helpers
function activeTabName() {
  const t = document.querySelector(".tab.active");
  return t ? t.dataset.tab : "plan";
}
function showTab(tabName) {
  document.querySelectorAll(".tab").forEach(x => {
    const on = x.dataset.tab === tabName;
    x.classList.toggle("active", on);
    x.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.toggle("active", p.id === "tab-" + tabName));
  if (tabName === "plan") render();
  else if (tabName === "historial") renderHistory();
  else if (tabName === "graficos") drawCharts();
}

// ================================
//  ALMACENAMIENTO
// ================================
function loadAll() { try { return JSON.parse(localStorage.getItem("sergio-weeks") || "{}"); } catch { return {}; } }
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
  const s = []; for (let i=0;i<sets;i++) s.push({w:"", r:""});
  return { name, target, sets: s };
}
function WU_Anterior(){ return { type:"Calentamiento — Cara anterior", fixed:true, status:"none",
  exercises:[ ex("Remo polea baja sentado","3 x 15 ligero (movilidad hombros/core)",0),
              ex("Sentadillas sin carga","3 x 10",0) ] }; }
function WU_Posterior(){ return { type:"Calentamiento — Cara posterior", fixed:true, status:"none",
  exercises:[ ex("Jalón al pecho polea alta","3 x 10 ligero",0),
              ex("Curl isquios máquina","3 x 15 ligero",0) ] }; }
function WU_HIIT(){ return { type:"Calentamiento — HIIT", fixed:true, status:"none",
  exercises:[ ex("Elíptica Z2 (110–120 ppm)","10 min (hablar cómodo)",0) ] }; }

function BL_Anterior(){ return { type:"Cara anterior", status:"none", exercises:[
  ex("Press banca horizontal","3 x 8–12"),
  ex("Elevaciones frontales polea baja","3 x 10–12"),
  ex("Extensión de rodilla","3 x 10"),
  ex("Curl bíceps polea baja","3 x 10–12"),
  ex("Crunch polea alta","3 x 12")
]};}
function BL_Posterior(){ return { type:"Cara posterior", status:"none", exercises:[
  ex("Pull-down polea alta","3 x 10–12"),
  ex("Face pull polea media","3 x 10–12"),
  ex("Extensión cadera polea baja (cada lado)","3 x 10"),
  ex("Extensión tríceps polea alta","3 x 10–12"),
  ex("Hiperextensión lumbar en máquina","3 x 12")
]};}
function BL_HIIT(){ return { type:"HIIT", status:"none", exercises:[
  { name:"Puente glúteos isométrico", target:'45" / 20"', sets:[] },
  { name:"Remo invertido en barra",   target:'45" / 20"', sets:[] },
  { name:"PM rumano con kettlebell",  target:'45" / 20"', sets:[] },
  { name:"Zancada estática + press militar", target:'45" / 20"', sets:[] },
  { name:"Press Pallof isométrico",   target:'45" / 20"', sets:[] },
  { name:"Bird-dog alterno",          target:'45" / 20"', sets:[] },
  { name:"Rondas finales",            target:'6–8 rondas: 2–3 burpees + 30" skipping', sets:[] }
]};}

function COOLDOWN(){ return { type:"Enfriamiento", fixed:true, status:"none",
  exercises:[ ex("Cinta + estiramientos","10 min",0) ] }; }

function CARDIO(){ return {
  type:"Cardio", cardio:true, status:"none",
  cardioData:{ modalidad:"Caminata", tiempo:"", distancia:"", fc:"", sensaciones:"" }
};}

function LIBRE(){ return {
  type:"Entrenamiento libre", kind:"libre", status:"none",
  custom:{ tipo:"", distancia:"", tiempo:"", fc:"", sensaciones:"" }, exercises:[]
};}

// ================================
//  SEMANA POR DEFECTO + REPARACIÓN
// ================================
function defaultPlan(weekStart) {
  return {
    weekStart,
    days: [
      { name:"Lunes",     blocks:[CARDIO(), WU_Anterior(),  BL_Anterior(),  COOLDOWN()] },
      { name:"Martes",    blocks:[CARDIO()] },
      { name:"Miércoles", blocks:[CARDIO(), WU_HIIT(),      BL_HIIT()] },
      { name:"Jueves",    blocks:[CARDIO()] },
      { name:"Viernes",   blocks:[CARDIO(), WU_Posterior(), BL_Posterior(), COOLDOWN()] },
      { name:"Sábado",    blocks:[LIBRE()] },
      { name:"Domingo",   blocks:[LIBRE()] }
    ],
    biometrics: {},              // últimos valores “vigentes” (opcional)
    biometricsByDate: {}         // histórico: { 'YYYY-MM-DD': {peso,...} }
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
  if (!st.biometricsByDate) { st.biometricsByDate = {}; saveStateFor(weekStart, st); }
  return false;
}

// ================================
function init() {
  document.addEventListener("click", (e)=>{
    const t = e.target.closest(".tab"); if (!t) return;
    e.preventDefault(); showTab(t.dataset.tab || "plan");
  });

  el("#prevWeek")?.addEventListener("click", ()=> shiftWeek(-7));
  el("#nextWeek")?.addEventListener("click", ()=> shiftWeek(7));
  weekInput?.addEventListener("change", e => createWeekIfMissing(e.target.value, true));

  el("#newWeekBtn")?.addEventListener("click", ()=>{
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay()+6)%7));
    createWeekIfMissing(iso(d), true);
  });
  el("#duplicateWeekBtn")?.addEventListener("click", duplicateWeek);
  el("#exportAllBtn")?.addEventListener("click", exportAll);
  el("#exportWeekReport")?.addEventListener("click", exportWeekReport);
  el("#importAllFile")?.addEventListener("change", importAll);
  el("#resetBtn")?.addEventListener("click", resetAll);
  el("#expandAll")?.addEventListener("click", ()=> toggleAll(true));
  el("#collapseAll")?.addEventListener("click", ()=> toggleAll(false));
  el("#addBlockFab")?.addEventListener("click", addBlockForToday);
  el("#saveBio")?.addEventListener("click", saveBiomarkersWithDate); // ⟵ guarda con fecha

  // Semana por defecto = lunes actual
  const today = new Date();
  const monday = new Date(today);
  const gd = today.getDay();
  monday.setDate(monday.getDate() + (gd===0 ? -6 : 1-gd));
  createWeekIfMissing(iso(monday), true);

  // Mostrar pestaña activa
  const initial = (document.querySelector(".tab.active")?.dataset.tab) || "plan";
  showTab(initial);
}
document.addEventListener("DOMContentLoaded", init);

// ================================
//  SEMANAS
// ================================
function shiftWeek(days) {
  const cur = getActiveWeek();
  const d = cur ? parseISO(cur) : new Date();
  d.setDate(d.getDate()+days);
  createWeekIfMissing(iso(d), true);
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
//  RENDER PLAN (con FECHA en cada día)
// ================================
function render() {
  const wk = getActiveWeek(); if (!wk) return;
  ensureWeekShape(wk);
  const st = loadStateFor(wk);
  if (!planner) return;
  planner.innerHTML = "";

  const base = parseISO(st.weekStart || wk);

  st.days.forEach((day, idx) => {
    const thisDate = addDays(base, idx);
    const dateLabel = fmtDate(thisDate); // dd/mm/yyyy

    const sec = document.createElement("section");
    sec.className = "day card";
    sec.innerHTML = `
      <h3>
        <span>${day.name} — ${dateLabel}</span>
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
    wrap.style.background = block.status==="done" ? "#d6f8d6" : block.status==="notdone" ? "#f9d6d6" : "";

    const showNotDone = !isWeekend(idx);
    const notDoneBtn = showNotDone ? `<button class="btn small" data-idx="${idx}" data-bidx="${bIdx}" data-act="notdone">No completado</button>` : "";
    const completed = `<label><input type="checkbox" ${block.status==="done"?"checked":""} data-idx="${idx}" data-bidx="${bIdx}" class="doneToggle"> Completado</label>`;

    // Cardio (selector modalidad)
    if (block.cardio || block.walk) {
      if (!block.cardio) {
        block.type="Cardio"; block.cardio=true;
        block.cardioData = Object.assign({ modalidad:"Caminata", tiempo:"", distancia:"", fc:"", sensaciones:"" }, block.walkData || {});
      }
      const cd = block.cardioData;
      wrap.innerHTML = `
        <header><strong>🏃 ${block.type}</strong>
          <div class="controls state-toggle">${completed}${notDoneBtn}</div>
        </header>
        <div class="walk">
          <label>Modalidad
            <select class="cardioSelect" data-idx="${idx}" data-bidx="${bIdx}" data-field="modalidad">
              <option ${cd.modalidad==="Caminata"?"selected":""}>Caminata</option>
              <option ${cd.modalidad==="Carrera"?"selected":""}>Carrera</option>
              <option ${cd.modalidad==="Bicicleta"?"selected":""}>Bicicleta</option>
            </select>
          </label>
          <label>Tiempo (min)<input type="number" step="1" class="cardioInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="tiempo" value="${cd.tiempo}"></label>
          <label>Distancia (km)<input type="number" step="0.01" class="cardioInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="distancia" value="${cd.distancia}"></label>
          <label>FC media (ppm)<input type="number" step="1" class="cardioInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="fc" value="${cd.fc}"></label>
          <label style="grid-column:1/-1;">Sensaciones<textarea rows="3" class="cardioText" data-idx="${idx}" data-bidx="${bIdx}" data-field="sensaciones">${cd.sensaciones}</textarea></label>
        </div>
      `;
    }
    // Entrenamiento libre
    else if (block.kind === "libre") {
      const c = block.custom || { tipo:"", distancia:"", tiempo:"", fc:"", sensaciones:"" };
      wrap.innerHTML = `
        <header><strong>🆓 ${block.type}</strong>
          <div class="controls state-toggle">${completed}</div>
        </header>
        <div class="walk">
          <label>Tipo<input type="text" class="freeInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="tipo" value="${c.tipo}"></label>
          <label>Distancia<input type="text" class="freeInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="distancia" value="${c.distancia}"></label>
          <label>Tiempo<input type="text" class="freeInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="tiempo" value="${c.tiempo}"></label>
          <label>FC media (ppm)<input type="number" class="freeInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="fc" value="${c.fc}"></label>
          <label style="grid-column:1/-1;">Sensaciones<textarea rows="3" class="freeText" data-idx="${idx}" data-bidx="${bIdx}" data-field="sensaciones">${c.sensaciones}</textarea></label>
        </div>
      `;
    }
    // Bloques de fuerza
    else {
      const maxSets = Math.max(3, ...(block.exercises||[]).map(ex => (ex.sets||[]).length));
      const thead = `<th>Ejercicio</th><th>Objetivo</th>` +
        Array.from({length:maxSets},(_,i)=>`<th>Set ${i+1} (kg x reps)</th>`).join("");
      const rows = (block.exercises||[]).map((ex,eIdx)=>{
        const cols = Array.from({length:maxSets},(_,i)=>{
          const s=(ex.sets||[])[i]||{w:"",r:""}; const v=(s.w&&s.r)?`${s.w} x ${s.r}`:"";
          return `<td contenteditable class="cell" data-idx="${idx}" data-bidx="${bIdx}" data-eidx="${eIdx}" data-sidx="${i}">${v}</td>`;
        }).join("");
        return `<tr>
          <td contenteditable class="exName" data-idx="${idx}" data-bidx="${bIdx}" data-eidx="${eIdx}">${ex.name}</td>
          <td contenteditable class="exTarget" data-idx="${idx}" data-bidx="${bIdx}" data-eidx="${eIdx}">${ex.target}</td>
          ${cols}
        </tr>`;
      }).join("");
      wrap.innerHTML = `
        <header><strong>🏋️ ${block.type}</strong>
          <div class="controls state-toggle">${completed}${notDoneBtn}<button class="btn small" data-idx="${idx}" data-bidx="${bIdx}" data-act="notes">Sensaciones</button></div>
        </header>
        <table class="ex-table"><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table>
      `;
    }
    container.appendChild(wrap);
  });
}

// ================================
//  EVENTOS / GUARDADO
// ================================
function attachBlockHandlers() {
  document.querySelectorAll(".doneToggle").forEach(chk=>{
    chk.addEventListener("change", e=>{
      const c=e.target, wk=getActiveWeek(), st=loadStateFor(wk);
      const b=st.days[c.dataset.idx].blocks[c.dataset.bidx];
      b.status = c.checked ? "done" : "none";
      saveStateFor(wk, st); render();
    });
  });
  document.querySelectorAll("button[data-act='notdone']").forEach(btn=>{
    btn.onclick = ()=>{
      const i=+btn.dataset.idx, j=+btn.dataset.bidx, wk=getActiveWeek(), st=loadStateFor(wk);
      st.days[i].blocks[j].status = "notdone";
      saveStateFor(wk, st); render();
    };
  });

  // Cardio
  document.querySelectorAll(".cardioSelect,.cardioInput,.cardioText").forEach(inp=>{
    inp.addEventListener("input", e=>{
      const i=e.target, wk=getActiveWeek(), st=loadStateFor(wk);
      const b=st.days[i.dataset.idx].blocks[i.dataset.bidx];
      if (!b.cardio) { b.type="Cardio"; b.cardio=true; b.cardioData=Object.assign({modalidad:"Caminata", tiempo:"", distancia:"", fc:"", sensaciones:""}, b.walkData||{}); }
      const field=i.dataset.field; if (b.cardioData) b.cardioData[field]=i.value;
      saveStateFor(wk, st);
    });
  });

  // Libre + compat caminata
  document.querySelectorAll(".walkInput,.walkText,.freeInput,.freeText").forEach(inp=>{
    inp.addEventListener("input", e=>{
      const i=e.target, wk=getActiveWeek(), st=loadStateFor(wk);
      const b=st.days[i.dataset.idx].blocks[i.dataset.bidx];
      const field=i.dataset.field;
      if (b.walkData) b.walkData[field]=i.value;
      if (b.custom)   b.custom[field]=i.value;
      saveStateFor(wk, st);
    });
  });

  // Celdas ejercicios
  document.querySelectorAll(".cell").forEach(td=>{
    td.addEventListener("input", e=>{
      const c=e.target;
      const i=+c.dataset.idx, j=+c.dataset.bidx, eidx=+c.dataset.eidx, sidx=+c.dataset.sidx;
      const wk=getActiveWeek(), st=loadStateFor(wk);
      const ex=st.days[i].blocks[j].exercises[eidx];
      const text=c.textContent.trim(); const m=text.match(/^\s*(\d+(?:[.,]\d+)?)\s*x\s*(\d+)\s*$/i);
      ex.sets[sidx] = m ? { w:String(m[1]).replace(",", "."), r:m[2] } : { w:"", r:"" };
      saveStateFor(wk, st);
    });
  });

  document.querySelectorAll("button[data-act='notes']").forEach(btn=>{
    btn.onclick = ()=>{
      const i=+btn.dataset.idx, j=+btn.dataset.bidx, wk=getActiveWeek(), st=loadStateFor(wk);
      const b=st.days[i].blocks[j]; const cur=b.notes||"";
      const val=prompt("Sensaciones del bloque:", cur ?? "");
      if (val!==null){ b.notes=val; saveStateFor(wk, st); }
    };
  });
}

// ================================
//  HISTORIAL
// ================================
function renderHistory() {
  const all = loadAll();
  const container = document.getElementById("history"); if (!container) return;
  container.innerHTML = "";
  const weeks = listWeeks(); if (!weeks.length){ container.innerHTML="<p>No hay semanas registradas todavía.</p>"; return; }

  weeks.forEach(w=>{
    const wk = loadStateFor(w);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${w}</h3>
      <p>Días: ${wk.days.length}</p>
      <button class="btn small" data-week="${w}">Ver</button>
    `;
    container.appendChild(card);
    card.querySelector("button").onclick = ()=>{
      setActiveWeek(w); if (weekInput) weekInput.value = w; showTab("plan");
    };
  });
}

// ================================
//  GRÁFICOS (semanal/diario)
// ================================
function collectUniqueExerciseNames() {
  const all = loadAll(); const set = new Set();
  Object.values(all).forEach(st=>{
    (st.days||[]).forEach(d=>{
      (d.blocks||[]).forEach(b=>{
        (b.exercises||[]).forEach(ex=>{ if (ex?.name) set.add(ex.name.trim()); });
      });
    });
  });
  return Array.from(set).sort((a,b)=>a.localeCompare(b, "es"));
}

// Helpers de agregación
function weeksAndDates() {
  const weeks = listWeeks();
  const weekDates = {}; // weekStart -> [iso for 7 days]
  weeks.forEach(w=>{
    const start = parseISO(w);
    weekDates[w] = Array.from({length:7},(_,i)=>iso(addDays(start,i)));
  });
  return { weeks, weekDates };
}

function weeklyVolumeFor(exerciseName) {
  const { weeks } = weeksAndDates();
  const all = loadAll();
  return weeks.map(w=>{
    const st = all[w]; if (!st) return { x:w, y:0 };
    let vol=0;
    st.days.forEach(d=>{
      d.blocks.forEach(b=>{
        (b.exercises||[]).forEach(ex=>{
          if (exerciseName && ex.name?.trim() !== exerciseName) return;
          (ex.sets||[]).forEach(s=>{ if (s.w && s.r) vol += (+s.w||0) * (+s.r||0); });
        });
      });
    });
    return { x:w, y:vol };
  });
}
function dailyVolumeFor(exerciseName) {
  const { weeks, weekDates } = weeksAndDates();
  const all = loadAll(); const rows = [];
  weeks.forEach(w=>{
    const st = all[w]; if (!st) return;
    (st.days||[]).forEach((dy,idx)=>{
      const date = weekDates[w][idx];
      let vol=0;
      dy.blocks.forEach(b=>{
        (b.exercises||[]).forEach(ex=>{
          if (exerciseName && ex.name?.trim() !== exerciseName) return;
          (ex.sets||[]).forEach(s=>{ if (s.w && s.r) vol += (+s.w||0) * (+s.r||0); });
        });
      });
      rows.push({ x:date, y:vol });
    });
  });
  return rows;
}

function weeklyCardioTotals(mod) {
  const { weeks } = weeksAndDates();
  const all = loadAll();
  return weeks.map(w=>{
    const st = all[w]; if (!st) return { x:w, t:0, d:0 };
    let t=0, d=0;
    st.days.forEach(dy=>{
      dy.blocks.forEach(b=>{
        const data = (b.cardioData || b.walkData);
        if (!data) return;
        const m = b.cardioData?.modalidad || "Caminata";
        if (mod && mod!=="Total" && m !== mod) return;
        t += +data.tiempo||0; d += +data.distancia||0;
      });
    });
    return { x:w, t, d };
  });
}
function dailyCardioTotals(mod) {
  const { weeks, weekDates } = weeksAndDates();
  const all = loadAll(); const rows = [];
  weeks.forEach(w=>{
    const st = all[w]; if (!st) return;
    (st.days||[]).forEach((dy,idx)=>{
      const date = weekDates[w][idx];
      let t=0, d=0;
      dy.blocks.forEach(b=>{
        const data = (b.cardioData || b.walkData);
        if (!data) return;
        const m = b.cardioData?.modalidad || "Caminata";
        if (mod && mod!=="Total" && m !== mod) return;
        t += +data.tiempo||0; d += +data.distancia||0;
      });
      rows.push({ x:date, t, d });
    });
  });
  return rows;
}

function weeklyWeightFromLogs() {
  const { weeks, weekDates } = weeksAndDates();
  const all = loadAll();
  return weeks.map(w=>{
    const st = all[w]; if (!st) return { x:w, y:null };
    const dates = weekDates[w];
    const vals = dates.map(d => +(st.biometricsByDate?.[d]?.peso || 0)).filter(v=>v>0);
    const avg = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : null;
    return { x:w, y: avg };
  }).filter(p => p.y !== null);
}
function dailyWeightFromLogs() {
  const all = loadAll(); const points = [];
  Object.values(all).forEach(st=>{
    const logs = st.biometricsByDate || {};
    Object.keys(logs).forEach(date=>{
      const v = +logs[date].peso || 0;
      if (v>0) points.push({ x:date, y:v });
    });
  });
  // ordenar por fecha
  points.sort((a,b)=> a.x.localeCompare(b.x));
  return points;
}

// UI controles gráficos
function ensureChartsControls() {
  const pane = document.getElementById("tab-graficos"); if (!pane) return;

  if (!document.getElementById("chartsControls")) {
    const wrap = document.createElement("div");
    wrap.id = "chartsControls";
    wrap.className = "card";
    wrap.style.marginBottom = "12px";
    wrap.innerHTML = `
      <div class="grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        <label>Volumen (kg·reps): ejercicio
          <select id="volExerciseSelect"><option value="">(Total)</option></select>
        </label>
        <label>Cardio: modalidad
          <select id="cardioModSelect">
            <option value="Total">(Total)</option>
            <option value="Caminata">Caminata</option>
            <option value="Carrera">Carrera</option>
            <option value="Bicicleta">Bicicleta</option>
          </select>
        </label>
        <label>Periodo
          <select id="periodSelect">
            <option value="Semanal">Semanal</option>
            <option value="Diario">Diario</option>
          </select>
        </label>
      </div>
    `;
    const chartsWrap = pane.querySelector(".charts");
    if (chartsWrap) pane.insertBefore(wrap, chartsWrap); else pane.prepend(wrap);
  }

  // Rellenar ejercicios una sola vez (o forzar si cambió el dataset)
  const sel = document.getElementById("volExerciseSelect");
  if (sel && sel.dataset.filled !== "1") {
    const names = collectUniqueExerciseNames();
    names.forEach(n => { const opt=document.createElement("option"); opt.value=n; opt.textContent=n; sel.appendChild(opt); });
    sel.dataset.filled = "1";
  }

  document.getElementById("volExerciseSelect")?.addEventListener("change", drawCharts);
  document.getElementById("cardioModSelect")?.addEventListener("change", drawCharts);
  document.getElementById("periodSelect")?.addEventListener("change", drawCharts);
}

function drawCharts() {
  if (typeof Chart === "undefined") return;
  ensureChartsControls();

  const ctxPeso = document.getElementById("pesoChart")?.getContext("2d");
  const ctxVol  = document.getElementById("volChart")?.getContext("2d");
  const ctxWalkT= document.getElementById("walkTimeChart")?.getContext("2d");
  const ctxWalkD= document.getElementById("walkDistChart")?.getContext("2d");
  if (!ctxPeso || !ctxVol || !ctxWalkT || !ctxWalkD) return;

  const chosenEx  = document.getElementById("volExerciseSelect")?.value || "";
  const chosenMod = document.getElementById("cardioModSelect")?.value || "Total";
  const period    = document.getElementById("periodSelect")?.value || "Semanal";

  let peso, vol, cardioT, cardioD;
  if (period === "Semanal") {
    peso = weeklyWeightFromLogs();
    vol  = weeklyVolumeFor(chosenEx || null);
    const c = weeklyCardioTotals(chosenMod);
    cardioT = c.map(o=>({x:o.x, y:o.t}));
    cardioD = c.map(o=>({x:o.x, y:o.d}));
  } else {
    peso = dailyWeightFromLogs();
    vol  = dailyVolumeFor(chosenEx || null);
    const c = dailyCardioTotals(chosenMod);
    cardioT = c.map(o=>({x:o.x, y:o.t}));
    cardioD = c.map(o=>({x:o.x, y:o.d}));
  }

  const opts = { responsive:true, parsing:false,
    scales:{ x:{ ticks:{ color:"#333" } }, y:{ beginAtZero:true } } };

  // destruir anteriores
  window._pesoChart && window._pesoChart.destroy();
  window._volChart && window._volChart.destroy();
  window._walkTChart && window._walkTChart.destroy();
  window._walkDChart && window._walkDChart.destroy();

  // Peso (línea)
  window._pesoChart = new Chart(ctxPeso, {
    type:"line",
    data:{ datasets:[{ label: period==="Semanal"?"Peso medio semana (kg)":"Peso diario (kg)",
      data: peso.map(p=>({x:p.x, y:p.y})) }] },
    options: { ...opts, scales:{...opts.scales, x:{...opts.scales.x, type:"category"}} }
  });

  // Volumen (barras)
  window._volChart = new Chart(ctxVol, {
    type:"bar",
    data:{ datasets:[{ label: chosenEx?`Volumen (${chosenEx})`:"Volumen (total)", data: vol.map(p=>({x:p.x, y:p.y})) }] },
    options: { ...opts, scales:{...opts.scales, x:{...opts.scales.x, type:"category"}} }
  });

  // Cardio Tiempo
  window._walkTChart = new Chart(ctxWalkT, {
    type:"bar",
    data:{ datasets:[{ label: (chosenMod==="Total"?"Tiempo cardio (min) — Total":`Tiempo cardio (min) — ${chosenMod}`),
      data: cardioT.map(p=>({x:p.x, y:p.y})) }] },
    options: { ...opts, scales:{...opts.scales, x:{...opts.scales.x, type:"category"}} }
  });

  // Cardio Distancia
  window._walkDChart = new Chart(ctxWalkD, {
    type:"bar",
    data:{ datasets:[{ label: (chosenMod==="Total"?"Distancia cardio (km) — Total":`Distancia cardio (km) — ${chosenMod}`),
      data: cardioD.map(p=>({x:p.x, y:p.y})) }] },
    options: { ...opts, scales:{...opts.scales, x:{...opts.scales.x, type:"category"}} }
  });
}

// ================================
//  RESUMEN DIARIO
// ================================
function openDailySummary(idx) {
  const wk=getActiveWeek(), st=loadStateFor(wk), day=st.days[idx];
  const base = parseISO(st.weekStart||wk);
  const date = iso(addDays(base, idx));
  let txt = `📅 ${day.name} (${fmtDate(addDays(base, idx))})\n\n`;
  day.blocks.forEach(b=>{
    txt += `🟦 ${b.type}\n`;
    if (b.cardio||b.walk){
      const d=(b.cardioData||b.walkData)||{};
      const mod=(b.cardioData?.modalidad)?` (${b.cardioData.modalidad})`:"";
      txt += `  • Tipo: Cardio${mod}\n  • Tiempo: ${d.tiempo||"-"} min\n  • Distancia: ${d.distancia||"-"} km\n  • FC media: ${d.fc||"-"} ppm\n  • Sensaciones: ${d.sensaciones||"-"}\n`;
    } else if (b.kind==="libre"){
      const c=b.custom||{};
      txt += `  • Tipo: ${c.tipo||"-"}\n  • Distancia: ${c.distancia||"-"}\n  • Tiempo: ${c.tiempo||"-"}\n  • FC media: ${c.fc||"-"}\n  • Sensaciones: ${c.sensaciones||"-"}\n`;
    } else {
      (b.exercises||[]).forEach(ex=>{
        txt += `  • ${ex.name}: ${ex.target||""}`;
        const sets=(ex.sets||[]).map(s=> s.w&&s.r?`${s.w}x${s.r}`:"").filter(Boolean).join(", ");
        if (sets) txt += ` → ${sets}`;
        txt += "\n";
      });
      if (b.notes) txt += `  • Sensaciones: ${b.notes}\n`;
    }
    txt += "\n";
  });

  const modal = document.getElementById("modalShare"); if (!modal) return;
  modal.classList.remove("hidden");
  const ta = document.getElementById("shareTextarea"); if (ta) ta.value = txt;
  document.getElementById("shareCopy")?.addEventListener("click", ()=>{ navigator.clipboard.writeText(txt); alert("Resumen copiado ✅"); }, { once:true });
  document.getElementById("shareDownload")?.addEventListener("click", ()=>{
    const blob=new Blob([txt],{type:"text/plain"}); const a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download=`${day.name}_${date}_resumen.txt`; a.click();
  }, { once:true });
  document.getElementById("shareClose")?.addEventListener("click", ()=> modal.classList.add("hidden"), { once:true });
}

// ================================
//  EXPORTAR / IMPORTAR / BIOMARCADORES
// ================================
function exportAll(){
  const data = localStorage.getItem("sergio-weeks") || "{}";
  const blob = new Blob([data], { type:"application/json" });
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="entrenos_sergio.json"; a.click();
}
function importAll(e){
  const f=e.target.files[0]; if (!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const data=JSON.parse(r.result);
      saveAll(data);
      // Forzar re-pintado y rearmar controles
      const cc=document.getElementById("chartsControls"); if (cc) cc.remove();
      const sel=document.getElementById("volExerciseSelect"); if (sel) sel.dataset.filled="";
      const tab=activeTabName(); if (tab==="plan") render(); else if (tab==="historial") renderHistory(); else drawCharts();
      alert("Datos importados ✅");
    }catch{ alert("Error al importar"); }
  };
  r.readAsText(f);
}
function resetAll(){
  if (confirm("¿Seguro que quieres borrar todos los datos?")){
    localStorage.removeItem("sergio-weeks"); localStorage.removeItem("sergio-active-week"); location.reload();
  }
}

// Guarda biomarcadores con fecha (histórico por día)
function saveBiomarkersWithDate(){
  const wk=getActiveWeek(), st=loadStateFor(wk);
  // fecha "hoy" (en la zona local)
  const todayIso = iso(new Date());
  const val = {
    peso:  el("#peso")?.value || "",
    sueno: el("#sueno")?.value || "",
    energia: el("#energia")?.value || "",
    estres: el("#estres")?.value || "",
    fcr: el("#fcr")?.value || "",
    notas: el("#bioNotas")?.value || ""
  };
  // guarda último snapshot
  st.biometrics = val;
  // guarda histórico por fecha
  if (!st.biometricsByDate) st.biometricsByDate = {};
  st.biometricsByDate[todayIso] = val;
  saveStateFor(wk, st);
  if (activeTabName()==="graficos") drawCharts();
  alert(`Biomarcadores guardados ✅ (${fmtDate(new Date())})`);
}

// ================================
//  OTRAS ACCIONES
// ================================
function duplicateWeek(){
  const cur=getActiveWeek(); if (!cur) return alert("No hay semana activa");
  const d=parseISO(cur); d.setDate(d.getDate()+7); const next=iso(d);
  const st=JSON.parse(JSON.stringify(loadStateFor(cur)));
  st.weekStart=next;
  st.days.forEach(day=>day.blocks.forEach(b=>{
    b.status="none";
    if (b.cardioData) b.cardioData={ modalidad:"Caminata", tiempo:"", distancia:"", fc:"", sensaciones:"" };
    if (b.walkData)  b.walkData = { tiempo:"", distancia:"", fc:"", sensaciones:"" };
    if (b.custom)    b.custom   = { tipo:"", distancia:"", tiempo:"", fc:"", sensaciones:"" };
    if (b.exercises) b.exercises.forEach(ex=> ex.sets.forEach(s=>{ s.w=""; s.r=""; }));
    b.notes="";
  }));
  // no copiamos biometricsByDate; se empieza limpio para la nueva semana
  st.biometrics = {};
  st.biometricsByDate = {};
  saveStateFor(next, st); setActiveWeek(next); if (weekInput) weekInput.value=next; showTab("plan");
  alert("Semana duplicada ✅");
}
function exportWeekReport(){
  const wk=getActiveWeek(), st=loadStateFor(wk); if (!st) return alert("No hay datos de esta semana");
  const base=parseISO(st.weekStart||wk);
  let txt=`📅 Reporte semanal (${wk})\n\n`;
  st.days.forEach((day,idx)=>{
    const fecha=fmtDate(addDays(base, idx));
    txt += `== ${day.name} — ${fecha} ==\n`;
    day.blocks.forEach(b=>{
      txt += `• ${b.type}\n`;
      if ((b.cardio && b.cardioData) || (b.walk && b.walkData)) {
        const d=b.cardioData||b.walkData; const mod=b.cardioData?.modalidad?` (${b.cardioData.modalidad})`:"";
        txt += `   - Cardio${mod}: Tiempo ${d.tiempo||"-"} min | Dist ${d.distancia||"-"} km | FC ${d.fc||"-"} | Sens ${d.sensaciones||"-"}\n`;
      } else if (b.kind==="libre" && b.custom){
        const c=b.custom;
        txt += `   - Tipo: ${c.tipo||"-"} | Dist: ${c.distancia||"-"} | Tiempo: ${c.tiempo||"-"} | FC: ${c.fc||"-"} | Sens.: ${c.sensaciones||"-"}\n`;
      } else if (b.exercises){
        b.exercises.forEach(ex=>{
          const sets=(ex.sets||[]).map(s=> s.w&&s.r ? `${s.w}x${s.r}`:"").filter(Boolean).join(", ");
          txt += `   - ${ex.name} (${ex.target||""}) ${sets? "→ "+sets : ""}\n`;
        });
        if (b.notes) txt += `   - Sensaciones: ${b.notes}\n`;
      }
    });
    txt += `\n`;
  });
  const blob=new Blob([txt],{type:"text/plain"}); const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download=`reporte_${wk}.txt`; a.click();
}
function toggleAll(open){ document.querySelectorAll(".details").forEach(d=> open?d.classList.add("open"):d.classList.remove("open")); }
function addBlockForToday(){
  const wk=getActiveWeek(), st=loadStateFor(wk);
  const today=new Date(); const idx=(today.getDay()+6)%7;
  st.days[idx].blocks.push(LIBRE()); saveStateFor(wk, st); render(); alert("Bloque libre añadido ✅");
}

// ================================
//  PWA
// ================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  });
}
