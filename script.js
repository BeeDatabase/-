/**
 * BEE EXPERT V32.0 - DATA BINDING & VISUALIZATION
 * Real-time charts, interactive map, and calendar.
 */

// ================= 1. 資料庫 (DB) =================
const DB = {
    data: {
        // 庫存
        inventory: { sugar: 50, acid: 500, bottles: 100, box: 108 },
        // 財務
        finance: { revenue: 0, cost: 0 },
        // 日誌 (模擬一些初始數據讓圖表好看)
        logs: [
            { date: '2025/10/01', type: 'harvest', msg: '採收 龍眼蜜 150kg', val: 150 },
            { date: '2025/10/15', type: 'harvest', msg: '採收 百花蜜 80kg', val: 80 }
        ],
        // 蜂箱狀態 (A-1 ~ A-108)
        hives: {}, 
        // 待辦事項
        tasks: [
            { date: '2025-11-20', title: '全場檢查王台', done: false },
            { date: '2025-11-22', title: '補充 B 區糖水', done: false }
        ],
        // CRM 客戶
        crm: [
            { name: '王大明', phone: '0912-345678', note: 'VIP 客戶', total: 5000 },
            { name: '陳小姐', phone: '0988-123456', note: '只買蜂王乳', total: 12000 }
        ],
        notifications: []
    },
    
    // 初始化蜂箱數據 (如果沒有的話)
    initHives: function() {
        if(Object.keys(this.data.hives).length === 0) {
            for(let i=1; i<=108; i++) {
                this.data.hives[`A-${i}`] = { status: 'normal', beeAmt: 5, queen: 'old' };
            }
        }
    },

    load: function() {
        const saved = localStorage.getItem('bee_db_v32');
        if(saved) this.data = JSON.parse(saved);
        this.initHives(); // 確保蜂箱有資料
    },
    save: function() {
        localStorage.setItem('bee_db_v32', JSON.stringify(this.data));
        SmartLogic.checkAlerts();
    }
};

// ================= 2. 智慧邏輯 (Smart Logic) =================
const SmartLogic = {
    feed: function(type, amount, cost) {
        this.addLog('feed', `餵食 ${type} ${amount}`, 0);
        if(type === '白糖') DB.data.inventory.sugar -= parseFloat(amount);
        DB.data.finance.cost += parseFloat(cost);
        DB.save(); 
        alert(`✅ 餵食紀錄完成！\n📉 庫存 -${amount}\n💰 成本 +$${cost}`);
        Router.go('dashboard');
    },
    
    harvest: function(type, weight, price) {
        const bottles = Math.ceil(weight / 0.7);
        this.addLog('harvest', `採收 ${type} ${weight}kg`, weight);
        
        DB.data.inventory.bottles -= bottles;
        DB.data.finance.revenue += (weight * price);
        
        DB.save(); 
        alert(`🎉 豐收紀錄完成！\n📊 圖表已更新\n💰 營收 +$${weight*price}`);
        Router.go('dashboard');
    },
    
    addLog: function(type, msg, val) {
        const d = new Date();
        const dateStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
        DB.data.logs.unshift({ date: dateStr, type, msg, val: parseFloat(val)||0 });
    },
    
    checkAlerts: function() {
        DB.data.notifications = [];
        if(DB.data.inventory.sugar < 20) DB.data.notifications.push({msg:'⚠️ 白糖庫存低於 20kg'});
        if(DB.data.inventory.bottles < 50) DB.data.notifications.push({msg:'⚠️ 玻璃瓶庫存緊張'});
        
        const dot = document.getElementById('notifDot');
        if(dot) dot.classList.toggle('hidden', DB.data.notifications.length === 0);
    }
};

// ================= 3. 單箱系統 (HiveOS - 地圖連動版) =================
const HiveOS = {
    currentId: null,
    open: function(id) {
        this.currentId = id;
        const data = DB.data.hives[id];
        document.getElementById('hiveModal').classList.remove('hidden');
        document.getElementById('modalTitle').innerText = `📦 ${id} 蜂箱管理`;
        
        // 根據儲存的狀態顯示
        this.renderStatus(data);
        this.switch('check');
    },
    
    renderStatus: function(data) {
        // 更新標籤顏色
        const statusMap = { 'strong': 'green', 'normal': 'yellow', 'weak': 'red' };
        const color = statusMap[data.status] || 'yellow';
        // 這裡可以做更細緻的 UI 更新
    },

    close: function() { document.getElementById('hiveModal').classList.add('hidden'); },
    
    switch: function(tab) {
        const c = document.getElementById('hive-tab-content');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        
        const data = DB.data.hives[this.currentId];
        
        if(tab === 'check') {
            c.innerHTML = `
                <div class="input-group">
                    <label>群勢評估</label>
                    <select id="h_status" class="input-field" onchange="HiveOS.updateTemp('status', this.value)">
                        <option value="strong" ${data.status==='strong'?'selected':''}>🟢 強群 (9框+)</option>
                        <option value="normal" ${data.status==='normal'?'selected':''}>🟡 標準 (5-8框)</option>
                        <option value="weak" ${data.status==='weak'?'selected':''}>🔴 弱/病群 (<4框)</option>
                    </select>
                </div>
                <div class="input-group"><label>蜂量 (框)</label><input type="range" min="0" max="10" step="0.5" class="input-field" value="${data.beeAmt}" oninput="this.nextElementSibling.innerText=this.value; HiveOS.updateTemp('beeAmt', this.value)"><span style="float:right">${data.beeAmt}</span></div>
                <div class="grid-2">
                    <label class="glass-btn"><input type="checkbox"> 見王</label>
                    <label class="glass-btn"><input type="checkbox"> 王台</label>
                </div>`;
        } else if(tab === 'feed') {
            c.innerHTML = `<div class="input-group"><select class="input-field"><option>1:1 糖水</option><option>花粉餅</option></select></div><div class="input-group"><input type="number" class="input-field" placeholder="數量 (ml/片)"></div>`;
        } else {
            c.innerHTML = `<p style="color:#666; text-align:center; padding:20px;">歷史紀錄讀取中...</p>`;
        }
    },
    
    updateTemp: function(key, val) {
        DB.data.hives[this.currentId][key] = val;
    },

    save: function() { 
        DB.save(); // 儲存所有變更
        alert(`✅ ${this.currentId} 狀態已更新`); 
        Modules.map.init(); // 重新繪製地圖顏色
        this.close(); 
    }
};

// ================= 4. 系統核心 =================
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

// ================= 5. 路由與模組 =================
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
            } else {
                c.innerHTML = `<div class="glass-panel" style="text-align:center;"><h3>模組載入錯誤</h3></div>`;
            }
            c.style.opacity = 1;
        }, 200);
        if(window.innerWidth <= 1024) System.closeAllOverlays();
        localStorage.setItem('bee_last_page', p);
    }
};

// --- 模組內容 (V32.0 升級版) ---
const Modules = {
    dashboard: {
        title: '營運總覽',
        render: () => {
            const profit = DB.data.finance.revenue - DB.data.finance.cost;
            return `
            <div class="grid-container">
                <div class="glass-panel" style="border-left:4px solid var(--primary)">
                    <div class="panel-title"><span class="material-icons-round">monetization_on</span>本月淨利</div>
                    <div class="stat-value" style="color:${profit>=0?'var(--success)':'var(--danger)'}">$${profit.toLocaleString()}</div>
                    <div class="stat-trend">營收 $${DB.data.finance.revenue} | 成本 $${DB.data.finance.cost}</div>
                </div>
                <div class="glass-panel">
                    <div class="panel-title"><span class="material-icons-round">inventory_2</span>庫存警示</div>
                    <div style="display:flex; justify-content:space-between"><span>白糖</span><b style="color:${DB.data.inventory.sugar<20?'var(--danger)':'#fff'}">${DB.data.inventory.sugar} kg</b></div>
                </div>
            </div>
            <div class="glass-panel">
                <div class="panel-title">📊 真實產量趨勢 (Data Driven)</div>
                <div style="height:250px"><canvas id="dashChart"></canvas></div>
            </div>
            <div class="glass-panel"><div class="panel-title">📢 最新日誌</div><div id="dashLogList"></div></div>`;
        },
        init: () => {
            // 1. 渲染日誌列表
            let h = ''; DB.data.logs.slice(0,5).forEach(l=>h+=`<div class="log-item"><small>${l.date}</small> ${l.msg}</div>`);
            document.getElementById('dashLogList').innerHTML = h || '<p style="color:#666">無紀錄</p>';
            
            // 2. 渲染真實動態圖表 (讀取 logs 中的 harvest 資料)
            const ctx = document.getElementById('dashChart');
            if(ctx) {
                // 簡單資料處理：抓取所有 harvest 類型的紀錄
                const harvestLogs = DB.data.logs.filter(l => l.type === 'harvest').reverse(); // 反轉讓日期從舊到新
                const labels = harvestLogs.map(l => l.date);
                const data = harvestLogs.map(l => l.val);

                new Chart(ctx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: labels.length ? labels : ['無數據'],
                        datasets: [{
                            label: '蜂蜜產量 (kg)',
                            data: data.length ? data : [0],
                            borderColor: '#FFD700',
                            backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        }
    },
    
    map: {
        title: '蜂場地圖 (Live Map)',
        render: () => `<div class="glass-panel"><div class="panel-title">🗺️ 點擊格子管理單箱</div><div id="hiveGrid" class="grid-auto"></div></div>`,
        init: () => {
            let html = '';
            const hives = DB.data.hives;
            // 根據 DB 中的狀態渲染顏色
            for(let i=1; i<=DB.data.inventory.box; i++) {
                const id = `A-${i}`;
                const status = hives[id] ? hives[id].status : 'normal';
                
                let color = 'var(--warning)'; // normal
                if(status === 'strong') color = 'var(--success)';
                if(status === 'weak') color = 'var(--danger)';
                
                html += `<div onclick="HiveOS.open('${id}')" style="aspect-ratio:1; border:1px solid ${color}; color:${color}; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; background:rgba(255,255,255,0.05); cursor:pointer;">${id}</div>`;
            }
            document.getElementById('hiveGrid').innerHTML = html;
        }
    },
    
    tasks: {
        title: '工作排程 (Calendar)',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">📅 本月工作月曆</div>
                <div class="grid-container" id="calendarView" style="grid-template-columns: repeat(7, 1fr); text-align:center; gap:5px;">
                    </div>
            </div>
            <div class="glass-panel">
                <div class="panel-title">✅ 待辦清單</div>
                <div class="input-group"><input type="text" id="newTask" class="input-field" placeholder="新增事項..."><button class="btn-main" onclick="Modules.tasks.add()">+</button></div>
                <ul id="taskList" style="list-style:none;padding:0"></ul>
            </div>
        `,
        init: () => {
            // 1. 渲染待辦清單
            let h=''; DB.data.tasks.forEach((t,i)=>h+=`<li class="list-item"><label><input type="checkbox" ${t.done?'checked':''} onchange="Modules.tasks.toggle(${i})"> ${t.title}</label></li>`);
            document.getElementById('taskList').innerHTML=h;
            
            // 2. 渲染簡單月曆 (模擬本月)
            const cal = document.getElementById('calendarView');
            let calHtml = '<div style="color:#888">日</div><div style="color:#888">一</div><div style="color:#888">二</div><div style="color:#888">三</div><div style="color:#888">四</div><div style="color:#888">五</div><div style="color:#888">六</div>';
            for(let i=1; i<=30; i++) {
                let hasTask = DB.data.tasks.some(t => t.date && t.date.endsWith(i)); // 簡單模擬匹配日期
                let bg = hasTask ? 'var(--primary)' : 'transparent';
                let color = hasTask ? '#000' : '#ccc';
                calHtml += `<div style="padding:10px; background:${bg}; color:${color}; border-radius:50%;">${i}</div>`;
            }
            cal.innerHTML = calHtml;
        },
        add: () => { const v=document.getElementById('newTask').value; if(v){ DB.data.tasks.push({title:v, done:false, date: new Date().toISOString().split('T')[0]}); DB.save(); Modules.tasks.init(); } },
        toggle: (i) => { DB.data.tasks[i].done=!DB.data.tasks[i].done; DB.save(); }
    },

    // --- 其他模組 (維持 V31.0 完整內容) ---
    flora: { title: '蜜源植物', render: () => `<div class="glass-panel">${Utils.floraCard('龍眼','3-4月',5,1)}${Utils.floraCard('荔枝','2-3月',4,2)}${Utils.floraCard('咸豐草','全年',3,5)}${Utils.floraCard('鴨腳木','11-1月',4,4)}</div>`, init:()=>{} },
    breeding: { title: '育王管理', render: () => `<div class="glass-panel"><label>移蟲日</label><input type="date" id="breedDate" class="input-field"><button class="btn-main" onclick="Modules.breeding.calc()">計算</button><div id="breedRes" class="hidden"></div></div>`, init:()=>{}, calc:()=>{ const d=new Date(document.getElementById('breedDate').value); if(!isNaN(d)) { const f=n=>new Date(d.getTime()+n*86400000).toLocaleDateString(); document.getElementById('breedRes').classList.remove('hidden'); document.getElementById('breedRes').innerHTML=`<p>封蓋：${f(5)}</p><p style="color:var(--danger)">出台：${f(12)}</p>`; } } },
    inventory: { title: '資材庫存', render: () => `<div class="glass-panel">${Utils.invItem('白糖',DB.data.inventory.sugar+'kg')}${Utils.invItem('瓶子',DB.data.inventory.bottles+'支')}</div>`, init:()=>{} },
    crm: { title: '客戶訂單', render: () => `<div class="glass-panel"><div id="crmList"></div></div>`, init:()=>{ let h=''; DB.data.crm.forEach(c=>h+=`<div class="list-item"><span>${c.name}</span><b>$${c.total}</b></div>`); document.getElementById('crmList').innerHTML=h; } },
    action_feed: { title: '餵食作業', render: () => `<div class="glass-panel"><div class="panel-title">🍬 餵食</div><select id="f_t" class="input-field"><option>白糖</option><option>花粉</option></select><input id="f_a" type="number" class="input-field" placeholder="數量"><input id="f_c" type="number" class="input-field" placeholder="成本"><button class="btn-main" onclick="SmartLogic.feed(getVal('f_t'),getVal('f_a'),getVal('f_c'))">確認</button></div>`, init:()=>{} },
    action_harvest: { title: '採收作業', render: () => `<div class="glass-panel"><div class="panel-title">🍯 採收</div><select id="h_t" class="input-field"><option>龍眼蜜</option><option>百花蜜</option></select><input id="h_w" type="number" class="input-field" placeholder="kg"><input id="h_p" type="number" class="input-field" placeholder="單價"><button class="btn-main" style="background:var(--success)" onclick="SmartLogic.harvest(getVal('h_t'),getVal('h_w'),getVal('h_p'))">確認</button></div>`, init:()=>{} },
    settings: { title: '系統設定', render: () => `<div class="glass-panel"><button class="btn-main" style="background:var(--danger)" onclick="localStorage.clear();location.reload()">重置系統</button></div>`, init:()=>{} },
    finance: { title:'財務報表', render:()=>Utils.placeholder('損益表'), init:()=>{} },
    logistics: { title:'轉場運輸', render:()=>Utils.placeholder('裝載計算'), init:()=>{} },
    science: { title:'環境氣象', render:()=>Utils.placeholder('氣象API'), init:()=>{} },
    land: { title:'場地管理', render:()=>Utils.placeholder('租約管理'), init:()=>{} },
    compliance: { title:'法規合規', render:()=>Utils.placeholder('登錄證'), init:()=>{} },
    risk: { title:'風險管理', render:()=>Utils.placeholder('農藥地圖'), init:()=>{} },
    esg: { title:'永續經營', render:()=>Utils.placeholder('碳足跡'), init:()=>{} },
    health: { title:'病害防治', render:()=>Utils.placeholder('草酸計算'), init:()=>{} },
    production: { title:'生產紀錄', render:()=>Utils.placeholder('批號管理'), init:()=>{} }
};

// --- Utils ---
const Utils = {
    placeholder: (t) => `<div class="glass-panel" style="text-align:center; padding:40px; color:#666"><h3>${t}</h3></div>`,
    invItem: (n,v,a=false) => `<div class="list-item"><span>${n}</span><span style="font-weight:bold; color:${a?'var(--danger)':'#fff'}">${v}</span></div>`,
    floraCard: (n,t,s1,s2) => `<div class="flora-card"><div class="flora-info"><h4>${n}</h4><p>${t}</p></div><div style="text-align:right"><div style="color:#FFD700">蜜 ${'⭐'.repeat(s1)}</div><div style="color:#FF9800">粉 ${'⭐'.repeat(s2)}</div></div></div>`,
    restoreData: () => { document.querySelectorAll('input').forEach(el=>{if(el.id){const v=localStorage.getItem('bee_val_'+el.id);if(v)el.value=v;}})}
};

function getVal(id) { return document.getElementById(id).value; }
const NotificationCenter = { toggle: () => { const p=document.getElementById('notifPanel'); p.classList.toggle('visible'); document.getElementById('overlay').classList.toggle('hidden', !p.classList.contains('visible')); let h=''; DB.data.notifications.forEach(n=>h+=`<div class="notif-alert">${n.msg}</div>`); document.getElementById('notifList').innerHTML=h||'<p style="color:#666;padding:10px">無新通知</p>'; } };
const QuickAction = { toggle: () => document.getElementById('quickSheet').classList.toggle('visible') };
const Log = { quick: (t) => { alert('已紀錄: '+t); QuickAction.toggle(); } };

document.addEventListener('DOMContentLoaded', () => System.init());
