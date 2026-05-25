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

// Importar las funciones necesarias de los módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm';

// Configuración de tu proyecto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBljf2sZQh9hQ-NDRNyOBmSZfmpeSx6Oso",
    authDomain: "alertbutton-75394.firebaseapp.com",
    projectId: "alertbutton-75394",
    storageBucket: "alertbutton-75394.firebasestorage.app",
    messagingSenderId: "872466013993",
    appId: "1:872466013993:web:ca59da94d14ad2e6aca138",
    measurementId: "G-D5QZ74V0DT"
};

// Inicializar servicios
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

auth.languageCode = 'es';

let verifierConfigurado = false;
let resultadoConfirmacion = null;

// Validar si estamos en entorno local de pruebas
const esLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

if (esLocal) {
    auth.settings.appVerificationDisabledForTesting = true;
    console.log("🔒 Modo desarrollo: Verificación de reCAPTCHA deshabilitada para pruebas.");
}

// Inicializa el reCAPTCHA (Solo necesario en producción real)
function configurarRecaptcha() {
    if (esLocal) {
        // En local pasamos un verificador ficticio dummy que exige Firebase
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
        verifierConfigurado = true;
        return;
    }

    if (!verifierConfigurado) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => { }
        });
        verifierConfigurado = true;
    }
}

// =========================================================================
// PASO 1: Enviar SMS al número telefónico (Blindado contra recargas)
// =========================================================================
document.getElementById('btn-enviar-sms').addEventListener('click', async (e) => {
    e.preventDefault(); // ◄--- EVITA QUE LA PÁGINA SE RECARGUE Y BORRE LA VARIABLE

    const nombre = document.getElementById('txt-nombre').value.trim();
    const telefonoInput = document.getElementById('txt-telefono').value.trim();

    if (!nombre || telefonoInput.length !== 10) {
        alert("Por favor, ingresa tu nombre y un número celular válido a 10 dígitos.");
        return;
    }

    const formatoInternacional = `+52${telefonoInput}`;
    console.log("Enviando número limpio a Firebase:", formatoInternacional);

    configurarRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    try {
        resultadoConfirmacion = await signInWithPhoneNumber(auth, formatoInternacional, appVerifier);
        console.log("🔒 Token guardado con éxito en memoria:", resultadoConfirmacion);

        // Intercambiar visibilidad de las secciones
        document.getElementById('seccion-telefono').classList.add('d-none');
        document.getElementById('seccion-codigo').classList.remove('d-none');
    } catch (error) {
        console.error("Error al enviar el SMS:", error);
        alert(`Error al iniciar verificación: ${error.message}`);
        if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
        verifierConfigurado = false;
    }
});

// =========================================================================
// PASO 2: Confirmar el código enviado (Blindado con lectura de error real)
// =========================================================================
document.getElementById('btn-verificar-codigo').addEventListener('click', async (e) => {
    e.preventDefault(); // ◄--- EVITA QUE LA PÁGINA SE RECARGUE AL DAR CLIC

    const codigo = document.getElementById('txt-codigo').value.trim();
    const nombre = document.getElementById('txt-nombre').value.trim();
    const telefonoInput = document.getElementById('txt-telefono').value.trim();

    if (codigo.length !== 6) {
        alert("El código debe contener exactamente 6 dígitos.");
        return;
    }

    // Alerta de depuración si la variable se borró por completo
    if (!resultadoConfirmacion) {
        alert("⚠️ Error de flujo: La sesión de Firebase se perdió. No recargues la página entre el Paso 1 y el Paso 2.");
        return;
    }

    try {
        console.log("Intentando validar el código contra el token activo...");
        const credencialUsuario = await resultadoConfirmacion.confirm(codigo);
        const usuario = credencialUsuario.user;

        // Guardar el registro en Firestore
        await setDoc(doc(db, "usuarios_alertas", usuario.uid), {
            uid: usuario.uid,
            nombre: nombre,
            telefono: `+52${telefonoInput}`,
            fechaRegistro: serverTimestamp(),
            rol: "CIUDADANO",
            cuentaActiva: true
        });

        Swal.fire({
            title: '¡Registro exitoso!',
            text: 'Identidad verificada.',
            icon: 'success',
            confirmButtonColor: '#28a745'
        }).then((result) => {
            if (result.isConfirmed) {
                // Redirigir después de que el usuario haga clic en el botón
                window.location.href = "./pantalla_alerta.html";
            }
        });

    } catch (error) {
        console.error("Detalle completo del error de Firebase:", error);
        // Te dirá textualmente qué está rechazando el servidor (ej: auth/invalid-verification-code)
        alert(`Firebase denegó el acceso: ${error.code || error.message}`);
    }
});
// =========================================================================
// PASO 3: Función para regresar
// =========================================================================
document.getElementById('btn-regresar').addEventListener('click', () => {
    document.getElementById('seccion-codigo').classList.add('d-none');
    document.getElementById('seccion-telefono').classList.remove('d-none');

    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        document.getElementById('recaptcha-container').innerHTML = '';
    }
    verifierConfigurado = false;
    resultadoConfirmacion = null;
});

// Registro del Service Worker para soporte PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/sw.js')
            .then(reg => console.log('PWA lista para instalarse', reg))
            .catch(err => console.error('Error de Service Worker', err));
    });
}