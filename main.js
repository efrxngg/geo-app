const map = L.map("map").setView([-1.7, -78.4], 7);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

// Establecer fecha máxima como hoy
const today = new Date().toISOString().split('T')[0];
document.getElementById('fecha-desde').max = today;
document.getElementById('fecha-hasta').max = today;

// Establecer fecha desde por defecto (1 mes atrás)
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
document.getElementById('fecha-desde').value = oneMonthAgo.toISOString().split('T')[0];
document.getElementById('fecha-hasta').value = today;

// listener de niveles de riesgo activos
document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
        nivelesActivos = getRiskLevelsActive();
        renderPoints();
        console.log('Niveles de riesgo activos:', nivelesActivos);

        // Puedes usar los niveles activos para filtrar los marcadores
        // actualizarMarcadoresMapa(nivelesActivos);
    });
});


let nivelesActivos = getRiskLevelsActive()
let extremeEvents = [];
console.log({nivelesActivos});


async function fetchExtremeEvents(startDate, endDate) {
    console.log({startDate, endDate});
    let url = 'http://127.0.0.1:8081/geo/extreme-events?'
    if (startDate) {
        url += '&from=' + startDate;
    }
    if (endDate) {
        url += '&to=' + endDate;
    }

    const response = await fetch(url);
    extremeEvents = await response.json();
    renderPoints();
}

function renderPoints() {
    clearMap();
    const riskMap = {
        "Bajo": "blue",
        "Medio": "orange",
        "Alto": "red"
    };
    extremeEvents
        .filter(ee => nivelesActivos.includes(ee.riesgo))
        .forEach(responseRow => {
            if (!riskMap[responseRow.riesgo]) return;

            const marker = L.circleMarker([responseRow.latitude, responseRow.longitude], {
                radius: 6,
                color: "black",
                weight: 1,
                fillColor: riskMap[responseRow.riesgo],
                fillOpacity: 0.7
            }).addTo(map);

            marker.bindTooltip(
                `📍 <b>${responseRow.location2}</b><br>ID: ${responseRow.comid}<br>Riesgo: <span style="color:${riskMap[responseRow.riesgo]}">${responseRow.riesgo}</span>`,
                {direction: "top", offset: [0, -10]}
            );
        });
}

function buscarHistorico() {
    const fechaDesde = document.getElementById('fecha-desde').value;
    const fechaHasta = document.getElementById('fecha-hasta').value;

    if (!fechaDesde || !fechaHasta) {
        alert('Por favor, selecciona ambas fechas');
        return;
    }

    if (fechaDesde > fechaHasta) {
        alert('La fecha "Desde" no puede ser posterior a la fecha "Hasta"');
        return;
    }

    // Aquí puedes agregar la lógica para buscar los datos históricos
    console.log('Buscando registros desde:', fechaDesde, 'hasta:', fechaHasta);

    fetchExtremeEvents(fechaDesde, fechaHasta);
    renderPoints();
}

function getRiskLevelsActive() {
    const riskLevels = ['Bajo', 'Medio', 'Alto'];
    const activeRisks = [];

    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
        if (checkbox.checked) {
            activeRisks.push(riskLevels[index]);
        }
    });

    return activeRisks;
}

function clearMap() {
    map.eachLayer((layer) => {
        // Mantener solo la capa base del mapa (tileLayer)
        if (!layer._url) {
            map.removeLayer(layer);
        }
    });
}

// init
fetchExtremeEvents();