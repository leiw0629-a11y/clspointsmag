// ===========================================
// 逻辑模块：数据导入导出 (Logic IO) - 纯净 JSON 版
// ===========================================

/**
 * 导出当前完整存档为 .json 文件
 */
/**
 * 导出当前完整存档为 .json 文件
 */
async function exportDataWithPicker() {
    // 1. 准备数据
    const exportData = {
        version: "2.0",
        timestamp: new Date().toLocaleString(),
        docTitle: docTitle, 
        config: CONFIG,
        subjects: SUBJECT_LIST,
        rules: EVOLUTION_RULES,
        students: students,
        history: historyData,
        products: products
    };
    const jsonString = JSON.stringify(exportData, null, 4);

    // ==========================================
    // 🕒 核心修改：生成纯净文件名 (无"存档"字样，无重复)
    // ==========================================
    
    // 1. 生成当前时间 (格式：20260121_093005)
    const now = new Date();
    const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    // 2. 清洗 docTitle (还原出最干净的标题)
    let cleanTitle = docTitle;

    // 正则 A：去掉旧的时间戳 (匹配结尾的 _8位数字_6位数字)
    // 例如： "萌宠养成记_20221212_122343" -> "萌宠养成记"
    const datePattern = /_?\d{8}_\d{6}$/; 
    if (datePattern.test(cleanTitle)) {
        cleanTitle = cleanTitle.replace(datePattern, '');
    }

    // 正则 B：去掉以前残留的 "_存档" 字样
    // 例如： "萌宠养成记_存档" -> "萌宠养成记"
    // 如果您之前的标题里已经堆积了 "萌宠养成记_存档_存档"，这里会把最后一个去掉
    // 建议用循环彻底洗净，或者只去尾部即可，通常去尾部就够了
    const archivePattern = /_?存档$/;
    while (archivePattern.test(cleanTitle)) {
        cleanTitle = cleanTitle.replace(archivePattern, '');
    }

    // 3. 拼接最终文件名
    // 格式： 干净标题_新时间.json
    // 注意：这里中间删除了 "存档" 两个字
    const fileName = `${cleanTitle}_${timeStr}.json`;

    // ==========================================
    // 🕒 修改结束
    // ==========================================

    try {
        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(jsonString);
            await writable.close();
        } else {
            // 兼容模式
            const blob = new Blob([jsonString], { type: "application/json" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(link.href);
        }
        isDataDirty = false;
        showToast("💾 导出成功！");
    } catch (error) {
        if (error.name !== 'AbortError') showToast("❌ 导出失败");
    }
}

/**
 * 触发文件选择 (带脏数据保护)
 */
function triggerImport() {
    const fileInput = document.getElementById('importFile');
    fileInput.accept = ".json"; // 强制指定选择 json 文件
    
    if (!isDataDirty) { 
        fileInput.value = ''; 
        fileInput.click(); 
        return; 
    }
    
    if (confirm("⚠️ 警告：当前有未保存的修改！\n导入新文件将覆盖现有数据，是否继续？")) { 
        fileInput.value = ''; 
        fileInput.click(); 
    }
}

/**
 * 处理 JSON 导入解析
 */
function handleImport(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            // ==========================================
            // 🛑 新增：严格式校验逻辑 (Validation Logic)
            // ==========================================
            
            // 1. 基础对象检查
            if (!data || typeof data !== 'object') {
                throw new Error("文件内容无效");
            }

            // 2. 核心字段完整性检查
            // 必须包含以下所有字段才允许导入，否则视为格式错误
            const requiredKeys = ['students', 'history', 'config', 'subjects', 'rules', 'products'];
            const missingKeys = requiredKeys.filter(key => !Object.prototype.hasOwnProperty.call(data, key));

            if (missingKeys.length > 0) {
                alert(`❌导入失败：文件格式不符合要求！\n\n检测到缺失关键数据块：\n${missingKeys.join(', ')}\n\n请确保导入的是本系统导出的JSON存档。`);
                input.value = ''; // 清空文件选择
                return; // ⛔️ 立即终止，不执行后续赋值
            }

            // 3. 数据类型安全性检查 (防止数组变成了 null 或其他类型)
            if (!Array.isArray(data.students) || !Array.isArray(data.history)) {
                alert("❌导入失败：核心数据结构已损坏！\n\n学生列表(students)或历史记录(history)不是有效格式。");
                input.value = '';
                return; // ⛔️ 立即终止
            }

            // ==========================================
            // ✅ 校验通过，开始覆盖数据
            // ==========================================

            // 1. 基础配置与标题覆盖
            if (data.docTitle) docTitle = data.docTitle;
            if (data.config) Object.assign(CONFIG, data.config);
			// --- 重点修改科目导入逻辑 ---
if (data.subjects && Array.isArray(data.subjects)) {
    // 兼容逻辑：如果是旧版的字符串数组 ["语文", "数学"]
    // 则自动转换为新版对象数组 [{name: "语文", type: 1}, ...]
    SUBJECT_LIST = data.subjects.map(sub => {
        if (typeof sub === 'string') {
            return { name: sub, type: 1 }; // 旧数据默认为加分项
        }
        return sub; // 如果已经是对象则直接返回
    });
}
            // if (data.subjects) SUBJECT_LIST = data.subjects;
            if (data.rules) EVOLUTION_RULES = data.rules;
            if (data.products) products = data.products;

            // 2. 核心数据数组覆盖 (采用清空并推入模式，保持内存引用一致)
            // 因为前面已经校验过是 Array，这里可以放心操作
            students.length = 0; 
            students.push(...data.students); 
            
            historyData.length = 0; 
			// 可以删除
			// 遍历一下导入的数据，如果发现没有 targetDate，就借用 time 里的日期
const safeHistory = data.history.map(item => {
    // 如果 item.targetDate 不存在，就截取 item.time 的前10位 (2026-01-20)
    // 注意：这里假设 time 是标准格式字符串
    if (!item.targetDate && item.time) {
        item.targetDate = item.time.split(' ')[0]; 
    }
    return item;
});
// 删除结束
			
            historyData.push(...data.history);

            // 3. 刷新界面流程
            // document.getElementById('mainTitle').innerText = `🔥 ${docTitle} 萌宠养成`;
            saveData();  // 同步到本地缓存
            refreshUI(); // 全局刷新 UI
            
            // 如果存在班级管理初始化函数，则调用
            if (typeof initClassOptions === 'function') initClassOptions();
            
            isDataDirty = false;
            showToast("📂 存档导入成功！");
            input.value = '';
        } catch (error) {
            console.error("导入解析出错:", error);
            // 区分是校验错误还是解析错误
            if (error.name === 'SyntaxError') {
                alert("❌ 导入失败：文件不是有效的 JSON 格式。");
            } else {
                alert("❌ 导入失败：无法解析文件内容。");
            }
            input.value = '';
        }
    };
    reader.readAsText(file);
}