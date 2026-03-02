/**
 * 基础设置模块 - 数据双向绑定逻辑
 */

// 打开弹窗时的初始化
function openBaseConfigModal() {
    const modal = document.getElementById('baseConfigModal');
    if (!modal) return;
    
    // 如果没有引入 basicSet 模板，先加载（防止报错）
    if (!document.getElementById('baseConfigModal') && window.AppTemplates && window.AppTemplates.basicSet) {
         document.body.insertAdjacentHTML('beforeend', window.AppTemplates.basicSet);
    }
    
    modal.style.display = 'flex';

    // 填充左侧数字项
    document.getElementById('cfg_exp_rate').value = (CONFIG.expRate !== undefined) ? CONFIG.expRate : "";
    document.getElementById('cfg_point_rate').value = (CONFIG.pointRate !== undefined) ? CONFIG.pointRate : "";
    document.getElementById('cfg_level_exp').value = (CONFIG.pointsPerLevel !== undefined) ? CONFIG.pointsPerLevel : "";
    
    const evoInput = document.getElementById('cfg_evo_rules');
    if (evoInput) {
        evoInput.value = (EVOLUTION_RULES && EVOLUTION_RULES.length > 0) ? EVOLUTION_RULES.join(',') : "";
    }

    // --- 核心改动：默认查看加分项 (Type=1) ---
    SubjectTagHandler.currentViewType = 1; 
    SubjectTagHandler.updateTabStyles(); // 刷新Tab样式
    SubjectTagHandler.renderTags();      // 刷新列表

    // 清空下方的输入框
    if(document.getElementById('v2-input-plus')) document.getElementById('v2-input-plus').value = "";
    if(document.getElementById('v2-input-minus')) document.getElementById('v2-input-minus').value = "";
}

const SubjectTagHandler = {
    // 状态：1 代表加分项，-1 代表扣分项
    currentViewType: 1,

    // 切换查看的类型
    switchView: function(type) {
        this.currentViewType = type;
        this.updateTabStyles();
        this.renderTags();
    },

    // 更新 Tab 的高亮样式
    updateTabStyles: function() {
        const tabPlus = document.getElementById('v2-tab-tag-plus');
        const tabMinus = document.getElementById('v2-tab-tag-minus');
        
        if(tabPlus && tabMinus) {
            tabPlus.classList.remove('active');
            tabMinus.classList.remove('active');
            if (this.currentViewType === 1) tabPlus.classList.add('active');
            else tabMinus.classList.add('active');
        }
    },

    // --- [核心修改] 3. 渲染科目标签 (支持点击修改) ---
    renderTags: function() {
        const tagContainer = document.getElementById('cfg_subject_tags');
        if (!tagContainer) return;

        tagContainer.innerHTML = '';
        const filteredList = SUBJECT_LIST.filter(item => item.type === this.currentViewType);

        if (!filteredList || filteredList.length === 0) {
            const typeName = this.currentViewType === 1 ? "加分" : "扣分";
            tagContainer.innerHTML = `<div class="v2-cfg-empty-hint">当前暂无${typeName}科目...</div>`;
            return;
        }

        filteredList.forEach((item) => {
            const tag = document.createElement('div');
            tag.className = 'v2-cfg-tag';
            tag.style.borderColor = this.currentViewType === 1 ? '#C8E6C9' : '#FFCDD2';
            tag.style.backgroundColor = this.currentViewType === 1 ? '#E8F5E9' : '#FFEBEE';
            
            // 修改点：span 增加 onclick 事件触发编辑，增加 title 提示
            tag.innerHTML = `
                <span onclick="SubjectTagHandler.startEdit(this, '${item.name}', ${item.type})" 
                      title="点击修改名称" 
                      style="cursor: text; border-bottom: 1px dashed #999;">${item.name}</span>
                <span class="tag-del" onclick="SubjectTagHandler.removeTag('${item.name}', ${item.type})">×</span>
            `;
            tagContainer.appendChild(tag);
        });
    },

    // --- [新增] 开始编辑 ---
    // --- [修改后] 开始编辑 (自动计算宽度) ---
    startEdit: function(spanEl, oldName, type) {
        // 1. 获取当前文字标签的实际宽度
        const currentWidth = spanEl.offsetWidth; 

        const input = document.createElement('input');
        input.type = 'text';
        input.value = oldName;
        
        // 2. 设置宽度：原宽度 + 30px (约等于多留1-1.5个汉字的空间，视觉最舒服)
        // 并设置一个最小宽度 (比如 50px)，防止只有一个字的时候框太小不好点
        input.style.width = Math.max(50, currentWidth + 30) + 'px'; 
        
        input.style.border = 'none';
        input.style.borderBottom = '1px solid #1976D2';
        input.style.background = 'transparent';
        input.style.outline = 'none';
        input.style.fontSize = 'inherit';
        input.style.color = 'inherit';
        input.style.textAlign = 'center'; // 让文字居中，看起来更像“原地修改”

        // 失去焦点或回车时保存
        input.onblur = () => this.finishEdit(input, spanEl, oldName, type);
        input.onkeydown = (e) => {
            if(e.key === 'Enter') input.blur();
        };

        spanEl.replaceWith(input);
        input.focus();
    },

    // --- [新增] 完成编辑 (含判重 + 历史修正) ---
    finishEdit: function(inputEl, originalSpan, oldName, type) {
        const newName = inputEl.value.trim();

        // 1. 如果没变或为空，恢复原状
        if (!newName || newName === oldName) {
            if(inputEl.parentNode) inputEl.replaceWith(originalSpan);
            return;
        }

        // 2. [判重逻辑] 检查当前类型下是否已有同名科目
        const exists = SUBJECT_LIST.some(item => item.name === newName && item.type === type);
        if (exists) {
            alert(`⚠️修改失败：科目「${newName}」已存在！`);
            if(inputEl.parentNode) inputEl.replaceWith(originalSpan); // 恢复原状
            return;
        }

        // 3. 执行修改 - 更新配置列表
        const targetItem = SUBJECT_LIST.find(item => item.name === oldName && item.type === type);
        if (targetItem) {
            targetItem.name = newName;
        }

        // 4. [关键] 执行修改 - 同步更新历史记录 (History Data)
        // 即使删除了科目配置，历史记录还在，所以改名时要连历史记录一起改，保证数据连续性
        let updateCount = 0;
        historyData.forEach(record => {
            if (record.subject === oldName) {
                record.subject = newName;
                updateCount++;
            }
        });

        // 5. 保存并刷新
        saveData();
        if(typeof refreshUI === 'function') refreshUI();
        this.renderTags(); // 重新渲染列表
        
        if(typeof showToast === 'function') showToast(`✅已更名，同步更新 ${updateCount}条历史记录`);
    },

    // --- [核心修改] 4. 删除科目 (软删除，保留历史) ---
    removeTag: function(name, type) {
        // 修改点：提示语变更，逻辑不再删除 historyData
        if (confirm(`确定要移除科目「${name}」吗？\n\n注意：\n1.之后将无法选择此科目。\n2.学生已获得的积分【保留】。\n3.历史记录【保留】(在排行榜中仍有效)。`)) {
            
            const realIndex = SUBJECT_LIST.findIndex(item => item.name === name && item.type === type);
            
            if (realIndex !== -1) {
                SUBJECT_LIST.splice(realIndex, 1); // 只删配置
                
                saveData();
                if(typeof refreshUI === 'function') refreshUI();
                this.renderTags();
                if(typeof showToast === 'function') showToast(`🗑️科目「${name}」已停用`);
            }
        }
    }
};

const BasicConfigHandler = {
    // --- 1. 初始化并打开弹窗 (保留原有逻辑，对接新入口) ---
    open: function() {
        openBaseConfigModal();
    },

    // --- 2. 提取数据并保存 (核心改动：分别处理两个输入框) ---
    save: function() {
        const modal = document.getElementById('baseConfigModal');

        // A. 保存基础参数 (数字配置)
        CONFIG.expRate = parseInt(document.getElementById('cfg_exp_rate').value) || 0;
        CONFIG.pointRate = parseInt(document.getElementById('cfg_point_rate').value) || 0;
        CONFIG.pointsPerLevel = parseInt(document.getElementById('cfg_level_exp').value) || 100;

        let levelStr = document.getElementById('cfg_evo_rules').value;
        if (levelStr) {
            EVOLUTION_RULES = levelStr.replace(/，/g, ',').split(',')
                .map(item => parseInt(item.trim())).filter(num => !isNaN(num));
        }

        // B. 获取输入框内容并构建对象
        const pInput = document.getElementById('v2-input-plus');
        const mInput = document.getElementById('v2-input-minus');
        
        // 辅助函数：解析文本并添加到列表
        const addItems = (text, typeVal) => {
            if (!text) return;
            const lines = text.split('\n').map(s => s.trim()).filter(s => s !== "");
            lines.forEach(name => {
                // 查重：名字和类型都一样才算重复
                const exists = SUBJECT_LIST.some(existing => existing.name === name && existing.type === typeVal);
                if (!exists) {
                    SUBJECT_LIST.push({ name: name, type: typeVal });
                }
            });
        };

        // 分别处理加分框(type=1) 和 扣分框(type=-1)
        addItems(pInput.value, 1);
        addItems(mInput.value, -1);

        // 清空输入框
        pInput.value = "";
        mInput.value = "";

        // C. 执行保存和刷新
        saveData();
        if(typeof refreshUI === 'function') refreshUI();
        
        // 关闭弹窗前重新渲染一下列表，或者直接关闭
        SubjectTagHandler.renderTags(); 
        
        modal.style.display = 'none';
        if(typeof showToast === 'function') showToast("💾 配置已保存");
    }
};