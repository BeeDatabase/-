/**
 * BEE EXPERT V35.0 - THE ULTIMATE MERGE
 * Includes: V31 Content + V34 Gamification + V27 Logic
 */

// ================= 1. 資料庫 (DB) =================
const DB = {
    data: {
        // V31 基礎數據
        inventory: { sugar: 50, acid: 500, bottles: 100, box: 108 },
        finance: { revenue: 150000, cost: 35000 },
        logs: [],
        tasks: [{ title: '全場檢查王台', done: false }, { title: '補充 B 區糖水', done: false }],
        crm: [{ name: '王大明', phone: '0912-xxx', note: '喜好龍眼蜜', total: 5000 }],
        notifications: [],
        // V34 新增數據
        user: { exp: 0, level: 1 }, // 等級系統
        risks: [], // 風險紀錄
        lands: [{ name: '中寮A場', landlord: '林先生', rent: '20斤蜜', due: '2025-12-31' }] // 場地紀錄
    },
    load: function() {
        const saved = localStorage.getItem('bee_db_v35');
        if(saved) this.data = JSON.parse(saved);
        this.initHives(); // 確保蜂箱地圖資料存在
    },
    save: function() {
        localStorage.setItem('bee_db_v35', JSON.stringify(this.data));
        SmartLogic.checkAlerts();
        Gamification.update(); // 每次存檔都計算等級
    },
    initHives: function() {
        // 確保有蜂箱狀態資料
        if(!this.data.hives) {
            this.data.hives = {};
            for(let i=1; i<=108; i++) this.data.hives[`A-${i}`] = { status: 'normal' };
        }
    }
};

// ================= 2. 遊戲化引擎 (V34) =================
const Gamification = {
    update: function() {
        // 經驗值 = 日誌數 * 10 + 營收/1000
        const xp = (DB.data.logs.length * 10) + Math.floor(DB.data.finance.revenue / 1000);
        const lvl = Math.floor(xp / 100) + 1;
        DB.data.user.exp = xp;
        DB.data.user.level = lvl;
    }
};

// ================= 3. 智慧邏輯與連動 (V27) =================
const SmartLogic = {
    feed: function(type, amount, cost) {
        this.addLog('feed', `餵食 ${type} ${amount}`);
        if(type.includes('糖')) DB.data.inventory.sugar -= parseFloat(amount)*0.6;
        DB.data.finance.cost += parseFloat(cost);
        DB.save(); 
        alert(`✅ 已紀錄！庫存已扣除，獲得經驗值！`);
        Router.go('dashboard');
    },
    harvest: function(type, weight, price) {
        const b = Math.ceil(weight / 0.7);
        this.addLog('harvest', `採收 ${type} ${weight}kg`);
        DB.data.inventory.bottles -= b;
        DB.data.finance.revenue += (weight * price);
        DB.save(); 
        alert(`🎉 恭喜豐收！營收 +$${weight*price}，獲得大量經驗值！`);
        Router.go('dashboard');
    },
    addRisk: function() { // V34 新增
        const t = prompt("風險類型 (農藥/防盜/天災):", "農藥");
        const n = prompt("說明:", "附近果園噴藥");
        if(t) {
            DB.data.risks.unshift({date: new Date().toLocaleDateString(), type: t, note: n});
            DB.save(); Router.go('risk');
        }
    },
    addLand: function() { // V34 新增
        const n = prompt("場地名稱:");
        if(n) {
            DB.data.lands.push({name: n, landlord: '未填', rent: '未填', due: '2025-12-31'});
            DB.save(); Router.go('land');
        }
    },
    addLog: function(type, msg) {
        DB.data.logs.unshift({ date: new Date().toLocaleDateString(), type, msg });
    },
    checkAlerts: function() {
        DB.data.notifications = [];
        if(DB.data.inventory.sugar < 20) DB.data.notifications.push({msg:'⚠️ 白糖庫存低於 20kg'});
        if(DB.data.inventory.bottles < 50) DB.data.notifications.push({msg:'⚠️ 玻璃瓶庫存緊張'});
        const dot = document.getElementById('notifDot');
        if(dot) dot.classList.toggle('hidden', DB.data.notifications.length === 0);
    }
};

// ================= 4. 單箱系統 (HiveOS) =================
const HiveOS = {
    currentId: null,
    open: function(id) {
        this.currentId = id;
        document.getElementById('hiveModal').classList.remove('hidden');
        document.getElementById('modalTitle').innerText = `📦 ${id} 蜂箱管理`;
        this.switch('check');
    },
    close: function() { document.getElementById('hiveModal').classList.add('hidden'); },
    switch: function(tab) {
        const c = document.getElementById('hive-tab-content');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        
        if(tab === 'check') {
            c.innerHTML = `
                <div class="input-group"><label>蜂量 (框)</label><input type="range" min="0" max="10" step="0.5" class="input-field" oninput="this.nextElementSibling.innerText=this.value"><span style="float:right; font-weight:bold; color:var(--primary)">5</span></div>
                <div class="input-group"><label>子脾狀況</label><select class="input-field"><option>健康連片</option><option>花子 (病害警訊)</option><option>無子 (失王?)</option></select></div>
                <div class="grid-2">
                    <label class="glass-btn"><input type="checkbox"> 見王</label>
                    <label class="glass-btn"><input type="checkbox"> 見卵</label>
                    <label class="glass-btn"><input type="checkbox"> 王台</label>
                    <label class="glass-btn"><input type="checkbox"> 雄蜂</label>
                </div>`;
        } else if(tab === 'feed') {
            c.innerHTML = `<div class="input-group"><select class="input-field"><option>1:1 糖水</option><option>花粉餅</option></select></div><div class="input-group"><input type="number" class="input-field" placeholder="數量"></div>`;
        } else {
            c.innerHTML = `<div class="log-item"><small>2025/11/01</small> 檢查：正常</div>`;
        }
    },
    save: function() { alert(`✅ ${this.currentId} 狀態已更新`); this.close(); }
};

// ================= 5. 系統核心 =================
const System = {
    init: function() {
        DB.load();
        setTimeout(() => {
            const s = document.getElementById('splashScreen');
            if(s) { s.style.opacity='0'; setTimeout(()=>s.style.display='none',500); }
        }, 1000);
        Router.go(localStorage.getItem('bee_last_page') || 'dashboard');
        this.startClock();
        SmartLogic.checkAlerts();
    },
    toggleSidebar: () => { document.querySelector('.sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('hidden'); },
    closeAllOverlays: () => { document.querySelector('.sidebar').classList.remove('open'); document.getElementById('overlay').classList.add('hidden'); document.getElementById('quickSheet').classList.remove('visible'); document.getElementById('notifPanel').classList.remove('visible'); HiveOS.close(); },
    toggleTheme: () => alert("專業深色模式"),
    toggleFullScreen: () => { if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); },
    startClock: () => {
        const w = ['晴朗','多雲','陰天']; document.getElementById('headerTemp').innerText = `${w[Math.floor(Math.random()*3)]} 24°C`;
    }
};

// ================= 6. 路由與全模組內容 (Modules) =================
const Router = {
    go: function(p) {
        document.querySelectorAll('.nav-btn, .nav-item').forEach(e=>e.classList.remove('active'));
        const d=document.querySelector(`.nav-btn[onclick*="'${p}'"]`);
        const m=document.querySelector(`.nav-item[onclick*="'${p}'"]`);
        if(d)d.classList.add('active'); if(m)m.classList.add('active');

        const c = document.getElementById('app-content');
        const t = document.getElementById('pageTitle');
        c.style.opacity = 0;
        setTimeout(() => {
            if(Modules[p]) {
                c.innerHTML = Modules[p].render();
                if(t) t.innerText = Modules[p].title;
                if(Modules[p].init) Modules[p].init();
                Utils.restoreData();
            } else { c.innerHTML = '載入錯誤'; }
            c.style.opacity = 1;
        }, 200);
        if(window.innerWidth <= 1024) System.closeAllOverlays();
        localStorage.setItem('bee_last_page', p);
    }
};

const Modules = {
    // --- A. 核心管理 ---
    dashboard: {
        title: '營運總覽',
        render: () => {
            const net = DB.data.finance.revenue - DB.data.finance.cost;
            const u = DB.data.user;
            return `
            <div class="glass-panel" style="background:linear-gradient(135deg, #263238 0%, #000 100%); border:1px solid var(--primary);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="color:var(--primary); font-weight:bold;">👑 Lv.${u.level} 蜂業大亨</div>
                        <div style="color:#aaa; font-size:0.8rem;">累積經驗值: ${u.exp} XP</div>
                    </div>
                    <div style="font-size:2rem;">👨‍🌾</div>
                </div>
                <div style="background:#333; height:5px; border-radius:5px; margin-top:10px;"><div style="width:${(u.exp%100)}%; height:100%; background:var(--primary); border-radius:5px;"></div></div>
            </div>
            
            <div class="grid-container">
                <div class="glass-panel" style="border-left:4px solid var(--primary)">
                    <div class="panel-title"><span class="material-icons-round">monetization_on</span>本月淨利</div>
                    <div class="stat-value" style="color:${net>=0?'var(--success)':'var(--danger)'}">$${net.toLocaleString()}</div>
                </div>
                <div class="glass-panel">
                    <div class="panel-title"><span class="material-icons-round">inventory_2</span>庫存</div>
                    <div style="display:flex; justify-content:space-between"><span>白糖</span><b>${DB.data.inventory.sugar} kg</b></div>
                </div>
            </div>
            <div class="glass-panel">
                <div class="panel-title">📊 產量趨勢</div>
                <div style="height:200px"><canvas id="dashChart"></canvas></div>
            </div>
            <div class="glass-panel"><div class="panel-title">📢 最新動態</div><div id="dashLogList"></div></div>`;
        },
        init: () => {
            // 圖表初始化
            const ctx = document.getElementById('dashChart');
            if(ctx) new Chart(ctx.getContext('2d'), { type: 'line', data: { labels: ['W1','W2','W3','W4'], datasets: [{ label: '產量', data: [150, 300, 200, 450], borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)', fill: true }] }, options: { responsive: true, maintainAspectRatio: false } });
            
            // 日誌初始化
            let h = ''; DB.data.logs.slice(0,5).forEach(l=>h+=`<div class="log-item"><small>${l.date}</small> ${l.msg}</div>`);
            document.getElementById('dashLogList').innerHTML = h || '<p style="color:#666">無紀錄</p>';
        }
    },

    map: {
        title: '蜂場地圖',
        render: () => `<div class="glass-panel"><div class="panel-title">🗺️ 全場監控 (${DB.data.inventory.box}箱)</div><div id="hiveGrid" class="grid-auto"></div></div>`,
        init: () => {
            let h=''; for(let i=1;i<=DB.data.inventory.box;i++) { 
                let c=i%10===0?'var(--danger)':'var(--success)'; 
                h+=`<div onclick="HiveOS.open('A-${i}')" style="aspect-ratio:1;border:1px solid ${c};border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(255,255,255,0.05);cursor:pointer;">A-${i}</div>`; 
            }
            document.getElementById('hiveGrid').innerHTML = h;
        }
    },

    // --- B. 生態與資源 (V31 完整內容確認存在) ---
    flora: {
        title: '蜜源植物圖鑑',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🌺 台灣完整蜜粉源 (15種)</div>
                <div style="height:600px; overflow-y:auto;">
                    ${Utils.floraCard('龍眼 (Longan)', '3-4月', 5, 1, '#fff')}
                    ${Utils.floraCard('荔枝 (Lychee)', '2-3月', 4, 2, '#f5f5f5')}
                    ${Utils.floraCard('水筆仔 (Kandelia)', '6-8月', 3, 3, '#8bc34a')}
                    ${Utils.floraCard('鴨腳木 (Schefflera)', '11-1月', 4, 4, '#ffeb3b')}
                    ${Utils.floraCard('烏桕 (Tallow)', '5-7月', 3, 4, '#4caf50')}
                    ${Utils.floraCard('白千層 (Paperbark)', '8-11月', 3, 3, '#eee')}
                    ${Utils.floraCard('咸豐草 (Bidens)', '全年', 3, 5, '#ff9800')}
                    ${Utils.floraCard('油菜花 (Rape)', '1-2月', 3, 5, '#ffeb3b')}
                    ${Utils.floraCard('羅氏鹽膚木', '9-10月', 1, 5, '#795548')}
                    ${Utils.floraCard('茶花 (Camellia)', '11-3月', 2, 4, '#d32f2f')}
                    ${Utils.floraCard('楠木 (Machilus)', '2-3月', 3, 3, '#5d4037')}
                    ${Utils.floraCard('蔓澤蘭', '10-11月', 3, 2, '#cddc39')}
                    ${Utils.floraCard('玉米', '全年', 0, 4, '#ffeb3b')}
                    ${Utils.floraCard('南瓜', '全年', 2, 5, '#ff9800')}
                    ${Utils.floraCard('瓜類', '夏季', 2, 4, '#ffeb3b')}
                </div>
            </div>
        `,
        init: () => {}
    },

    science: {
        title: '環境氣象',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🌤️ 微氣候分析</div>
                ${Utils.invItem('目前溫度', '24°C')}
                ${Utils.invItem('相對濕度', '75%')}
                ${Utils.invItem('流蜜機率', '高', true)}
            </div>
            <div class="glass-panel">
                <div class="panel-title">🌸 積溫預測</div>
                <p>預計龍眼流蜜日：<b>3月15日</b></p>
            </div>
        `,
        init: () => {}
    },

    inventory: {
        title: '資材庫存',
        render: () => `<div class="glass-panel"><div class="panel-title">📦 庫存盤點</div>${Utils.invItem('白糖 (kg)', DB.data.inventory.sugar)}${Utils.invItem('草酸 (g)', DB.data.inventory.acid)}${Utils.invItem('玻璃瓶 (支)', DB.data.inventory.bottles)}</div>`,
        init: () => {}
    },

    // --- C. 生產技術 (完整計算機) ---
    health: {
        title: '病害防治',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🧪 草酸/甲酸 計算</div>
                <div class="input-group"><label>防治箱數</label><input type="number" id="oaBox" class="input-field" placeholder="箱" oninput="Modules.health.calcOA()"></div>
                <div class="result-area" id="oaRes">請輸入箱數</div>
            </div>
            <div class="glass-panel">
                <div class="panel-title">🚑 病徵快篩</div>
                <div class="grid-2">
                    <label class="glass-btn"><input type="checkbox"> 幼蟲拉絲</label>
                    <label class="glass-btn"><input type="checkbox"> 翅膀捲曲</label>
                </div>
            </div>
        `,
        init: () => {},
        calcOA: () => {
            const n = document.getElementById('oaBox').value;
            if(n) document.getElementById('oaRes').innerHTML = `需準備：<br>草酸 <b>${(n*3.5).toFixed(1)}g</b><br>糖水 <b>${(n*50).toFixed(1)}ml</b>`;
        }
    },
    breeding: {
        title: '育王管理',
        render: () => `<div class="glass-panel"><div class="panel-title">🧬 育王時間軸</div><label>移蟲日</label><input type="date" id="breedDate" class="input-field"><button class="btn-main" onclick="Modules.breeding.calc()">計算時程</button><div id="breedRes" class="hidden"></div></div>`,
        init: () => {},
        calc: () => {
            const d = new Date(document.getElementById('breedDate').value);
            if(!isNaN(d)) {
                const f = n => new Date(d.getTime()+n*86400000).toLocaleDateString();
                document.getElementById('breedRes').classList.remove('hidden');
                document.getElementById('breedRes').innerHTML = `<p>🐛 移蟲：${f(0)}</p><p>🔒 封蓋：${f(5)}</p><p style="color:var(--danger)">👑 出台：${f(12)}</p>`;
            }
        }
    },
    production: { title: '生產紀錄', render: () => `<div class="glass-panel"><div class="panel-title">🍯 批號生成</div><button class="btn-main" onclick="alert('批號: 2025-LY-A01')">生成</button></div>`, init:()=>{} },

    // --- D. 商業與物流 (V31+V34 功能) ---
    logistics: {
        title: '轉場運輸',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🚚 貨車裝載計算</div>
                <div class="input-group"><label>箱數</label><input type="number" id="truckBox" class="input-field" oninput="Modules.logistics.calc()"></div>
                <div class="result-area" id="truckRes">---</div>
            </div>
        `,
        init: () => {},
        calc: () => { const n=document.getElementById('truckBox').value; if(n) document.getElementById('truckRes').innerHTML = `需堆疊：<b>${Math.ceil(n/12)} 層</b> (3.5噸車)`; }
    },
    compliance: {
        title: '法規合規',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">⚖️ 養蜂法規檢核</div>
                <label class="glass-btn"><input type="checkbox" checked> 養蜂登錄證</label>
                <label class="glass-btn"><input type="checkbox"> 農藥殘留檢驗 (SGS)</label>
                <label class="glass-btn"><input type="checkbox"> 林地租賃契約</label>
                <label class="glass-btn"><input type="checkbox"> 產品標示檢查</label>
            </div>
        `,
        init: () => {}
    },
    risk: {
        title: '風險管理',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🛑 風險通報</div>
                <button class="btn-main" style="background:var(--danger); margin-bottom:15px;" onclick="SmartLogic.addRisk()">+ 新增風險</button>
                <div id="riskList"></div>
            </div>
        `,
        init: () => {
            let h = '';
            DB.data.risks.forEach(r => h += `<div class="list-item" style="border-left:3px solid var(--danger)"><span>[${r.type}] ${r.date}</span><small>${r.note}</small></div>`);
            document.getElementById('riskList').innerHTML = h || '<p>無風險</p>';
        }
    },
    land: {
        title: '場地管理',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🏞️ 地主與租約</div>
                <button class="btn-main" style="background:var(--info); margin-bottom:15px;" onclick="SmartLogic.addLand()">+ 新增場地</button>
                <div id="landList"></div>
            </div>
        `,
        init: () => {
            let h = '';
            DB.data.lands.forEach(l => h += `<div class="list-item"><span>${l.name} (${l.landlord})</span><small>租金: ${l.rent}</small></div>`);
            document.getElementById('landList').innerHTML = h;
        }
    },
    
    // 其餘模組
    crm: { title: '客戶訂單', render: () => `<div class="glass-panel"><div id="crmList"></div></div>`, init:()=>{ let h=''; DB.data.crm.forEach(c=>h+=`<div class="list-item"><span>${c.name}</span><b>$${c.total}</b></div>`); document.getElementById('crmList').innerHTML=h; } },
    finance: { title: '財務報表', render: () => `<div class="glass-panel"><div class="panel-title">💰 損益</div>${Utils.invItem('總營收', '$'+DB.data.finance.revenue)}${Utils.invItem('總成本', '$'+DB.data.finance.cost)}</div>`, init: () => {} },
    tasks: { title: '工作排程', render: () => `<div class="glass-panel"><div class="panel-title">✅ 待辦</div><ul id="taskList" style="list-style:none;padding:0"></ul></div>`, init: () => { let h=''; DB.data.tasks.forEach(t=>h+=`<li class="list-item">${t.title}</li>`); document.getElementById('taskList').innerHTML=h; } },
    action_feed: { title: '餵食作業', render: () => `<div class="glass-panel"><div class="panel-title">🍬 餵食</div><select id="f_t" class="input-field"><option>白糖</option></select><input id="f_a" type="number" class="input-field" placeholder="數量"><input id="f_c" type="number" class="input-field" placeholder="成本"><button class="btn-main" onclick="SmartLogic.feed(getVal('f_t'),getVal('f_a'),getVal('f_c'))">確認</button></div>`, init:()=>{} },
    action_harvest: { title: '採收作業', render: () => `<div class="glass-panel"><div class="panel-title">🍯 採收</div><select id="h_t" class="input-field"><option>龍眼</option></select><input id="h_w" type="number" class="input-field" placeholder="kg"><input id="h_p" type="number" class="input-field" placeholder="單價"><button class="btn-main" style="background:var(--success)" onclick="SmartLogic.harvest(getVal('h_t'),getVal('h_w'),getVal('h_p'))">確認</button></div>`, init:()=>{} },
    settings: { title: '系統設定', render: () => `<div class="glass-panel"><button class="btn-main" style="background:var(--danger)" onclick="localStorage.clear();location.reload()">重置</button></div>`, init:()=>{} },
    esg: { title:'永續經營', render:()=>`<div class="glass-panel"><h3>🌍 ESG 貢獻</h3><p>授粉產值：$5M</p></div>`, init:()=>{} }
};

// --- Utils ---
const Utils = {
    invItem: (n,v,a=false) => `<div class="list-item"><span>${n}</span><span style="font-weight:bold; color:${a?'var(--danger)':'#fff'}">${v}</span></div>`,
    floraCard: (n,t,s1,s2,c) => `<div class="flora-card"><div class="flora-info"><h4 style="color:${c}">${n}</h4><p>${t}</p></div><div style="text-align:right"><div style="color:#FFD700">蜜 ${'⭐'.repeat(s1)}</div><div style="color:#FF9800">粉 ${'⭐'.repeat(s2)}</div></div></div>`,
    restoreData: () => { document.querySelectorAll('input').forEach(el=>{if(el.id){const v=localStorage.getItem('bee_val_'+el.id);if(v)el.value=v;}})}
};

function getVal(id) { return document.getElementById(id).value; }
const NotificationCenter = { toggle: () => { const p=document.getElementById('notifPanel'); p.classList.toggle('visible'); document.getElementById('overlay').classList.toggle('hidden', !p.classList.contains('visible')); let h=''; DB.data.notifications.forEach(n=>h+=`<div class="notif-alert">${n.msg}</div>`); document.getElementById('notifList').innerHTML=h||'<p style="color:#666;padding:10px">無新通知</p>'; } };
const QuickAction = { toggle: () => document.getElementById('quickSheet').classList.toggle('visible') };
const Log = { quick: (t) => { alert('已紀錄: '+t); QuickAction.toggle(); } };

document.addEventListener('DOMContentLoaded', () => System.init());
