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
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Credenciales oficiales de tu proyecto
const firebaseConfig = {
    apiKey: "AIzaSyBljf2sZQh9hQ-NDRNyOBmSZfmpeSx6Oso",
    authDomain: "alertbutton-75394.firebaseapp.com",
    projectId: "alertbutton-75394",
    storageBucket: "alertbutton-75394.firebasestorage.app",
    messagingSenderId: "872466013993",
    appId: "1:872466013993:web:ca59da94d14ad2e6aca138"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('txt-email').value.trim();
    const password = document.getElementById('txt-password').value;
    const alertaError = document.getElementById('alerta-error');

    alertaError.classList.add('d-none');

    try {
        // Validar credenciales en Firebase Auth
        await signInWithEmailAndPassword(auth, email, password);
        
        // Redirección exitosa al panel
        window.location.href = './panel.html';
    } catch (error) {
        console.error("Error de autenticación:", error.code);
        alertaError.classList.remove('d-none');
    }
});