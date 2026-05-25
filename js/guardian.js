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

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from "/js/conexion.js";

// ... ahora el resto de tu código que usa onAuthStateChanged ...
// Creamos un pequeño mensaje de "Cargando" mientras Firebase responde
const loader = document.createElement('div');
loader.innerHTML = "Verificando seguridad...";
loader.style.textAlign = "center";
loader.style.marginTop = "50px";
document.body.appendChild(loader);

onAuthStateChanged(auth, (user) => {
    // Eliminamos el mensaje de carga
    loader.remove();

    if (user) {
        // SESIÓN VÁLIDA: Mostramos el contenido
        document.body.style.display = "block";
        console.log("🔒 Acceso autorizado.");
    } else {
        // SESIÓN INVÁLIDA: Redirigimos
        console.warn("⚠️ Acceso denegado.");
        window.location.replace("./login.html");
    }
});