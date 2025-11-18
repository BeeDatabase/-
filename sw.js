/* Bee Expert V43.0 - Auto Update Service Worker */
const CACHE_NAME = 'bee-expert-v43-offline'; // ★ 每次更新務必修改此版號

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

// 1. 安裝
self.addEventListener('install', (e) => {
    self.skipWaiting(); // ★ 強制新版 SW 立刻進入等待狀態
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

// 2. 攔截請求
self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then((response) => response || fetch(e.request)));
});

// 3. 活化與清理舊快取
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => Promise.all(keyList.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key); // 刪除舊版本
        }))).then(() => self.clients.claim()) // 立刻接管頁面
    );
});
