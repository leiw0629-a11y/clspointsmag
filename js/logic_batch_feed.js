/**
 * 1. 打开批量喂养弹窗 (全新卡片交互版)
 */
function openBatchModal() {
    if (students.length === 0) return alert("请先导入名单");
    const dateInput = document.getElementById('batchFeedDate');
    
    if(dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today; // 默认显示今天
        dateInput.max = today;   // 不允许选未来
    }
    const classSelect = document.getElementById('classSelect'); 
    const selectedClass = classSelect ? classSelect.value : 'all';

    const titleEl = document.getElementById('batchTitleText');
    if (titleEl) {
        const classNameDisplay = selectedClass === 'all' ? '全校' : selectedClass;
        titleEl.innerText = `${classNameDisplay} 批量成绩录入`;
    }

    renderBatchSubjectUI();

    // --- 核心改动：渲染卡片矩阵 ---
    const container = document.getElementById('updbth_cardContainer');
    if (!container) return;
    container.innerHTML = ''; // 清空旧数据
	
    let displayList = students.map((stu, idx) => {
        return { data: stu, originalIdx: idx };
    });

    // 2. 按班级过滤
    if (selectedClass !== 'all') {
        displayList = displayList.filter(item => item.data.className === selectedClass);
    }

    // 3. 按姓名拼音 A-Z 排序 (利用浏览器的 zh-CN 本地化对比)
    displayList.sort((a, b) => {
        return a.data.name.localeCompare(b.data.name, 'zh-CN');
    });
	
    let visibleCount = 0;
    // 4. 循环渲染排好序的列表
    displayList.forEach(item => {
        visibleCount++;
        const stu = item.data;
        const realIdx = item.originalIdx; // 【关键】使用原始索引

        const cp = stu.currentPoints === undefined ? (stu.totalPoints || 0) : stu.currentPoints;
        
        const card = document.createElement('div');
        card.className = 'updbth_stu_card'; 
        card.dataset.idx = realIdx;       // 存入真实索引
        card.dataset.name = stu.name;

        card.innerHTML = `
            <span class="updbth_stu_name">${stu.name}</span>
            <span class="updbth_stu_coin">🪙${cp}</span>
        `;

        card.onclick = function() {
            this.classList.toggle('selected');
            updbth_updateSelectedCount(); 
        };

        container.appendChild(card);
    });
    
    if (visibleCount === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; color:#999; padding:40px 0; font-weight:bold;">该班级暂无学生数据</div>';
    }
    
    updbth_resetConsole();
    
    document.getElementById('batchModal').style.display = 'flex';
}

/**
 * 2. 辅助函数：实时统计并更新顶部的“已选 X 人”
 */
function updbth_updateSelectedCount() {
    // 寻找所有带有 selected 类的卡片
    const selectedCards = document.querySelectorAll('.updbth_stu_card.selected');
    const countEl = document.getElementById('updbth_selectedCount');
    if (countEl) {
        countEl.innerText = selectedCards.length;
        // 如果有人被选中，数字变色跳动一下增加反馈感
        countEl.style.color = selectedCards.length > 0 ? '#E65100' : '#FF6B6B';
    }
}

/**
 * 3. 辅助函数：每次打开弹窗时重置上层建筑的数据
 */
function updbth_resetConsole() {
    updbth_updateSelectedCount(); // 此时卡片刚渲染完，人数为0
    
    // 清空统一输入框
    const globalScoreInput = document.getElementById('updbth_globalScore');
    if (globalScoreInput) globalScoreInput.value = '';
    
    // 恢复预览的默认状态
    const previewEl = document.getElementById('updbth_globalPreview');
    if (previewEl) {
        previewEl.innerText = '请先输入分值';
        previewEl.style.color = '#ccc';
    }
}

/**
 * 渲染批量左侧的科目胶囊按钮
 */
function renderBatchSubjectUI() {
    const posContainer = document.getElementById('batchPosTags');
    const negContainer = document.getElementById('batchNegTags');
    
    if(!posContainer || !negContainer) return;

    posContainer.innerHTML = '';
    negContainer.innerHTML = '';

    let firstItem = null;

    SUBJECT_LIST.forEach(sub => {
        const btn = document.createElement('div');
        btn.className = 'batch-sub-tag'; 
        btn.style.cssText = `
            padding: 6px 12px; 
            border-radius: 50px; 
            font-size: 13px; 
            cursor: pointer; 
            border: 1px solid #FFEEE4; 
            background: #fff; 
            color: #8D6E63; 
            transition: all 0.2s;
            font-weight: bold;
            display: inline-block;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        `;
        btn.innerText = sub.name;
        btn.dataset.name = sub.name;
        btn.dataset.type = sub.type;
        
        btn.onclick = () => handleBatchSubjectClick(sub.name, sub.type);

        if (sub.type == 1) posContainer.appendChild(btn);
        else negContainer.appendChild(btn);

        if (!firstItem) firstItem = sub;
    });

    if(firstItem) {
        handleBatchSubjectClick(firstItem.name, firstItem.type);
    }
}

/**
 * 处理批量左侧科目点击逻辑 (全新卡片适配版)
 */
function handleBatchSubjectClick(name, type) {
    currentBatchSubData = { name, type };
    
    // 1. 更新顶部状态标签
    const label = document.getElementById('selectedBatchSubjectLabel');
    if(label) {
        label.innerHTML = `${name} ${type == 1 ? '(加分)' : '(扣分)'}`;
        label.style.color = (type == 1) ? '#2E7D32' : '#C62828';
    }

	const cardContainer = document.getElementById('updbth_cardContainer');
    if (cardContainer) {
        if (type == 1) {
            cardContainer.classList.add('theme-pos');
            cardContainer.classList.remove('theme-neg');
        } else {
            cardContainer.classList.add('theme-neg');
            cardContainer.classList.remove('theme-pos');
        }
    }
    // 2. 左侧胶囊高亮切换 (保留原有优秀的视觉反馈逻辑)
    const allTags = document.querySelectorAll('.batch-sub-tag');
    allTags.forEach(tag => {
        tag.style.background = '#fff';
        tag.style.color = '#8D6E63';
        tag.style.borderColor = '#FFEEE4';
        tag.style.transform = 'scale(1)';
        tag.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        
        if (tag.dataset.name === name) {
            if (type == 1) {
                tag.style.background = '#E8F5E9';
                tag.style.color = '#2E7D32';
                tag.style.borderColor = '#2E7D32';
                tag.style.boxShadow = '0 2px 6px rgba(46, 125, 50, 0.2)';
            } else {
                tag.style.background = '#FFEBEE';
                tag.style.color = '#C62828';
                tag.style.borderColor = '#C62828';
                tag.style.boxShadow = '0 2px 6px rgba(198, 40, 40, 0.2)';
            }
            tag.style.transform = 'scale(1)'; 
        }
    });

    // 3. 核心改动：清理旧版表格逻辑，适配新版控制台
    // 建议：保留老师辛苦选中的学生卡片，仅清空全局分值和预览
    const globalScoreInput = document.getElementById('updbth_globalScore');
    if (globalScoreInput) {
        globalScoreInput.value = ''; // 清空统一输入框
        updbth_updateGlobalPreview(); // 联动清空预览区文字
    }

    // 【补充】如果你依然坚决认为必须清空卡片，取消下面两行的注释即可：
    // document.querySelectorAll('.updbth_stu_card.selected').forEach(card => card.classList.remove('selected'));
    // updbth_updateSelectedCount();
}

/**
 * 6. 全选 / 反选 所有学生卡片
 */
function updbth_toggleAllCards() {
    const allCards = document.querySelectorAll('.updbth_stu_card');
    const selectedCards = document.querySelectorAll('.updbth_stu_card.selected');
    
    if (allCards.length === 0) return; // 如果没有卡片，直接返回

    // 判断当前是否已经处于“全选”状态
    const isAllSelected = (allCards.length === selectedCards.length);

    allCards.forEach(card => {
        if (isAllSelected) {
            // 如果已经全选了，就全部反选（清空）
            card.classList.remove('selected');
        } else {
            // 只要没全选，就强制全部选中
            card.classList.add('selected');
        }
    });

    // 联动更新顶部的“已选 X 人” UI
    updbth_updateSelectedCount();
}

/**
 * 4. 提交批量喂养 (全新卡片选中版)
 */
function submitBatchFeed() {
    // 1. 校验科目
    if (!currentBatchSubData) return showToast("⚠️ 请先选择科目！");

    // 2. 校验分数
    const scoreInput = document.getElementById('updbth_globalScore');
    const scoreStr = scoreInput ? scoreInput.value : '';
    if (!scoreStr) {
		alert('请先设定本次分值！');
		return;
	}
    
    let rawVal = Math.abs(parseInt(scoreStr));
    if (rawVal === 0) {
		alert('分数不能为0！');
		return;
	}

    // 3. 校验选中的学生
    const selectedCards = document.querySelectorAll('.updbth_stu_card.selected');
    if (selectedCards.length === 0){
		alert('请至少勾选一名学生！');
		return;
	} 

    // 4. 获取归属日期
    const dateInput = document.getElementById('batchFeedDate');
    const targetDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    
    // 5. 确定最终分值（根据科目类型自动加减）
    let finalScore = (currentBatchSubData.type == -1) ? -rawVal : rawVal;

    let count = 0; 
    let levelUpCount = 0;
    
    // 6. 核心循环：只给带 selected 的卡片加分
    selectedCards.forEach(card => {
        const idxStr = card.dataset.idx; // 我们在 open 时存入的 idx
        if (idxStr !== undefined) {
            const idx = parseInt(idxStr);
            const oldLevel = students[idx].level;
            
            // 调用核心加分函数
            addPoints(idx, finalScore, currentBatchSubData.name, targetDate);
            count++; 
            // 记录升级人数
            if (students[idx].level > oldLevel) levelUpCount++;
        }
    });
    
    // 7. 收尾：保存、刷新、提示、关窗
    if(count > 0) { 
        saveData(); 
        refreshUI(); 
        let msg = `[${currentBatchSubData.name}] 成功录入 ${count} 人！`;
        if (levelUpCount > 0) msg += `\n🎉有 ${levelUpCount} 人升级了！`;
        showToast(msg); 
        closeModal('batchModal'); 
    }
}

/**
 * 5. 辅助函数：更新批量录入的全局兑换预览
 */
function updbth_updateGlobalPreview() {
    const input = document.getElementById('updbth_globalScore');
    const previewEl = document.getElementById('updbth_globalPreview');
    
    // 如果还没选科目，或者找不到元素，直接返回
    if (!currentBatchSubData || !input || !previewEl) return;

    const scoreStr = input.value;

    // 处理空值
    if (scoreStr === '') {
        previewEl.innerText = '请先输入分值';
        previewEl.style.color = '#ccc';
        return;
    }

    const rawVal = Math.abs(parseInt(scoreStr));
    if (isNaN(rawVal) || rawVal === 0) {
        previewEl.innerText = '请输入有效数字';
        previewEl.style.color = '#ccc';
        return;
    }

    // 判断正负并计算 (兼容旧版的 CONFIG 获取方式)
    const isNegative = (currentBatchSubData.type == -1);
    const finalScore = isNegative ? -rawVal : rawVal;
    
    // 安全获取倍率配置，防止 CONFIG 未定义报错
    const pointRate = (window.CONFIG && window.CONFIG.pointRate) || 1;
    const expRate = (window.CONFIG && window.CONFIG.expRate) || 1;

    const pointsChange = Math.floor(finalScore * pointRate);
    const expChange = (finalScore > 0) ? Math.floor(finalScore * expRate) : 0;

    // 渲染 HTML
    let html = '';
    if (isNegative) {
        // 扣分：纯红色积分
        html = `<span style="font-size: 15px; font-weight: bold; color:#C62828;">积分🪙${pointsChange}</span>`;
    } else {
        // 加分：深咖色经验 + 绿色积分
        html = `<span style="font-size: 14px; font-weight: bold; color:#795548; margin-right:8px;">Exp+${expChange}</span> <span style="font-size: 15px; font-weight: bold; color:#2E7D32;">🪙+${pointsChange}</span>`;
    }

    previewEl.innerHTML = html;
}

// 批量喂养的实时预览监听 (全新全局版)
document.addEventListener('input', function(e){
    if(e.target.id === 'updbth_globalScore') {
        updbth_updateGlobalPreview();
    }
});