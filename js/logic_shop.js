// ===========================================
// 逻辑模块：积分商城 (Logic Shop) - 按班级独立版
// ===========================================

let selectedProductIdx = -1;
let selectedStudentNames = new Set(); 
let currentShopClass = ''; // 🌟 核心：记录当前操作的班级

/**
 * 打开积分商城弹窗
 */
function openShopModal() {
    // 1. 获取当前选中的班级
    const classSelect = document.getElementById('classSelect');
    const selectedClass = classSelect ? classSelect.value : 'all';

    // 2. 拦截：必须选具体班级
    if (selectedClass === 'all') {
        showToast("⚠️ 请先选择一个具体的班级，再进入商城");
        return; 
    }

    // 3. 锁定班级 & 初始化数据
    currentShopClass = selectedClass;
    
    // 🌟 如果该班级还没有商品数据，初始化为空数组，防止报错
    if (!products[currentShopClass]) {
        products[currentShopClass] = [];
    }

    // 4. 重置状态
    selectedProductIdx = -1; 
    selectedStudentNames.clear(); 
    
    // 5. 更新UI
    const titleEl = document.getElementById('shopTitleText');
    if (titleEl) titleEl.innerText = `🎁 ${currentShopClass} 积分商城`;

    // 调整弹窗尺寸
    const modal = document.querySelector('#shopModal .modal');
    modal.style.width = "850px";
    modal.style.height = "85vh";       
    modal.style.maxHeight = "85vh";
    const shopContainer = document.querySelector('.shop-container');
    if(shopContainer) shopContainer.style.height = "calc(100% - 50px)"; 

    updateBatchBtnState(); 
    renderShopProducts(); 
    renderShopStudents(); 
    document.getElementById('shopModal').style.display = 'flex';
}

/**
 * 获取选中学生的最低积分
 */
function getMinPointsOfSelectedStudents() {
    if (selectedStudentNames.size === 0) return Infinity; 
    let min = Infinity;
    selectedStudentNames.forEach(name => {
        const s = students.find(stu => stu.name === name);
        if (s) { 
            const cp = s.currentPoints !== undefined ? s.currentPoints : (s.totalPoints || 0); 
            if (cp < min) min = cp; 
        }
    });
    return min;
}

/**
 * 渲染商品列表 (只渲染当前班级的)
 */
function renderShopProducts() {
    const container = document.getElementById('shopGoodsGrid');
    container.innerHTML = '';
    const minStudentPoints = getMinPointsOfSelectedStudents();
    
    // 🌟 只获取当前班级的商品
    const currentList = products[currentShopClass] || [];
    
    currentList.forEach((p, idx) => {
        const div = document.createElement('div');
        const isTooExpensive = p.price > minStudentPoints;
        div.className = `good-card ${selectedProductIdx === idx ? 'active' : ''} ${isTooExpensive ? 'disabled' : ''}`;
        
        div.onclick = (e) => {
            if(e.target.className.includes('btn-del')) return;
            if(isTooExpensive) return; 
            
            selectedProductIdx = (selectedProductIdx === idx) ? -1 : idx;
            updateBatchBtnState(); 
            renderShopProducts(); 
            renderShopStudents(); 
        };

        div.innerHTML = `
            <span class="btn-del-good" onclick="deleteProduct(${idx})">×</span>
            <div class="good-icon">${p.icon || '🎁'}</div>
            <div class="good-name">${p.name}</div>
            <div class="good-price">🪙 ${p.price}</div>
        `;
        container.appendChild(div);
    });

    // 添加按钮
    const addBtn = document.createElement('div');
    addBtn.className = 'good-card add-good-card';
    addBtn.innerHTML = '<span style="font-size:24px;">+</span><span style="font-size:12px;">添加商品</span>';
    addBtn.onclick = addNewProduct;
    container.appendChild(addBtn);
}

/**
 * 渲染学生列表 (只显示当前班级)
 */
function renderShopStudents() {
    const container = document.getElementById('shopStudentList');
    const term = document.getElementById('shopSearchInput').value.toLowerCase();
    
    container.innerHTML = '';
    
    // 🌟 获取当前选中商品
    const currentList = products[currentShopClass] || [];
    const product = selectedProductIdx !== -1 ? currentList[selectedProductIdx] : null;
    
    // 排序
    const sorted = [...students].sort((a, b) => (b.currentPoints||0) - (a.currentPoints||0));
    
    sorted.forEach((stu) => {
        // 🌟 严格过滤：必须是当前班级的学生
        if (stu.className !== currentShopClass) return;

        // 搜索过滤
        if (term && !stu.name.toLowerCase().includes(term)) return;
        
        const cp = stu.currentPoints !== undefined ? stu.currentPoints : (stu.totalPoints || 0);
        let canBuy = true;
        if (product && cp < product.price) canBuy = false;
        
        const isSelected = selectedStudentNames.has(stu.name);
        
        const div = document.createElement('div');
        div.className = `shop-stu-item ${!canBuy ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`;
        
        if (canBuy) {
            div.onclick = () => {
                if (selectedStudentNames.has(stu.name)) selectedStudentNames.delete(stu.name);
                else selectedStudentNames.add(stu.name);
                renderShopStudents(); 
                renderShopProducts(); 
                updateBatchBtnState();
            };
        }
        
        div.innerHTML = `<div style="font-weight:bold;">${stu.name}</div><div class="shop-stu-coin" style="color:${canBuy ? '#E65100' : '#ccc'}">🪙 ${cp}</div>`;
        container.appendChild(div);
    });
}

/**
 * 更新按钮状态
 */
function updateBatchBtnState() {
    const count = selectedStudentNames.size;
    const countEl = document.getElementById('selectedCount');
    if(countEl) countEl.innerText = count;
    
    const btn = document.getElementById('btnBatchBuy');
    if(!btn) return;
    
    const currentList = products[currentShopClass] || [];
    const product = selectedProductIdx !== -1 ? currentList[selectedProductIdx] : null;
    
    if (count > 0 && product) {
        btn.classList.add('active');
        const totalPrice = count * product.price;
        btn.innerText = `兑换 (消耗 ${totalPrice})`;
    } else {
        btn.classList.remove('active');
        if (count === 0 && !product) btn.innerText = '请选择商品和学生';
        else if (!product) btn.innerText = '请选择商品';
        else if (count === 0) btn.innerText = '请选择学生';
        else btn.innerText = '确认兑换';
    }
}

/**
 * 提交购买
 */
function submitBatchPurchase() {
    const currentList = products[currentShopClass] || [];
    const product = currentList[selectedProductIdx];
    const names = Array.from(selectedStudentNames);
    
    if (!product || names.length === 0) return;
    if (!confirm(`确认要为这 ${names.length} 位同学兑换 [${product.name}] 吗？\n总计消耗 ${names.length * product.price} 积分`)) return;
    
    let successCount = 0;
    names.forEach(name => {
        const idx = students.findIndex(s => s.name === name);
        if (idx !== -1) {
            if ((students[idx].currentPoints || 0) >= product.price) {
                // 调用 script.js 的核心扣分
                addPoints(idx, -product.price, `兑换：${product.name}`, new Date(), true);
                successCount++;
            }
        }
    });

    if(successCount > 0) {
        saveData();
        selectedStudentNames.clear(); 
        selectedProductIdx = -1; 
        updateBatchBtnState(); 
        refreshUI(); 
        renderShopProducts(); 
        renderShopStudents(); 
        showToast(`🎉 成功兑换 ${successCount} 个商品！`);
    }
}

/**
 * 添加商品
 */
function addNewProduct() {
    document.getElementById('newProdName').value = '';
    document.getElementById('newProdPrice').value = '';
    document.getElementById('addProductModal').style.display = 'flex';
    setTimeout(() => document.getElementById('newProdName').focus(), 100);
}

/**
 * 确认添加 (直接存入当前班级)
 */
function confirmAddProduct() {
    const name = document.getElementById('newProdName').value.trim();
    const priceVal = document.getElementById('newProdPrice').value.trim();
    
    if (!name || !priceVal) return;
    
    // 🌟 确保当前班级数组存在
    if (!products[currentShopClass]) products[currentShopClass] = [];
    
    products[currentShopClass].push({ 
        name: name, 
        price: parseInt(priceVal), 
        icon: "🎁" 
    });
    
    saveData(); 
    renderShopProducts(); 
    closeModal('addProductModal'); 
    showToast("✅ 商品已上架到 " + currentShopClass);
}

/**
 * 删除商品
 */
function deleteProduct(idx) {
    if(confirm("确定删除这个商品吗？")) {
        // 🌟 从当前班级数组删除
        if (products[currentShopClass]) {
            products[currentShopClass].splice(idx, 1);
        }
        
        if(selectedProductIdx === idx) selectedProductIdx = -1;
        saveData(); 
        renderShopProducts(); 
        renderShopStudents(); 
    }
}