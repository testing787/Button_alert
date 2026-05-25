// Protección activa contra la apertura de la consola de desarrollo
(function () {
    const laConsolaMataModulos = function () {
        setInterval(function () {
            if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
                debugger;
            }
        }, 100);
    };
    try { laConsolaMataModulos(); } catch (e) { }
})();

// Deshabilitar el clic derecho y combinaciones de teclas de inspección
document.addEventListener('contextmenu', event => event.preventDefault());

document.onkeydown = function (e) {
    if (e.keyCode == 123 ||
        (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74)) ||
        (e.ctrlKey && e.keyCode == 85)) {
        return false;
    }
};

import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm';
import { auth, db } from "./conexion.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, updateDoc, serverTimestamp, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const audioAlarma = document.getElementById('sonido-alarma');

// =========================================================================
// 1. PUENTES GLOBALES
// =========================================================================
window.cerrarSesion_UI = function () {
    Swal.fire({
        title: "¿Cerrar sesión?",
        text: "Se finalizará su turno en el panel.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#077e17",
        cancelButtonColor: "#de0b0b",
        confirmButtonText: 'Sí, salir'
    }).then((result) => {
        if (result.isConfirmed) {
            detenerSonidoAlarma();
            signOut(auth).then(() => window.location.href = './login.html');
        }
    });
};

window.atenderAlerta_UI = (id) => atenderAlerta(id, auth.currentUser.email);
window.finalizarAlerta_UI = (id) => finalizarAlerta(id, `Atendido por: ${auth.currentUser.email}`);

// =========================================================================
// 2. LÓGICA DE MONITOREO
// =========================================================================
function iniciarMonitoreoAlertas() {
    const q = query(collection(db, "alertas_extorsion"), orderBy("fecha", "desc"));

    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('tabla-alertas');
        const numAlertasElemento = document.getElementById('num-alertas');
        if (!tbody) return;

        tbody.innerHTML = '';
        let alertasActivas = 0;
        let encenderAlarma = false;

        snapshot.forEach((docSnap) => {
            const alerta = docSnap.data();
            const id = docSnap.id;

            if (alerta.estatus === "NUEVA_ALERTA" || alerta.estatus === "EN_ATENCION") alertasActivas++;
            if (alerta.estatus === "NUEVA_ALERTA") encenderAlarma = true;

            const fecha = alerta.fecha ? new Date(alerta.fecha.seconds * 1000).toLocaleString() : 'Sincronizando...';
            
            const tr = document.createElement('tr');
            if (alerta.estatus === 'NUEVA_ALERTA') tr.className = 'alerta-parpadeo';

            tr.innerHTML = `
                <td>${fecha}</td>
                <td>${alerta.telefono || 'N/A'}</td>
                <td><a href="https://www.google.com/maps?q=${alerta.coordenadas?.latitud},${alerta.coordenadas?.longitud}" target="_blank" class="btn btn-sm btn-outline-primary">Mapa</a></td>
                <td><span class="badge ${alerta.estatus === 'NUEVA_ALERTA' ? 'bg-danger' : 'bg-warning'}">${alerta.estatus}</span></td>
                <td>
                    ${alerta.estatus === 'NUEVA_ALERTA' ? `<button class="btn btn-dark btn-sm" onclick="atenderAlerta_UI('${id}')">Atender</button>` : ''}
                    ${alerta.estatus === 'EN_ATENCION' ? `<button class="btn btn-success btn-sm" onclick="finalizarAlerta_UI('${id}')">Finalizar</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        numAlertasElemento.innerText = alertasActivas;
        encenderAlarma ? audioAlarma?.play().catch(() => {}) : detenerSonidoAlarma();
    });
}

function detenerSonidoAlarma() {
    if (audioAlarma) { audioAlarma.pause(); audioAlarma.currentTime = 0; }
}

// =========================================================================
// 3. SEGURIDAD E INICIALIZACIÓN
// =========================================================================
async function atenderAlerta(id, email) {
    await updateDoc(doc(db, "alertas_extorsion", id), { estatus: "EN_ATENCION", atendidoPor: email });
}

async function finalizarAlerta(id, notas) {
    await updateDoc(doc(db, "alertas_extorsion", id), { estatus: "FINALIZADA", notasResolucion: notas });
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            if (window.location.pathname.includes("panel.html")) window.location.href = "./login.html";
        } else {
            if (user.phoneNumber) window.location.href = "./login.html"; // Ciudadano no entra al panel
            else iniciarMonitoreoAlertas(); // <-- AQUÍ SE INICIA TODO
        }
    });
});
onAuthStateChanged(auth, (user) => {
    if (!user) {
        if (window.location.pathname.includes("panel.html")) window.location.href = "./login.html";
    } else {
        // FILTRO: Si el usuario que entró tiene teléfono, es un ciudadano. ¡EXPÚLSALO!
        if (user.phoneNumber) {
            console.warn("Usuario ciudadano detectado en panel. Cerrando sesión...");
            signOut(auth); // Esto cierra la sesión del ciudadano, pero NO debería afectar si el panel está en otro contexto
            window.location.href = "./login.html";
        }
    }
});