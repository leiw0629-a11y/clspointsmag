/**
 * 1. 打开批量喂养弹窗 (独立输入框新版)
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

    const container = document.getElementById('updbth_cardContainer');
    if (!container) return;
    container.innerHTML = ''; // 清空旧数据
	
    let displayList = students.map((stu, idx) => {
        return { data: stu, originalIdx: idx };
    });

    // 按班级过滤
    if (selectedClass !== 'all') {
        displayList = displayList.filter(item => item.data.className === selectedClass);
    }

    // 按姓名拼音 A-Z 排序
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
        card.className = 'updbth_stu_card batch-card-layout'; 
        card.dataset.idx = realIdx;       
        card.dataset.name = stu.name;

        card.innerHTML = `
            <div class="batch-card-header">
                <span class="updbth_stu_name">${stu.name}</span>
                <span class="updbth_stu_coin">🪙${cp}</span>
            </div>
            <div class="batch-input-area">
                <input type="number" class="batch-score-input" placeholder="请输入分值">
            </div>
        `;

        // 获取刚刚生成的输入框
        const inputEl = card.querySelector('.batch-score-input');

        // 【新增：监听输入框的打字事件】
        inputEl.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                // 只要里面有数字，强制变为选中状态
                card.classList.add('selected');
            } else {
                // 如果数字被删光了，自动取消选中
                card.classList.remove('selected');
            }
            updbth_updateSelectedCount(); // 实时更新顶部已选人数
        });

        // 【修改：卡片的点击事件】
        card.onclick = function(e) {
            // 如果点的是输入框本身，直接放行，不要触发任何卡片的选中/取消逻辑
            if (e.target.tagName.toLowerCase() === 'input') {
                return; 
            }
            
            // 如果点的是卡片其他区域，正常切换选中/取消选中状态
            this.classList.toggle('selected');
            
            // 【顺手优化 UX】：如果老师通过点击卡片空白处“取消选中”了该学生，
            // 为了防止下次选中时里面还有上次遗留的数字，顺手帮她把输入框清空
            if (!this.classList.contains('selected')) {
                inputEl.value = '';
            }
            
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
 * 处理批量窗口左侧科目点击逻辑 (全新卡片适配版)
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
 * 6. 全选 / 反选 所有学生卡片 (深度联动版)
 */
function updbth_toggleAllCards() {
    const allCards = document.querySelectorAll('.updbth_stu_card');
    const selectedCards = document.querySelectorAll('.updbth_stu_card.selected');
    
    if (allCards.length === 0) return; // 如果没有卡片，直接返回

    // 1. 获取顶部全局输入框的有效分值
    const globalInput = document.getElementById('updbth_globalScore');
    let globalVal = '';
    if (globalInput && globalInput.value) {
        let num = parseInt(globalInput.value.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && num > 0) {
            globalVal = num;
        }
    }

    // 2. 判断当前是否已经处于“全选”状态
    const isAllSelected = (allCards.length === selectedCards.length);

    // 3. 核心遍历执行
    allCards.forEach(card => {
        const inputEl = card.querySelector('.batch-score-input');
        
        if (isAllSelected) {
            // 【反选/清空】：如果已经全选了，就全部取消选中，并强制清空输入框
            card.classList.remove('selected');
            if (inputEl) inputEl.value = '';
        } else {
            // 【全选/填充】：只要没全选，就强制全部选中
            card.classList.add('selected');
            // 如果全局有分值，直接帮老师把所有的框填满
            if (inputEl && globalVal !== '') {
                inputEl.value = globalVal;
            }
        }
    });

    // 4. 联动更新顶部的“已选 X 人” UI
    updbth_updateSelectedCount();
}

/**
 * 4. 提交批量喂养 (全新独立卡片取值版)
 */
function submitBatchFeed() {
    // 1. 校验科目
    if (!currentBatchSubData) return showToast("⚠️ 请先选择科目！");

    // 2. 校验是否选人了
    const selectedCards = document.querySelectorAll('.updbth_stu_card.selected');
    if (selectedCards.length === 0){
        alert('请至少勾选一名学生！');
        return;
    } 

    // 3. 【核心新增：防呆前置校验】
    // 防止老师点了“全选”，但是没有输入全局分值，导致卡片空着就被提交
    let hasEmptyScore = false;
    selectedCards.forEach(card => {
        const inputEl = card.querySelector('.batch-score-input');
        const val = inputEl ? parseInt(inputEl.value, 10) : 0;
        if (isNaN(val) || val <= 0) {
            hasEmptyScore = true;
            // 可以顺手给这个空框加个红色闪烁提示，这里用最简单的聚焦
            if(inputEl) inputEl.focus(); 
        }
    });

    if (hasEmptyScore) {
        alert('⚠️发现被选中的学生中存在空分值或无效分值，请检查！');
        return; // 拦截提交
    }

    // 4. 获取归属日期
    const dateInput = document.getElementById('batchFeedDate');
    const targetDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    
    let count = 0; 
    let levelUpCount = 0;
    
    // 5. 【核心逻辑：遍历选中卡片，各自计算独立分值】
    selectedCards.forEach(card => {
        const idxStr = card.dataset.idx; 
        const inputEl = card.querySelector('.batch-score-input');
        
        if (idxStr !== undefined && inputEl) {
            const idx = parseInt(idxStr);
            const oldLevel = students[idx].level;
            
            // 提取该学生的专属分值 (前面已经拦截过空值了，这里绝对是安全正整数)
            const rawVal = parseInt(inputEl.value, 10);
            
            // 根据科目类型，后台赋予正负号
            let finalScore = (currentBatchSubData.type == -1) ? -rawVal : rawVal;

            // 调用核心加分函数
            addPoints(idx, finalScore, currentBatchSubData.name, targetDate);
            count++; 
            
            // 记录升级人数
            if (students[idx].level > oldLevel) levelUpCount++;
        }
    });
    
    // 6. 收尾：保存、刷新、提示、关窗
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

// 批量喂养的实时预览与向下同步监听 (全新全局版)
document.addEventListener('input', function(e){
    if(e.target.id === 'updbth_globalScore') {
        // 先清理非数字输入，保证全局框里也是干净的
        e.target.value = e.target.value.replace(/[^0-9]/g, ''); 
        
        updbth_updateGlobalPreview(); // 原有的：更新右上角预览
        updbth_syncGlobalScore();     // 【新增】：智能同步到下方卡片
    }
});

/**
 * 新增：将全局分数智能同步到下方卡片
 */
function updbth_syncGlobalScore() {
    const globalInput = document.getElementById('updbth_globalScore');
    if (!globalInput) return;

    // 提取并清洗全局分数
    let rawStr = globalInput.value.replace(/[^0-9]/g, '');
    let num = parseInt(rawStr, 10);
    let isValidScore = !isNaN(num) && num > 0;
    let finalValue = isValidScore ? num : '';

    // 获取卡片集合
    const allCards = document.querySelectorAll('.updbth_stu_card');
    const selectedCards = document.querySelectorAll('.updbth_stu_card.selected');

    if (allCards.length === 0) return;

    // 【核心智能判定】：如果有选中的，只操作选中的；如果一个都没选，就操作所有人
    let targetCards = selectedCards.length > 0 ? selectedCards : allCards;

    targetCards.forEach(card => {
        const inputEl = card.querySelector('.batch-score-input');
        if (inputEl) {
            inputEl.value = finalValue; // 填充数字
            
            // 联动卡片的选中状态
            if (isValidScore) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        }
    });

    updbth_updateSelectedCount(); // 刷新顶部的“已选 X 人”
}

/**
 * 辅助函数：点击 5分/10分/15分 胶囊时调用
 */
function setGlobalScoreFast(val) {
    const input = document.getElementById('updbth_globalScore');
    if(input) {
        input.value = val;
        updbth_updateGlobalPreview(); // 更新预览
        updbth_syncGlobalScore();     // 向下同步
    }
}
