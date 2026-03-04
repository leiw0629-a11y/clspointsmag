// ===========================================
// 逻辑模块：班级与分组管理 (Logic Class Manager)
// 依赖全局变量：students
// 依赖全局函数：saveData, refreshUI, showToast
// ===========================================

// --- 模块私有状态变量 ---
let currentMgrClassName = ''; // 当前正在管理的班级
let targetGroupName = '';     // 当前正在操作的小组

/**
 * 打开班级管理弹窗 (入口)
 */
function openClassMgrModal() {
    const modal = document.querySelector('#classMgrModal .modal');
    // 1. 设置尺寸
    modal.style.width = "850px";
    modal.style.height = "85vh";       
    modal.style.maxHeight = "85vh";

    // 2. 动态计算内部高度
    const container = document.querySelector('#classMgrModal .mgr-container');
    if(container) {
        container.style.height = "calc(100% - 50px)"; 
    }

    // 3. 重置到列表 Tab
    const firstTab = document.querySelector('.mgr-tab-btn');
    if(firstTab) switchMgrTab('class-list', firstTab);

    // 4. 渲染列表
    renderClassListTable();
    
    document.getElementById('classMgrModal').style.display = 'flex';
}

/**
 * 切换左侧主菜单
 */
function switchMgrTab(panelId, btnEl) {
    document.querySelectorAll('.mgr-sidebar .mgr-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if(btnEl) btnEl.classList.add('active');
    showSubView('panel-' + panelId);
}

/**
 * 通用面板显示切换
 */
function showSubView(viewId) {
    document.querySelectorAll('.mgr-main .mgr-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
}

/**
 * 获取所有不重复的班级名称
 */
function getUniqueClassNames() {
    const names = students.map(s => s.className).filter(n => n);
    return [...new Set(names)];
}

/**
 * 渲染班级列表表格
 */
function renderClassListTable() {
    const tbody = document.querySelector('#panel-class-list tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const classNames = getUniqueClassNames();
    if(classNames.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">暂无班级，请新建</td></tr>';
        return;
    }

    classNames.forEach(clsName => {
        const count = students.filter(s => s.className === clsName).length;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:bold; font-size: 14px;">${clsName}</td>
            <td>${count}人</td>
            <td><span class="status-tag high">进行中</span></td>
            <td style="white-space: nowrap; text-align: center;">
                <button class="btn-action-student" onclick="openStudentMgr('${clsName}')">🎓 学生</button>
                <button class="btn-action-group" onclick="openGroupMgr('${clsName}')">🧩 分组</button>
                <button class="action-btn" onclick="deleteClass('${clsName}')" style="color:#f00; font-size:12px; margin-left:5px; padding: 4px 8px;" title="解散班级">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * 执行新建班级
 */
function doCreateClass() {
    const nameInput = document.getElementById('newClassNameInput'); 
    const listInput = document.getElementById('newClassStudentList');
    
    const className = nameInput.value.trim();
    if(!className) return alert("❌ 请输入班级名称");

    const existingClasses = getUniqueClassNames();
    if (existingClasses.includes(className)) {
        return alert(`❌ 【${className}】已存在！\n请直接在列表点击该班级的【🎓学生】按钮进行管理。`);
    }
    
    const rawText = listInput.value.trim();
    if(!rawText) return alert("❌ 请至少录入一名学生才能创建班级");

    const lines = rawText.split(/\n+/);
    let validStudents = [];
    let duplicateNames = [];

    lines.forEach(line => {
        const stuName = line.trim().replace(/\s+/g, ' '); 
        if(stuName) {
            const exists = students.some(s => s.name === stuName);
            if (exists) {
                duplicateNames.push(stuName);
            } else {
                validStudents.push({
                    name: stuName,
                    level: 1, exp: 0, totalPoints: 0, currentPoints: 0, 
                    petPath: "xiongmao",
                    className: className, 
                    groupName: ""
                });
            }
        }
    });

    if (validStudents.length === 0) {
        if (duplicateNames.length > 0) {
            return alert(`❌ 创建失败！\n检测到以下学生已存在：\n${duplicateNames.join('、')}`);
        } else {
            return alert("❌ 有效名单为空，请检查输入。");
        }
    }

    students.push(...validStudents); 
    saveData();

    let msg = `✅ 班级 [${className}] 创建成功！\n🎉 录入：${validStudents.length} 人`;
    if (duplicateNames.length > 0) msg += `\n⚠️ 跳过重名：${duplicateNames.length} 人`;
    
    duplicateNames.length > 0 ? alert(msg) : showToast(msg);
    
    nameInput.value = '';
    listInput.value = '';
    
    renderClassListTable();
    refreshUI(); 
	// 👇 新增这一行：新建班级后，立即刷新主页下拉框
    if(window.InitClassOptions) window.InitClassOptions();
	
    const firstTab = document.querySelector('.mgr-sidebar .mgr-tab-btn');
    if(firstTab) switchMgrTab('class-list', firstTab);
}

function deleteClass(name) {
    if(!confirm(`⚠️ 确定要解散【${name}】吗？\n\n这将删除该班级下的所有学生数据及其历史记录！`)) return;
    
    // 1. 找到该班级所有学生的名字列表
    const classStudentNames = students
        .filter(s => s.className === name)
        .map(s => s.name);

    const initialCount = students.length;
    
    // 2. 删除学生档案
    students = students.filter(s => s.className !== name);
    const deletedCount = initialCount - students.length;

    // 3. 【新增】批量删除这些学生的历史记录
    if (classStudentNames.length > 0) {
        historyData = historyData.filter(record => !classStudentNames.includes(record.name));
    }

    saveData();
    renderClassListTable();
    refreshUI();
    
    if(window.InitClassOptions) window.InitClassOptions();
    showToast(`🗑️ 已解散班级，清理了 ${deletedCount} 人及其历史数据`);
}

/**
 * 打开学生管理视图
 */
function openStudentMgr(className) {
    currentMgrClassName = className;
    showSubView('view-student-mgr');
    
    const titleEl = document.querySelector('#view-student-mgr .panel-header-area div[style*="font-weight:bold"]');
    if(titleEl) titleEl.innerHTML = `${className}`;
    
    renderStudentMgrTable();
}

/**
 * 渲染学生管理表格
 */
function renderStudentMgrTable() {
    const tbody = document.querySelector('#view-student-mgr tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const classStudents = students.filter(s => s.className === currentMgrClassName);
    
    classStudents.forEach(stu => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:bold; font-size: 13px;">${stu.name}</td>
            <td>${stu.groupName ? `<span class="status-tag mid">${stu.groupName}</span>` : '<span class="status-tag">未分组</span>'}</td>
            <td>
                <button class="action-btn" onclick="openRenameModal('${stu.name}')" style="color:#1976D2; background:#E3F2FD; margin-right:5px;">改名</button>
<button class="action-btn" onclick="removeStudent('${stu.name}')" style="color:red; background:#FFF0F0;">移除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * 打开改名弹窗
 */
function openRenameModal(oldName) {
    targetRenameName = oldName; // 记录当前要改谁
    
    // 填充 UI
    document.getElementById('rename-old-name-display').innerText = oldName;
    const input = document.getElementById('renameInput');
    input.value = oldName; // 默认填入旧名字方便修改
    
    // 显示弹窗
    document.getElementById('modal-rename-student').style.display = 'flex';
    
    // 自动聚焦输入框 (体验优化)
    setTimeout(() => input.focus(), 100);
}

/**
 * 提交改名 (包含查重和历史记录更新)
 */
function submitRename() {
    const input = document.getElementById('renameInput');
    const newName = input.value.trim();
    const oldName = targetRenameName;

    // 1. 基础校验
    if (!newName) return alert("❌ 名字不能为空");
    if (newName === oldName) {
        document.getElementById('modal-rename-student').style.display = 'none';
        return;
    }

    // 2. 查重 (全局检查)
    const exists = students.some(s => s.name === newName);
    if (exists) {
        alert(`❌ 改名失败！\n学生【${newName}】已存在，名字不能重复。`);
        return; // 不关闭弹窗，让用户继续改
    }

    // 3. 更新学生档案
    const targetStudent = students.find(s => s.name === oldName);
    if (!targetStudent) return alert("❌ 档案未找到，请刷新重试");
    targetStudent.name = newName;

    // 4. 更新历史记录 (核心步骤)
    let historyCount = 0;
    historyData.forEach(record => {
        if (record.name === oldName) {
            record.name = newName;
            historyCount++;
        }
    });

    // 5. 保存与刷新
    saveData();
    renderStudentMgrTable(); // 刷新列表表格
    refreshUI();             // 刷新主界面
    
    // 6. 关闭弹窗并提示
    document.getElementById('modal-rename-student').style.display = 'none';
    showToast(`✅ 改名成功！\n档案及 ${historyCount} 条历史已更新`);
}

/**
 * 移除学生（修正版：同时删除历史记录）
 */
function removeStudent(name) {
    // 1. 确认删除
    if(!confirm(`⚠️ 确定要将【${name}】从【${currentMgrClassName}】移除吗？\n\n注意：这将彻底删除该生的档案以及所有历史积分记录！`)) return;

    // 2. 查找学生索引
    const idx = students.findIndex(s => s.name === name && s.className === currentMgrClassName);
    
    if(idx !== -1) {
        // 3. 删除学生档案
        students.splice(idx, 1);
        
        // 4. 【新增】删除该生的所有历史记录
        // 引用全局变量 historyData
        // 过滤掉所有名字匹配的记录
        const initialHistoryLen = historyData.length;
        historyData = historyData.filter(record => record.name !== name);
        const deletedHistoryCount = initialHistoryLen - historyData.length;

        // 5. 保存并刷新
        saveData();
        renderStudentMgrTable(); 
        refreshUI();             
        
        showToast(`🗑️ 已删除档案及 ${deletedHistoryCount} 条历史记录`);
    }
}

/**
 * 处理TXT导入
 */
function handleTxtImport(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const textarea = document.getElementById('newClassStudentList');
        textarea.value = textarea.value ? (textarea.value + '\n' + content) : content;
        input.value = '';
    };
    reader.readAsText(file, 'UTF-8');
}

/**
 * 打开新增学生弹窗
 */
function openAddStudentModal() {
    document.getElementById('modal-add-student-sub').style.display = 'flex';
}

/**
 * 提交新增学生
 */
function submitAddStudents() {
    const inputEl = document.getElementById('input-new-students');
    const rawText = inputEl.value.trim();
    
    if (!rawText) return alert("❌ 请输入至少一个学生姓名");
    if (!currentMgrClassName) return alert("❌ 系统错误：未获取到当前班级信息");

    const lines = rawText.split(/\n+/);
    let addCount = 0;

    lines.forEach(line => {
        const name = line.trim();
        if (name) {
            const exists = students.some(s => s.name === name);
            if (!exists) {
                students.push({
                    name: name,
                    level: 1, exp: 0, totalPoints: 0, currentPoints: 0,
                    petPath: "xiongmao",         
                    className: currentMgrClassName, 
                    groupName: ""                
                });
                addCount++;
            }
        }
    });

    if (addCount > 0) {
        saveData();
        renderStudentMgrTable();
        refreshUI();
        inputEl.value = '';
        document.getElementById('modal-add-student-sub').style.display = 'none';
        showToast(`✅ 成功添加 ${addCount} 名学生`);
    } else {
        alert("⚠️ 未添加任何学生。\n可能是名单为空或所有人均已重名。");
    }
}

// ================= 分组管理 =================

/**
 * 打开分组管理视图 (入口)
 */
function openGroupMgr(className) {
    currentMgrClassName = className;
    showSubView('view-group-mgr');
    renderGroupList();
}

/**
 * 渲染分组卡片
 */
function renderGroupList() {
    const container = document.querySelector('#view-group-mgr .group-matrix-layout');
    if(!container) return;
    container.innerHTML = '';

    const classStudents = students.filter(s => s.className === currentMgrClassName);
    const groups = {};
    classStudents.forEach(s => {
        const gName = s.groupName || ""; 
        if (!groups[gName]) groups[gName] = [];
        groups[gName].push(s);
    });

    // 渲染已有分组
    // 渲染已有分组
Object.keys(groups).forEach(gName => {
    if (gName === "") return; 
    const members = groups[gName];
    
    // 【修改点】优化名字气泡结构，对齐“基础设置”风格
    const namesHtml = members.map(m => `
        <div class="gd-member-tag" style="cursor: default;">
            <span>${m.name}</span>
            <span class="gd-tag-del-btn" 
                  onclick="removeFromGroup('${m.name}')" 
                  title="点击将 ${m.name} 移出小组">×</span>
        </div>
    `).join('');

    const card = document.createElement('div');
    card.className = 'group-card-new';
    card.innerHTML = `
        <div class="gc-header">
            <span>🛡️ ${gName}</span>
            <span class="gc-del-btn" onclick="deleteGroup('${gName}')" title="解散小组">🗑️</span>
        </div>
        <div class="gc-body" style="display: flex; flex-wrap: wrap; align-content: flex-start;">
            ${namesHtml}
        </div>
        <div class="gc-footer-btn" onclick="openAddMemberModal('${gName}')">➕ 添加组员</div>
    `;
    container.appendChild(card);
});

    // 渲染未分组
    const unassigned = groups[""] || [];
    const unassignedHtml = unassigned.map(m => m.name).join('、') || '<span style="color:#ccc">暂无未分组学员</span>';
    const unCard = document.createElement('div');
    unCard.className = 'group-card-new';
    unCard.style.borderStyle = 'dashed';
    unCard.style.background = '#FAFAFA';
    unCard.innerHTML = `<div class="gc-header" style="background:#eee; color:#666;"><span>👻 未分组</span></div><div class="gc-body" style="color:#999;">${unassignedHtml}</div>`;
    container.appendChild(unCard);
}

/**
 * 执行新建小组
 */
function doCreateGroup() {
    // 兼容 script.js 中的 createNewGroup 逻辑与 HTML 中的 onclick
    const input = document.getElementById('newGroupNameInput');
    if(!input) return;
    
    const name = input.value.trim();
    if(!name) return alert("请输入小组名称");
    
    const exists = students.some(s => s.className === currentMgrClassName && s.groupName === name);
    if(exists) return alert("该小组已存在！");

    document.getElementById('modal-create-group').style.display = 'none';
    openAddMemberModal(name); // 立即打开选人
    input.value = '';
}

/**
 * 打开添加组员选择窗
 */
function openAddMemberModal(groupName) {
    targetGroupName = groupName;
    document.getElementById('groupSelectTitle').innerText = groupName;
    
    const listEl = document.getElementById('groupSelectList');
    listEl.innerHTML = '';
    
    // 只能选本班且未分组的人
    const candidates = students.filter(s => s.className === currentMgrClassName && !s.groupName);
    
    if(candidates.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">没有可用的未分组学员</div>';
    }

    candidates.forEach(s => {
        const item = document.createElement('div');
        item.className = 'member-select-item';
        item.onclick = function() { 
            const cb = this.querySelector('input'); 
            cb.checked = !cb.checked; 
            this.style.background = cb.checked ? '#FFF3E0' : '#fff';
        };
        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <input type="checkbox" class="group-select-cb" value="${s.name}" style="pointer-events:none;">
                <span style="font-weight:bold; color:#5D4037;">${s.name}</span>
            </div>
        `;
        listEl.appendChild(item);
    });

    document.getElementById('modal-select-members').style.display = 'flex';
}

/**
 * 提交添加组员
 */
function submitAddMembersToGroup() {
    const checkboxes = document.querySelectorAll('.group-select-cb:checked');
    if(checkboxes.length === 0) return alert("请至少选择一名学生");

    const selectedNames = Array.from(checkboxes).map(cb => cb.value);
    let updateCount = 0;
    
    students.forEach(s => {
        if(s.className === currentMgrClassName && selectedNames.includes(s.name)) {
            s.groupName = targetGroupName;
            updateCount++;
        }
    });

    saveData();
    showToast(`✅ ${updateCount} 人已加入 ${targetGroupName}`);
    document.getElementById('modal-select-members').style.display = 'none';
    renderGroupList();
    refreshUI();
}

/**
 * 移出小组成员
 */
function removeFromGroup(studentName) {
    if(!confirm(`要把 ${studentName} 移出小组吗？`)) return;
    const stu = students.find(s => s.className === currentMgrClassName && s.name === studentName);
    if(stu) {
        stu.groupName = "";
        saveData();
        renderGroupList();
        refreshUI();
    }
}

/**
 * 解散小组
 */
function deleteGroup(groupName) {
    if(!confirm(`⚠️ 确定要解散【${groupName}】吗？\n组员将全部回到“未分组”状态。`)) return;

    let count = 0;
    students.forEach(s => {
        if(s.className === currentMgrClassName && s.groupName === groupName) {
            s.groupName = "";
            count++;
        }
    });

    saveData();
    showToast(`🗑️ 小组已解散，释放 ${count} 名组员`);
    renderGroupList();
    refreshUI();

}
