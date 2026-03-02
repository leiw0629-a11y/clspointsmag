
// ===========================================
// 逻辑模块：挂机锁屏 (Logic Lock)
// 依赖全局变量：CONFIG, isDataDirty
// 依赖全局函数：saveData
// ===========================================

/**
 * 触发锁屏
 * 逻辑：如果没有密码，强制跳转到设置密码页；否则显示解锁页。
 */
function lockScreen() {
    // 依赖 script.js 中的全局变量 CONFIG
    if (!CONFIG.password) {
        // 如果是空密码，直接跳转到修改面板，让用户设初始密码
        document.getElementById('lockScreenOverlay').style.display = 'flex';
        // 自动切换到修改页
        const tabs = document.querySelectorAll('.lock-tab-item');
        // 这里假设 tabs[1] 是修改密码 tab，为了稳健性，DOM结构需保持稳定
        if(tabs.length > 1) switchLockTab('change', tabs[1]); 
        return;
    }
    
    // 正常锁屏，默认显示解锁页
    const unlockInput = document.getElementById('unlockPwd');
    const oldPwdInput = document.getElementById('oldPwdChange');
    const newPwdInput = document.getElementById('newPwdChange');

    if(unlockInput) unlockInput.value = '';
    if(oldPwdInput) oldPwdInput.value = '';
    if(newPwdInput) newPwdInput.value = '';
    
    document.getElementById('lockScreenOverlay').style.display = 'flex';
    
    // 重置回解锁Tab
    const tabs = document.querySelectorAll('.lock-tab-item');
    if(tabs.length > 0) switchLockTab('unlock', tabs[0]);
    
    // 自动聚焦
    setTimeout(() => {
        if(unlockInput) unlockInput.focus();
    }, 100);
}

/**
 * 切换锁屏面板的 Tab
 * @param {string} mode - 'unlock' 或 'change'
 * @param {HTMLElement} tabEl - 点击的标签元素
 */
function switchLockTab(mode, tabEl) {
    // 样式切换
    document.querySelectorAll('.lock-tab-item').forEach(el => el.classList.remove('active'));
    if(tabEl) tabEl.classList.add('active');
    
    // 内容切换
    document.querySelectorAll('.lock-content').forEach(el => el.classList.remove('active'));
    const targetPanel = document.getElementById(`panel-${mode}`);
    if(targetPanel) targetPanel.classList.add('active');
}

/**
 * 执行解锁验证
 */
function checkUnlock() {
    const input = document.getElementById('unlockPwd').value;
    // 兼容 String 比对，依赖全局 CONFIG
    if (String(input) === String(CONFIG.password)) {
		sessionStorage.setItem('sessionUnlocked', 'true');
        document.getElementById('lockScreenOverlay').style.display = 'none';
    } else {
        alert("❌ 密码错误");
        const unlockInput = document.getElementById('unlockPwd');
        unlockInput.value = '';
        unlockInput.focus();
    }
}

/**
 * 执行修改密码
 */
function doChangePassword() {
    const oldPwd = document.getElementById('oldPwdChange').value.trim();
    const newPwd = document.getElementById('newPwdChange').value.trim();

    if (!newPwd) return alert("❌ 新密码不能为空");

    // 验证旧密码 (如果本来就没密码，则允许直接设)
    if (CONFIG.password && String(oldPwd) !== String(CONFIG.password)) {
        return alert("❌ 旧密码错误！无法修改。");
    }

    // 修改并保存
    CONFIG.password = newPwd;
    
    // 调用 script.js 中的全局函数 saveData
    if (typeof saveData === 'function') {
        saveData();
    } else {
        console.error("saveData function not found!");
    }

    // 标记脏数据，依赖 script.js 中的全局变量
    isDataDirty = true; 
    // 【新增】：修改成功，确认为主人操作，颁发通行证
    sessionStorage.setItem('sessionUnlocked', 'true');
    alert("✅ 密码修改成功！请牢记新密码。");
    
    // 修改成功后，自动清空输入框并切回解锁页
    document.getElementById('oldPwdChange').value = '';
    document.getElementById('newPwdChange').value = '';
    document.getElementById('unlockPwd').value = '';
    
    const tabs = document.querySelectorAll('.lock-tab-item');
    if(tabs.length > 0) switchLockTab('unlock', tabs[0]); 
}

/**
 * 【新增】手动上锁 / 退出登录
 * 场景：老师要离开座位，点击“锁定”按钮
 */
function manualLock() {
    // 1. 撕毁通行证
    sessionStorage.removeItem('sessionUnlocked');
    
    // 2. 立即锁屏
    lockScreen();
    
    // 可选：给个提示
    // if(typeof showToast === 'function') showToast("🔒 已手动锁定");
}