/* Bee Expert V42.0 - Offline Service Worker (Cache Buster) */
const CACHE_NAME = 'bee-expert-v42-offline'; // ★ 更新版本號 V42

const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    'https://fonts.googleapis.com/icon?family=Material+Icons+Round',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// 安裝與快取
self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

// 攔截請求
self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then((response) => response || fetch(e.request)));
});

// 活化與清除舊快取
self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((keyList) => Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
    }))));
});
