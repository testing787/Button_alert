// Protección activa contra la apertura de la consola de desarrollo
(function () {
    const laConsolaMataModulos = function () {
        setInterval(function () {
            // El comando 'debugger' congela la pestaña si la consola está abierta
            debugger;
        }, 100);
    };
    try { laConsolaMataModulos(); } catch (e) { }
})();

import { auth, db } from "./conexion.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm';
// Deshabilitar el clic derecho y combinaciones de teclas de inspección
document.addEventListener('contextmenu', event => event.preventDefault());

document.onkeydown = function (e) {
    // Bloquear F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (Ver código fuente)
    if (e.keyCode == 123 ||
        (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74)) ||
        (e.ctrlKey && e.keyCode == 85)) {
        return false;
    }
};


let usuarioLogueado = null;
let temporizador = null;
let progreso = 0;
let revisandoSesion = true; // Controla la espera del token asíncrono

const TIEMPO_REQUERIDO = 2000; // 2 segundos en milisegundos
const INTERVALO_TICK = 100; // Actualización de la barra cada 100ms

const boton = document.getElementById('btn-alerta');
const barra = document.getElementById('barra');
const txtEstado = document.getElementById('txt-estado');

// 1. Validar el estado de la sesión de forma controlada sin rebotes a index.html
onAuthStateChanged(auth, (user) => {
    revisandoSesion = false;
    if (user) {
        usuarioLogueado = user;
        console.log("Sesión verificada de manera exitosa para UID:", user.uid);
        txtEstado.innerText = "Sistema enlazado y listo";
        txtEstado.className = "mt-4 small fw-bold text-muted";
    } else {
        console.warn("Acceso denegado: Sin sesión activa. Redirigiendo...");
        window.location.href = "./index.html";
    }
});

// 2. Controladores de eventos para la pulsación sostenida (Móvil y Escritorio)
boton.addEventListener('mousedown', iniciarPulsacion);
boton.addEventListener('touchstart', (e) => { e.preventDefault(); iniciarPulsacion(); });

window.addEventListener('mouseup', abortarPulsacion);
window.addEventListener('touchend', abortarPulsacion);

function iniciarPulsacion() {
    // Si Firebase aún no responde sobre el estado del usuario, bloquear interacción
    if (revisandoSesion) {
        txtEstado.innerText = "Sincronizando seguridad...";
        return;
    }
    if (!usuarioLogueado) {
        window.location.href = "./index.html";
        return;
    }

    progreso = 0;
    txtEstado.innerText = "Evaluando situación...";
    txtEstado.className = "mt-4 small fw-bold text-warning";

    temporizador = setInterval(() => {
        progreso += (INTERVALO_TICK / TIEMPO_REQUERIDO) * 100;
        barra.style.width = `${Math.min(progreso, 100)}%`;

        if (progreso >= 100) {
            clearInterval(temporizador);
            dispararAlertaEmergencia();
        }
    }, INTERVALO_TICK);
}

function abortarPulsacion() {
    if (progreso < 100) {
        clearInterval(temporizador);
        progreso = 0;
        barra.style.width = "0%";
        txtEstado.innerText = "Sistema enlazado y listo";
        txtEstado.className = "mt-4 small fw-bold text-muted";
    }
}

// 3. Obtención de Coordenadas GPS y Subida a Firestore
function dispararAlertaEmergencia() {
    txtEstado.innerText = "Localizando dispositivo...";

    if (!navigator.geolocation) {
        txtEstado.innerText = "Error: GPS no soportado por el navegador.";
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            txtEstado.innerText = "Transmitiendo señal de auxilio...";

            // Creación del documento de incidente en tiempo real
            await addDoc(collection(db, "alertas_extorsion"), {
                usuarioId: usuarioLogueado.uid,
                telefono: usuarioLogueado.phoneNumber,
                coordenadas: {
                    latitud: position.coords.latitude,
                    longitud: position.coords.longitude
                },
                fecha: serverTimestamp(),
                estatus: "NUEVA_ALERTA"
            });

            // Camuflaje visual inmediato tras el envío exitoso
            pantallaDiscretaExito();

        } catch (error) {
            console.error("Error al transmitir reporte a Firestore:", error);
            txtEstado.innerText = "Error de conexión en el envío.";
            txtEstado.className = "mt-4 small fw-bold text-danger";
        }
    }, (error) => {
        txtEstado.innerText = "Error: Enciende tu GPS para enviar el reporte.";
        txtEstado.className = "mt-4 small fw-bold text-danger";
    }, { enableHighAccuracy: true, timeout: 5000 });
}

// Cambia la interfaz a una simulación inofensiva para no levantar sospechas
function pantallaDiscretaExito() {
    document.body.innerHTML = `
        <div class="container min-vh-100 d-flex flex-column justify-content-center align-items-center text-center px-4">
            <p class="text-muted small font-monospace">ERR_CONNECTION_TIMED_OUT<br><span class="text-secondary opacity-20">Su alerta ha sido recibida...</span></p>
        </div>
    `;
}

// =========================================================================
// 4. MÓDULO DE SEGURIDAD: CIERRE DE SESIÓN
// =========================================================================
// En tu archivo alerta.js, donde declaraste la función:
window.cerrarSesionCiudadano = function () {
    // Aseguramos el enlace directo desde JS
    document.getElementById('btn-salir').addEventListener('click', function () {
        console.log("Clic detectado en botón Salir");
        signOut(auth).then(() => {
            window.location.href = "./index.html";
        }).catch((error) => {
            console.error("Error al cerrar sesión:", error);
        });
    });
};

// 1. Asegúrate de tener esta importación al principio de tu alerta.js

// 2. Bloque del botón
const btnSalir = document.getElementById('btn-cerrar-sesion');

if (btnSalir) {
    btnSalir.addEventListener('click', () => {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: "Se finalizará su sesión actual.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, salir'
        }).then((result) => {
            if (result.isConfirmed) {
                console.log("Clic detectado, intentando cerrar sesión...");
                signOut(auth).then(() => {
                    window.location.href = "./index.html";
                }).catch((error) => {
                    console.error("Error al cerrar:", error);
                    Swal.fire("Error", "No se pudo cerrar la sesión.", "error");
                });
            }
        });
    });
} 
onAuthStateChanged(auth, (user) => {
    if (!user) {
        if (window.location.pathname.includes("pantalla_alerta.html")) window.location.href = "./index.html";
    } else {
        // FILTRO: Si el usuario tiene email, es un operador. ¡EXPÚLSALO del sistema ciudadano!
        if (user.email) {
            window.location.href = "./index.html";
        }
    }
});