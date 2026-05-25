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

const CACHE_NAME = 'alerta-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
];

// Evento de Instalación: Guarda la interfaz esencial en la caché local del celular
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Evento de Activación: Limpia cachés o versiones anteriores si las hubiera
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de Red: Intenta obtener datos de internet en tiempo real, si no hay señal usa la caché
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});