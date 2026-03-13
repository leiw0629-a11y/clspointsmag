// ===========================================
// 逻辑模块：左侧小组PK榜 & 小组详情 (Logic Rank)
// Refactored Version (Renamed to avoid conflicts)
// ===========================================

// 全局变量
let currentGroupContext = null; 
let currentGroupFeedSub = null; 
let selectedAddCandidates = []; 

// 1. 排行榜筛选菜单切换 (保持不变)
function toggleRankFilter() {
    const p = document.getElementById('rankFilterPopover');
    if(p) p.style.display = (p.style.display === 'block') ? 'none' : 'block';
}

// 2. 设置排行榜时间范围 (保持不变)
function setRankTime(type, btn) {
    document.querySelectorAll('.v2-filter-tag').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    const customArea = document.getElementById('rankCustomDate');
    if(customArea) customArea.style.display = (type === 'custom') ? 'block' : 'none';
}

// 3. 渲染左侧排行榜 (保持不变)
function applyRankFilter() {
    const listEl = document.getElementById('rankingList');
    if(!listEl) return;
    listEl.innerHTML = '';
    
    const v2ClassSelect = document.getElementById('v2_ClassSelect'); 
    const timeSelect = document.getElementById('timeSelect') || document.getElementById('v2_TimeSelect');
    const selectedClass = v2ClassSelect ? v2ClassSelect.value : (document.getElementById('classSelect') ? document.getElementById('classSelect').value : 'all');
    const timeType = timeSelect ? timeSelect.value : 'all';
    const customStart = document.getElementById('startDate') ? document.getElementById('startDate').value : "";
    const customEnd = document.getElementById('endDate') ? document.getElementById('endDate').value : "";

    let groupMap = {};
    students.forEach(s => {
        if (s.groupName && (selectedClass === 'all' || s.className === selectedClass)) {
            const key = `${s.className}_${s.groupName}`;
            if (!groupMap[key]) groupMap[key] = { cls: s.className, group: s.groupName, score: 0 };
        }
    });

    if (timeType === 'all') {
        students.forEach(s => {
            const key = `${s.className}_${s.groupName}`;
            if (groupMap[key]) groupMap[key].score += (s.accumulatedPoints || 0);
        });
    } else {
        historyData.forEach(log => {
			const dateString = log.targetDate || log.time;
            if (isTimeInRange(dateString, timeType, customStart, customEnd)) {
                const stu = students.find(s => s.name === log.name);
                if (stu && stu.groupName && (selectedClass === 'all' || stu.className === selectedClass)) {
                    const key = `${stu.className}_${stu.groupName}`;
                    if (log.subject && log.subject.includes("兑换")) { /* skip */ } 
                    else if (log.revoked) {
                        // groupMap[key].score -= (log.pointsChange || 0);
                    } else {
                        groupMap[key].score += (log.pointsChange || 0);
                    }
                }
            }
        });
    }

    let rankData = Object.values(groupMap).sort((a, b) => b.score - a.score);
	
	// ===========================================
    // 修改开始：直接在这里判断并渲染小贴士
    // ===========================================
    if (rankData.length === 0) {
        listEl.innerHTML = `
            <div class="gd-rank-empty-tip">
                <strong>💡 还没建立小组？</strong>
                <div style="margin-bottom: 8px;">当前班级还是空的呢，快使用小助手建立秩序吧：</div>
                
                <div>1.先点 <span style="font-weight:900; color:#5D4037;">⚙️设置</span> 搞定全局参数</div>
                <div>2.再去 <span style="font-weight:900; color:#5D4037;">🏫班级管理</span> 增加班级与小组</div>
                
                <div style="margin-top:8px; color:#FF9800; font-weight:bold;">( 操作按钮就在上方⚙/🏫)</div>
            </div>
        `;
        return;
    }
    // ===========================================

    rankData.forEach((item, index) => {
        let medal = (index === 0) ? '🥇' : (index === 1) ? '🥈' : (index === 2) ? '🥉' : `<span class="rank-number">${index+1}</span>`;
        const div = document.createElement('div');
        div.className = `student-card`;
        div.onclick = () => openGroupDetail(item.group, item.cls);
        div.innerHTML = `
            <div class="rank-badge ${index<3?'rank-'+(index+1):''}" style="font-size:18px; min-width:30px; text-align:center;">${medal}</div>
            <div class="card-info" style="display: flex; align-items: baseline; gap: 6px;">
            <div class="card-name">${item.group}</div>
            <div style="font-size:12px; color:#666; font-weight:normal;">${item.cls}</div>
        </div>
        <div class="card-score" style="font-weight:900; color:${item.score < 0 ? '#999' : '#F57C00'};">${item.score}</div>
    `;
    listEl.appendChild(div);
    });
	


}

// ==========================================
// 核心重构区域：打开小组详情弹窗
// ==========================================

/**
 * 4. 打开小组详情弹窗 (Main Function)
 */
function openGroupDetail(groupName, className) {
    if (!groupName) return;

    // 4.1 提取数据 (使用新函数名)
    const data = _getGroupDetailData(groupName, className);

    // 4.2 分别渲染四个部分 (使用新函数名，增加 'Group' 前缀以避免冲突)
    const leftPanelHtml = _renderGroupLeftPanel(data);
    const viewListHtml  = _renderGroupViewList(data);
    const viewFeedHtml  = _renderGroupViewFeed(); 
    const viewAddHtml   = _renderGroupViewAdd(data.groupName, data.className); 

    // 4.3 组装整体结构
    const contentHtml = `
        <div class="gd-container">
            <div class="gd-left-panel" style="background:transparent; padding:0; display:flex; flex-direction:column;">
                ${leftPanelHtml}
            </div>

            <div class="gd-right-panel" style="position: relative;">
                ${viewListHtml}
                ${viewFeedHtml}
                ${viewAddHtml}
            </div>
        </div>
    `;

    // 4.4 注入 DOM
    document.getElementById('groupModalTitle').innerHTML = `${groupName} <span style="font-size:12px; color:#666;">(${className})</span>`;
    document.getElementById('groupModalContent').innerHTML = contentHtml;
    document.getElementById('groupDetailModal').style.display = 'flex';
}

// ==========================================
// 内部 Helper 函数 (私有渲染逻辑 - 已重命名)
// ==========================================

/**
 * Helper: 计算所有需要的组数据
 * 重命名为: _getGroupDetailData
 */
function _getGroupDetailData(groupName, className) {
    // 1. 获取筛选条件
    const timeSelect = document.getElementById('timeSelect') || document.getElementById('v2_TimeSelect');
    const timeType = timeSelect ? timeSelect.value : 'all';
    const customStart = document.getElementById('startDate') ? document.getElementById('startDate').value : "";
    const customEnd = document.getElementById('endDate') ? document.getElementById('endDate').value : "";
    
    const v2ClassSelect = document.getElementById('v2_ClassSelect');
    const selectedClassFilter = v2ClassSelect ? v2ClassSelect.value : (document.getElementById('classSelect') ? document.getElementById('classSelect').value : 'all');
    const rankLabelText = (selectedClassFilter === 'all') ? "年级排名" : "班级排名";

    // 2. 锁定成员
    let members = students.filter(s => s.groupName === groupName && s.className === className);
    let memberNames = members.map(m => m.name);

    // 3. 计算数据 (总分, 区间分, 7天表现)
    let groupTotalScore = members.reduce((sum, m) => sum + (m.accumulatedPoints || 0), 0);
    let groupIntervalScore = 0;
    let recentGood = 0;
    let recentBad = 0;

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    historyData.forEach(log => {
        if (!memberNames.includes(log.name)) return;
		
		const dateString = log.targetDate || log.time;
        // 区间
        if (timeType !== 'all' && isTimeInRange(dateString, timeType, customStart, customEnd)) {
            if (log.subject && log.subject.includes("兑换")) { /* 忽略 */ }
            else if (log.revoked) { 
				// groupIntervalScore -= (log.pointsChange || 0); 
			}
            else { groupIntervalScore += (log.pointsChange || 0); }
        }
        // 7天
        let logTime = new Date(dateString.replace(/-/g, '/'));
        if (logTime >= sevenDaysAgo && logTime <= now) {
            if ((log.subject && log.subject.includes("兑换")) || log.revoked) { /* 忽略 */ }
            else {
                if ((log.pointsChange || 0) > 0) recentGood++;
                if ((log.pointsChange || 0) < 0) recentBad++;
            }
        }
    });

    // 4. 获取排名
    let rankVal = '-';
    const rankingListEl = document.getElementById('rankingList');
    if (rankingListEl) {
        const cards = rankingListEl.querySelectorAll('.student-card');
        for (let i = 0; i < cards.length; i++) {
            const cardName = cards[i].querySelector('.card-name');
            const cardText = cards[i].innerText || "";
            if (cardName && cardName.innerText === groupName && cardText.includes(className)) {
                rankVal = `No.${i + 1}`;
                break;
            }
        }
    }

    // 5. 组员统计列表
    let memberStats = members.map(m => {
        let contribution = 0;
        if (timeType === 'all') {
            contribution = m.accumulatedPoints !== undefined ? m.accumulatedPoints : (m.totalPoints || 0);
        } else {
            historyData.forEach(log => {
				const dateString = log.targetDate || log.time;
                if (log.name === m.name && isTimeInRange(dateString, timeType, customStart, customEnd)) {
                    if (log.subject && log.subject.includes("兑换")) return;
                    else if (log.revoked) {
                    // 【修正】：撤销记录不计入贡献
                    return; 
					}
                    else contribution += (log.pointsChange || 0);
                }
            });
        }
        let petInfo = typeof getPetInfo === 'function' ? getPetInfo(m) : { raw: "🐾" };
        return { name: m.name, pet: petInfo.raw, score: contribution };
    });
    memberStats.sort((a, b) => b.score - a.score);

    // 6. 时间文本
    const timeMap = { 'all': '全部时间', 'week': '近一周', 'month': '近一月', 'year': '近一年' };
    let timeText = timeType === 'custom' ? `${customStart}~${customEnd}` : (timeMap[timeType] || '全部时间');
    const tableHeaderLabel = timeType === 'all' ? '历史总分' : '净增积分';

    return {
        groupName, className,
        timeType, timeText, tableHeaderLabel,
        rankLabelText, rankVal,
        groupTotalScore, groupIntervalScore,
        recentGood, recentBad,
        memberStats
    };
}

/**
 * 渲染 HTML 1/4: 左侧面板
 * 重命名为: _renderGroupLeftPanel (避免与 logic_detail.js 冲突)
 */
function _renderGroupLeftPanel(data) {
    // 预处理显示字符串
    let intervalDisplayStr = "";
    if (data.timeType === 'all') {
        intervalDisplayStr = `<span style="font-size:14px; color:#999;">--</span>`;
    } else {
        if (data.groupIntervalScore > 0) intervalDisplayStr = `<span style="color:#4CAF50;">+${data.groupIntervalScore}</span>`;
        else if (data.groupIntervalScore < 0) intervalDisplayStr = `<span style="color:#F44336;">${data.groupIntervalScore}</span>`;
        else intervalDisplayStr = `<span style="color:#999;">0</span>`;
    }

    let recentDisplayStr = `
        <span style="color:#666;">👍</span><span style="color:#4CAF50; font-weight:bold; margin-left:2px;">${data.recentGood}</span>
        <span style="margin:0 4px; color:#ccc;">/</span>
        <span style="color:#666;">👎</span><span style="color:#F44336; font-weight:bold; margin-left:2px;">${data.recentBad}</span>
    `;

    return `
        <style>
            @keyframes floatTrophy {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-10px); } 100% { transform: translateY(0px); }
            }
        </style>
        <div style="flex: 4; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px 0;">
            <div style="font-size: 90px; line-height: 1.2; margin-bottom: 5px; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.15)); animation: floatTrophy 3s ease-in-out infinite;">
                🏆
            </div>
            
            <div id="group_rank_val" style="font-weight: 900; font-size: 24px; color: #5D4037; letter-spacing: 2px; margin-bottom: 2px;">
                ${data.rankVal}
            </div>
            
            <div style="font-size: 13px; color: #8D6E63; background: rgba(255,255,255, 0.8); padding: 2px 12px; border-radius: 12px; font-weight: bold;">
                ${data.rankLabelText}
            </div>
        </div>

        <div style="flex: 6; background: #FFFBF7; border: 1px solid #FFEEE4; border-radius: 20px; padding: 20px 15px; margin: 0 5px 10px 5px; display: flex; flex-direction: column; box-shadow: inset 0 0 6px rgba(255,238,228,0.3);">
            
            <div style="text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #FFE0B2; padding-bottom: 10px;">
                <div style="font-size: 12px; color: #8D6E63; font-weight: bold; margin-bottom: 0px;">总积分</div>
                <div id="group_total_score" style="font-size: 40px; font-weight: 900; color: #E65100; line-height: 1.2;">${data.groupTotalScore}</div>
            </div>

            <div style="display: flex; align-items: center; background: rgba(255,255,255,0.5); padding: 12px; border-radius: 10px; margin-bottom: 15px;">
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 11px; color: #8D6E63;">区间净增</div>
                    <div id="group_interval_score" style="font-size: 16px; font-weight: bold;">
                        ${intervalDisplayStr}
                    </div>
                </div>
                
                <div style="width: 1px; height: 20px; background: #FFE0B2;"></div>
                
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 11px; color: #8D6E63;">7天表现</div>
                    <div id="group_7day_stats" style="font-size: 14px;">
                        ${recentDisplayStr}
                    </div>
                </div>
            </div>

            <button onclick="showGroupFeed('${data.groupName}', '${data.className}')" 
                onmouseover="this.style.background='linear-gradient(135deg, #FF8A65 0%, #FF5722 100%)'; this.style.transform='scale(1.02)'"
                onmouseout="this.style.background='linear-gradient(135deg, #FF7043 0%, #F4511E 100%)'; this.style.transform='scale(1)'"
                style="width: 100%; background: linear-gradient(135deg, #FF7043 0%, #F4511E 100%); color: white; border: none; padding: 14px; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(244, 81, 30, 0.3); margin-bottom: 10px; transition: all 0.2s;">
                全组奖惩
            </button>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="jumpToGroupAnalysis('${data.groupName}', '${data.className}')" 
                    onmouseover="this.style.background='#FFF3E0'; this.style.borderColor='#FFB74D'"
                    onmouseout="this.style.background='#fff'; this.style.borderColor='#FFCCBC'"
                    style="flex: 1; background: #fff; border: 1px solid #FFCCBC; color: #FF7043; padding: 10px; border-radius: 8px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                    📊数据分析
                </button>
                <button onclick="showGroupAdd('${data.groupName}', '${data.className}')" 
                    onmouseover="this.style.background='#FFF3E0'; this.style.borderColor='#FFB74D'"
                    onmouseout="this.style.background='#fff'; this.style.borderColor='#FFCCBC'"
                    style="flex: 1; background: #fff; border: 1px solid #FFCCBC; color: #8D6E63; padding: 10px; border-radius: 8px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                    ➕增加组员
                </button>
            </div>

            <div style="margin-top: auto; padding-top: 10px; text-align: center;">
                <span onclick="dissolveGroup('${data.groupName}', '${data.className}')" 
                    style="font-size: 12px; color: #CFD8DC; cursor: pointer; text-decoration: underline;">
                    解散小组
                </span>
            </div>
        </div>
    `;
}

/**
 * 渲染 HTML 2/4: 右侧 - 组员列表视图
 * 重命名为: _renderGroupViewList
 */
function _renderGroupViewList(data) {
    const totalScoreInTable = data.memberStats.reduce((sum, m) => sum + (m.score > 0 ? m.score : 0), 0);

    let tableRowsHtml = data.memberStats.map((m, idx) => {
        let percentHtml = '';
        if (m.score < 0) {
            percentHtml = `<span style="font-size:12px; color:#999;">💪 加油</span>`;
        } else {
            let percent = totalScoreInTable > 0 ? Math.round((m.score / totalScoreInTable) * 100) : 0;
            if (percent > 100) percent = 100;
            percentHtml = `
                <div style="width:60px; height:6px; background:#FFE0B2; border-radius:3px; display:inline-block; vertical-align:middle; margin-right:5px;">
                    <div style="width:${percent}%; height:100%; background:#FF7043; border-radius:3px;"></div>
                </div>
                <span style="font-size:11px; color:#999;">${percent}%</span>
            `;
        }

        let rankClass = idx < 3 ? `gd-rank-${idx+1}` : '';
        let rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1;
        
        return `
            <tr>
                <td><span class="gd-rank-num ${rankClass}">${rankIcon}</span></td>
                <td style="font-weight:bold;">${m.name}</td>
                <td>
                    ${(typeof m.pet === 'string' && m.pet.match(/\.(png|jpg|gif)$/i)) 
                        ? `<img src="${m.pet}" style="width:20px;height:20px;">` 
                        : m.pet}
                </td>
                <td style="color:${m.score < 0 ? '#C62828' : '#E65100'}; font-weight:bold;">${m.score}</td>
                <td>${percentHtml}</td>
            </tr>
        `;
    }).join('');

    return `
        <div id="gd-view-list" style="display:flex; flex-direction:column; height:100%;">
            <div class="gd-panel-header">
                <span>📊 组内贡献榜</span>
                <span style="font-size:12px; color:#FF8A65;">范围：${data.timeText}</span>
            </div>
            <div class="gd-table-area">
                <table class="gd-table">
                    <thead>
                        <tr>
                            <th width="40">排名</th>
                            <th>姓名</th>
                            <th>形态</th>
                            <th>${data.tableHeaderLabel}</th>
                            <th width="80">占比</th>
                        </tr>
                    </thead>
                    <tbody>${tableRowsHtml}</tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * 渲染 HTML 3/4: 右侧 - 全组奖惩视图
 * 重命名为: _renderGroupViewFeed
 */
function _renderGroupViewFeed() {
    return `
        <div id="gd-view-feed" style="display:none; flex-direction:column; height:100%; background:#fff;">
            
            <div class="gd-panel-header" style="flex-shrink:0;">
                <span style="color:#E65100; font-weight:bold;">⚡ 全组批量奖惩</span>
                <button onclick="hideGroupFeed()" style="border:none; background:none; color:#8D6E63; cursor:pointer; font-size:13px;">❌ 取消</button>
            </div>
            
            <div style="flex: 1; display:flex; flex-direction:column; padding: 15px; overflow:hidden;">
                <div style="flex: 1; display:flex; flex-direction:column; gap: 10px; min-height: 0; margin-bottom: 10px;">
                    <div style="flex: 1; background: #F1F8E9; border: 1px solid #DCEDC8; border-radius: 12px; display:flex; flex-direction:column; overflow:hidden;">
                        <div style="padding: 10px 10px 5px 10px; color: #33691E; font-weight: bold; font-size: 13px; border-bottom: 1px dashed #AED581; flex-shrink:0;">🌟 加分科目</div>
                        <div id="groupFeedPosTags" style="flex:1; overflow-y:auto; overflow-x:hidden; padding:8px; display:flex; flex-wrap:wrap; align-content:flex-start; gap:6px;"></div>
                    </div>
                    <div style="flex: 1; background: #FFEBEE; border: 1px solid #FFCDD2; border-radius: 12px; display:flex; flex-direction:column; overflow:hidden;">
                        <div style="padding: 10px 10px 5px 10px; color: #C62828; font-weight: bold; font-size: 13px; border-bottom: 1px dashed #E57373; flex-shrink:0;">⚠️ 扣分科目</div>
                        <div id="groupFeedNegTags" style="flex:1; overflow-y:auto; overflow-x:hidden; padding:8px; display:flex; flex-wrap:wrap; align-content:flex-start; gap:6px;"></div>
                    </div>
                </div>
                <div style="height: 210px; flex-shrink: 0; background:#fff; border-radius:16px; padding:15px; text-align:center; border:1px solid #FFE0B2; box-shadow: 0 4px 12px rgba(230, 81, 0, 0.05); display:flex; flex-direction:column; justify-content:space-between;">
                    <div id="groupFeedSubLabel" style="font-size:14px; color:#8D6E63; font-weight:bold; margin-top:5px;">请选择科目</div>
                    <div style="display:flex; justify-content:center; align-items:baseline;">
                        <input type="tel" id="groupFeedScore" placeholder="0" oninput="handleGroupFeedInput(this)" style="width:140px; height:50px; font-size:42px; text-align:center; border:none; border-bottom:2px solid #E0E0E0; background:transparent; font-weight:900; color:#BDBDBD; outline:none; font-family:inherit;">
                    </div>
                    <div id="groupFeedPreview" style="height:20px; font-size:13px; color:#999;">等待输入...</div>
                    <button onclick="submitGroupFeed()" style="width:100%; background:linear-gradient(135deg, #FF7043 0%, #F4511E 100%); color:white; border:none; padding:12px; border-radius:10px; font-size:15px; font-weight:bold; cursor:pointer; box-shadow:0 4px 10px rgba(244, 81, 30, 0.3);">确认全组执行</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * 渲染 HTML 4/4: 右侧 - 添加组员视图
 * 重命名为: _renderGroupViewAdd
 */
function _renderGroupViewAdd(groupName, className) {
    return `
        <div id="gd-view-add" style="display:none; flex-direction:column; height:100%; background:#fff;">
            
            <div class="gd-panel-header" style="flex-shrink:0;">
                <span style="color:#E65100; font-weight:bold;">➕ 添加新组员</span>
                <button onclick="hideGroupAdd()" style="border:none; background:none; color:#8D6E63; cursor:pointer; font-size:13px;">❌ 取消</button>
            </div>
            
            <div style="padding:15px; background:#FFF8E1; border-bottom:1px solid #FFE0B2; font-size:12px; color:#666;">
                正在为 <strong style="color:#E65100;">${groupName}</strong> 选择组员，仅显示本班未分组学生。
            </div>

            <div id="groupAddContainer" style="flex: 1; overflow-y: auto; padding: 20px; display:flex; flex-wrap:wrap; align-content:flex-start; gap:10px;">
                </div>

            <div style="padding:15px; border-top:1px solid #FFE0B2; background:#fff; text-align:center;">
                    <button onclick="submitGroupAdd()" 
                    style="width:100%; background:linear-gradient(135deg, #FF7043 0%, #F4511E 100%); color:white; border:none; padding:12px; border-radius:10px; font-size:15px; font-weight:bold; cursor:pointer; box-shadow:0 4px 10px rgba(244, 81, 30, 0.3);">
                    确认添加选中学员
                </button>
            </div>
        </div>
    `;
}

// ===========================================
// 新增：全组奖惩逻辑函数 (保持逻辑不变)
// ===========================================

// 1. 显示全组奖惩界面
function showGroupFeed(groupName, className) {
    currentGroupContext = { group: groupName, cls: className };
    currentGroupFeedSub = null; 
    
    // 切换视图
    document.getElementById('gd-view-list').style.display = 'none';
    
    const addView = document.getElementById('gd-view-add');
    if(addView) addView.style.display = 'none'; 
    
    document.getElementById('gd-view-feed').style.display = 'flex';
    
    renderGroupFeedSubjects();
    
    const input = document.getElementById('groupFeedScore');
    if(input) {
        input.value = '';
        input.style.color = '#BDBDBD';
        input.style.borderBottomColor = '#E0E0E0';
    }
    document.getElementById('groupFeedSubLabel').innerText = '请选择科目';
    document.getElementById('groupFeedSubLabel').style.color = '#8D6E63';
    document.getElementById('groupFeedPreview').innerHTML = '等待输入...';
}

// 2. 隐藏全组奖惩界面
function hideGroupFeed() {
    document.getElementById('gd-view-list').style.display = 'flex';
    document.getElementById('gd-view-feed').style.display = 'none';
}

// 3. 渲染科目
function renderGroupFeedSubjects() {
    const posContainer = document.getElementById('groupFeedPosTags');
    const negContainer = document.getElementById('groupFeedNegTags');
    if (!posContainer || !negContainer) return;
    
    posContainer.innerHTML = '';
    negContainer.innerHTML = '';

    const getStyle = () => `
        padding: 6px 12px; border-radius: 50px; font-size: 13px; cursor: pointer;
        border: 1px solid #eee; background: #fff; color: #666; transition: all 0.2s; font-weight: bold;
    `;

    SUBJECT_LIST.forEach(sub => {
        const btn = document.createElement('div');
        btn.className = 'group-feed-tag';
        btn.style.cssText = getStyle();
        btn.innerText = sub.name;
        
        btn.onclick = () => {
            currentGroupFeedSub = sub;
            document.querySelectorAll('.group-feed-tag').forEach(t => {
                t.style.background = '#fff';
                t.style.color = '#666';
                t.style.borderColor = '#eee';
            });
            
            const isPos = sub.type === 1;
            btn.style.background = isPos ? '#E8F5E9' : '#FFEBEE';
            btn.style.color = isPos ? '#2E7D32' : '#C62828';
            btn.style.borderColor = isPos ? '#2E7D32' : '#C62828';
            
            const label = document.getElementById('groupFeedSubLabel');
            label.innerText = `已选：${sub.name} (${isPos ? '加分' : '扣分'})`;
            label.style.color = isPos ? '#2E7D32' : '#C62828';
            
            const input = document.getElementById('groupFeedScore');
            input.value = ''; 
            input.focus();
            handleGroupFeedInput(input);
        };

        if (sub.type === 1) posContainer.appendChild(btn);
        else negContainer.appendChild(btn);
    });
}

// 4. 输入处理
function handleGroupFeedInput(input) {
    if (!currentGroupFeedSub) return;
    
    let rawVal = input.value.replace(/[^0-9]/g, '');
    input.value = rawVal; 
    
    const previewEl = document.getElementById('groupFeedPreview');
    
    if (!rawVal) {
        input.style.color = '#BDBDBD';
        input.style.borderBottomColor = '#E0E0E0';
        previewEl.innerHTML = '等待输入...';
        return;
    }
    
    const score = parseInt(rawVal);
    const isPos = currentGroupFeedSub.type === 1;
    
    input.style.color = isPos ? '#2E7D32' : '#C62828';
    input.style.borderBottomColor = isPos ? '#2E7D32' : '#C62828';
    
    const finalScore = isPos ? score : -score;
    const pointsChange = Math.floor(finalScore * CONFIG.pointRate); 
    const expChange = (finalScore > 0) ? Math.floor(finalScore * CONFIG.expRate) : 0;
    
    if (isPos) {
        previewEl.innerHTML = `每人获得: <span style="color:#795548; font-weight:bold;">Exp+${expChange}</span> <span style="color:#2E7D32; font-weight:bold;">🪙+${pointsChange}</span>`;
    } else {
        previewEl.innerHTML = `每人扣除: <span style="color:#C62828; font-weight:bold;">🪙${pointsChange}</span> (经验不变)`;
    }
}

// 5. 提交全组奖惩
function submitGroupFeed() {
    if (!currentGroupContext || !currentGroupFeedSub) return alert("请先选择科目");
    const input = document.getElementById('groupFeedScore');
    const scoreStr = input.value;
    if (!scoreStr) return alert("请输入分值");
    
    const rawVal = parseInt(scoreStr);
    if (rawVal === 0) return alert("分值不能为0");
    
    const finalScore = (currentGroupFeedSub.type === 1) ? rawVal : -rawVal;
    const now = new Date();
    
    let count = 0;
    
    students.forEach((s, idx) => {
        if (s.groupName === currentGroupContext.group && s.className === currentGroupContext.cls) {
            addPoints(idx, finalScore, currentGroupFeedSub.name, now);
            count++;
        }
    });
    
    if (count > 0) {
        saveData(); 
        showToast(`⚡ 全组 ${count} 人已${finalScore>0?'奖励':'扣除'}！`);
        refreshUI();
    } else {
        alert("未找到该小组成员");
    }
}

// ===========================================
// 新增：添加组员逻辑 (View C) (保持逻辑不变)
// ===========================================

// 1. 显示添加界面
function showGroupAdd(groupName, className) {
    currentGroupContext = { group: groupName, cls: className };
    selectedAddCandidates = []; 
    
    document.getElementById('gd-view-list').style.display = 'none';
    document.getElementById('gd-view-feed').style.display = 'none';
    document.getElementById('gd-view-add').style.display = 'flex';
    
    renderGroupAddList();
}

// 2. 隐藏添加界面
function hideGroupAdd() {
    document.getElementById('gd-view-add').style.display = 'none';
    document.getElementById('gd-view-list').style.display = 'flex';
}

// 3. 渲染候选人列表
function renderGroupAddList() {
    const container = document.getElementById('groupAddContainer');
    if(!container) return;
    container.innerHTML = '';
    
    const candidates = students.filter(s => 
        s.className === currentGroupContext.cls && 
        (!s.groupName || s.groupName.trim() === '')
    );
    
    if (candidates.length === 0) {
        container.innerHTML = `
            <div style="width:100%; text-align:center; color:#999; margin-top:50px;">
                <div style="font-size:40px; margin-bottom:10px;">🤷‍♂️</div>
                本班所有学生都已有分组<br>或没有其他学生
            </div>`;
        return;
    }

    candidates.forEach(stu => {
        const btn = document.createElement('div');
        btn.style.cssText = `
            padding: 8px 16px; 
            border-radius: 50px; 
            font-size: 13px; 
            cursor: pointer; 
            border: 1px solid #E0E0E0; 
            background: #fff; 
            color: #616161; 
            transition: all 0.2s;
            font-weight: bold;
            user-select: none;
            display: flex; align-items: center; gap: 5px;
        `;
        btn.innerHTML = `<span>${stu.name}</span>`;
        
        btn.onclick = () => {
            const idx = selectedAddCandidates.indexOf(stu.name);
            if (idx === -1) {
                selectedAddCandidates.push(stu.name);
                btn.style.background = '#E3F2FD';
                btn.style.color = '#1565C0';
                btn.style.borderColor = '#1565C0';
            } else {
                selectedAddCandidates.splice(idx, 1);
                btn.style.background = '#fff';
                btn.style.color = '#616161';
                btn.style.borderColor = '#E0E0E0';
            }
        };
        
        container.appendChild(btn);
    });
}

// 4. 提交添加
function submitGroupAdd() {
    if (selectedAddCandidates.length === 0) return showToast("⚠️ 请至少选择一名学生");
    
    let count = 0;
    
    students.forEach(s => {
        if (s.className === currentGroupContext.cls && selectedAddCandidates.includes(s.name)) {
            s.groupName = currentGroupContext.group; 
            count++;
        }
    });
    
    if (count > 0) {
        saveData();
        showToast(`✅ 成功添加 ${count} 名新组员！`);
        openGroupDetail(currentGroupContext.group, currentGroupContext.cls);
        refreshUI();
    }
}

// ===========================================
// 新增：解散小组逻辑
// ===========================================
function dissolveGroup(groupName, className) {
    if (!confirm(`⚠️ 高风险操作确认\n\n确定要解散【${className} · ${groupName}】吗？\n\n解散后：\n1. 该组所有成员将变为“未分组”状态\n2. 成员的个人积分数据【全部保留】\n3. 该小组将从排行榜中移除`)) {
        return;
    }

    let count = 0;
    
    students.forEach(s => {
        if (s.className === className && s.groupName === groupName) {
            s.groupName = ""; 
            count++;
        }
    });

    if (count > 0) {
        saveData();
        document.getElementById('groupDetailModal').style.display = 'none';
        refreshUI();
        showToast(`🗑️ 小组已解散，${count} 名成员已回归未分组`);
    } else {
        showToast("⚠️ 该小组似乎已经是空的了");
        document.getElementById('groupDetailModal').style.display = 'none';
        refreshUI();
    }
}

// ===========================================
// 新增：从小组详情跳转到数据分析
// ===========================================
function jumpToGroupAnalysis(groupName, className) {
    document.getElementById('groupDetailModal').style.display = 'none';

    const timeSelect = document.getElementById('timeSelect') || document.getElementById('v2_TimeSelect');
    const timeType = timeSelect ? timeSelect.value : 'all';
    
    let customStart = "";
    let customEnd = "";
    
    if (timeType === 'custom') {
        customStart = document.getElementById('startDate') ? document.getElementById('startDate').value : "";
        customEnd = document.getElementById('endDate') ? document.getElementById('endDate').value : "";
    }

    const targetKey = `${className}|${groupName}`;

    if (typeof openAnalysisModal === 'function') {
        openAnalysisModal(targetKey, timeType, customStart, customEnd);
    }
}
