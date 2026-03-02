// ===========================================
// 逻辑模块：喂养系统 (Logic Feed)
// ===========================================

// 全局变量：记录批量选中 和 单个喂养选中的科目
let currentBatchSubData = null;
let currentSingleSubData = null; // 新增：单个喂养的当前科目

/**
 * 2. 新增：通用的侧边栏 UI 抓取过滤函数
 */
// function filterAnaSidebarBySearch() {
    // const keyword = document.getElementById('ana_sidebar_Search').value.trim().toLowerCase();
    // const cards = document.querySelectorAll('#ana_target_list .student-card');

    // cards.forEach(card => {
        // const nameEl = card.querySelector('.card-name');
        // if (nameEl) {
            // const nameText = nameEl.textContent.toLowerCase();
            // // 匹配则显示，不匹配则隐藏 (保持 flex 布局)
            // card.style.display = nameText.includes(keyword) ? "flex" : "none";
        // }
    // });
// }