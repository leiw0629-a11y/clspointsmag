

// ===========================================
// 逻辑模块：右侧主列表 & 筛选 (Logic Table)
// 依赖全局变量：students, historyData, CONFIG
// 依赖全局函数：getPetInfo, openStudentDetail, openSingleFeed
// ===========================================

/**
 * 🎨 颜色生成器 (增强版：防撞色)
 * 逻辑：使用更剧烈的位运算(XOR + 乘法)，确保“三年二班”和“四年一班”算出截然不同的颜色
 */
function getGroupStyle(className, groupName) {
    // 1. 未分组：灰色
    if (!groupName || groupName === '未分组') {
        return 'background-color: #F2F3F5; color: #999999; border: 1px solid #E5E6EB;';
    }

    // 2. 唯一ID (班级+组名)
    const seed = (className || '') + '_' + groupName;

    // 3. 【核心修改】使用更强力的哈希算法 (FNV-1a 变体)
    // 目的是让相似的字符串（如三年二班、四年一班）产生巨大的数值差异
    let hash = 2166136261; // 初始质数基底
    for (let i = 0; i < seed.length; i++) {
        hash ^= seed.charCodeAt(i); // 异或运算：打乱二进制位
        hash = Math.imul(hash, 16777619); // 乘以大质数：放大差异
    }

    // 4. 生成 HSL
    // 使用 hash 的绝对值对 360 取模，得到色相
    const h = Math.abs(hash % 360); 
    
    // 5. 额外技巧：根据 hash 的奇偶微调饱和度和亮度，进一步增加差异感
    // 如果 hash 是偶数，饱和度 85%，亮度 94%
    // 如果 hash 是奇数，饱和度 80%，亮度 91%
    const isEven = (hash % 2 === 0);
    const s = isEven ? 85 : 80;
    const l = isEven ? 94 : 91;

    // 6. 返回样式
    // 边框比背景深 10% - 15%，保证轮廓清晰
    return `background-color: hsl(${h}, ${s}%, ${l}%); color: #5D4037; border: 1px solid hsl(${h}, ${s}%, ${l - 12}%);`;
}


// 1. 初始化班级下拉框
function initClassOptions() {
    const select = document.getElementById('classSelect');
    if (!select) return;

    const classes = [...new Set(students.map(s => s.className).filter(c => c))]; 
    let currentVal = select.value;

    select.innerHTML = '<option value="all">全部班级</option>';
    classes.forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls;
        opt.textContent = cls;
        select.appendChild(opt);
    });

    if (classes.length > 0) {
        if (currentVal === 'all' || !classes.includes(currentVal)) {
            select.value = classes[0];
        } else {
            select.value = currentVal;
        }
    } else {
        select.value = classes[0];
    }
	document.getElementById('timeSelect').value = 'week';
}

// 2. 处理时间下拉框变化
function handleTimeChange() {
    const timeType = document.getElementById('timeSelect').value;
    const customArea = document.getElementById('customDateArea');
    
    if (timeType === 'custom') {
        customArea.style.display = 'block';
    } else {
        customArea.style.display = 'none';
        renderMainTable();
        // 🌟 联动左侧
        if(typeof applyRankFilter === 'function') applyRankFilter();
    }
}

// 3. 处理自定义时间点击“确定”
function applyCustomDate() {
    const startStr = document.getElementById('startDate').value;
    const endStr = document.getElementById('endDate').value;

    if (!startStr || !endStr) {
        showToast("⚠️ 请完整选择开始和结束日期");
        return;
    }
    if (startStr > endStr) {
        showToast("⚠️ 开始日期不能晚于结束日期");
        return;
    }
    renderMainTable();
    // 🌟 联动左侧
    if(typeof applyRankFilter === 'function') applyRankFilter();
    // document.getElementById('customDateArea').style.display = 'none';
}

/**
 * 核心渲染表格函数
 * 逻辑升级：
 * 1. 标题文字：调用 getCommonDateRange 实现与报表完全一致的日期显示（含年份/起止处理）。
 * 2. 数据筛选：直接使用 startDate/endDate 进行时间比对，保证数据与报表 100% 对齐。
 * 3. 样式优化：区间积分显示+/-号及红绿配色，可用积分默认金黄，负数变红。
 */
function renderMainTable() {
    const tbody = document.getElementById('mainTableBody');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const selectedClass = document.getElementById('classSelect').value;
    const timeType = document.getElementById('timeSelect').value;
    const customStart = document.getElementById('startDate').value;
    const customEnd = document.getElementById('endDate').value;

    const statusSpan = document.getElementById('statusText');
    const totalHeader = document.getElementById('totalScoreHeader');

    // --- 1. 获取统一的时间范围 ---
    const dateObj = getCommonDateRange(timeType, customStart, customEnd);
    const startDate = dateObj.startDate;
    const endDate = dateObj.endDate;
    let timeLabel = dateObj.label;

    // --- 2. 优化标题显示文案 ---
    const formatFull = (d) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    
    if (timeType === 'all') {
        totalHeader.innerText = '总积分▼';
        totalHeader.style.color = ''; // 默认颜色
        
        if (historyData && historyData.length > 0) {
            const firstLog = historyData.reduce((prev, curr) => {
                // 【同步修改】比较 earliest targetDate
                const prevDate = prev.targetDate || prev.time;
                const currDate = curr.targetDate || curr.time;
                return (prevDate < currDate) ? prev : curr;
            });
            const firstDate = new Date((firstLog.targetDate || firstLog.time).replace(/-/g, '/'));
            const today = new Date();
            timeLabel = `${formatFull(firstDate)} ~ ${formatFull(today)}`;
        } else {
            timeLabel = "暂无历史数据";
        }
    } else {
        totalHeader.innerText = '净增积分▼';
        totalHeader.style.color = '#1ABC9C'; // 绿色区分区间模式
        
        if (timeType === 'custom' || timeType === 'year') {
            timeLabel = `${formatFull(startDate)} ~ ${formatFull(endDate)}`;
        }
    }

    statusSpan.textContent = `${selectedClass === 'all' ? '全部班级' : selectedClass} | ${timeLabel}`;

    tbody.innerHTML = '';

    // --- 3. 数据计算逻辑 ---
    let displayList = students.map((stu, index) => {
        let dynamicScore = 0;
        
        if (timeType === 'all') {
            dynamicScore = stu.accumulatedPoints !== undefined ? stu.accumulatedPoints : (stu.totalPoints || 0);
        } else {
            historyData.forEach(log => {
                if (log.name === stu.name) {
					let dateString = log.targetDate || log.time;
					
                    let logTime = new Date(dateString.replace(/-/g, '/'));
                    if (logTime >= startDate && logTime <= endDate) {
                        if (log.revoked) {
                            // dynamicScore -= (log.pointsChange || 0);
                        } else if (log.subject && log.subject.includes("兑换")) {
                            // dynamicScore += Math.abs(log.pointsChange || 0);
                        } else {
                            dynamicScore += (log.pointsChange || 0);
                        }
                    }
                }
            });
        }
        
        const walletBalance = stu.currentPoints !== undefined ? stu.currentPoints : (stu.totalPoints || 0);

        return { 
            ...stu, 
            dynamicScore: dynamicScore, 
            walletBalance: walletBalance, 
            originalIndex: index 
        };
    });

    // 4. 排序
    displayList.sort((a, b) => b.dynamicScore - a.dynamicScore);

    // 5. 渲染表格行
    let rankCounter = 1; 

    displayList.forEach((stu) => {
        // --- 筛选逻辑 (必须在 rankCounter 累加前) ---
        // if (searchTerm && !stu.name.toLowerCase().includes(searchTerm)) return;
        if (selectedClass !== 'all' && stu.className !== selectedClass) return;

        // 确定当前有效排名
        const currentRank = rankCounter++;

        // 基础数据准备
        const pet = getPetInfo(stu);
        const percent = Math.min(100, (stu.exp / CONFIG.pointsPerLevel) * 100);

        // 积分显示逻辑
        let dynamicColor, dynamicText;
        if (timeType === 'all') {
            dynamicColor = '#F57C00';
            dynamicText = `💰 ${stu.dynamicScore}`;
        } else {
            if (stu.dynamicScore > 0) {
                dynamicColor = '#2E7D32';
                dynamicText = `💰 +${stu.dynamicScore}`;
            } else if (stu.dynamicScore < 0) {
                dynamicColor = '#D32F2F';
                dynamicText = `💰 ${stu.dynamicScore}`;
            } else {
                dynamicColor = '#5D4037';
                dynamicText = `💰 ${stu.dynamicScore}`;
            }
        }
        const walletColor = stu.walletBalance < 0 ? '#D32F2F' : '#F57C00';

        // 小组胶囊 + 班级名称显示逻辑
        const groupName = stu.groupName || '未分组';
        const groupStyle = getGroupStyle(stu.className, stu.groupName);
        const capsuleHtml = `<span class="status-tag" style="${groupStyle}">${groupName}</span>`;
        
        let finalGroupDisplay = capsuleHtml; 
        if (selectedClass === 'all') {
            finalGroupDisplay = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; line-height:1;">
                ${capsuleHtml}
                <span style="font-size:12px; color:#5D4037; margin-top:3px; transform:scale(0.95); white-space:nowrap; opacity: 0.8;">
                    ${stu.className}
                </span>
            </div>`;
        }

        // --- 排名样式逻辑 ---
        let rankDisplayHtml = '';
        if (currentRank === 1) {
            rankDisplayHtml = `<span style="font-size: 26px;">🥇</span>`;
        } else if (currentRank === 2) {
            rankDisplayHtml = `<span style="font-size: 26px;">🥈</span>`;
        } else if (currentRank === 3) {
            rankDisplayHtml = `<span style="font-size: 26px;">🥉</span>`;
        } else {
            rankDisplayHtml = `
            <div style="width: 24px; height: 24px; line-height: 24px; border-radius: 50%; background-color: #F2F3F5; color: #5D4037; font-weight: bold; font-size: 13px; margin: 0 auto; text-align: center;">
                ${currentRank}
            </div>`;
        }

        // 生成表格行
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="vertical-align: middle; text-align: center;">${rankDisplayHtml}</td>
            <td style="font-weight:bold;">${stu.name}</td>
            
            <td style="vertical-align: middle;">
                ${finalGroupDisplay}
            </td>
            
            <td style="cursor: help;" title="${pet.title}">${pet.html}</td>
            
            <td style="padding: 8px 15px;">
                <div style="width:120px; height:8px; background:#FFE0B2; border-radius:4px; overflow:hidden; margin: 0 auto 6px auto;">
                    <div style="width:${percent}%; height:100%; background:linear-gradient(90deg, #FF8A65, #FF5252);"></div>
                </div>
                <div style="font-size: 13px; color: #5D4037;">
                    <span style="font-weight:900; color:#FF8A65; margin-right:5px;">Lv.${stu.level}</span>
                </div>
            </td>
            
            <td style="font-weight:bold; color:${dynamicColor};">${dynamicText}</td>
            <td style="font-weight:bold; color:${walletColor};">🪙 ${stu.walletBalance}</td>
            
            <td style="display: flex; gap: 5px; justify-content: center; align-items: center; border-bottom: 1px solid #FFF3E0; padding: 12px 15px;">
                <button class="action-btn btn-detail" onclick="openStudentDetail('${stu.name}')">详情</button>
                <button class="action-btn btn-feed" onclick="openSingleFeed('${stu.name}')">喂养</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * 纯前端 UI 过滤：只隐藏/显示行，不重新渲染
 */
function filterTableBySearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tbody = document.getElementById('mainTableBody');
    const rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // 假设姓名在第二列 (index 为 1)
        const nameColumn = row.getElementsByTagName('td')[1]; 
        
        if (nameColumn) {
            const nameText = nameColumn.textContent || nameColumn.innerText;
            // 如果包含搜索词，显示；否则隐藏
            if (nameText.toLowerCase().includes(searchTerm)) {
                row.style.display = ""; 
            } else {
                row.style.display = "none";
            }
        }
    }
}
