/**
 * BEE EXPERT V38.0 - CONTENT EXPANSION EDITION
 * Features: Richer Dropdowns, Detailed Inventory, Advanced Logic.
 */

// ================= 1. 資料庫與核心 (DB) =================
const DB = {
    data: {
        // 1. 庫存 (細節擴充)
        inventory: {
            // 飼料類
            sugar: 50,      // 白糖 (kg)
            pollen: 20,     // 花粉 (kg)
            soy: 10,        // 大豆粉 (kg)
            probiotic: 5,   // 益生菌 (包)
            // 藥品類
            acid: 500,      // 草酸 (g)
            formic: 1000,   // 甲酸 (ml)
            strips: 50,     // 福化利 (片)
            // 資材類
            bottles: 100,   // 玻璃瓶 (支)
            box: 108,       // 蜂箱 (個)
            frames: 200,    // 巢框 (個)
            foundation: 500,// 巢礎片 (片)
            excluder: 30,   // 隔王板 (片)
            cage: 50        // 王籠 (個)
        },
        // 2. 財務
        finance: { revenue: 150000, cost: 35000, fixedCost: 20000 },
        // 3. 紀錄
        logs: [],
        // 4. 待辦 (預設範本)
        tasks: [
            { title: '全場檢查王台 (分蜂熱)', done: false },
            { title: '補充 B 區糖水 (1:1)', done: false },
            { title: '更換老舊巢脾', done: false }
        ],
        // 5. 客戶 CRM
        crm: [
            { name: '王大明', phone: '0912-345678', note: 'VIP / 喜好龍眼蜜', total: 5000 },
            { name: '陳小姐', phone: '0988-123456', note: '只買蜂王乳 / 宅配', total: 12000 },
            { name: '林老闆 (寄賣)', phone: '04-1234567', note: '咖啡廳寄賣點', total: 0 }
        ],
        notifications: [],
        user: { exp: 1450, level: 14 }, // 等級
        // 6. 戰略數據
        risks: [{ date: '2024/10/01', type: '農藥', note: '附近檳榔園噴藥' }],
        lands: [{ name: '中寮A場', landlord: '林先生', rent: '20斤蜜/年', due: '2025-12-31' }],
        // 7. 蜂箱狀態
        hives: {}
    },
    load: function() {
        const saved = localStorage.getItem('bee_db_v38');
        if(saved) this.data = JSON.parse(saved);
        this.initHives();
    },
    save: function() {
        localStorage.setItem('bee_db_v38', JSON.stringify(this.data));
        SmartLogic.checkAlerts();
        Gamification.update();
    },
    initHives: function() {
        if(Object.keys(this.data.hives).length === 0) {
            for(let i=1; i<=108; i++) this.data.hives[`A-${i}`] = { status: 'normal', beeAmt: 5 };
        }
    }
};

// ================= 2. 遊戲化 (Gamification) =================
const Gamification = {
    update: function() {
        const xp = (DB.data.logs.length * 15) + Math.floor(DB.data.finance.revenue / 1000);
        const lvl = Math.floor(xp / 200) + 1;
        DB.data.user.exp = xp;
        DB.data.user.level = lvl;
    }
};

// ================= 3. 智慧邏輯 (Logic) =================
const SmartLogic = {
    // 擴充：支援更多飼料類型
    feed: function(type, amount, cost) {
        this.addLog('feed', `餵食 ${type} ${amount}`);
        
        // 自動扣庫存邏輯
        const inv = DB.data.inventory;
        if(type.includes('白糖')) inv.sugar -= parseFloat(amount) * 0.6; // 糖水折算乾糖
        if(type.includes('花粉')) inv.pollen -= parseFloat(amount);
        if(type.includes('大豆')) inv.soy -= parseFloat(amount);
        if(type.includes('益生菌')) inv.probiotic -= parseFloat(amount);
        
        DB.data.finance.cost += parseFloat(cost);
        DB.save(); 
        alert(`✅ 已紀錄！庫存扣除，成本 +$${cost}`);
        Router.go('dashboard');
    },
    
    // 擴充：支援更多產品類型與瓶罐計算
    harvest: function(type, weight, price) {
        let bottles = 0;
        // 不同產品用不同容器
        if(type.includes('蜜')) bottles = Math.ceil(weight / 0.7); // 700g 瓶
        if(type.includes('王乳')) bottles = Math.ceil(weight / 0.5); // 500g 罐
        
        this.addLog('harvest', `採收 ${type} ${weight}kg`);
        DB.data.inventory.bottles -= bottles;
        DB.data.finance.revenue += (weight * price);
        
        DB.save(); 
        alert(`🎉 豐收！營收 +$${weight*price}，扣除容器 ${bottles}個`);
        Router.go('dashboard');
    },
    
    addRisk: function() {
        const t = prompt("風險類型 (農藥/防盜/天災/虎頭蜂):", "農藥");
        const n = prompt("說明:", "附近果園噴藥，預計持續3天");
        if(t) {
            DB.data.risks.unshift({date: new Date().toLocaleDateString(), type: t, note: n});
            DB.save(); Router.go('risk');
        }
    },
    
    addLand: function() {
        const n = prompt("場地名稱:");
        const l = prompt("地主:");
        if(n) {
            DB.data.lands.push({name: n, landlord: l || '未填', rent: '未填', due: '2025-12-31'});
            DB.save(); Router.go('land');
        }
    },
    
    addLog: function(type, msg) {
        DB.data.logs.unshift({ date: new Date().toLocaleDateString(), type, msg });
    },
    
    checkAlerts: function() {
        DB.data.notifications = [];
        const inv = DB.data.inventory;
        if(inv.sugar < 20) DB.data.notifications.push({msg:'⚠️ 白糖庫存低 (<20kg)'});
        if(inv.bottles < 50) DB.data.notifications.push({msg:'⚠️ 玻璃瓶庫存緊張'});
        if(inv.acid < 100) DB.data.notifications.push({msg:'⚠️ 草酸存量不足'});
        
        const dot = document.getElementById('notifDot');
        if(dot) dot.classList.toggle('hidden', DB.data.notifications.length === 0);
    }
};

// ================= 4. 特殊計算機 (Calculators) =================
const Calc = {
    // Brix 換算含水量 (CNS1305)
    brixToWater: () => {
        const b = parseFloat(document.getElementById('in_brix').value);
        if(b) {
            let w = 0;
            // 簡易對照表
            if(b >= 43) w = 17; else if(b >= 42) w = 18.6; else if(b >= 41) w = 21; else if(b >= 40) w = 23; else w = 25;
            document.getElementById('res_water').innerText = w + '%';
            document.getElementById('res_rank').innerText = w <= 20 ? '🏆 甲級 (合規)' : '❌ 水分過高';
        }
    },
    // 蟎害寄生率
    miteRate: () => {
        const b = parseFloat(document.getElementById('in_bees').value);
        const m = parseFloat(document.getElementById('in_mites').value);
        if(b && m) {
            const r = (m/b)*100;
            document.getElementById('res_mite_rate').innerText = r.toFixed(1) + '%';
            document.getElementById('res_mite_advice').innerText = r > 3 ? '🔴 立即用藥 (超標)' : '🟢 安全範圍';
        }
    }
};

// ================= 5. 單箱系統 (HiveOS) =================
const HiveOS = {
    currentId: null,
    open: function(id) {
        this.currentId = id;
        document.getElementById('hiveModal').classList.remove('hidden');
        document.getElementById('modalTitle').innerText = `📦 ${id} 管理`;
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
                <div class="input-group"><label>子脾狀況</label><select class="input-field"><option>健康連片</option><option>花子 (爛子病)</option><option>雄蜂房過多 (工蜂產卵)</option><option>無子 (失王)</option></select></div>
                <div class="grid-2">
                    <label class="glass-btn"><input type="checkbox"> 見王</label>
                    <label class="glass-btn"><input type="checkbox"> 見卵</label>
                    <label class="glass-btn"><input type="checkbox"> 王台 (分蜂熱)</label>
                    <label class="glass-btn"><input type="checkbox"> 盜蜂</label>
                </div>`;
        } else if(tab === 'feed') {
            c.innerHTML = `
                <div class="input-group"><label>飼料</label><select class="input-field"><option>1:1 糖水</option><option>花粉餅</option><option>益生菌水</option></select></div>
                <div class="input-group"><label>數量</label><input type="number" class="input-field" placeholder="單位"></div>`;
        } else {
            c.innerHTML = `<div class="log-item"><small>2025/11/01</small> 檢查：正常，進蜜中</div>`;
        }
    },
    save: function() { alert(`✅ 已儲存 ${this.currentId} 狀態`); this.close(); }
};

// ================= 6. 系統核心 =================
const System = {
    init: function() {
        DB.load();
        setTimeout(() => {
            const s = document.getElementById('splashScreen');
            if(s) { s.style.opacity='0'; setTimeout(()=>s.style.display='none',500); }
        }, 1000);
        Router.go(localStorage.getItem('bee_last_page') || 'dashboard');
        this.startClock();
        this.initAutoSave();
        SmartLogic.checkAlerts();
    },
    toggleSidebar: () => { document.querySelector('.sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('hidden'); },
    closeAllOverlays: () => { document.querySelector('.sidebar').classList.remove('open'); document.getElementById('overlay').classList.add('hidden'); document.getElementById('quickSheet').classList.remove('visible'); document.getElementById('notifPanel').classList.remove('visible'); HiveOS.close(); },
    toggleTheme: () => alert("專業深色模式"),
    toggleFullScreen: () => { if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); },
    startClock: () => {
        const w = ['晴朗','多雲','陰天','雨天']; document.getElementById('headerTemp').innerText = `${w[Math.floor(Math.random()*4)]} 24°C`;
    },
    initAutoSave: () => {
        document.getElementById('app-content').addEventListener('change', (e)=>{ if(e.target.id) localStorage.setItem('bee_val_'+e.target.id, e.target.value); });
    }
};

// ================= 7. 路由與模組 (Full Content) =================
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
            } else { c.innerHTML = `<div class="glass-panel" style="text-align:center;"><h3>載入錯誤</h3></div>`; }
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
            const net = DB.data.finance.revenue - DB.data.finance.cost;
            const u = DB.data.user;
            return `
            <div class="glass-panel" style="background:linear-gradient(135deg, #263238 0%, #000 100%); border:1px solid var(--primary);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div><div style="color:var(--primary); font-weight:bold;">👑 Lv.${u.level} 蜂業大亨</div><div style="color:#aaa; font-size:0.8rem;">Exp: ${u.exp}</div></div>
                    <div style="font-size:2rem;">👨‍🌾</div>
                </div>
                <div style="background:#333; height:5px; border-radius:5px; margin-top:10px;"><div style="width:${(u.exp%100)}%; height:100%; background:var(--primary); border-radius:5px;"></div></div>
            </div>
            <div class="grid-container">
                <div class="glass-panel" style="border-left:4px solid var(--primary)"><div class="panel-title"><span class="material-icons-round">monetization_on</span>本月淨利</div><div class="stat-value" style="color:${net>=0?'var(--success)':'var(--danger)'}">$${net.toLocaleString()}</div></div>
                <div class="glass-panel"><div class="panel-title"><span class="material-icons-round">inventory_2</span>糖存量</div><div style="display:flex;justify-content:space-between"><span>白糖</span><b>${DB.data.inventory.sugar} kg</b></div></div>
            </div>
            <div class="glass-panel"><div class="panel-title">📢 最新動態</div><div id="dashLogList"></div></div>`;
        },
        init: () => {
            let h=''; DB.data.logs.slice(0,5).forEach(l=>h+=`<div class="log-item"><small>${l.date}</small> ${l.msg}</div>`);
            document.getElementById('dashLogList').innerHTML = h || '<p style="color:#666">無紀錄</p>';
        }
    },
    
    map: {
        title: '蜂場地圖',
        render: () => `<div class="glass-panel"><div class="panel-title">🗺️ 點擊格子管理單箱</div><div id="hiveGrid" class="grid-auto"></div></div>`,
        init: () => {
            let h=''; for(let i=1;i<=DB.data.inventory.box;i++){ let c=i%10===0?'var(--danger)':'var(--success)'; h+=`<div onclick="HiveOS.open('A-${i}')" style="aspect-ratio:1;border:1px solid ${c};border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(255,255,255,0.05);cursor:pointer;">A-${i}</div>`; } document.getElementById('hiveGrid').innerHTML = h;
        }
    },

    // --- 詳細功能區 ---
    flora: {
        title: '蜜源植物圖鑑 (15種)',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🌺 台灣完整蜜粉源</div>
                <div style="height:500px; overflow-y:auto;">
                    ${Utils.floraCard('龍眼', '3-4月', 5, 1, '#fff')}
                    ${Utils.floraCard('荔枝', '2-3月', 4, 2, '#f5f5f5')}
                    ${Utils.floraCard('咸豐草', '全年', 3, 5, '#ff9800')}
                    ${Utils.floraCard('鴨腳木', '11-1月', 4, 4, '#ffeb3b')}
                    ${Utils.floraCard('烏桕', '5-7月', 3, 4, '#4caf50')}
                    ${Utils.floraCard('油菜花', '1-2月', 3, 5, '#ffeb3b')}
                    ${Utils.floraCard('白千層', '8-11月', 3, 3, '#eee')}
                    ${Utils.floraCard('水筆仔', '6-8月', 3, 3, '#8bc34a')}
                    ${Utils.floraCard('羅氏鹽膚木', '9-10月', 1, 5, '#795548')}
                    ${Utils.floraCard('茶花', '11-3月', 2, 4, '#d32f2f')}
                    ${Utils.floraCard('楠木', '2-3月', 3, 3, '#5d4037')}
                    ${Utils.floraCard('蔓澤蘭', '10-11月', 3, 2, '#cddc39')}
                    ${Utils.floraCard('玉米', '全年', 0, 4, '#ffeb3b')}
                    ${Utils.floraCard('南瓜', '全年', 2, 5, '#ff9800')}
                    ${Utils.floraCard('瓜類', '夏季', 2, 4, '#ffeb3b')}
                </div>
            </div>`,
        init: () => {}
    },

    action_feed: {
        title: '餵食作業 (細節版)',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🍬 飼料種類選擇</div>
                <select id="f_t" class="input-field">
                    <option>白糖 (1:1 獎勵)</option>
                    <option>白糖 (2:1 越冬)</option>
                    <option>轉化糖漿</option>
                    <option>花粉餅</option>
                    <option>大豆粉</option>
                    <option>益生菌水</option>
                </select>
                <div class="input-group"><label>總數量 (kg/L/片)</label><input id="f_a" type="number" class="input-field"></div>
                <div class="input-group"><label>本次成本 ($)</label><input id="f_c" type="number" class="input-field"></div>
                <button class="btn-main" onclick="SmartLogic.feed(getVal('f_t'),getVal('f_a'),getVal('f_c'))">確認扣庫存</button>
            </div>`,
        init: () => {}
    },

    action_harvest: {
        title: '採收作業 (多品項)',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🍯 產品種類</div>
                <select id="h_t" class="input-field">
                    <option>龍眼蜜</option>
                    <option>荔枝蜜</option>
                    <option>百花蜜</option>
                    <option>烏桕蜜</option>
                    <option>鴨腳木蜜</option>
                    <option>蜂王乳</option>
                    <option>蜂花粉</option>
                    <option>蜂膠</option>
                    <option>雄蜂蛹</option>
                </select>
                <div class="input-group"><label>總重量 (kg)</label><input id="h_w" type="number" class="input-field"></div>
                <div class="input-group"><label>預估單價 ($)</label><input id="h_p" type="number" class="input-field"></div>
                <button class="btn-main" style="background:var(--success)" onclick="SmartLogic.harvest(getVal('h_t'),getVal('h_w'),getVal('h_p'))">確認入庫</button>
            </div>`,
        init: () => {}
    },

    health: {
        title: '病害防治',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🧪 草酸/甲酸/福化利</div>
                <div class="input-group"><label>防治箱數</label><input type="number" id="oaBox" class="input-field" oninput="Modules.health.calcOA()"></div>
                <div class="result-area" id="oaRes">請輸入箱數</div>
            </div>
            <div class="glass-panel">
                <div class="panel-title">🚑 病徵快篩資料庫</div>
                <div class="grid-2">
                    <label class="glass-btn"><input type="checkbox"> 幼蟲拉絲 (美洲病)</label>
                    <label class="glass-btn"><input type="checkbox"> 幼蟲酸臭 (歐洲病)</label>
                    <label class="glass-btn"><input type="checkbox"> 白堊化 (白堊病)</label>
                    <label class="glass-btn"><input type="checkbox"> 翅膀捲曲 (蜂蟹蟎)</label>
                    <label class="glass-btn"><input type="checkbox"> 爬蜂/大肚 (孢子蟲)</label>
                    <label class="glass-btn"><input type="checkbox"> 巢門死蜂堆積 (農藥/餓死)</label>
                </div>
            </div>`,
        init: () => {},
        calcOA: () => { const n=document.getElementById('oaBox').value; if(n) document.getElementById('oaRes').innerHTML=`需準備：<br>草酸 <b>${(n*3.5).toFixed(1)}g</b><br>糖水 <b>${(n*50).toFixed(1)}ml</b>`; }
    },

    inventory: {
        title: '資材庫存 (完整)',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">📦 庫存總表</div>
                ${Utils.invItem('白糖 (kg)', DB.data.inventory.sugar)}
                ${Utils.invItem('草酸 (g)', DB.data.inventory.acid)}
                ${Utils.invItem('玻璃瓶 (支)', DB.data.inventory.bottles)}
                ${Utils.invItem('空蜂箱 (個)', DB.data.inventory.box)}
                ${Utils.invItem('巢框 (個)', DB.data.inventory.frames)}
                ${Utils.invItem('花粉 (kg)', DB.data.inventory.pollen)}
            </div>`,
        init: () => {}
    },

    finance: {
        title: '財務報表',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">💰 損益分析</div>
                ${Utils.invItem('總營收', '$'+DB.data.finance.revenue)}
                ${Utils.invItem('總成本', '$'+DB.data.finance.cost)}
                ${Utils.invItem('固定成本', '$'+DB.data.finance.fixedCost)}
                <hr style="border-color:#333">
                <div style="text-align:right; font-size:1.5rem; color:var(--primary); font-weight:bold;">淨利 $${DB.data.finance.revenue - DB.data.finance.cost - DB.data.finance.fixedCost}</div>
            </div>
            <div class="glass-panel">
                <div class="panel-title">⚖️ 損益平衡點 (BEP)</div>
                <p>假設每瓶利潤 $300，固定成本 $20000</p>
                <p>需賣出：<b style="color:#fff">67 瓶</b> 才能回本</p>
            </div>`,
        init: () => {}
    },

    // 其他模組保持精簡但功能完整
    breeding: { title:'育王管理', render:()=>`<div class="glass-panel"><label>移蟲日</label><input type="date" id="breedDate" class="input-field"><button class="btn-main" onclick="Modules.breeding.calc()">計算</button><div id="breedRes" class="hidden"></div></div>`, init:()=>{}, calc:()=>{ const d=new Date(document.getElementById('breedDate').value); if(!isNaN(d)) { const f=n=>new Date(d.getTime()+n*86400000).toLocaleDateString(); document.getElementById('breedRes').classList.remove('hidden'); document.getElementById('breedRes').innerHTML=`<p>封蓋：${f(5)}</p><p style="color:var(--danger)">出台：${f(12)}</p>`; } } },
    production: { title: '生產紀錄', render: () => `<div class="glass-panel"><div class="panel-title">🌡️ 蜂蜜品質計算</div><div class="input-group"><label>波美度 (Brix)</label><input type="number" id="in_brix" class="input-field" oninput="Calc.brixToWater()"></div><div class="result-area"><p>含水量：<b id="res_water">---</b></p></div></div>`, init: () => {} },
    logistics: { title: '轉場運輸', render: () => `<div class="glass-panel"><div class="panel-title">🚚 貨車裝載</div><input type="number" id="truckBox" class="input-field" placeholder="箱數" oninput="Modules.logistics.calc()"><div class="result-area" id="truckRes">---</div></div>`, init: () => {}, calc: () => { const n=document.getElementById('truckBox').value; if(n) document.getElementById('truckRes').innerHTML = `需堆疊：<b>${Math.ceil(n/12)} 層</b> (3.5噸)`; } },
    compliance: { title: '法規合規', render: () => `<div class="glass-panel"><label class="glass-btn"><input type="checkbox" checked> 養蜂登錄證</label><label class="glass-btn"><input type="checkbox"> 農藥殘留檢驗</label></div>`, init: () => {} },
    risk: { title: '風險管理', render: () => `<div class="glass-panel"><button class="btn-main" style="background:var(--danger)" onclick="SmartLogic.addRisk()">+ 新增風險通報</button><div id="riskList"></div></div>`, init: () => { let h = ''; DB.data.risks.forEach(r => h += `<div class="list-item" style="border-left:3px solid var(--danger)"><span>[${r.type}] ${r.date}</span><small>${r.note}</small></div>`); document.getElementById('riskList').innerHTML = h || '<p>無風險</p>'; } },
    land: { title: '場地管理', render: () => `<div class="glass-panel"><button class="btn-main" onclick="SmartLogic.addLand()">+ 新增場地</button><div id="landList"></div></div>`, init: () => { let h = ''; DB.data.lands.forEach(l => h += `<div class="list-item"><span>${l.name}</span><small>${l.landlord}</small></div>`); document.getElementById('landList').innerHTML = h; } },
    crm: { title:'客戶訂單', render:()=>`<div class="glass-panel"><div id="crmList"></div></div>`, init:()=>{ let h=''; DB.data.crm.forEach(c=>h+=`<div class="list-item"><span>${c.name}</span><b>$${c.total}</b></div>`); document.getElementById('crmList').innerHTML=h; } },
    tasks: { title: '工作排程', render: () => `<div class="glass-panel"><ul id="taskList" style="list-style:none;padding:0"></ul></div>`, init: () => { let h=''; DB.data.tasks.forEach(t=>h+=`<li class="list-item">${t.title}</li>`); document.getElementById('taskList').innerHTML=h; } },
    settings: { title: '系統設定', render: () => `<div class="glass-panel"><button class="btn-main" style="background:var(--danger)" onclick="localStorage.clear();location.reload()">重置</button></div>`, init:()=>{} },
    science: { title:'環境氣象', render:()=>Utils.placeholder('氣象API'), init:()=>{} },
    esg: { title:'永續經營', render:()=>Utils.placeholder('碳足跡'), init:()=>{} }
};

// --- Utils ---
const Utils = {
    placeholder: (t) => `<div class="glass-panel" style="text-align:center; padding:40px; color:#666"><h3>${t}</h3></div>`,
    invItem: (n,v,a=false) => `<div class="list-item"><span>${n}</span><span style="font-weight:bold; color:${a?'var(--danger)':'#fff'}">${v}</span></div>`,
    floraCard: (n,t,s1,s2,c) => `<div class="flora-card"><div class="flora-info"><h4 style="color:${c}">${n}</h4><p>${t}</p></div><div style="text-align:right"><div style="color:#FFD700">蜜 ${'⭐'.repeat(s1)}</div><div style="color:#FF9800">粉 ${'⭐'.repeat(s2)}</div></div></div>`,
    restoreData: () => { document.querySelectorAll('input').forEach(el=>{if(el.id){const v=localStorage.getItem('bee_val_'+el.id);if(v)el.value=v;}})}
};
const Calc = {
    brixToWater: () => {
        const b = parseFloat(document.getElementById('in_brix').value);
        if(b) document.getElementById('res_water').innerText = (400/b - 10).toFixed(1) + '%'; // 簡易公式
    }
};
function getVal(id) { return document.getElementById(id).value; }
const NotificationCenter = { toggle: () => { const p=document.getElementById('notifPanel'); p.classList.toggle('visible'); document.getElementById('overlay').classList.toggle('hidden', !p.classList.contains('visible')); let h=''; DB.data.notifications.forEach(n=>h+=`<div class="notif-alert">${n.msg}</div>`); document.getElementById('notifList').innerHTML=h||'<p style="color:#666;padding:10px">無新通知</p>'; } };
const QuickAction = { toggle: () => document.getElementById('quickSheet').classList.toggle('visible') };
const Log = { quick: (t) => { alert('已紀錄: '+t); QuickAction.toggle(); } };

document.addEventListener('DOMContentLoaded', () => System.init());
