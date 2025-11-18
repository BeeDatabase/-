/* Bee Expert V33.0 - Offline Service Worker */
// 注意：這裡版本號改為 v33，強迫瀏覽器抓取新檔案
const CACHE_NAME = 'bee-expert-v33-offline';

const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    // 外部資源也要快取，確保離線時字體和圖表能用
    'https://fonts.googleapis.com/icon?family=Material+Icons+Round',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// 安裝與快取
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// 攔截請求 (離線優先策略)
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});

// 更新版本時清除舊快取 (這是最重要的步驟，刪除 v21 的舊資料)
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
});
