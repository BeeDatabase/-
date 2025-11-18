/**
 * BEE EXPERT V33.0 - FULL CONTENT & OFFLINE READY
 */

// ================= 1. 資料庫 (DB) =================
const DB = {
    data: {
        inventory: { sugar: 50, acid: 500, bottles: 100, box: 108 },
        finance: { revenue: 150000, cost: 35000 }, // 模擬初始數據
        logs: [],
        tasks: [{ title: '全場檢查王台', done: false }, { title: '補充 B 區糖水', done: false }],
        crm: [{ name: '王大明', phone: '0912-xxx', note: '喜好龍眼蜜', total: 5000 }],
        notifications: [],
        // 法規狀態
        legal: { license: true, sgs: false, contract: true }
    },
    load: function() {
        const saved = localStorage.getItem('bee_db_v33');
        if(saved) this.data = JSON.parse(saved);
    },
    save: function() {
        localStorage.setItem('bee_db_v33', JSON.stringify(this.data));
        SmartLogic.checkAlerts();
    }
};

// ================= 2. 邏輯引擎 =================
const SmartLogic = {
    feed: function(type, amount, cost) {
        this.addLog('feed', `餵食 ${type} ${amount}`);
        if(type.includes('糖')) DB.data.inventory.sugar -= parseFloat(amount)*0.6;
        DB.data.finance.cost += parseFloat(cost);
        DB.save(); Router.go('dashboard'); alert('✅ 已紀錄並扣庫存');
    },
    harvest: function(type, weight, price) {
        const b = Math.ceil(weight / 0.7);
        this.addLog('harvest', `採收 ${type} ${weight}kg`);
        DB.data.inventory.bottles -= b;
        DB.data.finance.revenue += (weight * price);
        DB.save(); Router.go('dashboard'); alert(`🎉 營收 +$${weight*price}`);
    },
    addLog: function(type, msg) { DB.data.logs.unshift({ date: new Date().toLocaleDateString(), type, msg }); },
    checkAlerts: function() {
        DB.data.notifications = [];
        if(DB.data.inventory.sugar < 20) DB.data.notifications.push({msg:'⚠️ 白糖庫存低於 20kg'});
        const dot = document.getElementById('notifDot');
        if(dot) dot.classList.toggle('hidden', DB.data.notifications.length === 0);
    }
};

// ================= 3. 系統核心 =================
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
    startClock: () => document.getElementById('headerTemp').innerText = `晴朗 24°C`
};

// ================= 4. 路由與模組 =================
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
            return `<div class="grid-container"><div class="glass-panel" style="border-left:4px solid var(--primary)"><div class="panel-title"><span class="material-icons-round">monetization_on</span>本月淨利</div><div class="stat-value" style="color:${net>=0?'var(--success)':'var(--danger)'}">$${net.toLocaleString()}</div></div><div class="glass-panel"><div class="panel-title"><span class="material-icons-round">inventory_2</span>庫存</div><div style="display:flex;justify-content:space-between"><span>白糖</span><b>${DB.data.inventory.sugar}kg</b></div></div></div><div class="glass-panel"><div class="panel-title">📢 動態</div><div id="dashLogList"></div></div>`;
        },
        init: () => {
            let h=''; DB.data.logs.slice(0,5).forEach(l=>h+=`<div class="log-item"><small>${l.date}</small> ${l.msg}</div>`);
            document.getElementById('dashLogList').innerHTML = h || '<p style="color:#666">無紀錄</p>';
        }
    },
    map: { title: '蜂場地圖', render: () => `<div class="glass-panel"><div class="panel-title">🗺️ 全場監控</div><div id="hiveGrid" class="grid-auto"></div></div>`, init: () => { let h=''; for(let i=1;i<=DB.data.inventory.box;i++){ let c=i%10===0?'var(--danger)':'var(--success)'; h+=`<div onclick="HiveOS.open('A-${i}')" style="aspect-ratio:1;border:1px solid ${c};border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(255,255,255,0.05);cursor:pointer;">A-${i}</div>`; } document.getElementById('hiveGrid').innerHTML = h; } },
    tasks: { title: '工作排程', render: () => `<div class="glass-panel"><div class="panel-title">✅ 待辦</div><ul id="taskList" style="list-style:none;padding:0"></ul></div>`, init: () => { let h=''; DB.data.tasks.forEach(t=>h+=`<li class="list-item">${t.title}</li>`); document.getElementById('taskList').innerHTML=h; } },

    // --- B. 補完計畫：商業營運 ---
    finance: {
        title: '財務報表',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">💰 損益表 (P&L)</div>
                ${Utils.invItem('總營收', '$'+DB.data.finance.revenue.toLocaleString())}
                ${Utils.invItem('總成本', '$'+DB.data.finance.cost.toLocaleString())}
                <hr style="border-color:#333">
                <div style="text-align:right; font-size:1.5rem; color:var(--primary); font-weight:bold;">淨利 $${(DB.data.finance.revenue - DB.data.finance.cost).toLocaleString()}</div>
            </div>
            <div class="glass-panel">
                <div class="panel-title">📊 收支分析</div>
                <div style="height:200px"><canvas id="finChart"></canvas></div>
            </div>
        `,
        init: () => {
            const ctx = document.getElementById('finChart');
            if(ctx) new Chart(ctx.getContext('2d'), { type: 'doughnut', data: { labels: ['營收', '成本'], datasets: [{ data: [DB.data.finance.revenue, DB.data.finance.cost], backgroundColor: ['#00E676', '#FF1744'] }] } });
        }
    },
    logistics: {
        title: '轉場運輸',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🚚 貨車裝載計算</div>
                <div class="input-group"><label>車型</label><select class="input-field"><option>1.75 噸</option><option>3.5 噸</option></select></div>
                <div class="input-group"><label>箱數</label><input type="number" id="truckBox" class="input-field" oninput="Modules.logistics.calc()"></div>
                <div class="result-area" id="truckRes">---</div>
            </div>
            <div class="glass-panel">
                <div class="panel-title">🗺️ 路線</div>
                <div class="list-item"><span>南投線</span><small>路況優</small></div>
            </div>
        `,
        init: () => {},
        calc: () => { const n=document.getElementById('truckBox').value; if(n) document.getElementById('truckRes').innerHTML = `需堆疊：<b>${Math.ceil(n/12)} 層</b><br>總重：<b>${n*35} kg</b>`; }
    },

    // --- C. 補完計畫：環境與法規 ---
    science: {
        title: '環境氣象',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🌤️ 累積溫度 (GDD)</div>
                <p>目前累積：<b>1250 度日</b></p>
                <p>預測龍眼流蜜：<b>還需 15 天</b></p>
                <div style="background:#333; height:10px; border-radius:5px; margin-top:10px;"><div style="width:80%; height:100%; background:var(--primary); border-radius:5px;"></div></div>
            </div>
            <div class="glass-panel">
                <div class="panel-title">🌺 蜜源植物</div>
                ${Utils.floraCard('龍眼','3-4月',5,1)}
                ${Utils.floraCard('荔枝','2-3月',4,2)}
            </div>
        `,
        init: () => {}
    },
    compliance: {
        title: '法規合規',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">⚖️ 合規檢核</div>
                <label class="glass-btn"><input type="checkbox" checked> 養蜂登錄證</label>
                <label class="glass-btn"><input type="checkbox"> 農藥殘留檢驗</label>
                <label class="glass-btn"><input type="checkbox"> 產銷履歷 (TAP)</label>
            </div>
            <div class="glass-panel">
                <div class="panel-title">🚫 農藥殘留標準</div>
                <p>福化利：不得檢出</p>
                <p>四環黴素：不得檢出</p>
            </div>
        `,
        init: () => {}
    },
    land: { title:'場地管理', render:()=>`<div class="glass-panel"><div class="panel-title">🏞️ 租約</div><div class="list-item"><span>A場 (林先生)</span><small>租金20斤</small></div></div>`, init:()=>{} },

    // --- D. 補完計畫：永續與風險 ---
    risk: { title:'風險管理', render:()=>`<div class="glass-panel"><div class="panel-title">🛑 預警</div><div class="list-item" style="border-left:3px solid var(--danger)"><span>農藥噴灑</span><small>明日</small></div></div>`, init:()=>{} },
    esg: { title:'永續經營', render:()=>`<div class="glass-panel"><div class="panel-title">🌍 ESG</div><p>授粉產值：$5M</p></div>`, init:()=>{} },

    // --- E. 原有功能 ---
    breeding: { title:'育王管理', render:()=>`<div class="glass-panel"><label>移蟲日</label><input type="date" class="input-field"></div>`, init:()=>{} },
    health: { title:'病害防治', render:()=>`<div class="glass-panel"><label>草酸配比</label><input type="number" class="input-field" placeholder="箱數"></div>`, init:()=>{} },
    production: { title:'生產紀錄', render:()=>`<div class="glass-panel"><button class="btn-main">生成批號</button></div>`, init:()=>{} },
    inventory: { title:'資材庫存', render:()=>`<div class="glass-panel">${Utils.invItem('白糖',DB.data.inventory.sugar+'kg')}</div>`, init:()=>{} },
    crm: { title:'客戶訂單', render:()=>`<div class="glass-panel"><div id="crmList"></div></div>`, init:()=>{ let h=''; DB.data.crm.forEach(c=>h+=`<div class="list-item"><span>${c.name}</span><b>$${c.total}</b></div>`); document.getElementById('crmList').innerHTML=h; } },
    settings: { title:'系統設定', render:()=>`<div class="glass-panel"><button class="btn-main" style="background:var(--danger)" onclick="localStorage.clear();location.reload()">重置</button></div>`, init:()=>{} },
    
    // --- Actions ---
    action_feed: { title:'餵食', render:()=>`<div class="glass-panel"><select id="f_t" class="input-field"><option>白糖</option></select><input id="f_a" type="number" class="input-field" placeholder="數"><input id="f_c" type="number" class="input-field" placeholder="本"><button class="btn-main" onclick="SmartLogic.feed(getVal('f_t'),getVal('f_a'),getVal('f_c'))">確認</button></div>`, init:()=>{} },
    action_harvest: { title:'採收', render:()=>`<div class="glass-panel"><select id="h_t" class="input-field"><option>龍眼</option></select><input id="h_w" type="number" class="input-field" placeholder="kg"><input id="h_p" type="number" class="input-field" placeholder="$"><button class="btn-main" onclick="SmartLogic.harvest(getVal('h_t'),getVal('h_w'),getVal('h_p'))">確認</button></div>`, init:()=>{} },
    flora: { title: '蜜源植物', render: () => `<div class="glass-panel">${Utils.floraCard('龍眼','3-4月',5,1)}${Utils.floraCard('荔枝','2-3月',4,2)}${Utils.floraCard('咸豐草','全年',3,5)}</div>`, init:()=>{} }
};

// --- Utils & HiveOS ---
const Utils = {
    invItem: (n,v) => `<div class="list-item"><span>${n}</span><span style="font-weight:bold; color:#fff">${v}</span></div>`,
    floraCard: (n,t,s1,s2) => `<div class="flora-card"><div class="flora-info"><h4>${n}</h4><p>${t}</p></div><div style="text-align:right"><div style="color:#FFD700">蜜 ${'⭐'.repeat(s1)}</div><div style="color:#FF9800">粉 ${'⭐'.repeat(s2)}</div></div></div>`,
    restoreData: () => {}
};
const HiveOS = {
    open: (id) => { document.getElementById('hiveModal').classList.remove('hidden'); document.getElementById('modalTitle').innerText=`📦 ${id}`; document.getElementById('hive-tab-content').innerHTML=`<div class="input-group"><label>蜂量</label><input type="range" max="10" class="input-field"></div>`; },
    close: () => document.getElementById('hiveModal').classList.add('hidden'),
    switch: () => {}, save: () => { alert('已儲存'); HiveOS.close(); }
};
function getVal(id) { return document.getElementById(id).value; }
const NotificationCenter = { toggle: () => { const p=document.getElementById('notifPanel'); p.classList.toggle('visible'); document.getElementById('overlay').classList.toggle('hidden',!p.classList.contains('visible')); let h=''; DB.data.notifications.forEach(n=>h+=`<div class="notif-alert">${n.msg}</div>`); document.getElementById('notifList').innerHTML=h||'無通知'; } };
const QuickAction = { toggle: () => document.getElementById('quickSheet').classList.toggle('visible') };
const Log = { quick: (t) => { alert('已紀錄: '+t); QuickAction.toggle(); } };

document.addEventListener('DOMContentLoaded', () => System.init());
