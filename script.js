/**
 * BEE EXPERT - SMART SYSTEM CORE V19.1
 * Naming Convention: Professional Business Terms
 */

const System = {
    init: function() {
        console.log("System Starting...");
        
        // 1. 強制移除載入畫面
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            if(splash) {
                splash.style.opacity = '0';
                setTimeout(() => splash.style.display = 'none', 500);
            }
        }, 1500);

        // 2. 啟動路由
        const lastPage = localStorage.getItem('bee_last_page') || 'dashboard';
        Router.go(lastPage);
        
        // 3. 啟動時鐘
        this.startClock();
        
        // 4. 自動儲存
        this.initAutoSave();
    },

    toggleSidebar: function() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('overlay');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('hidden');
    },

    toggleTheme: function() { alert("目前預設為深色專業模式"); },

    toggleFullScreen: function() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e=>{});
        else if (document.exitFullscreen) document.exitFullscreen();
    },

    startClock: function() {
        const weathers = ['晴朗', '多雲', '陰天'];
        const temps = ['24°C', '25°C', '23°C'];
        const idx = Math.floor(Math.random() * weathers.length);
        const el = document.getElementById('headerTemp');
        if(el) el.innerText = `${weathers[idx]} ${temps[idx]}`;
    },

    initAutoSave: function() {
        const container = document.getElementById('app-content');
        if(container) {
            container.addEventListener('change', (e) => {
                if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                    if(e.target.id) {
                        localStorage.setItem('bee_data_' + e.target.id, e.target.value);
                    }
                }
            });
        }
    }
};

const Router = {
    go: function(pageId) {
        document.querySelectorAll('.nav-btn, .nav-item').forEach(el => el.classList.remove('active'));
        const deskBtn = document.querySelector(`.nav-btn[onclick="Router.go('${pageId}')"]`);
        const mobBtn = document.querySelector(`.nav-item[onclick="Router.go('${pageId}')"]`);
        if(deskBtn) deskBtn.classList.add('active');
        if(mobBtn) mobBtn.classList.add('active');

        const content = document.getElementById('app-content');
        const title = document.getElementById('pageTitle');
        
        if(content) {
            content.style.opacity = 0;
            setTimeout(() => {
                if(Modules[pageId]) {
                    content.innerHTML = Modules[pageId].render();
                    // 這裡會使用更新後的專業名稱
                    if(title) title.innerText = Modules[pageId].title;
                    if(Modules[pageId].init) Modules[pageId].init();
                    Utils.restoreData();
                } else {
                    content.innerHTML = `<div class="glass-panel" style="text-align:center; padding:40px;">
                        <span class="material-icons-round" style="font-size:3rem; color:#555">construction</span>
                        <h3>功能建置中</h3><p style="color:#777">此模組將於下次更新啟用</p>
                    </div>`;
                    if(title) title.innerText = "建置中";
                }
                content.style.opacity = 1;
            }, 200);
        }
        
        if(window.innerWidth <= 1024) {
            document.querySelector('.sidebar').classList.remove('open');
            document.getElementById('overlay').classList.add('hidden');
        }
        localStorage.setItem('bee_last_page', pageId);
    }
};

// --- 模組定義 (名稱正名) ---
const Modules = {
    dashboard: {
        title: '營運總覽', // 修正：戰情儀表板 -> 營運總覽
        render: () => `
            <div class="grid-4">
                <div class="glass-panel" style="border-left: 4px solid var(--primary)">
                    <div class="panel-title"><span class="material-icons-round">today</span>今日概況</div>
                    <div class="stat-value" style="font-size:1.5rem">11月19日</div>
                    <p style="color:#aaa">宜開箱檢查 • 流蜜期</p>
                </div>
                <div class="glass-panel">
                    <div class="panel-title"><span class="material-icons-round">opacity</span>本月產量</div>
                    <div class="stat-value">1,280 <span style="font-size:0.5rem">kg</span></div>
                    <div class="stat-trend" style="color:var(--success)">▲ 成長 12%</div>
                </div>
                <div class="glass-panel">
                    <div class="panel-title"><span class="material-icons-round">warning</span>異常警報</div>
                    <div class="stat-value" style="color:var(--danger)">3 <span style="font-size:0.5rem">箱</span></div>
                    <p style="font-size:0.8rem; color:var(--danger)">A-05 失王疑慮</p>
                </div>
                <div class="glass-panel">
                    <div class="panel-title"><span class="material-icons-round">assignment</span>待辦事項</div>
                    <div class="stat-value">5 <span style="font-size:0.5rem">項</span></div>
                    <button class="btn-main" onclick="Router.go('tasks')" style="margin-top:5px; padding:8px; font-size:0.8rem">查看清單</button>
                </div>
            </div>
            <div class="glass-panel">
                <div class="panel-title">📊 產量趨勢</div>
                <div style="height:250px"><canvas id="dashChart"></canvas></div>
            </div>
        `,
        init: () => {
            const ctx = document.getElementById('dashChart');
            if(ctx) {
                new Chart(ctx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['W1', 'W2', 'W3', 'W4'],
                        datasets: [{
                            label: '蜂蜜 (kg)',
                            data: [150, 300, 200, 450],
                            borderColor: '#FFD700',
                            backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            fill: true
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        }
    },
    
    map: {
        title: '蜂場地圖', // 修正：視覺化地圖 -> 蜂場地圖
        render: () => `
            <div class="glass-panel">
                <div style="margin-bottom:15px; display:flex; gap:15px;">
                    <span style="color:var(--success)">● 強群</span>
                    <span style="color:var(--warning)">● 普通</span>
                    <span style="color:var(--danger)">● 需注意</span>
                </div>
                <div id="hiveGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap:10px;"></div>
            </div>
        `,
        init: () => {
            let html = '';
            for(let i=1; i<=50; i++) {
                let color = 'var(--success)';
                if(i%5===0) color = 'var(--danger)';
                html += `<div style="aspect-ratio:1; border:1px solid ${color}; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; background:rgba(255,255,255,0.05)">A-${i}</div>`;
            }
            document.getElementById('hiveGrid').innerHTML = html;
        }
    },

    breeding: {
        title: '育王管理', // 修正：精密育王 -> 育王管理
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🧬 育王時間軸</div>
                <label style="color:#aaa; display:block; margin-bottom:5px;">移蟲時間</label>
                <input type="datetime-local" id="breedDate" class="input-field">
                <button class="btn-main" onclick="Modules.breeding.calc()">計算時程</button>
                <div id="breedResult" style="margin-top:20px; line-height:2; display:none;">
                    <div class="result-area" style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px;">
                        <div>🐛 移蟲：<b id="bd1">---</b></div>
                        <div>🔒 封蓋 (5天)：<b id="bd2">---</b></div>
                        <div style="color:var(--danger)">👑 出台 (13天)：<b id="bd3">---</b></div>
                    </div>
                </div>
            </div>
        `,
        init: () => {},
        calc: () => {
            const v = document.getElementById('breedDate').value;
            if(!v) return alert('請輸入時間');
            const d = new Date(v);
            const f = t => t.toLocaleString('zh-TW', {month:'numeric', day:'numeric', hour:'numeric'});
            document.getElementById('bd1').innerText = f(d);
            document.getElementById('bd2').innerText = f(new Date(d.getTime() + 120*3600000));
            document.getElementById('bd3').innerText = f(new Date(d.getTime() + 312*3600000));
            document.getElementById('breedResult').style.display = 'block';
        }
    },

    inventory: {
        title: '資材庫存',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">📦 庫存盤點</div>
                ${Utils.invItem('白糖 (kg)', '150')}
                ${Utils.invItem('草酸 (g)', '500')}
                ${Utils.invItem('玻璃瓶 (支)', '12', true)}
            </div>
        `,
        init: () => {}
    },

    production: {
        title: '生產紀錄', // 修正：生產加工 -> 生產紀錄
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🍯 批號生成</div>
                <div class="input-group">
                    <select class="input-field"><option>龍眼蜜</option><option>荔枝蜜</option></select>
                    <button class="btn-main" onclick="this.nextElementSibling.innerText='2025-LY-A01'">生成追溯碼</button>
                    <h2 style="text-align:center; color:var(--primary); margin-top:10px;">---</h2>
                </div>
            </div>
        `,
        init: () => {}
    },

    settings: {
        title: '系統設定',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🛠️ 資料管理</div>
                <button class="btn-main" onclick="Utils.exportData()" style="background:#2196F3; margin-bottom:10px;">⬇️ 匯出備份</button>
                <button class="btn-main" onclick="document.getElementById('fileInput').click()" style="background:#607D8B;">⬆️ 匯入還原</button>
                <input type="file" id="fileInput" style="display:none" onchange="Utils.importData(this)">
                <div style="margin-top:20px; border-top:1px solid #333; padding-top:20px;">
                    <button class="btn-main" onclick="if(confirm('確定重置？')) localStorage.clear(); location.reload();" style="background:var(--danger)">🗑️ 清空所有資料</button>
                </div>
            </div>
        `,
        init: () => {}
    }
};

const Utils = {
    restoreData: () => {
        document.querySelectorAll('input, select').forEach(el => {
            if(el.id) {
                const v = localStorage.getItem('bee_data_' + el.id);
                if(v) el.value = v;
            }
        });
    },
    invItem: (name, val, alert=false) => `
        <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #333;">
            <span>${name}</span>
            <span style="font-weight:bold; font-size:1.1rem; color:${alert?'var(--danger)':'#fff'}">${val}</span>
        </div>
    `,
    exportData: () => {
        const data = JSON.stringify(localStorage);
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'bee_backup.json';
        a.click();
    },
    importData: (input) => {
        const file = input.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const d = JSON.parse(e.target.result);
                Object.keys(d).forEach(k => localStorage.setItem(k, d[k]));
                alert('還原成功'); location.reload();
            } catch(err) { alert('格式錯誤'); }
        };
        reader.readAsText(file);
    }
};

const QuickAction = {
    toggle: () => document.getElementById('quickSheet').classList.toggle('visible')
};
const Log = {
    quick: (t) => { alert('已紀錄: '+t); QuickAction.toggle(); }
};

document.addEventListener('DOMContentLoaded', () => System.init());
