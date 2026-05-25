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
// --- IMPORTACIONES ---
import { auth, app } from "/js/conexion.js"; // Asegúrate de exportar 'app' en conexion.js
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm';

// --- INICIALIZACIÓN ---
const db = getFirestore(app);
auth.languageCode = 'es';
auth.settings.appVerificationDisabledForTesting = true; // Forzamos modo pruebas

let resultadoConfirmacion = null;

// --- FUNCIONES AUXILIARES ---
function configurarRecaptcha() {
    if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
    });
}

// --- PASO 1: ENVIAR SMS ---
document.getElementById('btn-enviar-sms').addEventListener('click', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('txt-nombre').value.trim();
    const telefonoInput = document.getElementById('txt-telefono').value.trim();

    if (!nombre || telefonoInput.length !== 10) {
        Swal.fire("Error", "Nombre y teléfono de 10 dígitos requerido.", "warning");
        return;
    }

    configurarRecaptcha();

    try {
        const formatoInternacional = `+52${telefonoInput}`;
        resultadoConfirmacion = await signInWithPhoneNumber(auth, formatoInternacional, window.recaptchaVerifier);
        sessionStorage.setItem('auth_pending', 'true');

        document.getElementById('seccion-telefono').classList.add('d-none');
        document.getElementById('seccion-codigo').classList.remove('d-none');
    } catch (error) {
        Swal.fire("Error", "No se pudo enviar el SMS: " + error.message, "error");
    }
});

// --- PASO 2: VERIFICAR ---
document.getElementById('btn-verificar-codigo').addEventListener('click', async (e) => {
    e.preventDefault();
    const codigo = document.getElementById('txt-codigo').value.trim();
    const nombre = document.getElementById('txt-nombre').value.trim();
    const telefono = document.getElementById('txt-telefono').value.trim();

    if (!resultadoConfirmacion || !sessionStorage.getItem('auth_pending')) {
        Swal.fire("Error", "La sesión expiró.", "error");
        return;
    }

    try {
        const credencial = await resultadoConfirmacion.confirm(codigo);

        await setDoc(doc(db, "usuarios_alertas", credencial.user.uid), {
            uid: credencial.user.uid,
            nombre: nombre,
            telefono: `+52${telefono}`,
            fechaRegistro: serverTimestamp(),
            rol: "CIUDADANO"
        });

        sessionStorage.removeItem('auth_pending');
        Swal.fire("¡Éxito!", "Identidad verificada.", "success").then(() => {
            window.location.href = "./pantalla_alerta.html";
        });
    } catch (error) {
        Swal.fire("Error", "Código incorrecto: " + error.code, "error");
    }
});

// --- PASO 3: REGRESAR ---
document.getElementById('btn-regresar').addEventListener('click', () => {
    document.getElementById('seccion-codigo').classList.add('d-none');
    document.getElementById('seccion-telefono').classList.remove('d-none');
    resultadoConfirmacion = null;
    sessionStorage.removeItem('auth_pending');
});

// Registro del Service Worker (Se ejecuta al cargar)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/sw.js').catch(console.error);
    });
}