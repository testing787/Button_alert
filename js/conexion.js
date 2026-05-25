import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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
const auth = getAuth(app);
const db = getFirestore(app);

// APLICACIÓN INMEDIATA: Forzar modo pruebas si estamos en localhost
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    auth.settings.appVerificationDisabledForTesting = true;
    console.log("Modo pruebas habilitado en conexion.js");
}

export { auth, db, app };