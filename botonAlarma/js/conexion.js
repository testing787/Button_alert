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

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBljf2sZQh9hQ-NDRNyOBmSZfmpeSx6Oso",
    authDomain: "alertbutton-75394.firebaseapp.com",
    projectId: "alertbutton-75394",
    storageBucket: "alertbutton-75394.firebasestorage.app",
    messagingSenderId: "872466013993",
    appId: "1:872466013993:web:ca59da94d14ad2e6aca138",
    measurementId: "G-D5QZ74V0DT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Forzar el modo de pruebas si es necesario (solo en desarrollo)
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    auth.settings.appVerificationDisabledForTesting = true;
}