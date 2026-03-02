/**
 * =============================================================
 * 📊 萌宠成绩养成记 - 数据分析中心逻辑插件 (Logic_Chat.js)
 * =============================================================
 */

let currentAnaTab = 'student';

/**
 * 【核心计算引擎：同步三重判定口径 & 复合分组 & 排名计算】
 */
function getAnalysisData(type, targetName, rangeType) {
    const allStus = students || [];
    const allLogs = historyData || [];
    
    // --- 1. 基础时间获取 (调用通用函数) ---
    const startVal = document.getElementById('ana_startDate') ? document.getElementById('ana_startDate').value : "";
    const endVal = document.getElementById('ana_endDate') ? document.getElementById('ana_endDate').value : "";
    
    const dateObj = getCommonDateRange(rangeType, startVal, endVal);
    const startDate = dateObj.startDate; // 用于数据过滤的起始点
    const endDate = dateObj.endDate;     // 用于数据过滤的结束点
    let dateRangeText = dateObj.label;   // 默认文案 (稍后会根据需求覆盖)

    // --- 2. 辅助格式化函数 ---
    const formatShort = (d) => `${d.getMonth() + 1}月${d.getDate()}日`;
    const formatFull = (d) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;

    // --- 3. 针对特定类型的文案优化 (核心修改点) ---
    
    // 修正A：如果是“近一年”或“自定义”，强制显示年份
    if (rangeType === 'year' || rangeType === 'custom') {
        dateRangeText = `${formatFull(startDate)} ~ ${formatFull(endDate)}`;
    }

    let displayStartDateStr = "初始时刻"; // 图表X轴起点

    // 修正B：如果是“全部数据”，动态查找第一条记录的时间
    if (rangeType === 'all') {
         // 查找该对象的历史第一条记录
         const firstLog = allLogs.find(h => h.name === targetName || (type==='group' && allStus.find(s=>s.name===h.name)?.groupName===targetName));
         
         if(firstLog) {
             // 有记录：文案变成 "2023年9月1日 ~ 2024年1月18日"
             const firstTime = new Date(firstLog.time.replace(/-/g, '/'));
             const today = new Date();
             dateRangeText = `${formatFull(firstTime)} ~ ${formatFull(today)}`;
             
             // 图表X轴保持短日期
             let t = firstLog.time;
             displayStartDateStr = t.length > 10 ? t.substring(5, 10) : t;
         } else { 
             displayStartDateStr = "无记录"; 
             dateRangeText = "暂无历史数据";
         }
    } else {
         // 其他情况 (近7天/近一月) X轴显示短日期 MM-DD
         const m = String(startDate.getMonth() + 1).padStart(2, '0');
         const d = String(startDate.getDate()).padStart(2, '0');
         displayStartDateStr = `${m}-${d}`;
         
         // 近7天/近一月 保持通用函数返回的短日期文案(不含年)即可，显得简洁
         // 如果你也想让月度显示年份，可以在这里加: if(rangeType==='month') dateRangeText = ...
    }

    // --- 以下逻辑保持不变 ---

    function getAdjustedValue(log) {
        // 1. 第一优先级：如果是兑换，直接归零 (无视任何状态，包括是否撤销)
    if (log.subject && log.subject.includes("兑换")) return 0;

    let val = Number(log.pointsChange) || 0;

    // 2. 第二优先级：如果是撤销 (且不是兑换)，取反值
    if (log.revoked) return 0; 

    // 3. 正常情况：返回原始分值
    return val;
    }

    const targetNames = [];
    if (type === 'student') {
        targetNames.push(targetName);
    } else if (type === 'group') {
        const [cls, grp] = targetName.split('|');
        allStus.forEach(s => {
            if (s.className === cls && s.groupName === grp) targetNames.push(s.name);
        });
    } else if (type === 'class') {
        allStus.forEach(s => {
            if (s.className === targetName) targetNames.push(s.name);
        });
    }

    function calcRankChange() {
        const getScores = (isCurrent) => {
            let scoreMap = {};
            if (type === 'student') allStus.forEach(s => scoreMap[s.name] = s.accumulatedPoints || 0);
            else if (type === 'group') [...new Set(allStus.map(s=>`${s.className}|${s.groupName}`))].forEach(k => scoreMap[k] = 0);
            else [...new Set(allStus.map(s=>s.className))].forEach(c => scoreMap[c] = 0);

            if (type !== 'student') {
                allStus.forEach(s => {
                    let key = type === 'group' ? `${s.className}|${s.groupName}` : s.className;
                    if (key && scoreMap[key] !== undefined) scoreMap[key] += (s.accumulatedPoints || 0);
                });
            }

            if (!isCurrent) {
                allLogs.forEach(h => {
                    let hDate = new Date(h.time?.replace(/-/g, '/') || 0);
                    if (hDate >= startDate) {
                        let sObj = allStus.find(s => s.name === h.name);
                        if (sObj) {
                            let key = type === 'student' ? sObj.name : (type === 'group' ? `${sObj.className}|${sObj.groupName}` : sObj.className);
                            if (key && scoreMap[key] !== undefined) scoreMap[key] -= getAdjustedValue(h);
                        }
                    }
                });
            }
            return Object.entries(scoreMap).map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score);
        };

        const currentRanks = getScores(true);
        const pastRanks = getScores(false);
        const curPos = currentRanks.findIndex(i => i.name === targetName) + 1;
        const oldPos = pastRanks.findIndex(i => i.name === targetName) + 1;

        if (curPos === 0 || oldPos === 0) return { val: 0, text: "持平" };
        const diff = oldPos - curPos; 
        return { val: diff, text: diff === 0 ? "持平" : `${diff > 0 ? '↑' : '↓'} ${Math.abs(diff)}` };
    }
    
    let netPoints = 0, basePoints = 0;
    const filteredLogs = [];

    allLogs.forEach(h => {
        if (targetNames.includes(h.name)) {
            let hDate = new Date(String(h.time).replace(/-/g, '/') || 0);
            const adjVal = getAdjustedValue(h);

            if (hDate < startDate) basePoints += adjVal;
            else if (hDate <= endDate) {
                netPoints += adjVal;
                filteredLogs.push({ ...h, adjustedValue: adjVal });
            }
        }
    });

    return { 
        basePoints, 
        netPoints, 
        rankInfo: calcRankChange(), 
        logs: filteredLogs.sort((a,b)=>new Date(a.time)-new Date(b.time)), 
        targetStudents: allStus.filter(s => targetNames.includes(s.name)),
        startDateStr: displayStartDateStr,
        dateRangeText: dateRangeText // 返回优化后的文案
    };
}

/**
 * 【图表初始化与统计渲染】
 */
function initAllCharts() {
    const cardVal1 = document.getElementById('card_val_1');
    const cardVal2 = document.getElementById('card_val_2');
    const cardVal3 = document.getElementById('card_val_3');
    const cardLab1 = document.getElementById('card_lab_1');
    
    const name = cardVal1?.getAttribute('data-raw-name'); 
    const timeSelectEl = document.getElementById('ana_TimeSelect');
    const timeType = timeSelectEl.value;
    // --- 修改：不再从下拉框获取文本，而是等待 getAnalysisData 返回具体日期 ---
    // const timeLabel = timeSelectEl.options[timeSelectEl.selectedIndex].text; // 删除旧逻辑
    const activeTab = document.querySelector('.ana-tab.active');
    
    if (!name || !activeTab) return;

    const typeMap = { 'tab_ana_stu': 'student', 'tab_ana_grp': 'group', 'tab_ana_cls': 'class' };
    const type = typeMap[activeTab.id];
    
    const data = getAnalysisData(type, name, timeType);
    
    // --- 新增：使用计算出的具体日期范围作为图表副标题 ---
    const timeLabel = data.dateRangeText || "时间范围";

    if(cardLab1) cardLab1.innerText = type === 'student' ? "所属小组" : (type === 'group' ? "所属班级" : "班级人数");

    if(cardVal1) {
        if (type === 'student') {
            const s = students.find(item => item.name === name);
            cardVal1.innerHTML = `<small></small> ${s?.groupName || '未分配'}`;
        } else if (type === 'group') {
            const cls = name.split('|')[0];
            cardVal1.innerHTML = `<small></small> ${cls || '未分配'}`;
        } else {
            cardVal1.innerHTML = `<small></small> ${data.targetStudents.length} 位学员`;
        }
    }

    if(cardVal2) {
        const netVal = data.netPoints || 0;
        cardVal2.innerText = (netVal > 0 ? "+" : "") + netVal;
        cardVal2.style.setProperty('color', netVal > 0 ? '#4CAF50' : (netVal < 0 ? '#F44336' : '#5D4037'), 'important');
    }

    if(cardVal3) {
        const rVal = data.rankInfo.val || 0;
        cardVal3.innerText = data.rankInfo.text;
        cardVal3.style.setProperty('color', rVal > 0 ? '#4CAF50' : (rVal < 0 ? '#F44336' : '#5D4037'), 'important');
    }

    renderLineChart(data, name, timeLabel);
    renderBarChart(type, data, name, timeLabel);
}

/**
 * 【图表绘制核心逻辑】
 */
function renderLineChart(data, targetName, timeLabel) {
    const chartDom = document.getElementById('lineChart');
    if (!chartDom) return;
    const chart = echarts.getInstanceByDom(chartDom) || echarts.init(chartDom);
    
    // 1. 准备基础数据
    let current = data.basePoints; // 获取期初积分
    
    // 2.【核心修改】使用 Map 合并同一天的数据
    // 逻辑：循环所有记录，一直累加，但 Map 里只记录该日期 "最后" 的那个分数
    let dailyMap = new Map();
    
    data.logs.forEach(l => {
        current += l.adjustedValue; // 正常累加每一笔分数
        
        let timeStr = l.time;
        if(timeStr.length > 10) timeStr = timeStr.substring(5, 10); // 截取日期 "01-12"
        
        // set 操作会覆盖旧值，所以 dailyMap 里永远存的是该日期 累加完最后一笔后的 总分
        dailyMap.set(timeStr, current); 
    });

    // 3. 构建图表数组
    let xData = [data.startDateStr]; 
    let yData = [data.basePoints];

    dailyMap.forEach((score, dateStr) => {
        // 如果日志日期等于初始日期(例如都是01-12)，我们选择更新初始点，还是追加点？
        // 为了体现"当天变化"，如果初始就是01-12，我们追加一个点表示"01-12期末值"是合理的。
        // 但如果你非常介意X轴有两个01-12，可以把下面注释打开：
        
        /* 
        if (dateStr === data.startDateStr) {
            yData[0] = score; // 覆盖初始点
            return;
        } 
        */
       
        xData.push(dateStr); 
        yData.push(score);
    });

    chart.setOption({
        title: {
            text: (targetName.includes('|') ? targetName.split('|')[1] : targetName) + ' - 积分走势',
            subtext: '时间：' + timeLabel,
            left: 'center', top: '5%',
            textStyle: { color: '#E65100', fontWeight: 'bold' }
        },
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', top: '22%', bottom: '5%', containLabel: true },
        xAxis: { type: 'category', data: xData, boundaryGap: false, axisLabel: { fontSize: 10, color: '#999' } },
        yAxis: { type: 'value', scale: true },
        series: [{ 
            data: yData, type: 'line', smooth: true, symbolSize: 8,
            label: { show: true, position: 'top', color: '#FF9800', fontSize: 10 },
            lineStyle: { color: '#FFB74D', width: 3 },
            itemStyle: { color: '#FF9800' },
            areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0, color:'rgba(255,183,77,0.4)'},{offset:1, color:'rgba(255,183,77,0)'}]) }
        }]
    }, true);
}

function renderBarChart(type, data, targetName, timeLabel) {
    const chartDom = document.getElementById('barChart');
    if (!chartDom) return;
    const chart = echarts.getInstanceByDom(chartDom) || echarts.init(chartDom);
    
    if (data.logs.length === 0) { chart.clear(); return; }

    let stats = {};
    data.logs.forEach(l => {
		// 1. 兑换记录：不参与柱状图统计
        if (l.subject && l.subject.includes("兑换")) return;
		// 2. 撤销记录：建议保留！
        // 如果不加这行，当你把某个科目的分全撤销后，图表上还会留着该科目的名字（显示为0）
        if (l.revoked) return;
        let key = type === 'student' ? l.subject : (type === 'group' ? l.name : (students.find(s=>s.name===l.name)?.groupName || "未分配"));
        stats[key] = (stats[key] || 0) + l.adjustedValue;
    });

    const xKeys = Object.keys(stats);
    chart.setOption({
        title: {
            text: (targetName.includes('|') ? targetName.split('|')[1] : targetName) + ' - 积分详情',
            subtext: '时间：' + timeLabel, 
            left: 'center', top: '5%',
            textStyle: { color: '#E65100', fontWeight: 'bold', fontSize: 16 },
            subtextStyle: { color: '#666', fontSize: 12 }
        },
        tooltip: { trigger: 'item' },
        grid: { left: '3%', right: '4%', top: '22%', bottom: '10%', containLabel: true },
        xAxis: { 
            type: 'category', 
            data: xKeys, 
            axisLabel: { interval: 0, fontWeight: 'bold', color: '#6D4C41', fontSize: 11 } 
        },
        yAxis: { type: 'value', axisLabel: { color: '#999' } },
        series: [{ 
            type: 'bar', 
            barMaxWidth: 35,
            data: xKeys.map(key => {
                const val = stats[key];
                return {
                    value: val,
                    label: {
                        show: true,
                        position: val >= 0 ? 'top' : 'bottom', 
                        distance: 5,
                        color: val >= 0 ? '#FF9800' : '#78909C',
                        fontWeight: 'bold',
                        formatter: (p) => (p.value > 0 ? '+' : '') + p.value
                    },
                    itemStyle: {
                        color: val >= 0 ? '#FFB75E' : '#CFD8DC',
                        borderRadius: val >= 0 ? [10, 10, 0, 0] : [0, 0, 10, 10] 
                    }
                };
            })
        }]
    }, true);
}

/**
 * 【侧边栏列表渲染】
 */
function renderAnaStudentList(className) {
    const listEl = document.getElementById('ana_target_list');
    const timeType = document.getElementById('ana_TimeSelect').value;
    
    // 1. 获取全量数据并排序
    let pool = (students || [])
        .filter(s => (className === 'all' || s.className === className)) 
        .map(s => {
            const data = getAnalysisData('student', s.name, timeType);
            return { ...s, sortScore: data.netPoints };
        })
        .sort((a, b) => b.sortScore - a.sortScore); 

    // 2. 打排位标签 (这是真实的全局排名)
    pool.forEach((item, index) => { item.realRank = index + 1; });

    // 3. 【修改点】不再根据 keyword 过滤，直接渲染完整列表，交给前端去隐藏
    const displayList = pool; 

    // 新增：空数据提示
    if (displayList.length === 0) {
        listEl.innerHTML = `
            <div class="gd-rank-empty-tip">
                <strong>💡还没录入数据？</strong>
                <div style="margin-bottom: 8px;">当前还没有班级学生，无法生成分析图表：</div>
                <div>1.先点 <span style="font-weight:900; color:#5D4037;">⚙️设置</span> 搞定全局参数</div>
                <div>2.再去 <span style="font-weight:900; color:#5D4037;">🏫班级管理</span> 增加班级与学生</div>
            </div>`;
        return;
    }

    // 4. 渲染
    listEl.innerHTML = displayList.map(s => {
        const pet = getPetInfo(s);
        const rank = s.realRank;
        
        let rankContent;
        if (rank === 1) rankContent = '<span style="font-size: 20px;">🥇</span>';
        else if (rank === 2) rankContent = '<span style="font-size: 20px;">🥈</span>';
        else if (rank === 3) rankContent = '<span style="font-size: 20px;">🥉</span>';
        else rankContent = `<span style="font-size: 14px; font-weight: 900; color: #90A4AE;">${rank}</span>`;

        const scoreColor = s.sortScore >= 0 ? '#FF9800' : '#9E9E9E';
        
        // 注意：这里 class 必须包含 student-card，且增加了 data-name 用于自动定位
        return `
            <div class="student-card" data-name="${s.name}" onclick="switchAnaTarget('student', '${s.name}', this)" 
                 style="display: flex; align-items: center; justify-content: space-between; padding: 10px 15px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 24px; display:flex; justify-content:center; align-items:center; flex-shrink:0; font-size: 18px;">
                        ${rankContent}
                    </div>
                    <div class="rank-badge" style="position:relative; flex-shrink:0;">
                        ${pet.html}
                    </div>
                    <div class="card-info"><div class="card-name" style="font-weight: bold;">${s.name}</div></div>
                </div>
                <div style="font-size: 16px; color: ${scoreColor}; font-weight: 900; white-space: nowrap;">
                    ${s.sortScore >= 0 ? '+' : ''}${s.sortScore}
                </div>
            </div>`;
    }).join('');
}

function renderAnaGroupList(selectedClassName) {
    const listEl = document.getElementById('ana_target_list');
    const timeType = document.getElementById('ana_TimeSelect').value;
    
    // 1. 构建小组Key池
    let groupKeys = []; 
    students.forEach(s => {
        if (s.groupName && (selectedClassName === 'all' || s.className === selectedClassName)) {
            const key = `${s.className}|${s.groupName}`;
            if (!groupKeys.includes(key)) {
                groupKeys.push(key);
            }
        }
    });

    // 2. 计算与排序
    let pool = groupKeys.map(key => {
        const data = getAnalysisData('group', key, timeType);
        return { 
            key: key, 
            name: key.split('|')[1], 
            className: key.split('|')[0], 
            sortScore: data.netPoints 
        };
    }).sort((a, b) => b.sortScore - a.sortScore);

    // 3. 打标签
    pool.forEach((item, index) => { item.realRank = index + 1; });

    // 4. 【修改点】直接渲染全量
    const displayList = pool;

    // 5. 渲染
    listEl.innerHTML = displayList.map(g => {
        const rank = g.realRank;
        let rankContent;
        if (rank === 1) rankContent = '<span style="font-size: 20px;">🥇</span>';
        else if (rank === 2) rankContent = '<span style="font-size: 20px;">🥈</span>';
        else if (rank === 3) rankContent = '<span style="font-size: 20px;">🥉</span>';
        else rankContent = `<span style="font-size: 14px; font-weight: 900; color: #90A4AE;">${rank}</span>`;
        
        const scoreColor = g.sortScore >= 0 ? '#FF9800' : '#9E9E9E';
        return `
            <div class="student-card" onclick="switchAnaTarget('group', '${g.key}', this)" 
                 style="display: flex; align-items: center; justify-content: space-between; padding: 10px 15px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 24px; display:flex; justify-content:center; align-items:center; flex-shrink:0; font-size: 18px;">
                        ${rankContent}
                    </div>
                    <div class="card-info" style="display: flex; align-items: baseline; gap: 8px;">
                        <div class="card-name" style="font-weight: bold;">${g.name}</div>
                        <div style="font-size:12px; color:#1976D2; opacity: 0.7;">${g.className}</div>
                    </div>
                </div>
                <div style="font-size: 16px; color: ${scoreColor}; font-weight: 900;">
                    ${g.sortScore >= 0 ? '+' : ''}${g.sortScore}
                </div>
            </div>`;
    }).join('');
}

function renderAnaClassList() {
    const listEl = document.getElementById('ana_target_list');
    const timeType = document.getElementById('ana_TimeSelect').value;
    
    // 1. 构建班级池
    const classes = [...new Set(students.map(s => s.className))].filter(c => c);
    
    // 2. 计算与排序
    let pool = classes.map(c => {
        const data = getAnalysisData('class', c, timeType);
        return { 
            name: c, 
            sortScore: data.netPoints, 
            count: data.targetStudents.length 
        };
    }).sort((a, b) => b.sortScore - a.sortScore);

    // 3. 打标签
    pool.forEach((item, index) => { item.realRank = index + 1; });

    // 4. 【修改点】直接渲染全量
    const displayList = pool;

    // 5. 渲染
    listEl.innerHTML = displayList.map(c => {
        const rank = c.realRank;
        let rankContent;
        if (rank === 1) rankContent = '<span style="font-size: 20px;">🥇</span>';
        else if (rank === 2) rankContent = '<span style="font-size: 20px;">🥈</span>';
        else if (rank === 3) rankContent = '<span style="font-size: 20px;">🥉</span>';
        else rankContent = `<span style="font-size: 14px; font-weight: 900; color: #90A4AE;">${rank}</span>`;

        const scoreColor = c.sortScore >= 0 ? '#FF9800' : '#9E9E9E';
        return `
            <div class="student-card" onclick="switchAnaTarget('class', '${c.name}', this)" 
                 style="display: flex; align-items: center; justify-content: space-between; padding: 10px 15px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 24px; display:flex; justify-content:center; align-items:center; flex-shrink:0; font-size: 18px;">
                        ${rankContent}
                    </div>
                    <div class="card-info" style="display: flex; align-items: baseline; gap: 8px;">
                        <div class="card-name" style="font-weight: bold;">${c.name}</div>
                        <div style="font-size:12px; color:#1976D2; opacity: 0.7;">${c.count}人</div>
                    </div>
                </div>
                <div style="font-size: 16px; color: ${scoreColor}; font-weight: 900;">
                    ${c.sortScore >= 0 ? '+' : ''}${c.sortScore}
                </div>
            </div>`;
    }).join('');
}

/**
 * 【纯前端搜索：UI显隐控制】
 * 终极版：使用 setProperty + important 暴力强制显隐
 * 解决“逻辑对了但界面没反应”的问题
 */
function filterAnalysisList() {
    const input = document.getElementById('ana_sidebar_Search');
    if (!input) return;
    
    // 1. 获取关键词 (转小写，去空格)
    const filter = input.value.trim().toLowerCase();
    
    // 2. 获取容器下所有的卡片元素
    const listContainer = document.getElementById('ana_target_list');
    const cards = listContainer.querySelectorAll('.student-card');

    cards.forEach(card => {
        // 获取卡片可见文本 (包含名字、排名、分数等)
        const text = (card.innerText || card.textContent).toLowerCase();
        
        // 3. 匹配逻辑
        if (text.includes(filter)) {
            // 匹配成功：强制恢复为 flex 布局，且加权
            card.style.setProperty('display', 'flex', 'important');
        } else {
            // 匹配失败：强制隐藏，且加权！
            // 既然输入 'z' 这种不存在的字，我就必须让你消失
            card.style.setProperty('display', 'none', 'important');
        }
    });
}

/**
 * 打开分析模态框 (支持带参数跳转)
 * 修改：增加自动识别是“学生”还是“小组”的逻辑
 */
function openAnalysisModal(targetName = null, timeType = 'week', cStart = '', cEnd = '') {
    // 1. 切换视图
    document.querySelector('.ranking-panel:not(#ana_left_panel)').style.display = 'none';
    document.querySelector('.list-panel:not(#ana_right_panel)').style.display = 'none';
    document.getElementById('ana_left_panel').style.display = 'flex';
    document.getElementById('ana_right_panel').style.display = 'flex';
    
    initAnalysisFilters();
    
    // 【关键修改】只重置样式和值，绝对不再绑定 oninput
    const searchInput = document.getElementById('ana_sidebar_Search');
    if (searchInput) {
        searchInput.style.paddingLeft = '32px'; 
        searchInput.value = ''; 
    }

    // 2. 同步时间设置
    const timeSelect = document.getElementById('ana_TimeSelect');
    if (timeSelect) {
        timeSelect.value = timeType;
        
        if (timeType === 'custom') {
            document.getElementById('ana_customDateArea').style.display = 'block';
            if (cStart) document.getElementById('ana_startDate').value = cStart;
            if (cEnd) document.getElementById('ana_endDate').value = cEnd;
        } else {
            document.getElementById('ana_customDateArea').style.display = 'none';
        }
    }

    // 3. 智能判断 Tab 类型
    let targetType = 'student';
    if (targetName && targetName.includes('|')) {
        targetType = 'group';
    }

    // 切换到对应 Tab
    switchAnaTab(targetType, targetName);
}

function switchAnaTab(type, targetName = null) {
    currentAnaTab = type;
    document.querySelectorAll('.ana-tab').forEach(el => el.classList.remove('active'));
    
    const tabId = { 'student': 'tab_ana_stu', 'group': 'tab_ana_grp', 'class': 'tab_ana_cls' }[type];
    document.getElementById(tabId).classList.add('active');
    
    // 切换Tab时，清空搜索框并重置placeholder
    const searchInput = document.getElementById('ana_sidebar_Search');
    if (searchInput) {
        searchInput.value = ''; 
        const tips = { 'student': '🔍 搜学生', 'group': '🔍 搜小组', 'class': '🔍 搜班级' };
        searchInput.placeholder = tips[type] || '🔍 搜索';
    }
    
    // 刷新页面数据 (此时会渲染全量列表)
    refreshAnalysisPage(true, targetName); 
}

/**
 * 刷新页面逻辑
 * @param {boolean} autoSelect - 是否执行自动选择
 * @param {string} targetName - 指定要选中的目标名字
 */
function refreshAnalysisPage(autoSelect = true, targetName = null) {
    const listEl = document.getElementById('ana_target_list');
    const classVal = document.getElementById('ana_sidebar_ClassSelect').value;
    
    // 渲染列表
    if (currentAnaTab === 'student') renderAnaStudentList(classVal);
    else if (currentAnaTab === 'group') renderAnaGroupList(classVal);
    else renderAnaClassList();
    
    // 【核心修改】自动选择逻辑
    if (autoSelect) {
        let targetCard = null;

        // 1. 如果有指定的人名，尝试找到它的卡片
        if (targetName) {
            // 使用我们刚才加的 data-name 属性来精确查找
            targetCard = listEl.querySelector(`.student-card[data-name="${targetName}"]`);
        }

        // 2. 如果没找到指定的人（或者没传人名），则默认选第一个
        if (!targetCard) {
            targetCard = listEl.querySelector('.student-card');
        }

        // 3. 执行点击
        if (targetCard) {
            targetCard.click();
            // 可选：让列表滚动到这个卡片的位置
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function switchAnaTarget(type, name, el) {
    document.querySelectorAll('#ana_target_list .student-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('card_val_1').setAttribute('data-raw-name', name);
    // document.getElementById('ana_MainTitle').innerText = `📊 ${(name.includes('|')?name.split('|')[1]:name)} 数据分析`;
    initAllCharts(); 
}

function initAnalysisFilters() {
    const main = document.getElementById('classSelect');
    const ana = document.getElementById('ana_sidebar_ClassSelect');
    if(main && ana) { ana.innerHTML = main.innerHTML; ana.value = main.value;; }
}

function closeChatAnalysis() {
    document.getElementById('ana_left_panel').style.display = 'none';
    document.getElementById('ana_right_panel').style.display = 'none';
    document.querySelector('.ranking-panel:not(#ana_left_panel)').style.display = 'flex';
    document.querySelector('.list-panel:not(#ana_right_panel)').style.display = 'flex';
}

function exportSingleChart(domId) {
    const chart = echarts.getInstanceByDom(document.getElementById(domId));
    if (!chart) return;
    const link = document.createElement('a');
    link.download = `${document.getElementById('ana_MainTitle').innerText}_${domId}.png`;
    link.href = chart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' });
    link.click();
}

function downloadAllCharts() {
    const l = echarts.getInstanceByDom(document.getElementById('lineChart'));
    const b = echarts.getInstanceByDom(document.getElementById('barChart'));
    if(!l || !b) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const i1 = new Image(), i2 = new Image();
    i1.onload = () => {
        i2.onload = () => {
            canvas.width = i1.width; canvas.height = i1.height + i2.height;
            ctx.fillStyle = "#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.drawImage(i1, 0, 0); ctx.drawImage(i2, 0, i1.height);
            const link = document.createElement('a');
            link.download = `分析报告_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        };
        i2.src = b.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' });
    };
    i1.src = l.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' });
}

function handleAnaTimeChange() {
    const timeSelect = document.getElementById('ana_TimeSelect');
    const customArea = document.getElementById('ana_customDateArea');
    if (timeSelect.value === 'custom') {
        customArea.style.display = 'block'; 
    } else {
        customArea.style.display = 'none';
        refreshAnalysisPage(true); // 改变时间范围时自动重新选择
    }
}

function applyAnaCustomDate() {
    const start = document.getElementById('ana_startDate').value;
    const end = document.getElementById('ana_endDate').value;
    if (!start || !end) {
        alert("请选择起止日期");
        return;
    }
    // document.getElementById('ana_customDateArea').style.display = 'none';
    refreshAnalysisPage(true); 
}