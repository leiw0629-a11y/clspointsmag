// ===========================================
// 逻辑模块：进阶图鉴 (Logic Gallery)
// 依赖全局变量：PET_LIBRARY, EVOLUTION_RULES
// ===========================================

/**
 * 打开图鉴弹窗并渲染内容
 */
function openGalleryModal() {
    const container = document.getElementById('galleryContent');
    container.innerHTML = '';
    
    // 遍历全局 PET_LIBRARY
    for (let key in PET_LIBRARY) {
        const lib = PET_LIBRARY[key];
        // 组名兜底逻辑
        let groupName = key === 'default' ? '默认体系' : (lib.titles && lib.titles.length > 0 ? lib.titles[lib.titles.length - 1] : key);
        
        let html = `<div class="gallery-group"><div class="gallery-title">🔮 ${groupName}</div><div class="gallery-row">`;
        
        lib.images.forEach((img, idx) => {
            let title = lib.titles[idx] || `第${idx}阶`;
            // 计算需要的等级 (第1阶段1级，后面根据 EVOLUTION_RULES)
            let needLv = idx === 0 ? 1 : (EVOLUTION_RULES[idx-1] || 'Max');
            
            // 判断是否为图片链接 (支持 http 开头或常见图片后缀)
            let isImg = img.match(/\.(jpeg|jpg|gif|png|webp)$/i) || img.startsWith('http');
            
            let imgTag = isImg 
                ? `<img src="${img}" class="gallery-img" onclick="showBigImage('${img}')" style="cursor:zoom-in;">` 
                : `<div class="gallery-img" style="font-size:40px; display:flex; align-items:center; justify-content:center;">${img}</div>`;
            
            html += `<div class="gallery-item"><span class="gallery-level">Lv.${needLv}</span>${imgTag}<span class="gallery-name">${title}</span></div>`;
            
            // 箭头
            if (idx < lib.images.length - 1) html += `<div class="gallery-arrow">→</div>`;
        });
        
        html += `</div></div>`;
        container.innerHTML += html;
    }
    
    document.getElementById('galleryModal').style.display = 'flex';
}

/**
 * 显示图鉴大图预览
 * @param {string} src - 图片路径
 */
function showBigImage(src) {
    const overlay = document.getElementById('imgPreviewOverlay');
    const target = document.getElementById('imgPreviewTarget');
    if (overlay && target) {
        target.src = src;
        overlay.style.display = 'flex';
    }
}