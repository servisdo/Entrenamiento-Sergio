alert("✅ Script de Sergio funcionando (v23)");

// ================================
//  CONFIGURACIÓN BASE
// ================================
const planner = document.getElementById("planner");

// ================================
//  PLAN SEMANAL POR DEFECTO
// ================================
function defaultPlan() {
  return [
    { name: "Lunes", bloques: ["Caminata", "Calentamiento anterior", "Entreno cara anterior"] },
    { name: "Martes", bloques: ["Caminata", "Descanso activo"] },
    { name: "Miércoles", bloques: ["Caminata", "HIIT"] },
    { name: "Jueves", bloques: ["Caminata", "Descanso activo"] },
    { name: "Viernes", bloques: ["Caminata", "Calentamiento posterior", "Entreno cara posterior"] },
    { name: "Sábado", bloques: ["Entrenamiento libre"] },
    { name: "Domingo", bloques: ["Entrenamiento libre"] }
  ];
}

// ================================
//  RENDER
// ================================
function renderWeek() {
  planner.innerHTML = "";
  const week = defaultPlan();

  week.forEach((day, idx) => {
    const sec = document.createElement("section");
    sec.className = "day card";

    const bloquesHTML = day.bloques.map((b, i) => `
      <li class="bloque" data-day="${idx}" data-block="${i}">
        <span>${b}</span>
        <div class="acciones">
          <button class="btn-ok" type="button">✅</button>
          <button class="btn-no" type="button">❌</button>
        </div>
      </li>
    `).join("");

    sec.innerHTML = `
      <h3>${day.name}</h3>
      <ul>${bloquesHTML}</ul>
    `;
    planner.appendChild(sec);
  });

  attachListeners();
}

// ================================
//  INTERACCIÓN
// ================================
function paintState(li, state) {
  // estado visual con clase + inline (por si el CSS no carga)
  li.classList.remove("hecho", "nohecho");
  li.style.background = ""; // limpia inline anterior

  if (state === "ok") {
    li.classList.add("hecho");
    li.style.background = "#d6f8d6";
  } else if (state === "no") {
    li.classList.add("nohecho");
    li.style.background = "#f9d6d6";
  }
}

function attachListeners() {
  document.querySelectorAll(".btn-ok").forEach(btn => {
    btn.onclick = e => {
      const li = e.target.closest(".bloque");
      paintState(li, "ok");
    };
  });

  document.querySelectorAll(".btn-no").forEach(btn => {
    btn.onclick = e => {
      const li = e.target.closest(".bloque");
      paintState(li, "no");
    };
  });
}

// ================================
//  ARRANQUE
// ================================
document.addEventListener("DOMContentLoaded", renderWeek);
