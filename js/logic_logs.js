// ===========================================
// 逻辑模块：操作日志 (Logic Logs)
// 依赖全局变量：historyData, students, CONFIG
// 依赖全局函数：saveData, refreshUI, openStudentDetail, showToast, formatAnyTime
// ===========================================

/**
 * 打开全校操作日志弹窗
 * 说明：此函数会动态构建搜索栏和表格容器
 */
function openLogModal() {
    const modal = document.querySelector('#logModal .modal');
    // 1. 设置弹窗大小
    modal.className = "modal modal-normal"; 
    modal.style.width = "850px";            
    modal.style.height = "85vh";        
    modal.style.maxHeight = "85vh";

    const container = document.getElementById('logListContainer');
    
    // 强制样式调整
    container.style.overflow = "hidden";       
    container.style.display = "flex";          
    container.style.flexDirection = "column";  
    container.style.height = "100%";           

    // 2. 构建内部界面 (搜索栏 + 表格区)
    container.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px; gap: 10px; background:#FFFBF7; padding:8px; border-radius:8px; border:1px dashed #FFCCBC; flex-shrink: 0;">
            <div style="flex:1;">
                <input type="text" id="logSearchName" class="form-input" 
                       style="height: 36px; font-size: 13px; width: 100%;" 
                       placeholder="🔍 搜姓名..." oninput="renderLogTable()">
            </div>
            <div style="position: relative;">
                <input type="date" id="logSearchDate" class="form-input" 
                       style="height: 36px; font-size: 13px; width: 130px; cursor: pointer;" 
                       onchange="renderLogTable()" 
                       onclick="try{this.showPicker()}catch(e){}">
            </div>
            <button onclick="document.getElementById('logSearchName').value='';document.getElementById('logSearchDate').value='';renderLogTable()" 
                    style="height: 36px; padding: 0 15px; border-radius: 8px; border: 1px solid #FFCCBC; background: white; color: #FF7043; cursor: pointer; font-size: 13px; white-space:nowrap;">
                重置
            </button>
        </div>
        <div style="flex: 1; overflow-y: auto; border: 1px solid #FFEEE4; border-radius: 12px; min-height: 0;">
            <table class="data-table" style="width:100%">
                <thead style="position: sticky; top: 0; z-index: 10;">
                    <tr>
                        <th width="100">操作日期</th>
						<th width="100">记分日期</th>
                        <th width="100">姓名</th>
                        <th>事项</th>
                        <th>变动</th>
                        <th width="80">操作</th>
                    </tr>
                </thead>
                <tbody id="logTableBody"></tbody>
            </table>
        </div>
    `;
    
    renderLogTable();
    document.getElementById('logModal').style.display = 'flex';
}

/**
 * 渲染日志表格 (支持筛选：姓名、日期、以及当前选中的班级)
 */
function renderLogTable() {
    const tbody = document.getElementById('logTableBody');
    const searchName = document.getElementById('logSearchName').value.trim().toLowerCase();
    const searchDate = document.getElementById('logSearchDate').value; 

    // 1. 获取主界面当前选中的班级
    const classSelect = document.getElementById('ClassSelect');
    const selectedClass = classSelect ? classSelect.value : 'all';

    // 2. 核心优化：如果是特定班级，用 Set 生成“白名单”，查找速度极快
    let validStudentNames = null;
    if (selectedClass !== 'all') {
        validStudentNames = new Set(
            students
                .filter(s => s.className === selectedClass)
                .map(s => s.name)
        );
    }

    tbody.innerHTML = '';

    // 3. 映射原始索引并过滤
    const filteredData = historyData.map((item, index) => ({...item, originalIndex: index}))
        .filter(h => {
            // 姓名筛选
            if (searchName && !h.name.toLowerCase().includes(searchName)) return false;
            // 日期筛选
            if (searchDate && !h.time.startsWith(searchDate)) return false;
            
            // ✅ 班级筛选 (高性能版)
            // 如果白名单存在，且该名字不在 Set 里 -> 过滤掉
            if (validStudentNames && !validStudentNames.has(h.name)) return false;

            return true;
        });

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="color: #999; padding: 20px;">没有找到相关记录</td></tr>';
        return;
    }

    // 4. 渲染表格行
    filteredData.forEach(h => {
        const tr = document.createElement('tr');

        // 已撤销样式
        if (h.revoked) {
            tr.style.color = '#aaa';              
            tr.style.textDecoration = 'line-through'; 
            tr.style.opacity = '0.6';             
        }

        let changeText = '';
        if (h.expChange > 0) changeText += `<span style="font-size:12px; color:#795548; margin-right:5px;">Exp+${h.expChange}</span>`;
        if (h.pointsChange !== 0) {
            const color = h.pointsChange > 0 ? '#2E7D32' : '#C62828';
            const sign = h.pointsChange > 0 ? '+' : '';
            changeText += `<span style="font-weight:bold; color:${color}; font-size:13px;">🪙${sign}${h.pointsChange}</span>`;
        }

        const timeParts = h.time.split(' ');
        const dateStr = timeParts[0] || h.time;
        const timeStr = timeParts[1] || '';
        
        // 1. 操作时间 (更紧凑，灰字显示秒)
        const timeDisplay = `
            <div style="line-height: 1.2;">
                <div style="font-size: 12px; color: #999;">${dateStr}</div>
                <div style="font-size: 13px; font-weight: bold; color: #5D4037;">${timeStr}</div>
            </div>`;

        // 2. 记分日期 (targetDate) 处理
        // 如果数据是旧的没有 targetDate，就暂且用 dateStr (操作日) 代替，或者显示 '-'
        const targetDateShow = h.targetDate || dateStr; 
        
        // 不再判断日期是否一致，统一样式
        const dateStyle = 'color: #5D4037; font-size: 13px; text-align: center;';

        tr.innerHTML = `
            <td style="padding: 6px 10px;">${timeDisplay}</td>
            <td style="font-size: 13px; text-align: center;">
                <span style="${dateStyle}">${targetDateShow}</span>
            </td>
            <td style="font-size:14px;">${h.name}</td>
            <td style="font-size:13px;">${h.subject}</td>
            <td>${changeText}</td>
            <td>
                ${h.revoked 
                    ? '<span style="color:#ccc; font-size:13px;">已撤销</span>' 
                    : `<button class="btn-revoke" onclick="revokeHistoryItem(${h.originalIndex})" style="margin:0; padding: 6px 15px; font-size: 13px;">撤销</button>`}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// logic_logs.js - 核心撤销函数
function revokeHistoryItem(index) {
    const record = historyData[index];
    if (!record || record.revoked) return;

    // 提示语优化
    const typeStr = record.pointsChange > 0 ? '奖励' : (record.isExchange ? '消费' : '惩罚');
    if (!confirm(`⚠️ 确定要撤销这条 [${typeStr}] 记录吗？\n\n[${record.time}] ${record.name}\n${record.subject}: ${record.pointsChange}积分\n\n撤销将自动回滚数值。`)) return;

    const idx = students.findIndex(s => s.name === record.name);
    if (idx === -1) return alert("找不到该学生，无法撤销");

    const student = students[idx];

    // 1. 回滚可用积分 (钱包)
    // 原来-10，现在-(-10)=+10；原来+10，现在-(+10)=-10
    student.currentPoints -= record.pointsChange;

    // 2. 回滚累计积分
    // 只有当初动了累计积分的，现在才要动回来
    // 商城消费(isExchange)当初没动累计，所以这里不回滚
    if (!record.isExchange) {
        if(student.accumulatedPoints === undefined) student.accumulatedPoints = 0;
        
        // 喂养奖励：pointsChange是正，这里减去 (rank下降)
        // 喂养惩罚：pointsChange是负，这里减去负数 (rank上升)
        student.accumulatedPoints -= record.pointsChange;
    }

    // 3. 回滚经验 (只有当初加了经验的才回滚)
    if (record.expChange > 0) {
        student.exp -= record.expChange;
        student.totalPoints = (student.totalPoints || 0) - record.expChange;

        // 循环降级逻辑
        while (student.exp < 0) {
            if (student.level > 1) {
                student.level -= 1;
                student.exp += CONFIG.pointsPerLevel;
            } else {
                student.exp = 0; // 最低0级0经验
                break;
            }
        }
    }

    // 4. 标记删除
    record.revoked = true;
    
    saveData();
    refreshUI();
    
    // 刷新界面
    if(document.getElementById('logModal') && document.getElementById('logModal').style.display === 'flex') renderLogTable();
    if(document.getElementById('detailModal') && document.getElementById('detailModal').style.display === 'flex') openStudentDetail(student.name);

    showToast("🗑️ 记录已撤销");
}