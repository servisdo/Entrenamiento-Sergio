alert("✅ Script de Sergio funcionando (v21)");

// ================================
//  CONFIGURACIÓN BASE
// ================================
const planner = document.getElementById("planner");
const DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

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
//  FUNCIÓN PRINCIPAL DE RENDERIZADO
// ================================
function renderWeek() {
  planner.innerHTML = ""; // limpiar
  const week = defaultPlan();

  week.forEach((day, idx) => {
    const sec = document.createElement("section");
    sec.className = "day card";
    const bloquesHTML = day.bloques.map(b => `<li>${b}</li>`).join("");
    sec.innerHTML = `
      <h3>${day.name}</h3>
      <ul>${bloquesHTML}</ul>
    `;
    planner.appendChild(sec);
  });

  console.log("✅ Semana renderizada correctamente");
  alert("✅ Semana actual generada");
}

// ================================
//  ARRANQUE AUTOMÁTICO
// ================================
document.addEventListener("DOMContentLoaded", () => {
  renderWeek();
});
