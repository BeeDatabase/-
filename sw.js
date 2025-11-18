const CACHE_NAME = 'bee-expert-v75-ultimate';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    'https://fonts.googleapis.com/icon?family=Material+Icons+Round',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS))); });
self.addEventListener('fetch', (e) => { e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request))); });
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); }))).then(() => self.clients.claim())); });
