alert("✅ Script cargado correctamente (v20)");

// --- Selección del contenedor ---
const planner = document.getElementById("planner");
if (!planner) {
  alert("❌ No se encontró #planner en el HTML");
} else {
  alert("✅ Contenedor planner encontrado");
}

// --- Generar semana de prueba ---
const DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
planner.innerHTML = ""; // limpiar

DAYS.forEach(d => {
  const sec = document.createElement("section");
  sec.className = "day card";
  sec.innerHTML = `
    <h3>${d}</h3>
    <p>Entrenamiento de ejemplo para ${d}</p>
  `;
  planner.appendChild(sec);
});

alert("✅ Semana de prueba generada correctamente");
