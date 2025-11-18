/**
 * BEE EXPERT V27.0 - AI LINKAGE BRAIN
 * The most advanced beekeeping logic engine.
 */

// ================= 1. 資料庫中心 (Database) =================
// 這裡集中管理所有數據，而不是散落在各處
const DB = {
    data: {
        inventory: { sugar: 50, acid: 500, bottles: 100 }, // 預設庫存
        finance: { revenue: 0, cost: 0 },
        logs: [],
        notifications: []
    },
    load: function() {
        const saved = localStorage.getItem('bee_db_v27');
        if(saved) this.data = JSON.parse(saved);
    },
    save: function() {
        localStorage.setItem('bee_db_v27', JSON.stringify(this.data));
        SmartLogic.checkAlerts(); // 每次存檔都檢查警報
    }
};

// ================= 2. 智慧邏輯引擎 (The Brain) =================
// 負責處理「連動」的核心
const SmartLogic = {
    // 動作：餵食 (連動：扣庫存 -> 記日誌 -> 加成本)
    feed: function(type, amount, cost) {
        // 1. 記日誌
        const logMsg = `餵食 ${type} ${amount}單位`;
        this.addLog('feed', logMsg);
        
        // 2. 扣庫存 (連動!)
        if(type === '白糖') {
            DB.data.inventory.sugar -= parseFloat(amount);
            alert(`✅ 已紀錄餵食！\n📉 自動扣除白糖庫存 ${amount}kg\n💰 自動增加成本 $${cost}`);
        }
        
        // 3. 加成本 (連動!)
        DB.data.finance.cost += parseFloat(cost);
        
        DB.save();
        Router.go('dashboard'); // 回首頁看更新
    },

    // 動作：採收 (連動：扣瓶子 -> 記日誌 -> 加營收)
    harvest: function(type, weight, price) {
        const bottlesNeeded = Math.ceil(weight / 0.7); // 假設700g一瓶
        
        // 1. 記日誌
        const logMsg = `採收 ${type} ${weight}kg (約 ${bottlesNeeded} 瓶)`;
        this.addLog('harvest', logMsg);

        // 2. 扣瓶子 (連動!)
        DB.data.inventory.bottles -= bottlesNeeded;

        // 3. 加營收 (連動!)
        DB.data.finance.revenue += (weight * price);
        
        alert(`🎉 恭喜豐收！\n📉 自動扣除空瓶 ${bottlesNeeded}支\n💰 營收增加 $${weight*price}`);
        
        DB.save();
        Router.go('dashboard');
    },

    addLog: function(type, msg) {
        const date = new Date().toLocaleDateString();
        DB.data.logs.unshift({ date, type, msg }); // 加到最前面
    },

    // 自動檢查警報
    checkAlerts: function() {
        DB.data.notifications = []; // 重置
        
        // 檢查糖
        if(DB.data.inventory.sugar < 10) {
            DB.data.notifications.push({type:'alert', msg:'⚠️ 白糖庫存過低 (<10kg)'});
        }
        // 檢查瓶子
        if(DB.data.inventory.bottles < 20) {
            DB.data.notifications.push({type:'alert', msg:'⚠️ 玻璃瓶即將用完'});
        }
        
        // 更新 UI 紅點
        const dot = document.getElementById('notifDot');
        if(dot) {
            if(DB.data.notifications.length > 0) dot.classList.remove('hidden');
            else dot.classList.add('hidden');
        }
    }
};

// ================= 3. 系統核心 =================
const System = {
    init: function() {
        DB.load();
        setTimeout(() => {
            document.getElementById('splashScreen').style.opacity = '0';
            setTimeout(() => document.getElementById('splashScreen').style.display='none', 500);
        }, 1000);
        
        Router.go('dashboard');
        SmartLogic.checkAlerts();
    },
    toggleSidebar: () => { document.querySelector('.sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('hidden'); },
    closeAll: () => { document.querySelector('.sidebar').classList.remove('open'); document.getElementById('overlay').classList.add('hidden'); document.getElementById('quickSheet').classList.remove('visible'); document.getElementById('notifPanel').classList.remove('visible'); },
    toggleTheme: () => alert("專業模式鎖定中"),
    toggleFullScreen: () => { if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
};

// ================= 4. 路由與模組 =================
const Router = {
    go: function(p) {
        // UI 更新
        document.querySelectorAll('.nav-btn, .nav-item').forEach(e=>e.classList.remove('active'));
        const b1=document.querySelector(`.nav-btn[onclick*="'${p}'"]`);
        const b2=document.querySelector(`.nav-item[onclick*="'${p}'"]`);
        if(b1)b1.classList.add('active'); if(b2)b2.classList.add('active');

        const content = document.getElementById('app-content');
        const title = document.getElementById('pageTitle');
        
        content.innerHTML = Modules[p] ? Modules[p].render() : Utils.placeholder();
        title.innerText = Modules[p] ? Modules[p].title : '建置中';
        
        if(Modules[p] && Modules[p].init) Modules[p].init();
        if(window.innerWidth <= 768) System.closeAll();
    }
};

const Modules = {
    dashboard: {
        title: '營運總覽',
        render: () => {
            const inv = DB.data.inventory;
            const fin = DB.data.finance;
            const profit = fin.revenue - fin.cost;
            
            return `
            <div class="grid-container">
                <div class="glass-panel" style="border-left:4px solid var(--primary)">
                    <div class="panel-title"><span class="material-icons-round">attach_money</span>本月淨利</div>
                    <div class="stat-value" style="color:${profit>=0?'var(--success)':'var(--danger)'}">$${profit.toLocaleString()}</div>
                    <div class="stat-trend">營收 $${fin.revenue} | 成本 $${fin.cost}</div>
                </div>
                <div class="glass-panel">
                    <div class="panel-title"><span class="material-icons-round">inventory_2</span>關鍵庫存</div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span>白糖</span><b style="color:${inv.sugar<10?'var(--danger)':'#fff'}">${inv.sugar} kg</b>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span>瓶子</span><b style="color:${inv.bottles<20?'var(--danger)':'#fff'}">${inv.bottles} 支</b>
                    </div>
                </div>
            </div>
            <div class="glass-panel">
                <div class="panel-title">📢 最新動態</div>
                <div id="dashLogList"></div>
            </div>
            `;
        },
        init: () => {
            const list = document.getElementById('dashLogList');
            let html = '';
            DB.data.logs.slice(0, 5).forEach(l => {
                html += `<div class="log-item"><small>${l.date}</small><br>${l.msg}</div>`;
            });
            list.innerHTML = html || '<p style="color:#666">暫無紀錄</p>';
        }
    },

    // --- 智慧連動介面：餵食 ---
    action_feed: {
        title: '智慧餵食系統',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🍬 餵食紀錄 (自動扣庫存)</div>
                <label style="color:#999">飼料種類</label>
                <select id="feedType" class="input-field"><option value="白糖">白糖 (1:1 糖水)</option><option value="花粉餅">花粉餅</option></select>
                <label style="color:#999">使用量 (kg/片)</label>
                <input type="number" id="feedAmount" class="input-field" placeholder="例如 50">
                <label style="color:#999">預估成本 ($)</label>
                <input type="number" id="feedCost" class="input-field" placeholder="例如 1500">
                <button class="btn-main" onclick="Modules.action_feed.submit()">確認餵食</button>
            </div>
        `,
        init: () => {},
        submit: () => {
            const t = document.getElementById('feedType').value;
            const a = document.getElementById('feedAmount').value;
            const c = document.getElementById('feedCost').value;
            if(!a || !c) return alert('請輸入數量與成本');
            SmartLogic.feed(t, a, c);
        }
    },

    // --- 智慧連動介面：採收 ---
    action_harvest: {
        title: '智慧採收系統',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">🍯 採收紀錄 (自動算利潤)</div>
                <label style="color:#999">蜜種</label>
                <select id="harvType" class="input-field"><option>龍眼蜜</option><option>荔枝蜜</option><option>百花蜜</option></select>
                <label style="color:#999">總重量 (kg)</label>
                <input type="number" id="harvWeight" class="input-field" placeholder="例如 100">
                <label style="color:#999">預估單價 ($/kg)</label>
                <input type="number" id="harvPrice" class="input-field" placeholder="例如 200">
                <button class="btn-main" style="background:var(--success)" onclick="Modules.action_harvest.submit()">確認採收入庫</button>
            </div>
        `,
        init: () => {},
        submit: () => {
            const t = document.getElementById('harvType').value;
            const w = document.getElementById('harvWeight').value;
            const p = document.getElementById('harvPrice').value;
            if(!w || !p) return alert('請輸入重量與價格');
            SmartLogic.harvest(t, w, p);
        }
    },
    
    logs: {
        title: '歷史日誌',
        render: () => `<div class="glass-panel"><div id="fullLogList"></div></div>`,
        init: () => {
            const list = document.getElementById('fullLogList');
            let html = '';
            DB.data.logs.forEach(l => html += `<div class="log-item"><small>${l.date} [${l.type}]</small><br>${l.msg}</div>`);
            list.innerHTML = html || '無紀錄';
        }
    },
    
    inventory: {
        title: '資材庫存',
        render: () => `
            <div class="glass-panel">
                <div class="panel-title">📦 庫存盤點 (可手動修正)</div>
                ${Utils.invInput('白糖 (kg)', 'sugar')}
                ${Utils.invInput('草酸 (g)', 'acid')}
                ${Utils.invInput('玻璃瓶 (支)', 'bottles')}
                <button class="btn-main" onclick="Modules.inventory.save()">儲存修正</button>
            </div>
        `,
        init: () => {},
        save: () => {
            DB.data.inventory.sugar = parseFloat(document.getElementById('inv_sugar').value);
            DB.data.inventory.acid = parseFloat(document.getElementById('inv_acid').value);
            DB.data.inventory.bottles = parseFloat(document.getElementById('inv_bottles').value);
            DB.save();
            alert('庫存已手動更新');
        }
    },

    // 其他模組 placeholder
    map: { title: '蜂場地圖', render: () => Utils.placeholder(), init:()=>{} },
    settings: { title: '系統設定', render: () => `<div class="glass-panel"><button class="btn-main" style="background:var(--danger)" onclick="localStorage.clear();location.reload()">重置系統</button></div>`, init:()=>{} }
};

// --- Utils ---
const Utils = {
    placeholder: () => `<div class="glass-panel" style="text-align:center; padding:40px; color:#666"><h3>功能建置中</h3></div>`,
    invInput: (name, key) => `<div style="margin-bottom:10px;"><label>${name}</label><input type="number" id="inv_${key}" class="input-field" value="${DB.data.inventory[key]}"></div>`
};

const QuickAction = { toggle: () => document.getElementById('quickSheet').classList.toggle('visible') };
const SmartNotif = { 
    toggle: () => {
        const p = document.getElementById('notifPanel');
        const list = document.getElementById('notifList');
        p.classList.toggle('visible');
        document.getElementById('overlay').classList.toggle('hidden');
        
        let html = '';
        DB.data.notifications.forEach(n => html += `<div class="notif-alert">${n.msg}</div>`);
        list.innerHTML = html || '<p style="color:#666; padding:10px;">無新通知</p>';
    } 
};

document.addEventListener('DOMContentLoaded', () => System.init());
