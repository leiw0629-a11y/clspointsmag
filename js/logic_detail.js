// ===========================================
// 逻辑模块：学生详情 (Logic Detail)
// 依赖全局变量：students, CONFIG, historyData, PET_LIBRARY, EVOLUTION_RULES, currentDetailName
// 依赖全局函数：saveData, refreshUI, getPetInfo, renderMainTable, revokeHistoryItem(日志模块)
// ===========================================

/**
 * 打开学生详情弹窗 (主入口)
 */
function openStudentDetail(name) {
    currentDetailName = name;
    const student = students.find(s => s.name === name);
    if (!student) return;
    
    // ---------------------------------------------------------
    // 1. 全局数据准备 (Stats Calculation)
    // ---------------------------------------------------------
    const pet = getPetInfo(student);
    const percent = (student.exp / CONFIG.pointsPerLevel) * 100;
    
    // 关联日志
    const historyWithIdx = historyData.map((h, i) => ({...h, originalIndex: i})).filter(h => h.name === student.name);
    
    // 排名计算
    const rankList = students
        .filter(s => s.className === student.className)
        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    const rankIndex = rankList.findIndex(s => s.name === student.name);
    const rankStr = rankIndex !== -1 ? `No.${rankIndex + 1}` : 'No.-';

    // 近7天统计
    const now = new Date();
    const endDate = new Date(now); endDate.setHours(23, 59, 59, 999); 
    const startDate = new Date(now); startDate.setDate(startDate.getDate() - 6); startDate.setHours(0, 0, 0, 0); 

    let goodCount = 0;
    let badCount = 0;
    historyData.forEach(h => {
        if (h.name !== student.name || h.revoked) return;
        const dateString = h.targetDate || h.time;
        const logTime = new Date(dateString.replace(/-/g, '/')); // 依然保留兼容 Safari 的写法
        if (logTime < startDate || logTime > endDate) return;
        if (h.isExchange === true || (h.subject && h.subject.includes("兑换"))) return;
        const change = h.pointsChange !== undefined ? h.pointsChange : h.points;
        if (change > 0) goodCount++; else if (change < 0) badCount++;
    });

    // ---------------------------------------------------------
    // 2. 调用子函数生成各板块 HTML
    // ---------------------------------------------------------
    
    // 左侧：个人信息与操作区
    const leftPanelHtml = _renderLeftPanel(student, pet, percent, rankStr, goodCount, badCount);
    
    // 右侧 A：历史记录
    const historyPanelHtml = _renderHistoryPanel(historyWithIdx);
    
    // 右侧 B：分组选择
    const groupPanelHtml = _renderGroupPanel(student);

    // ---------------------------------------------------------
    // 3. 组装并渲染
    // ---------------------------------------------------------
    const modal = document.querySelector('#detailModal .modal');
    modal.style.width = "900px";
    modal.style.height = "80vh";
    modal.style.maxHeight = "80vh";
    
    const contentContainer = document.getElementById('modalDetailContent');
    contentContainer.style.height = "calc(100% - 50px)";
    contentContainer.style.overflow = "hidden"; 
    contentContainer.style.padding = "0"; 

    document.getElementById('modalTitleText').innerHTML = `${student.name} <span class="badge-small">Lv.${student.level} ${pet.title}</span>`;
    
    contentContainer.innerHTML = `
        <div style="display: flex; width: 100%; height: 100%; gap: 20px; box-sizing: border-box; padding: 10px;">
            ${leftPanelHtml}
            <div style="flex: 1; border: 2px solid #FFEEE4; border-radius: 16px; background: #fff; display: flex; flex-direction: column; overflow: hidden; height: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.03); position:relative;">
                ${historyPanelHtml}
                ${groupPanelHtml}
            </div>
        </div>
    `;
    
    document.getElementById('detailModal').style.display = 'flex';
}

// ===========================================
// 私有渲染辅助函数 (Private Render Helpers)
// ===========================================

/**
 * 渲染左侧面板 (头像、属性、按钮)
 */
function _renderLeftPanel(student, pet, percent, rankStr, goodCount, badCount) {
    const accumulated = student.accumulatedPoints || 0; 
    const walletBalance = student.currentPoints !== undefined ? student.currentPoints : (student.totalPoints || 0); 
    const classNameStr = student.className || '暂无';
    const groupNameStr = student.groupName || '未分组';

    // 生成大图交互
    let bigImg = pet.html.replace('class="pet-avatar"', 'class="pet-stage-lg" onclick="this.style.transform=\'scale(1.1)\'; setTimeout(()=>this.style.transform=\'scale(1)\', 200);"');
    if(!bigImg.includes('img')) bigImg = `<div class="pet-stage-lg" style="font-size:140px; display:flex; align-items:center; justify-content:center; height:100%;">${pet.raw}</div>`;

    // 生成进化路径下拉框
    let petOptions = '';
    for(let key in PET_LIBRARY) {
        let label = key === 'default' ? '默认体系' : (PET_LIBRARY[key].titles && PET_LIBRARY[key].titles[4] ? PET_LIBRARY[key].titles[4] : key);
        petOptions += `<option value="${key}" ${student.petPath === key ? 'selected' : ''}>${label}</option>`;
    }

    return `
    <div style="flex: 0 0 300px; display: flex; flex-direction: column; align-items: center; height: 100%; box-sizing: border-box; padding-right: 5px;">
        
        <div class="pet-image-container" style="flex: 0 0 auto; width: 100%; max-width: 260px; height: 260px; box-sizing: border-box; display:flex; align-items:center; justify-content:center; margin-bottom: 0px;">
            ${bigImg}
        </div>
        
        <div style="width: 100%; padding: 0 5px; box-sizing: border-box; flex-shrink: 0; margin-top: 5px;">
            <div style="background: #FFFBF7; border: 1px solid #FFEEE4; border-radius: 12px; padding: 20px 12px 15px 12px; margin-bottom: 0; box-shadow: inset 0 0 6px rgba(255,238,228,0.3);">
                
                <div style="display:flex; align-items:center; justify-content:center; padding-bottom:10px;">
                     <span style="font-size:16px; margin-right:6px;">🏆</span>
                     <span id="detail_rank" style="font-weight:bold; color:#E65100; font-size:15px;">当前排名: ${rankStr}</span>
                </div>
                
                <div style="border-bottom: 1px dashed #FFE0B2; margin-bottom: 15px;"></div>

                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; height: 30px;">
                    <div style="flex: 1; display:flex; align-items:center;">
                        <select onchange="changeStudentPath(this.value)" class="form-input" style="width: 100%; height: 26px; padding: 0 2px; font-size: 12px; border: 1px solid #FFCCBC; border-radius: 6px; background: #fff; color: #5D4037;">
                            ${petOptions}
                        </select>
                    </div>
                    <div style="width:1px; height:16px; background:#FFE0B2;"></div>
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2px;">
                        <div style="display:flex; justify-content:space-between; align-items:baseline; line-height:1;">
                            <span style="font-weight:bold; font-size:12px; color:#6D4C41;">Lv.${student.level}</span>
                            <span style="font-size:10px; color:#AAA;">${student.exp}</span>
                        </div>
                        <div class="exp-bar-bg" style="height:6px; border-radius:3px; background:#FFE0B2; overflow:hidden; width:100%;">
                            <div class="exp-bar-fill" style="width: ${percent}%;"></div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 13px; color: #5D4037;">
                    <div style="padding:8px 10px; display:flex; align-items:center; white-space:nowrap;">
                        <span style="color:#9E9E9E; font-size:12px; margin-right:5px;">累计:</span>
                        <span id="detail_accumulated" style="font-weight:bold; color:#757575; font-size:14px;">💰${accumulated}</span>
                    </div>
                    <div style="padding:8px 10px; display:flex; align-items:center; white-space:nowrap;">
                        <span style="color:#9E9E9E; font-size:12px; margin-right:5px;">可用:</span>
                        <span id="detail_available" style="font-weight:bold; color:#2E7D32; font-size:14px;">🪙${walletBalance}</span>
                    </div>
                    <div style="display:flex; align-items:center; background:rgba(255,255,255,0.4); border-radius:8px; padding:6px 10px;">
                        <span style="color:#9E9E9E; margin-right:6px;">班级:</span> 
                        <span id="detail_className" style="font-weight:bold; color:#5D4037; font-size:14px;">${classNameStr}</span>
                    </div>
                    <div style="display:flex; align-items:center; background:rgba(255,255,255,0.4); border-radius:8px; padding:6px 10px;">
                        <span style="color:#9E9E9E; margin-right:6px;">小组:</span> 
                        <span id="detail_groupName" style="font-weight:bold; color:#5D4037; font-size:14px;">${groupNameStr}</span>
                    </div>
                </div>

                <div style="margin-top: 15px; padding-top: 12px; padding-bottom: 5px; border-top: 1px dashed #FFE0B2; font-size: 12px; color: #666; display:flex; justify-content:center; align-items:center;">
                    <span style="color:#9E9E9E; margin-right:6px;font-size:14px;">📅近7天表现:</span> 
                    <span style="color:#2E7D32; font-weight:bold; margin-right:5px; font-size:14px;">👍${goodCount}</span><span style="color:#ddd; margin:0 5px;">|</span><span style="color:#C62828; font-weight:bold; font-size:14px;">👎${badCount}</span>
                </div>
            </div>
        </div>

        <div style="width: 100%; padding: 5px; box-sizing: border-box; margin-top: 5px; flex-shrink: 0;">
            <div style="display: flex; gap: 8px;">
                <button class="btn-hover-effect" 
                    onclick="jumpToAnalysis()" 
                    onmouseover="this.style.background='#4FC3F7'" 
                    onmouseout="this.style.background='#81D4FA'"
                    style="flex:1; background:#81D4FA; color:#01579B; border:none; padding:10px 0; border-radius:8px; font-size:13px; cursor:pointer; font-weight:bold;">
                    📈数据分析
                </button>
            
                <button class="btn-hover-effect" 
                    onclick="document.getElementById('d-view-history').style.display='none'; document.getElementById('d-view-group').style.display='flex';"
                    onmouseover="this.style.background='#FFB74D'" 
                    onmouseout="this.style.background='#FFCC80'"
                    style="flex:1; background:#FFCC80; color:#E65100; border:none; padding:10px 0; border-radius:8px; font-size:13px; cursor:pointer; font-weight:bold;">
                    🔄学员换组
                </button>
                                
                <button class="btn-hover-effect" 
                    onclick="deleteStudentFromDetail()" 
                    style="flex:0 0 40px; background:#FFEBEE; color:#C62828; border:1px solid #FFCDD2; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center;" 
                    title="删除该学生" 
                    onmouseover="this.style.background='#FFCDD2'" 
                    onmouseout="this.style.background='#FFEBEE'">
                    🗑️
                </button>
            </div>
        </div>
        
        <div style="flex: 1;"></div>
    </div>`;
}

/**
 * 渲染右侧：历史记录面板 (Layer 1)
 * 修改：仅展示 targetDate (记分日期)，保持原有字体风格
 */
function _renderHistoryPanel(historyWithIdx) {
    let historyRows = historyWithIdx.map(h => {
        let pChange = h.pointsChange !== undefined ? h.pointsChange : h.points;
        let eChange = h.expChange;
        if (eChange === undefined) eChange = (pChange > 0) ? pChange : 0;
        
        const color = pChange >= 0 ? '#2E7D32' : '#C62828';
        
        // -----------------------------------------------------
        // 核心修改：只获取日期字符串
        // -----------------------------------------------------
        // 优先使用 targetDate (记分日期)，如果没有则截取 time 的日期部分
        const rawDate = h.time.split(' ')[0];
        const displayDate = h.targetDate || rawDate;

        let changeHtml = '';
        if(eChange > 0) changeHtml += `<div style="font-size:11px; color:#795548;">Exp+${eChange}</div>`;
        changeHtml += `<div style="font-weight:bold; color:${color}; font-size:13px;">🪙${pChange >= 0 ? '+' : ''}${pChange}</div>`;

        const actionHtml = h.revoked 
            ? '<span style="color:#ccc; font-size:12px;">已撤销</span>' 
            : `<button class="btn-revoke" onclick="revokeHistoryItem(${h.originalIndex})">撤销</button>`;

        const rowStyle = h.revoked ? 'opacity: 0.6; text-decoration: line-through;' : '';

        return `
        <tr style="border-bottom: 1px dashed #FFEEE4; ${rowStyle}">
            <td style="padding: 10px 6px; text-align:center;">
                <div style="font-size:12px; color:#666;">${displayDate}</div>
            </td>
            <td style="padding: 10px 6px; text-align:center; font-size:14px; color:#5D4037;">${h.subject}</td>
            <td style="padding: 10px 6px; text-align:center;">${changeHtml}</td>
            <td style="padding: 10px 6px; text-align:center;">${actionHtml}</td>
        </tr>`;
    }).join('');

    if(!historyRows) historyRows = '<tr><td colspan="4" style="text-align:center; color:#ccc; padding:40px;">暂无喂养记录</td></tr>';
    
    // 保持原来的无表头结构
    const tableHtml = `<table style="width:100%; border-collapse: collapse;"><tbody>${historyRows}</tbody></table>`;

    return `
    <div id="d-view-history" style="display:flex; flex-direction:column; height:100%; width:100%;">
        <div style="background: #FFF3E0; padding: 12px 20px; font-weight:bold; color:#E65100; font-size:15px; border-bottom:2px solid #FFEEE4; flex-shrink: 0; display:flex; justify-content:space-between;">
            <span>📅 喂养记录</span>
            <span style="font-size:12px; color:#FF8A65; font-weight:normal;">共 ${historyWithIdx.length} 条</span>
        </div>
        <div style="flex: 1; overflow-y: auto; padding: 0;">
            ${tableHtml}
        </div>
    </div>`;
}

/**
 * 渲染右侧：分组选择面板 (Layer 2, 默认隐藏)
 */
function _renderGroupPanel(student) {
    const classStudents = students.filter(s => s.className === student.className);
    const groupsMap = {};
    classStudents.forEach(s => {
        const gName = s.groupName || ""; 
        if (!groupsMap[gName]) groupsMap[gName] = [];
        groupsMap[gName].push(s);
    });

    const groupNames = Object.keys(groupsMap).sort((a, b) => {
        if (a === "") return -1;
        if (b === "") return 1;
        return a.localeCompare(b);
    });
    if (!groupNames.includes("")) groupNames.unshift("");

    let groupCardsHtml = '';
    groupNames.forEach(gName => {
        const members = groupsMap[gName] || [];
        const isCurrentGroup = (student.groupName || "") === gName;
        
        const membersHtml = members.map(m => {
            const isMe = m.name === student.name;
            const tagStyle = isMe 
                ? "background:#FFE0B2; color:#E65100; font-weight:bold; border:1px solid #FFCC80;" 
                : "background:#F5F5F5; color:#616161; border:1px solid #EEE;";
            return `<span style="display:inline-block; padding:2px 6px; margin:2px; font-size:11px; border-radius:4px; ${tagStyle}">${m.name}</span>`;
        }).join('');

        const cardBg = isCurrentGroup ? '#FFF3E0' : '#FAFAFA';
        const cardBorder = isCurrentGroup ? '2px solid #FFB74D' : '1px solid #EEEEEE';
        const titleColor = isCurrentGroup ? '#E65100' : '#424242';
        const titleText = gName === "" ? "🚫 未分组 (移出)" : `🛡️ ${gName}`;
        const checkMark = isCurrentGroup ? '<span style="float:right; color:#E65100; font-weight:bold; font-size:12px;">✅ 当前所在</span>' : '';
        const clickAttr = isCurrentGroup ? '' : `onclick="doChangeGroup('${gName}')"`;
        const cursorStyle = isCurrentGroup ? 'default' : 'pointer';
        const hoverEffect = isCurrentGroup ? '' : 'onmouseover="this.style.borderColor=\'#FF9800\';this.style.background=\'#fff\'" onmouseout="this.style.borderColor=\'#EEEEEE\';this.style.background=\'#FAFAFA\'"';

        groupCardsHtml += `
            <div style="background:${cardBg}; border:${cardBorder}; border-radius:8px; padding:10px; margin-bottom:8px; cursor:${cursorStyle}; transition:all 0.2s;" ${clickAttr} ${hoverEffect}>
                <div style="margin-bottom:6px; font-weight:bold; color:${titleColor}; font-size:13px;">
                    ${titleText} <span style="font-weight:normal; color:#999; margin-left:5px;">(${members.length}人)</span>
                    ${checkMark}
                </div>
                <div style="line-height:1.2;">
                    ${membersHtml}
                </div>
            </div>
        `;
    });

    return `
    <div id="d-view-group" style="display:none; flex-direction:column; height:100%; width:100%; background:#fff;">
         <div style="background: #FFF3E0; padding: 12px 20px; font-weight:bold; color:#E65100; font-size:15px; border-bottom:2px solid #FFEEE4; flex-shrink: 0; display:flex; justify-content:space-between; align-items:center;">
            <span>🧩 请选择小组</span>
            <button onclick="document.getElementById('d-view-history').style.display='flex'; document.getElementById('d-view-group').style.display='none';" 
                    style="border:none; background:none; color:#C62828; cursor:pointer; font-size:13px;">❌ 取消</button>
        </div>
        <div style="flex: 1; overflow-y: auto; padding: 15px;">
            ${groupCardsHtml}
        </div>
    </div>`;
}

// ===========================================
// 其他辅助函数 (保持不变)
// ===========================================

/**
 * 修改学生进化路径
 */
function changeStudentPath(path) {
    if (!currentDetailName) return;
    const idx = students.findIndex(s => s.name === currentDetailName);
    if (idx !== -1) {
        students[idx].petPath = path;
        saveData(); 
        if(typeof isDataDirty !== 'undefined') isDataDirty = true;
        openStudentDetail(currentDetailName); 
        renderMainTable();
    }
}

/**
 * 执行换组操作
 */
function doChangeGroup(targetGroupName) {
    if (!currentDetailName) return;
    const confirmMsg = targetGroupName 
        ? `⚠️ 确定要将该学生加入【${targetGroupName}】吗？` 
        : `⚠️ 确定要将该学生移出当前小组吗？`;
        
    if (!confirm(confirmMsg)) return; 

    const student = students.find(s => s.name === currentDetailName);
    if (student) {
        student.groupName = targetGroupName;
        saveData();
        if(typeof isDataDirty !== 'undefined') isDataDirty = true;
        const msg = targetGroupName ? `✅ 已加入【${targetGroupName}】` : `🗑️ 已移出小组`;
        showToast(msg);
        openStudentDetail(currentDetailName);
        renderMainTable();
    }
}

/**
 * 详情页专用：删除学生 (基于名字唯一)
 */
function deleteStudentFromDetail() {
    if (!currentDetailName) return;
    if(!confirm(`⚠️ 严重警告\n\n确定要永久删除【${currentDetailName}】吗？\n此操作将销毁该生的所有数据且无法恢复！`)) return;
    const idx = students.findIndex(s => s.name === currentDetailName);
    if (idx !== -1) {
        students.splice(idx, 1); 
        saveData();              
        showToast("🗑️ 学生档案已销毁"); 
        document.getElementById('detailModal').style.display = 'none';
        renderMainTable(); 
        refreshUI();
        if(typeof renderStudentMgrTable === 'function') renderStudentMgrTable();
    }
}

/**
 * 从详情页跳转到分析页 (带上下文)
 */
function jumpToAnalysis() {
    if (!currentDetailName) return;
    const mainTimeSelect = document.getElementById('timeSelect');
    const timeType = mainTimeSelect ? mainTimeSelect.value : 'week';
    let customStart = "";
    let customEnd = "";
    if (timeType === 'custom') {
        customStart = document.getElementById('startDate').value;
        customEnd = document.getElementById('endDate').value;
    }
    document.getElementById('detailModal').style.display = 'none';
    if (typeof openAnalysisModal === 'function') {
        openAnalysisModal(currentDetailName, timeType, customStart, customEnd);
    }
}
