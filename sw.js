/**
 * BEE EXPERT V200.0 - SERVICE WORKER (MILITARY GRADE)
 * Features:
 * 1. Aggressive Caching (秒開)
 * 2. Auto Update Mechanism (自動更新)
 * 3. Network Fault Tolerance (斷網容錯)
 * 4. Detailed Logging (詳細日誌)
 */

// ★★★ 核心版本控制 (每次更新請修改這裡) ★★★
const CACHE_NAME = 'bee-expert-v200-universe';

// ★ 必須快取的資產清單 (白名單)
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    // Google Fonts (介面圖示與字體)
    'https://fonts.googleapis.com/icon?family=Material+Icons+Round',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap',
    // 外部函式庫 (圖表、PDF、排序、QR Code、特效)
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

// ================= 1. 安裝階段 (Install Phase) =================
// 當瀏覽器偵測到新版本時觸發
self.addEventListener('install', (event) => {
    console.log(`[SW] 正在安裝新版本: ${CACHE_NAME}`);
    
    // 強制進入等待狀態 (Skip Waiting)，不等待舊版關閉
    self.skipWaiting();

    // 開始快取所有核心檔案
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] 正在下載並快取核心檔案...');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                console.log('[SW] 安裝完成！核心檔案已就緒。');
            })
            .catch((err) => {
                console.error('[SW] 安裝失敗 (可能是網路問題或檔案遺失):', err);
            })
    );
});

// ================= 2. 啟動階段 (Activate Phase) =================
// 當新版本正式接管頁面時觸發
self.addEventListener('activate', (event) => {
    console.log('[SW] 新版本已啟動，正在清理舊快取...');

    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                // 如果發現舊版本的快取 (例如 v199)，直接刪除
                if (key !== CACHE_NAME) {
                    console.log(`[SW] 刪除舊快取: ${key}`);
                    return caches.delete(key);
                }
            }));
        })
        .then(() => {
            console.log(`[SW] 清理完畢，目前運行版本: ${CACHE_NAME}`);
            // 立即接管所有客戶端頁面，不用等下次重新整理
            return self.clients.claim();
        })
    );
});

// ================= 3. 請求攔截 (Fetch Strategy) =================
// 這是離線功能的靈魂：決定要讀快取還是讀網路
self.addEventListener('fetch', (event) => {
    // 只處理 http/https 請求
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // 策略 A: 快取優先 (Cache First)
            // 如果快取裡有這個檔案，直接回傳 (速度最快，且支援離線)
            if (cachedResponse) {
                // console.log(`[SW] 讀取快取: ${event.request.url}`); // 除錯時可開啟
                return cachedResponse;
            }

            // 策略 B: 網路候補 (Network Fallback)
            // 如果快取沒有，才去網路上抓
            // console.log(`[SW] 網路下載: ${event.request.url}`);
            return fetch(event.request).catch((error) => {
                console.warn(`[SW] 網路請求失敗 (可能是離線狀態): ${event.request.url}`);
                // 這裡未來可以擴充：如果是圖片讀不到，回傳一張預設的「離線圖」
            });
        })
    );
});

// ================= 4. 訊息溝通 (Messaging) =================
// 接收來自網頁 (index.html) 的強制更新指令
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] 收到強制更新指令，跳過等待狀態...');
        self.skipWaiting();
    }
});
