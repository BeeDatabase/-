/**
 * BEE EXPERT V29.0 - INTEGRATED SYSTEM
 */

// ================= 1. 資料庫與連動 =================
const DB = {
    data: {
        inventory: { sugar: 50, acid: 500, bottles: 100, box: 108 },
        finance: { revenue: 0, cost: 0 },
        logs: [],
        crm: [
            { name: '王大明', phone: '0912-345678', note: '喜好龍眼蜜', total: 5000 },
            { name: '陳小姐', phone: '0988-123456', note: '只買蜂王乳', total: 12000 }
        ],
        tasks: [
            { id: 1, title: '全場檢查王台', done: false },
            { id: 2, title: '補充B區糖水', done: false }
        ],
        notifications: []
    },
    load: function() {
        const saved = localStorage.getItem('bee_db_v29');
        if(saved) this.data = JSON.parse(saved);
    },
    save: function() {
        localStorage.setItem('bee_db_v29', JSON.stringify(this.data));
        SmartLogic.checkAlerts();
    }
};

const SmartLogic = {
    feed: function(type, amount, cost) {
        const logMsg = `餵食 ${type} ${amount}`;
        this.addLog('feed', logMsg);
        if(type === '白糖') DB.data.inventory.sugar -= parseFloat(amount);
        DB.data.finance.cost += parseFloat(cost);
        DB.save();
        Router.go('dashboard');
        alert(`✅ 已扣除庫存並記入成本 $${cost}`);
    },
    harvest: function(type, weight, price) {
        const bottles = Math.ceil(weight / 0.7);
        this.addLog('harvest', `採收 ${type} ${weight}kg`);
        DB.data.inventory.bottles -= bottles;
        DB.data.finance.revenue += (weight * price);
        DB.save();
        Router.go('dashboard');
        alert(`🎉 營收增加 $${weight*price}，扣除瓶子 ${bottles}支`);
    },
    addLog: function(type, msg) {
        const date = new Date().toLocaleDateString();
        DB.data.logs.unshift({ date, type, msg });
    },
    checkAlerts: function() {
        DB.data.notifications = [];
        if(DB.data.inventory.sugar < 20) DB.data.notifications.push({type:'alert', msg:'⚠️ 白糖庫存低於 20kg'});
        if(DB.data.inventory.bottles < 50) DB.data.notifications.push({type:'alert', msg:'⚠️ 玻璃瓶庫存緊張'});
        const dot = document.getElementById('notifDot');
        if(dot) dot.classList.toggle('hidden', DB.data.notifications.length === 0);
    }
};

// ================= 2. 單箱系統 (HiveOS) =================
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
            c.innerHTML = `<div class="input-group"><label>蜂量</label><input type="range" min="0" max="10" step="0.5" class="input-field" oninput="this.nextElementSibling.innerText=this.value"><span style="float:right">5</span></div><div class="grid-2"><label class="glass-btn"><input type="checkbox"> 見王</label><label class="glass-btn"><input type="checkbox"> 王台</label></div>`;
        } else if(tab === 'feed') {
            c.innerHTML = `<div class="input-group"><select class="input-field"><option>1:1 糖水</option><option>花粉餅</option></select></div><div class="input-group"><input type="number" class="input-field" placeholder="數量"></div>`;
        } else {
            c.innerHTML = `<p style="color:#666; text-align:center; padding:20px;">無紀錄</p>`;
        }
    },
    save: function() { alert(`✅ 已儲存 ${this.currentId}`); this.close(); }
};

// ================= 3. 系統核心 =================
const System = {
    init: function() {
        DB.load();
        setTimeout(() => {
            const s = document.getElementById('splashScreen');
            if(s) { s.style.opacity='0'; setTimeout(()=>s.style.display='none',500); }
        }, 1500);
        Router.go(localStorage.getItem('bee_last_page') || 'dashboard');
        this.startClock();
        this.initAutoSave();
        SmartLogic.checkAlerts();
    },
    toggleSidebar: () => { document.querySelector('.sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('hidden'); },
    closeAllOverlays: () => { document.querySelector('.sidebar').classList.remove('open'); document.getElementById('overlay').classList.add('hidden'); document.getElementById('quickSheet').classList.remove('visible'); document.getElementById('notifPanel').classList.remove('visible'); HiveOS.close(); },
    toggleTheme: () => alert("預設專業深色模式"),
    toggleFullScreen: () => { if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); },
    startClock: () => {
        const w = ['晴朗','多雲','陰天']; document.getElementById('headerTemp').innerText = `${w[Math.floor(Math.random()*3)]} 24°C`;
    },
    initAutoSave: () => {
        document.getElementById('app-content').addEventListener('change', (e)=>{ if(e.target.id) localStorage.setItem('bee_val_'+e.target.id, e.target.value); });
    }
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
                t.innerText = Modules[p].title;
                if(Modules[p].init) Modules[p].init();
                Utils.restoreData();
            } else {
                c.innerHTML = Utils.placeholder(p);
            }
            c.style.opacity = 1;
        }, 200);
        if(window.innerWidth <= 1024) System.closeAllOverlays();
        localStorage.setItem('bee_last_page', p);
    }
};

const Modules = {
    dashboard: {
        title: '營運總覽',
        render: () => {
            const profit = DB.data.finance.revenue - DB.data.finance.cost;
            return `<div class="grid-container"><div class="glass-panel" style="border-left:4px solid var(--primary)"><div class="panel-title"><span class="material-icons-round">monetization_on</span>本月淨利</div><div class="stat-value" style="color:${profit>=0?'var(--success)':'var(--danger)'}">$${profit.toLocaleString()}</div></div><div class="glass-panel"><div class="panel-title"><span class="material-icons-round">inventory_2</span>庫存</div><div style="display:flex; justify-content:space-between"><span>白糖</span><b>${DB.data.inventory.sugar} kg</b></div></div></div><div class="glass-panel"><div class="panel-title">📢 最新動態</div><div id="dashLogList"></div></div>`;
        },
        init: () => {
            const l = document.getElementById('dashLogList');
            let h = ''; DB.data.logs.slice(0,5).forEach(log=>h+=`<div class="log-item"><small>${log.date}</small> ${log.msg}</div>`);
            l.innerHTML = h || '<p style="color:#666">無紀錄</p>';
        }
    },
    map: {
        title: '蜂場地圖',
        render: () => `<div class="glass-panel"><div class="panel-title">🗺️ 點擊格子管理單箱</div><div id="hiveGrid" class="grid-auto"></div></div>`,
        init: () => {
            let h=''; for(let i=1;i<=DB.data.inventory.box;i++) { let c=i%10===0?'var(--danger)':'var(--success)'; h+=`<div onclick="HiveOS.open('A-${i}')" style="aspect-ratio:1; border:1px solid ${c}; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; background:rgba(255,255,255,0.05); cursor:pointer;">A-${i}</div>`; }
            document.getElementById('hiveGrid').innerHTML = h;
        }
    },
    flora: {
        title: '蜜源植物圖鑑',
        render: () => `<div class="glass-panel"><div class="panel-title">🌺 台灣蜜粉源</div>${Utils.floraCard('龍眼','3-4月',5,1)}${Utils.floraCard('荔枝','2-3月',4,2)}${Utils.floraCard('咸豐草','全年',3,5)}${Utils.floraCard('鴨腳木','11-1月',4,4)}</div>`,
        init: () => {}
    },
    breeding: {
        title: '育王管理',
        render: () => `<div class="glass-panel"><div class="panel-title">🧬 育王計算</div><label>移蟲日</label><input type="date" id="breedDate" class="input-field"><button class="btn-main" onclick="Modules.breeding.calc()">計算</button><div id="breedRes" class="result-area hidden"></div></div>`,
        init: () => {},
        calc: () => {
            const d = new Date(document.getElementById('breedDate').value);
            if(!isNaN(d)) {
                const f = n => new Date(d.getTime()+n*86400000).toLocaleDateString();
                document.getElementById('breedRes').classList.remove('hidden');
                document.getElementById('breedRes').innerHTML = `<p>封蓋：${f(5)}</p><p style="color:var(--danger)">出台：${f(12)}</p>`;
            }
        }
    },
    inventory: { title: '資材庫存', render: () => `<div class="glass-panel"><div class="panel-title">📦 庫存</div>${Utils.invItem('白糖',DB.data.inventory.sugar+'kg')}${Utils.invItem('瓶子',DB.data.inventory.bottles+'支')}</div>`, init: () => {} },
    tasks: { title: '工作排程', render: () => `<div class="glass-panel"><div class="panel-title">✅ 待辦</div><ul id="taskList" style="list-style:none;padding:0"></ul></div>`, init: () => { let h=''; DB.data.tasks.forEach(t=>h+=`<li class="list-item">${t.title}</li>`); document.getElementById('taskList').innerHTML=h; } },
    crm: { title: '客戶訂單', render: () => `<div class="glass-panel"><div class="panel-title">👥 客戶</div><div id="crmList"></div></div>`, init: () => { let h=''; DB.data.crm.forEach(c=>h+=`<div class="list-item"><span>${c.name}</span><b>$${c.total}</b></div>`); document.getElementById('crmList').innerHTML=h; } },
    action_feed: { title: '餵食作業', render: () => `<div class="glass-panel"><div class="panel-title">🍬 餵食</div><input id="f_type" class="input-field" value="白糖"><input id="f_amt" type="number" class="input-field" placeholder="數量"><input id="f_cost" type="number" class="input-field" placeholder="成本"><button class="btn-main" onclick="SmartLogic.feed(getVal('f_type'), getVal('f_amt'), getVal('f_cost'))">確認</button></div>`, init: () => {} },
    action_harvest: { title: '採收作業', render: () => `<div class="glass-panel"><div class="panel-title">🍯 採收</div><input id="h_type" class="input-field" value="龍眼蜜"><input id="h_w" type="number" class="input-field" placeholder="公斤"><input id="h_p" type="number" class="input-field" placeholder="單價"><button class="btn-main" style="background:var(--success)" onclick="SmartLogic.harvest(getVal('h_type'), getVal('h_w'), getVal('h_p'))">確認</button></div>`, init: () => {} },
    settings: { title: '系統設定', render: () => `<div class="glass-panel"><button class="btn-main" style="background:var(--danger)" onclick="localStorage.clear();location.reload()">重置系統</button></div>`, init: () => {} },
    // Placeholders
    finance: { title:'財務報表', render:()=>Utils.placeholder('損益表'), init:()=>{} },
    logistics: { title:'轉場運輸', render:()=>Utils.placeholder('車輛裝載'), init:()=>{} },
    science: { title:'環境氣象', render:()=>Utils.placeholder('氣象API'), init:()=>{} },
    land: { title:'場地管理', render:()=>Utils.placeholder('租約管理'), init:()=>{} },
    compliance: { title:'法規合規', render:()=>Utils.placeholder('登錄證'), init:()=>{} },
    risk: { title:'風險管理', render:()=>Utils.placeholder('農藥地圖'), init:()=>{} },
    esg: { title:'永續經營', render:()=>Utils.placeholder('碳足跡'), init:()=>{} },
    health: { title:'病害防治', render:()=>Utils.placeholder('草酸計算'), init:()=>{} },
    production: { title:'生產紀錄', render:()=>Utils.placeholder('批號管理'), init:()=>{} }
};

const Utils = {
    placeholder: (t) => `<div class="glass-panel" style="text-align:center; padding:40px; color:#666"><h3>${t} 建置中</h3></div>`,
    invItem: (n,v) => `<div class="list-item"><span>${n}</span><span style="font-weight:bold; color:#fff">${v}</span></div>`,
    floraCard: (n,t,s1,s2) => `<div class="flora-card"><div class="flora-info"><h4>${n}</h4><p>${t}</p></div><div style="text-align:right"><div style="color:#FFD700">蜜 ${'⭐'.repeat(s1)}</div><div style="color:#FF9800">粉 ${'⭐'.repeat(s2)}</div></div></div>`,
    restoreData: () => { document.querySelectorAll('input').forEach(el=>{if(el.id){const v=localStorage.getItem('bee_val_'+el.id);if(v)el.value=v;}})}
};

function getVal(id) { return document.getElementById(id).value; }
const NotificationCenter = { toggle: () => { const p=document.getElementById('notifPanel'); p.classList.toggle('visible'); document.getElementById('overlay').classList.toggle('hidden', !p.classList.contains('visible')); let h=''; DB.data.notifications.forEach(n=>h+=`<div class="notif-alert">${n.msg}</div>`); document.getElementById('notifList').innerHTML=h||'<p style="color:#666;padding:10px">無新通知</p>'; } };
const QuickAction = { toggle: () => document.getElementById('quickSheet').classList.toggle('visible') };
const Log = { quick: (t) => { alert('已紀錄: '+t); QuickAction.toggle(); } };

document.addEventListener('DOMContentLoaded', () => System.init());
