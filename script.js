// v34 — Igual que v32 + Biomarcadores por día (se guardan y salen en el Resumen diario)
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const planner = $("#planner");
const weekInput = $("#weekStart");

const DAY_NAMES = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const isWeekend = i => i===5 || i===6;

const fmtDate = d => {
  const dd=String(d.getDate()).padStart(2,"0");
  const mm=String(d.getMonth()+1).padStart(2,"0");
  const yy=d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};
const iso = d => d.toISOString().slice(0,10);
const parseISO = s => { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const addDays = (d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};

// ---- Storage
const loadAll=()=>{try{return JSON.parse(localStorage.getItem("sergio-weeks")||"{}");}catch{return {};}}
const saveAll=(all)=>localStorage.setItem("sergio-weeks",JSON.stringify(all));
const loadStateFor=(w)=>loadAll()[w];
const saveStateFor=(w,st)=>{const all=loadAll();all[w]=st;saveAll(all);}
const setActiveWeek=(w)=>localStorage.setItem("sergio-active-week",w);
const getActiveWeek=()=>localStorage.getItem("sergio-active-week");
const listWeeks=()=>Object.keys(loadAll()).sort();

// ---- Plantillas
const ex=(name,target,sets=3)=>({name,target,sets:Array.from({length:sets},()=>({w:"",r:""}))});
const WU_Anterior = ()=>({type:"Calentamiento — Cara anterior",fixed:true,status:"none",
  exercises:[ex("Remo polea baja sentado","3 x 15 ligero",0),ex("Sentadillas sin carga","3 x 10",0)]});
const WU_Posterior= ()=>({type:"Calentamiento — Cara posterior",fixed:true,status:"none",
  exercises:[ex("Jalón al pecho polea alta","3 x 10 ligero",0),ex("Curl isquios máquina","3 x 15 ligero",0)]});
const WU_HIIT    = ()=>({type:"Calentamiento — HIIT",fixed:true,status:"none",
  exercises:[ex("Elíptica Z2 (110–120 ppm)","10 min",0)]});
const BL_Anterior= ()=>({type:"Cara anterior",status:"none",exercises:[
  ex("Press banca horizontal","3 x 8–12"),
  ex("Elevaciones frontales polea baja","3 x 10–12"),
  ex("Extensión de rodilla","3 x 10"),
  ex("Curl bíceps polea baja","3 x 10–12"),
  ex("Crunch polea alta","3 x 12")
]});
const BL_Posterior=()=>({type:"Cara posterior",status:"none",exercises:[
  ex("Pull-down polea alta","3 x 10–12"),
  ex("Face pull polea media","3 x 10–12"),
  ex("Extensión cadera polea baja (cada lado)","3 x 10"),
  ex("Extensión tríceps polea alta","3 x 10–12"),
  ex("Hiperextensión lumbar en máquina","3 x 12")
]});
const BL_HIIT=()=>({type:"HIIT",status:"none",exercises:[
  {name:"Puente glúteos isométrico",target:'45" / 20"',sets:[]},
  {name:"Remo invertido en barra",target:'45" / 20"',sets:[]},
  {name:"PM rumano con kettlebell",target:'45" / 20"',sets:[]},
  {name:"Zancada estática + press militar",target:'45" / 20"',sets:[]},
  {name:"Press Pallof isométrico",target:'45" / 20"',sets:[]},
  {name:"Bird-dog alterno",target:'45" / 20"',sets:[]},
  {name:"Rondas finales",target:'6–8 rondas: 2–3 burpees + 30" skipping',sets:[]}
]});
const COOLDOWN = ()=>({type:"Enfriamiento",fixed:true,status:"none",exercises:[ex("Cinta + estiramientos","10 min",0)]});
// Cardio con selector de modalidad
const CARDIO   = ()=>({type:"Cardio",cardio:true,status:"none",
  cardioData:{modalidad:"Caminata",tiempo:"",distancia:"",fc:"",sensaciones:""}});
const LIBRE    = ()=>({type:"Entrenamiento libre",kind:"libre",status:"none",
  custom:{tipo:"",distancia:"",tiempo:"",fc:"",sensaciones:""},exercises:[]});

// ---- Semana por defecto
function defaultPlan(weekStart){
  return {
    weekStart,
    days:[
      {name:"Lunes",     blocks:[CARDIO(), WU_Anterior(),  BL_Anterior(),  COOLDOWN()], bio:{}},
      {name:"Martes",    blocks:[CARDIO()], bio:{}},
      {name:"Miércoles", blocks:[CARDIO(), WU_HIIT(),      BL_HIIT()], bio:{}},
      {name:"Jueves",    blocks:[CARDIO()], bio:{}},
      {name:"Viernes",   blocks:[CARDIO(), WU_Posterior(), BL_Posterior(), COOLDOWN()], bio:{}},
      {name:"Sábado",    blocks:[LIBRE()], bio:{}},
      {name:"Domingo",   blocks:[LIBRE()], bio:{}}
    ]
  };
}
function ensureWeekShape(weekStart){
  const all=loadAll(); const st=all[weekStart];
  if (!st || !Array.isArray(st.days) || st.days.length!==7){
    all[weekStart]=defaultPlan(weekStart); saveAll(all); return;
  }
  // asegurar bio por día
  st.days.forEach(d=>{ if (!d.bio) d.bio={}; });
  saveAll(all);
}

// ---- Init (estilo v32)
function init(){
  let wk=getActiveWeek();
  if (!wk){
    const today=new Date();
    const monday=new Date(today);
    const gd=today.getDay();
    monday.setDate(monday.getDate() + (gd===0 ? -6 : 1-gd));
    wk=iso(monday);
    const all=loadAll(); if (!all[wk]) all[wk]=defaultPlan(wk); saveAll(all); setActiveWeek(wk);
  }
  ensureWeekShape(wk);
  if (weekInput) weekInput.value=wk;

  // Tabs
  $$(".tab").forEach(t=>{
    t.onclick=()=>{
      $$(".tab").forEach(x=>{x.classList.remove("active"); x.setAttribute("aria-selected","false");});
      $$(".tab-pane").forEach(x=>x.classList.remove("active"));
      t.classList.add("active"); t.setAttribute("aria-selected","true");
      $("#tab-"+t.dataset.tab).classList.add("active");
      if (t.dataset.tab==="graficos") drawCharts();
      if (t.dataset.tab==="historial") renderHistory();
    };
  });

  // Semana
  $("#prevWeek")?.addEventListener("click",()=>shiftWeek(-7));
  $("#nextWeek")?.addEventListener("click",()=>shiftWeek(7));
  weekInput?.addEventListener("change", e=> createWeekIfMissing(e.target.value, true));
  $("#newWeekBtn")?.addEventListener("click", ()=>{
    const d=new Date(); d.setDate(d.getDate()-((d.getDay()+6)%7));
    createWeekIfMissing(iso(d), true);
  });
  $("#duplicateWeekBtn")?.addEventListener("click", duplicateWeek);
  $("#exportAllBtn")?.addEventListener("click", exportAll);
  $("#exportWeekReport")?.addEventListener("click", exportWeekReport);
  $("#importAllFile")?.addEventListener("change", importAll);
  $("#resetBtn")?.addEventListener("click", resetAll);
  $("#expandAll")?.addEventListener("click",()=>toggleAll(true));
  $("#collapseAll")?.addEventListener("click",()=>toggleAll(false));
  $("#addBlockFab")?.addEventListener("click", addBlockForToday);

  // Mostrar Plan
  $("#tab-plan").classList.add("active");
  $(".tab[data-tab='plan']").classList.add("active");
  render();
}
document.addEventListener("DOMContentLoaded", init);

// ---- Semana
function shiftWeek(days){
  const cur = getActiveWeek(); if (!cur) return;
  const d=parseISO(cur); d.setDate(d.getDate()+days);
  createWeekIfMissing(iso(d), true);
}
function createWeekIfMissing(weekStart,setActive){
  const all=loadAll();
  if (!all[weekStart]) all[weekStart]=defaultPlan(weekStart);
  if (setActive) setActiveWeek(weekStart);
  if (weekInput) weekInput.value=weekStart;
  // redibuja según pestaña
  const tab = ($(".tab.active")?.dataset.tab) || "plan";
  if (tab==="plan") render();
  else if (tab==="historial") renderHistory();
  else drawCharts();
}

// ---- Render plan (añade biomarcadores por día)
function render(){
  const wk=getActiveWeek(); if (!wk) return;
  ensureWeekShape(wk);
  const st=loadStateFor(wk); if (!st) return;

  planner.innerHTML="";
  const base=parseISO(st.weekStart||wk);

  st.days.forEach((day,idx)=>{
    const d=addDays(base, idx);
    const sec=document.createElement("section");
    sec.className="day card";
    sec.innerHTML=`
      <h3>
        <span>${day.name} — ${fmtDate(d)}</span>
        <span class="summary-actions">
          <button class="btn small" data-idx="${idx}" data-act="summary">Resumen</button>
          <button class="btn small" data-idx="${idx}" data-act="toggle">Ver</button>
        </span>
      </h3>
      <div class="details open" data-idx="${idx}"></div>
    `;
    planner.appendChild(sec);
    renderDayBlocks(sec.querySelector(".details"), day, idx, d);
  });

  $$("button[data-act='summary']").forEach(b=> b.onclick=()=>openDailySummary(+b.dataset.idx));
  $$("button[data-act='toggle']").forEach(b=> b.onclick=()=>{
    const d=planner.querySelector(`.details[data-idx="${b.dataset.idx}"]`); d?.classList.toggle("open");
  });

  attachBlockHandlers();
}

function renderDayBlocks(container, day, idx, dateObj){
  container.innerHTML="";

  // 1) BLOQUES DE ENTRENAMIENTO
  day.blocks.forEach((block,bIdx)=>{
    const wrap=document.createElement("div");
    wrap.className="block";
    if (block.status==="done") wrap.style.background="#d6f8d6";
    else if (block.status==="notdone") wrap.style.background="#f9d6d6";

    const showNotDone=!isWeekend(idx);
    const notDoneBtn = showNotDone ? `<button class="btn small" data-idx="${idx}" data-bidx="${bIdx}" data-act="notdone">No completado</button>` : "";
    const completed  = `<label><input type="checkbox" ${block.status==="done"?"checked":""} data-idx="${idx}" data-bidx="${bIdx}" class="doneToggle"> Completado</label>`;

    // Cardio
    if (block.cardio || block.walk){
      if (!block.cardio){
        block.type="Cardio"; block.cardio=true;
        block.cardioData=Object.assign({modalidad:"Caminata",tiempo:"",distancia:"",fc:"",sensaciones:""}, block.walkData||{});
      }
      const cd=block.cardioData;
      wrap.innerHTML=`
        <header><strong>🏃 Cardio</strong>
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
          <label>Tiempo (min)<input type="number" step="1" class="cardioInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="tiempo" value="${cd.tiempo||""}"></label>
          <label>Distancia (km)<input type="number" step="0.01" class="cardioInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="distancia" value="${cd.distancia||""}"></label>
          <label>FC media (ppm)<input type="number" step="1" class="cardioInput" data-idx="${idx}" data-bidx="${bIdx}" data-field="fc" value="${cd.fc||""}"></label>
          <label style="grid-column:1/-1;">Sensaciones<textarea rows="3" class="cardioText" data-idx="${idx}" data-bidx="${bIdx}" data-field="sensaciones">${cd.sensaciones||""}</textarea></label>
        </div>
      `;
    }
    // Libre
    else if (block.kind==="libre"){
      const c=block.custom||{tipo:"",distancia:"",tiempo:"",fc:"",sensaciones:""};
      wrap.innerHTML=`
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
    // Fuerza
    else {
      const maxSets=Math.max(3, ...(block.exercises||[]).map(ex=> (ex.sets||[]).length));
      const thead = `<th>Ejercicio</th><th>Objetivo</th>` + Array.from({length:maxSets},(_,i)=>`<th>Set ${i+1} (kg x reps)</th>`).join("");
      const rows=(block.exercises||[]).map((ex,eIdx)=>{
        const cols=Array.from({length:maxSets},(_,i)=>{
          const s=(ex.sets||[])[i]||{w:"",r:""}; const v=(s.w&&s.r)?`${s.w} x ${s.r}`:"";
          return `<td contenteditable class="cell" data-idx="${idx}" data-bidx="${bIdx}" data-eidx="${eIdx}" data-sidx="${i}">${v}</td>`;
        }).join("");
        return `<tr>
          <td contenteditable class="exName" data-idx="${idx}" data-bidx="${bIdx}" data-eidx="${eIdx}">${ex.name}</td>
          <td contenteditable class="exTarget" data-idx="${idx}" data-bidx="${bIdx}" data-eidx="${eIdx}">${ex.target}</td>
          ${cols}
        </tr>`;
      }).join("");
      wrap.innerHTML=`
        <header><strong>🏋️ ${block.type}</strong>
          <div class="controls state-toggle">${completed}${notDoneBtn}<button class="btn small" data-idx="${idx}" data-bidx="${bIdx}" data-act="notes">Sensaciones</button></div>
        </header>
        <table class="ex-table"><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table>
      `;
    }
    container.appendChild(wrap);
  });

  // 2) BIOMARCADORES DEL DÍA (NUEVO)
  const bio = day.bio || {};
  const bioCard = document.createElement("div");
  bioCard.className = "card";
  bioCard.innerHTML = `
    <h4>🧪 Biomarcadores del día</h4>
    <div class="bio-grid">
      <label>Peso (kg) <input type="number" step="0.1" class="bioInput" data-idx="${idx}" data-field="peso" value="${bio.peso ?? ""}"></label>
      <label>Sueño (h) <input type="number" step="0.1" class="bioInput" data-idx="${idx}" data-field="sueno" value="${bio.sueno ?? ""}"></label>
      <label>Energía (1–5) <input type="number" min="1" max="5" class="bioInput" data-idx="${idx}" data-field="energia" value="${bio.energia ?? ""}"></label>
      <label>Estrés (1–5) <input type="number" min="1" max="5" class="bioInput" data-idx="${idx}" data-field="estres" value="${bio.estres ?? ""}"></label>
      <label>FC reposo (ppm) <input type="number" step="1" class="bioInput" data-idx="${idx}" data-field="fcr" value="${bio.fcr ?? ""}"></label>
      <label style="grid-column:1/-1;">Notas<textarea rows="3" class="bioText" data-idx="${idx}" data-field="notas">${bio.notas ?? ""}</textarea></label>
    </div>
  `;
  container.appendChild(bioCard);
}

// ---- Handlers / guardado
function attachBlockHandlers(){
  // estado hecho/no hecho
  $$(".doneToggle").forEach(chk=>{
    chk.addEventListener("change", e=>{
      const c=e.target, wk=getActiveWeek(), st=loadStateFor(wk);
      const b=st.days[c.dataset.idx].blocks[c.dataset.bidx];
      b.status = c.checked ? "done" : "none"; saveStateFor(wk, st); render();
    });
  });
  $$("button[data-act='notdone']").forEach(btn=>{
    btn.onclick=()=>{
      const i=+btn.dataset.idx, j=+btn.dataset.bidx, wk=getActiveWeek(), st=loadStateFor(wk);
      st.days[i].blocks[j].status="notdone"; saveStateFor(wk, st); render();
    };
  });

  // Cardio
  $$(".cardioSelect,.cardioInput,.cardioText").forEach(inp=>{
    inp.addEventListener("input", e=>{
      const i=e.target, wk=getActiveWeek(), st=loadStateFor(wk);
      const b=st.days[i.dataset.idx].blocks[i.dataset.bidx];
      if (!b.cardio){ b.type="Cardio"; b.cardio=true; b.cardioData=Object.assign({modalidad:"Caminata",tiempo:"",distancia:"",fc:"",sensaciones:""}, b.walkData||{}); }
      const field=i.dataset.field; b.cardioData[field]=i.value; saveStateFor(wk, st);
    });
  });

  // Libre / caminata heredado
  $$(".walkInput,.walkText,.freeInput,.freeText").forEach(inp=>{
    inp.addEventListener("input", e=>{
      const i=e.target, wk=getActiveWeek(), st=loadStateFor(wk);
      const b=st.days[i.dataset.idx].blocks[i.dataset.bidx];
      const field=i.dataset.field;
      if (b.walkData) b.walkData[field]=i.value;
      if (b.custom)   b.custom[field]=i.value;
      saveStateFor(wk, st);
    });
  });

  // Sets fuerza
  $$(".cell").forEach(td=>{
    td.addEventListener("input", e=>{
      const c=e.target;
      const i=+c.dataset.idx, j=+c.dataset.bidx, eidx=+c.dataset.eidx, sidx=+c.dataset.sidx;
      const wk=getActiveWeek(), st=loadStateFor(wk);
      const ex=st.days[i].blocks[j].exercises[eidx];
      const t=c.textContent.trim();
      const m=t.match(/^\s*(\d+(?:[.,]\d+)?)\s*x\s*(\d+)\s*$/i);
      ex.sets[sidx] = m ? {w:String(m[1]).replace(",", "."), r:m[2]} : {w:"",r:""};
      saveStateFor(wk, st);
    });
  });

  // Notas de bloque
  $$("button[data-act='notes']").forEach(btn=>{
    btn.onclick=()=>{
      const i=+btn.dataset.idx, j=+btn.dataset.bidx, wk=getActiveWeek(), st=loadStateFor(wk);
      const b=st.days[i].blocks[j]; const cur=b.notes||"";
      const val=prompt("Sensaciones del bloque:", cur ?? "");
      if (val!==null){ b.notes=val; saveStateFor(wk, st); }
    };
  });

  // Biomarcadores por día (auto-guardado)
  $$(".bioInput,.bioText").forEach(inp=>{
    inp.addEventListener("input", e=>{
      const el=e.target; const i=+el.dataset.idx; const field=el.dataset.field;
      const wk=getActiveWeek(), st=loadStateFor(wk);
      if (!st.days[i].bio) st.days[i].bio={};
      st.days[i].bio[field]=el.value;
      saveStateFor(wk, st);
    });
  });
}

// ---- Historial
function renderHistory(){
  const box=$("#history"); if (!box) return;
  const weeks=listWeeks();
  box.innerHTML = weeks.length? "" : "<p>No hay semanas registradas todavía.</p>";
  weeks.forEach(w=>{
    const st=loadStateFor(w);
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`
      <h3>${w}</h3>
      <p>Días: ${st.days.length}</p>
      <button class="btn small" data-week="${w}">Ver</button>
    `;
    box.appendChild(card);
    card.querySelector("button").onclick=()=>{
      setActiveWeek(w); if (weekInput) weekInput.value=w; 
      // Volvemos a Plan
      $$(".tab").forEach(x=>x.classList.remove("active"));
      $(".tab[data-tab='plan']").classList.add("active");
      $$(".tab-pane").forEach(x=>x.classList.remove("active"));
      $("#tab-plan").classList.add("active");
      render();
    };
  });
}

// ---- Gráficos (igual que v32; no dependen del cambio)
function collectUniqueExerciseNames(){
  const all=loadAll(); const set=new Set();
  Object.values(all).forEach(st=>{
    (st.days||[]).forEach(d=> (d.blocks||[]).forEach(b=> (b.exercises||[]).forEach(ex=>{
      if (ex?.name) set.add(ex.name.trim());
    })));
  });
  return Array.from(set).sort((a,b)=>a.localeCompare(b,"es"));
}
function weeksAndDates(){
  const weeks=listWeeks(); const weekDates={};
  weeks.forEach(w=>{
    const start=parseISO(w);
    weekDates[w]=Array.from({length:7},(_,i)=>iso(addDays(start,i)));
  });
  return {weeks, weekDates};
}
function weeklyVolumeFor(name){
  const {weeks}=weeksAndDates(); const all=loadAll();
  return weeks.map(w=>{
    const st=all[w]; if(!st) return {x:w,y:0};
    let vol=0;
    st.days.forEach(d=> d.blocks.forEach(b=> (b.exercises||[]).forEach(ex=>{
      if (name && ex.name?.trim()!==name) return;
      (ex.sets||[]).forEach(s=>{if(s.w&&s.r) vol+=(+s.w||0)*(+s.r||0)});
    })));
    return {x:w,y:vol};
  });
}
function dailyVolumeFor(name){
  const {weeks,weekDates}=weeksAndDates(); const all=loadAll(); const rows=[];
  weeks.forEach(w=>{
    const st=all[w]; if(!st) return;
    (st.days||[]).forEach((dy,idx)=>{
      const date=weekDates[w][idx]; let vol=0;
      dy.blocks.forEach(b=> (b.exercises||[]).forEach(ex=>{
        if (name && ex.name?.trim()!==name) return;
        (ex.sets||[]).forEach(s=>{if(s.w&&s.r) vol+=(+s.w||0)*(+s.r||0)});
      }));
      rows.push({x:date,y:vol});
    });
  });
  return rows;
}
function weeklyCardioTotals(mod){
  const {weeks}=weeksAndDates(); const all=loadAll();
  return weeks.map(w=>{
    const st=all[w]; if(!st) return {x:w,t:0,d:0};
    let t=0,d=0;
    st.days.forEach(dy=> dy.blocks.forEach(b=>{
      const data=b.cardioData||b.walkData; if(!data) return;
      const m=b.cardioData?.modalidad||"Caminata";
      if (mod && mod!=="Total" && m!==mod) return;
      t+=+data.tiempo||0; d+=+data.distancia||0;
    }));
    return {x:w,t,d};
  });
}
function dailyCardioTotals(mod){
  const {weeks,weekDates}=weeksAndDates(); const all=loadAll(); const rows=[];
  weeks.forEach(w=>{
    const st=all[w]; if(!st) return;
    (st.days||[]).forEach((dy,idx)=>{
      const date=weekDates[w][idx]; let t=0,dst=0;
      dy.blocks.forEach(b=>{
        const data=b.cardioData||b.walkData; if(!data) return;
        const m=b.cardioData?.modalidad||"Caminata";
        if (mod && mod!=="Total" && m!==mod) return;
        t+=+data.tiempo||0; dst+=+data.distancia||0;
      });
      rows.push({x:date,t: t, d: dst});
    });
  });
  return rows;
}
function weeklyWeightFromLogs(){
  // Ahora usamos peso diario si existe (promedio semanal)
  const {weeks,weekDates}=weeksAndDates(); const all=loadAll();
  return weeks.map(w=>{
    const st=all[w]; if(!st) return {x:w,y:null};
    const vals=(st.days||[]).map(d=> +((d.bio||{}).peso||0)).filter(v=>v>0);
    const avg=vals.length? (vals.reduce((a,b)=>a+b,0)/vals.length) : null;
    return {x:w,y:avg};
  }).filter(p=>p.y!==null);
}
function dailyWeightFromLogs(){
  // Puntos por día desde day.bio
  const all=loadAll(); const pts=[];
  Object.keys(all).forEach(w=>{
    const st=all[w];
    const base=parseISO(st.weekStart||w);
    (st.days||[]).forEach((dy,idx)=>{
      const date=iso(addDays(base,idx));
      const v=+((dy.bio||{}).peso||0);
      if (v>0) pts.push({x:date,y:v});
    });
  });
  pts.sort((a,b)=>a.x.localeCompare(b.x));
  return pts;
}

// Controles + pintado
function ensureChartsControls(){
  const pane=$("#tab-graficos"); if(!pane) return;
  if (!$("#chartsControls")){
    const wrap=document.createElement("div");
    wrap.id="chartsControls"; wrap.className="card"; wrap.style.marginBottom="12px";
    wrap.innerHTML=`
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
    const chartsWrap=pane.querySelector(".charts");
    if (chartsWrap) pane.insertBefore(wrap, chartsWrap); else pane.prepend(wrap);
  }
  const sel=$("#volExerciseSelect");
  if (sel && sel.dataset.filled!=="1"){
    collectUniqueExerciseNames().forEach(n=>{
      const o=document.createElement("option"); o.value=n; o.textContent=n; sel.appendChild(o);
    });
    sel.dataset.filled="1";
  }
  $("#volExerciseSelect")?.addEventListener("change", drawCharts);
  $("#cardioModSelect")?.addEventListener("change", drawCharts);
  $("#periodSelect")?.addEventListener("change", drawCharts);
}

function drawCharts(){
  if (typeof Chart==="undefined") return;
  ensureChartsControls();

  const ctxPeso=$("#pesoChart")?.getContext("2d");
  const ctxVol=$("#volChart")?.getContext("2d");
  const ctxWalkT=$("#walkTimeChart")?.getContext("2d");
  const ctxWalkD=$("#walkDistChart")?.getContext("2d");
  if (!ctxPeso || !ctxVol || !ctxWalkT || !ctxWalkD) return;

  const ex = $("#volExerciseSelect")?.value || "";
  const mod = $("#cardioModSelect")?.value || "Total";
  const period = $("#periodSelect")?.value || "Semanal";

  let peso, vol, cT, cD;
  if (period==="Semanal"){
    peso=weeklyWeightFromLogs();
    vol =weeklyVolumeFor(ex||null);
    const c=weeklyCardioTotals(mod);
    cT=c.map(o=>({x:o.x,y:o.t}));
    cD=c.map(o=>({x:o.x,y:o.d}));
  }else{
    peso=dailyWeightFromLogs();
    vol =dailyVolumeFor(ex||null);
    const c=dailyCardioTotals(mod);
    cT=c.map(o=>({x:o.x,y:o.t}));
    cD=c.map(o=>({x:o.x,y:o.d}));
  }

  const opts={responsive:true,parsing:false,scales:{x:{type:"category"},y:{beginAtZero:true}}};

  window._pesoChart && window._pesoChart.destroy();
  window._volChart && window._volChart.destroy();
  window._walkTChart && window._walkTChart.destroy();
  window._walkDChart && window._walkDChart.destroy();

  window._pesoChart=new Chart(ctxPeso,{type:"line",data:{datasets:[{label:period==="Semanal"?"Peso medio semana (kg)":"Peso diario (kg)",data:peso}]},options:opts});
  window._volChart=new Chart(ctxVol,{type:"bar",data:{datasets:[{label:ex?`Volumen (${ex})`:"Volumen (total)",data:vol}]},options:opts});
  window._walkTChart=new Chart(ctxWalkT,{type:"bar",data:{datasets:[{label:mod==="Total"?"Tiempo cardio (min) — Total":`Tiempo cardio (min) — ${mod}`,data:cT}]},options:opts});
  window._walkDChart=new Chart(ctxWalkD,{type:"bar",data:{datasets:[{label:mod==="Total"?"Distancia cardio (km) — Total":`Distancia cardio (km) — ${mod}`,data:cD}]},options:opts});
}

// ---- Resumen (incluye Biomarcadores por día — NUEVO)
function openDailySummary(idx){
  const wk=getActiveWeek(), st=loadStateFor(wk), day=st.days[idx];
  const base=parseISO(st.weekStart||wk);
  const dateIso=iso(addDays(base, idx));
  let txt=`📅 ${day.name} (${fmtDate(addDays(base, idx))})\n\n`;

  // Biomarcadores del día primero
  const bio = day.bio || {};
  const bioLine = [
    bio.peso ? `Peso: ${bio.peso} kg` : null,
    bio.sueno ? `Sueño: ${bio.sueno} h` : null,
    bio.energia ? `Energía: ${bio.energia}/5` : null,
    bio.estres ? `Estrés: ${bio.estres}/5` : null,
    bio.fcr ? `FC reposo: ${bio.fcr} ppm` : null
  ].filter(Boolean).join(" | ");
  txt += bioLine ? `🧪 Biomarcadores → ${bioLine}\n` : "🧪 Biomarcadores → (sin datos)\n";
  if (bio.notas) txt += `   Notas: ${bio.notas}\n`;
  txt += `\n`;

  // Bloques
  day.blocks.forEach(b=>{
    txt += `🟦 ${b.type}\n`;
    if (b.cardio||b.walk){
      const d=b.cardioData||b.walkData||{};
      const mod=b.cardioData?.modalidad?` (${b.cardioData.modalidad})`:"";
      txt+=`  • Cardio${mod} → Tiempo: ${d.tiempo||"-"} min | Dist: ${d.distancia||"-"} km | FC: ${d.fc||"-"} | Sens: ${d.sensaciones||"-"}\n`;
    } else if (b.kind==="libre"){
      const c=b.custom||{};
      txt+=`  • Libre → Tipo: ${c.tipo||"-"} | Dist: ${c.distancia||"-"} | Tiempo: ${c.tiempo||"-"} | FC: ${c.fc||"-"} | Sens: ${c.sensaciones||"-"}\n`;
    } else {
      (b.exercises||[]).forEach(ex=>{
        const sets=(ex.sets||[]).map(s=> s.w&&s.r?`${s.w}x${s.r}`:"").filter(Boolean).join(", ");
        txt+=`  • ${ex.name} (${ex.target||""}) ${sets? "→ "+sets:""}\n`;
      });
      if (b.notes) txt+=`  • Sensaciones: ${b.notes}\n`;
    }
    txt += "\n";
  });

  const m=$("#modalShare"); if (!m) return;
  m.classList.remove("hidden");
  $("#shareTextarea").value = txt;
  $("#shareCopy").onclick = ()=>{ navigator.clipboard.writeText(txt); alert("Resumen copiado ✅"); };
  $("#shareDownload").onclick=()=>{
    const blob=new Blob([txt],{type:"text/plain"}); const a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download=`${day.name}_${dateIso}_resumen.txt`; a.click();
  };
  $("#shareClose").onclick=()=> m.classList.add("hidden");
}

// ---- Export / Import / utilidades
function exportAll(){
  const data=localStorage.getItem("sergio-weeks")||"{}";
  const blob=new Blob([data],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="entrenos_sergio.json"; a.click();
}
function importAll(e){
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const data=JSON.parse(r.result); saveAll(data);
      const tab=$(".tab.active")?.dataset.tab || "plan";
      if (tab==="plan") render(); else if (tab==="historial") renderHistory(); else drawCharts();
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
function duplicateWeek(){
  const cur=getActiveWeek(); if(!cur) return alert("No hay semana activa");
  const d=parseISO(cur); d.setDate(d.getDate()+7); const next=iso(d);
  const st=JSON.parse(JSON.stringify(loadStateFor(cur)));
  st.weekStart=next;
  st.days.forEach(day=>{
    day.blocks.forEach(b=>{
      b.status="none";
      if (b.cardioData) b.cardioData={modalidad:"Caminata",tiempo:"",distancia:"",fc:"",sensaciones:""};
      if (b.walkData)  b.walkData={tiempo:"",distancia:"",fc:"",sensaciones:""};
      if (b.custom)    b.custom={tipo:"",distancia:"",tiempo:"",fc:"",sensaciones:""};
      if (b.exercises) b.exercises.forEach(ex=> ex.sets.forEach(s=>{s.w="";s.r="";}));
      b.notes="";
    });
    day.bio={}; // limpiar biomarcadores diarios
  });
  saveStateFor(next, st); setActiveWeek(next); if (weekInput) weekInput.value=next;
  $(".tab[data-tab='plan']")?.click();
  alert("Semana duplicada ✅");
}
function exportWeekReport(){
  const wk=getActiveWeek(), st=loadStateFor(wk); if(!st) return alert("No hay datos");
  const base=parseISO(st.weekStart||wk);
  let txt=`📅 Reporte semanal (${wk})\n\n`;
  st.days.forEach((day,idx)=>{
    const fecha=fmtDate(addDays(base, idx));
    txt+=`== ${day.name} — ${fecha} ==\n`;

    // Biomarcadores del día
    const bio = day.bio || {};
    const bioLine = [
      bio.peso ? `Peso: ${bio.peso} kg` : null,
      bio.sueno ? `Sueño: ${bio.sueno} h` : null,
      bio.energia ? `Energía: ${bio.energia}/5` : null,
      bio.estres ? `Estrés: ${bio.estres}/5` : null,
      bio.fcr ? `FC reposo: ${bio.fcr} ppm` : null
    ].filter(Boolean).join(" | ");
    txt += bioLine ? `  • Biomarcadores → ${bioLine}\n` : `  • Biomarcadores → (sin datos)\n`;
    if (bio.notas) txt += `    Notas: ${bio.notas}\n`;

    day.blocks.forEach(b=>{
      txt+=`  • ${b.type}\n`;
      if ((b.cardio&&b.cardioData)||(b.walk&&b.walkData)){
        const d=b.cardioData||b.walkData; const mod=b.cardioData?.modalidad?` (${b.cardioData.modalidad})`:"";
        txt+=`     - Cardio${mod}: Tiempo ${d.tiempo||"-"} min | Dist ${d.distancia||"-"} km | FC ${d.fc||"-"} | Sens ${d.sensaciones||"-"}\n`;
      } else if (b.kind==="libre" && b.custom){
        const c=b.custom; txt+=`     - Libre: ${c.tipo||"-"} | Dist ${c.distancia||"-"} | Tiempo ${c.tiempo||"-"} | FC ${c.fc||"-"} | Sens ${c.sensaciones||"-"}\n`;
      } else if (b.exercises){
        b.exercises.forEach(ex=>{
          const sets=(ex.sets||[]).map(s=> s.w&&s.r?`${s.w}x${s.r}`:"").filter(Boolean).join(", ");
          txt+=`     - ${ex.name} (${ex.target||""}) ${sets? "→ "+sets:""}\n`;
        });
        if (b.notes) txt+=`     - Sensaciones: ${b.notes}\n`;
      }
    });
    txt+=`\n`;
  });
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([txt],{type:"text/plain"}));
  a.download=`reporte_${wk}.txt`; a.click();
}
function toggleAll(open){ $$(".details").forEach(d=> open?d.classList.add("open"):d.classList.remove("open")); }
function addBlockForToday(){
  const wk=getActiveWeek(), st=loadStateFor(wk);
  const today=new Date(); const idx=(today.getDay()+6)%7;
  st.days[idx].blocks.push(LIBRE()); saveStateFor(wk, st); render(); alert("Bloque libre añadido ✅");
}

// ---- PWA
if ("serviceWorker" in navigator){
  window.addEventListener("load", ()=> {
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  });
}
