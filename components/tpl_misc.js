// 投喂模块

window.AppTemplates = window.AppTemplates || {};

window.AppTemplates.misc = `

<div class="modal-overlay" id="detailModal">
    <div class="modal modal-normal" style="width: 600px;">
        <div class="modal-header">
            <div class="modal-title-badges"><span id="modalTitleText">详情</span></div>
            <span class="close-btn" onclick="closeModal('detailModal')">×</span>
        </div>
        <div id="modalDetailContent" class="detail-content"></div>
    </div>
</div>

<div class="modal-overlay" id="singleFeedModal">
    <div class="modal" style="width: 400px; padding: 25px;">
        <div class="modal-header" style="justify-content: center; border-bottom: none; padding-bottom: 0;">
            <div style="text-align: center;">
                <div style="font-size: 18px; color: #5D4037;">给 <span id="singleFeedName" style="color: #E65100; font-weight: 900; font-size: 22px;"></span> 同学</div>
                <div style="font-size: 12px; color: #999; font-weight: normal; margin-top: 4px;">记录一次成长点滴</div>
            </div>
            <span class="close-btn" onclick="closeModal('singleFeedModal')" style="position: absolute; right: 20px; top: 20px;">×</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 25px; padding-top: 20px;">
            
            <div id="singleSubjectContainer" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                </div>

            <div style="text-align: center; position: relative;">
                <input type="tel" id="singleScore" 
       placeholder="0" 
	   onkeydown="if(event.key === 'Enter') { event.preventDefault(); submitSingleFeed(); }"
       oninput="handleSingleInput(this)"
       style="width: 140px; height: 60px; font-size: 48px; text-align: center; 
              border: none; border-bottom: 3px dashed #FFCCBC; 
              background: transparent; color: #5D4037; font-weight: bold; outline: none;
              font-family: 'Nunito', sans-serif;">

<div id="singleScoreHint" style="font-size: 13px; color: #999; margin-top: 10px; font-weight: bold; min-height: 20px;">
    请选择科目并输入分值
</div>
            </div>
<div style="text-align: center; margin-top: -10px;">
                <div style="display: inline-flex; align-items: center; background: #FFFFFF; padding: 6px 15px; border-radius: 20px; border: 1px solid #FFE0B2;">
                    <span style="font-size: 14px; margin-right: 8px;">📅</span>
                    <input type="date" id="singleFeedDate" 
       onclick="try{this.showPicker()}catch(e){}"
       style="border: none; background: transparent; color: #E65100; font-weight: bold; font-family: inherit; font-size: 14px; outline: none; cursor: pointer; width: 110px;">
                </div>
                <div style="font-size:10px; color:#ccc; margin-top:4px;">(默认为今天，点击可补录旧日期)</div>
            </div>
            <button class="btn-submit" onclick="submitSingleFeed()" title="快捷键: Enter (回车)"
                    style="height: 44px; font-size: 16px; box-shadow: 0 4px 12px rgba(255,107,107,0.3);">
                确认投喂
            </button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="batchModal">
    <div class="modal" onkeydown="if(event.ctrlKey && event.key === 'Enter') { event.preventDefault(); submitBatchFeed(); }" style="width: 980px; height: 85vh; max-height: 750px; display: flex; flex-direction: column;">
        <div class="modal-header" style="flex-shrink: 0; margin-bottom: 10px;">
            <div style="display: flex; align-items: center;">
                <span id="batchTitleText">⚡ 批量成绩录入</span>
				<div style="display: flex; align-items: center; background: #fff; padding: 4px 12px; border-radius: 8px; border: 1px solid #E0E0E0; margin-left: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
					<span style="font-size: 12px; color: #E65100; margin-right: 6px; font-weight:bold;">📅 归属:</span>
					<input type="date" id="batchFeedDate" 
						   onclick="try{this.showPicker()}catch(e){}"
						   style="border: none; background: transparent; color: #E65100; font-family: inherit; outline: none; font-size: 13px; width: 105px; cursor: pointer; font-weight: bold;">
				</div>
            </div>
            <span class="close-btn" onclick="closeModal('batchModal')">×</span>
        </div>

        <div style="display: flex; flex: 1; overflow: hidden; gap: 20px;">
            <div style="width: 220px; display: flex; flex-direction: column; gap: 15px; flex-shrink: 0;">
                <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #FFFBF7; padding: 12px; border-radius: 12px; border: 1px solid #FFE0B2;">
                    <div style="font-size: 13px; color: #2E7D32; font-weight: bold; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed #A5D6A7; flex-shrink: 0;">
                        🌟 加分科目
                    </div>
                    <div style="flex: 1; overflow-y: auto;">
                        <div id="batchPosTags" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 5px;"></div>
                    </div>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #FFFBF7; padding: 12px; border-radius: 12px; border: 1px solid #FFE0B2;">
                    <div style="font-size: 13px; color: #C62828; font-weight: bold; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed #EF9A9A; flex-shrink: 0;">
                        ⚡ 扣分科目
                    </div>
                    <div style="flex: 1; overflow-y: auto;">
                        <div id="batchNegTags" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 5px;"></div>
                    </div>
                </div>
            </div>

            <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background: white; border-left: 1px dashed #FFEEE4; padding-left: 15px;">
    
    <div class="updbth_console">
        <div class="updbth_layer1">
            <div style="display: flex; align-items: center; background: #FAFAFA; padding: 6px 15px; border-radius: 10px; border: 1px solid #EEE;">
                <span style="font-size: 13px; color: #8D6E63; margin-right: 8px;">当前选中:</span>
                <span id="selectedBatchSubjectLabel" style="font-weight: bold; font-size: 14px; color: #E65100;">请选择科目</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 13px; color: #8D6E63; background: #FFF8E1; padding: 4px 12px; border-radius: 20px;">
                    已选: <span id="updbth_selectedCount" style="color: #FF6B6B; font-weight: 900; font-size: 16px; margin: 0 2px;">0</span> 人
                </div>
                <button class="updbth_btn_select" onclick="updbth_toggleAllCards()">
                    全选/反选
                </button>
                <button class="btn-submit" onclick="submitBatchFeed()" style="width: auto; height: 38px; padding: 0 24px; font-size: 15px; margin-top: 0; box-shadow: 0 4px 12px rgba(255,107,107,0.3);">
                    确认录入
                </button>
            </div>
        </div>

        <div class="updbth_layer2">
            <div style="font-size: 14px; color: #8D6E63; font-weight: bold;">分值:</div>
            
            <div style="display: flex; gap: 10px; align-items: center;">
                <div class="updbth_capsule" onclick="document.getElementById('updbth_globalScore').value=5; updbth_updateGlobalPreview();">5分</div>
				<div class="updbth_capsule" onclick="document.getElementById('updbth_globalScore').value=10; updbth_updateGlobalPreview();">10分</div>
				<div class="updbth_capsule" onclick="document.getElementById('updbth_globalScore').value=15; updbth_updateGlobalPreview();">15分</div>
                
                <div style="width: 1px; height: 18px; background: #FFCCBC; margin: 0 5px;"></div>
                
                <input type="tel" id="updbth_globalScore" class="updbth_input" placeholder="自定义" oninput="this.value = this.value.replace(/[^0-9]/g, ''); /* 触发预览事件 */">
            </div>
            
            <div style="margin-left: auto; display: flex; align-items: center; background: white; padding: 6px 15px; border-radius: 20px; border: 1px dashed #FFE0B2; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                <span style="font-size: 13px; color: #999; margin-right: 8px;">预览:</span>
                <span id="updbth_globalPreview" style="font-size: 14px; font-weight: bold; color: #ccc;">请先输入分值</span>
            </div>
        </div>
    </div>
	
    <div class="batch-list-container updbth_list_override" style="flex: 1; margin-bottom: 0; border: 1px solid #FFEEE4; overflow-y: auto; overflow-x: hidden; max-height: none;">
		<div id="updbth_cardContainer" class="updbth_card_grid">
			
			<div class="updbth_stu_card">
				<span class="updbth_stu_name">程羽</span>
				<span class="updbth_stu_coin">🪙62</span>
			</div>
			
			<div class="updbth_stu_card selected">
				<span class="updbth_stu_name">林小明</span>
				<span class="updbth_stu_coin">🪙85</span>
			</div>
			
			<div class="updbth_stu_card">
				<span class="updbth_stu_name">欧阳夏丹</span>
				<span class="updbth_stu_coin">🪙12</span>
			</div>
			
			<div class="updbth_stu_card">
				<span class="updbth_stu_name">张三</span>
				<span class="updbth_stu_coin">🪙105</span>
			</div>
			</div>
	</div>
	
</div>

        </div>
    </div>
</div>

<div class="modal-overlay" id="levelUpModal" style="z-index: 2000;">
    <div class="modal" style="width: 500px; text-align: center; background: linear-gradient(135deg, #FFF 0%, #FFF8E1 100%); border: 4px solid #FFD700;">
        <div style="font-size: 24px; font-weight: 900; color: #FF6B6B; margin-bottom: 5px; text-shadow: 2px 2px 0px #FFE0B2;">
            🎉 恭喜 <span id="levelUpName" style="font-size: 30px; color:#E65100;"></span> 同学升级！
        </div>
        <div id="levelUpImgContainer" style="margin: 5px auto 15px; width: 320px; height: 320px; display: flex; align-items: center; justify-content: center; animation: zoomBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>
        <div style="background: #FFE0B2; color: #E65100; display: inline-block; padding: 4px 20px; border-radius: 50px; font-weight: bold; font-size: 16px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(255, 167, 38, 0.3);">
            获得称号：<span id="levelUpTitle"></span>
        </div>
        <button class="btn-submit" onclick="closeModal('levelUpModal')" style="background: linear-gradient(135deg, #FFD700 0%, #FFCA28 100%); box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);">太棒了！(关闭)</button>
    </div>
</div>

<div id="centerToast" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 20px 40px; border-radius: 12px; font-weight: bold; z-index: 3000; display: none; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
    <div style="font-size: 30px; margin-bottom: 10px;">🎉</div>
    <span id="toastMsg">操作成功</span>
</div>
`;