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
    const extremeEventsFiltered = extremeEvents
        .filter(ee => nivelesActivos.includes(ee.riesgo));

    showToast({title: 'Criterio Aplicado', message: `Registros encontrados ${extremeEventsFiltered.length}`, type: 'success', duration: 3000});

    extremeEventsFiltered.forEach(responseRow => {
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

function clearDateRange() {
    fetchExtremeEvents();
}


function showToast({title, message, type = 'success', duration = 3000}) {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.innerHTML = `
        <div role="alert" class="rounded-md border border-gray-300 bg-white p-4 shadow-sm">
            <div class="flex items-start gap-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6 ${type === 'success' ? 'text-green-600' : 'text-red-600'}"
                >
                    ${type === 'success'
        ? '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
        : '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />'
    }
                </svg>
                <div class="flex-1">
                    <strong class="font-medium text-gray-900">${title}</strong>
                    <p class="mt-0.5 text-sm text-gray-700">${message}</p>
                </div>
                <button
                    class="-m-3 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                    type="button"
                    aria-label="Descartar alerta"
                >
                    <span class="sr-only">Descartar mensaje</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="size-5"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    `;

    // Añadir manejador para el botón de cerrar
    const closeButton = toast.querySelector('button');
    closeButton.addEventListener('click', () => {
        toast.remove();
    });

    // Añadir el toast al contenedor
    container.appendChild(toast);

    // Animación de entrada
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease-in-out';

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);

    // Remover automáticamente después de la duración especificada
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// init
fetchExtremeEvents();