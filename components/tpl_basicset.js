// 确保这个文件的 Key 是 basicSet
window.AppTemplates = window.AppTemplates || {};

window.AppTemplates.basicSet = `
<div id="baseConfigModal" class="modal-overlay">
    <div class="modal" style="width: 800px; max-width: 90vw;">
        <div class="modal-header">
            <div class="modal-title-badges" style="display: flex; align-items: center; gap: 10px; overflow: visible;">
                <span>⚙️ 全局参数设置</span>
                
                <div style="position: relative;">
                    <a href="javascript:void(0)" 
                       onclick="document.getElementById('cfg_help_popup').style.display='block'"
                       style="font-size: 14px; color: #1976D2; text-decoration: underline; cursor: pointer; font-weight: normal;">
                       [使用帮助]
                    </a>
                    
                    <div id="cfg_help_popup" 
                         onmouseleave="this.style.display='none'"
                         style="display: none; 
                                position: absolute; 
                                left: 110%; 
                                top: -10px; 
                                width: 320px; 
                                padding: 15px; 
                                background-color: #FFF8E1; 
                                border: 1px solid #FFE0B2; 
                                border-radius: 8px; 
                                box-shadow: 0 4px 15px rgba(0,0,0,0.15); 
                                z-index: 1000; 
                                font-size: 13px; 
                                line-height: 1.6; 
                                color: #5D4037;
                                text-align: left;">
                        
                        <div style="margin-bottom: 12px; color: #D32F2F; font-weight: bold; background: #FFEBEE; padding: 8px; border-radius: 4px; border: 1px solid #FFCDD2;">
                            ❗ 核心排名规则：<br>
                            排名依据【净增积分】。学生兑换奖品消耗积分，与排名无关（不扣排名分）！请放心兑换。
                        </div>

                        <strong style="color: #E65100; font-size: 14px;">📖 配置指南</strong><hr style="margin: 8px 0; border: 0; border-top: 1px dashed #FFCC80;">
                        
                        <div style="margin-bottom: 6px;">
                            <b>1. 经验/积分兑换比：</b><br>
                            老师打分时输入 "1"，学生实际获得多少经验/积分。建议设为 1:1。
                        </div>
                        <div style="margin-bottom: 6px;">
                            <b>2. 升级经验值：</b><br>
                            学生升一级需要多少经验，例如 100。
                        </div>
                        <div style="margin-bottom: 6px;">
                            <b>3. 图鉴变化等级：</b><br>
                            宠物在哪几个等级会发生形态进化，用逗号隔开 (如 3,6,10,20)。
                        </div>
                        <div>
                            <b>4. 科目列表：</b><br>
                            右侧输入框输入新科目，上方列表点 × 删除。
                            <span style="color: #D32F2F;">(删除操作即时生效，请谨慎)</span>
                        </div>
                        
                        <div style="margin-top: 10px; text-align: right; color: #999; font-size: 12px;">
                            (鼠标移出此区域自动关闭) ↘
                        </div>
                    </div>
                </div>
            </div>
            <span class="close-btn" onclick="document.getElementById('baseConfigModal').style.display='none'">&times;</span>
        </div>
        <div class="v2-cfg-main-layout">
            <div class="v2-cfg-side-left">
                <label class="v2-cfg-big-label">⚖️ 积分规则设置</label>
                <div class="v2-cfg-row"><label>经验兑换比</label><input type="number" id="cfg_exp_rate"  step="1" min="0" oninput="this.value=this.value.replace(/\\D/g,'')" placeholder="整数"></div>
                <div class="v2-cfg-row"><label>积分兑换比</label><input type="number" id="cfg_point_rate" step="1" min="0" oninput="this.value=this.value.replace(/\\D/g,'')"  placeholder="整数"></div>
                <div class="v2-cfg-row"><label>升级经验值</label><input type="number" id="cfg_level_exp" step="1" min="0" oninput="this.value=this.value.replace(/\\D/g,'')" placeholder="整数"></div>
                <div class="v2-cfg-row"><label>图鉴变化等级</label><input type="text" id="cfg_evo_rules" placeholder="如: 3,6,10,20"></div>
            </div>
            <div class="v2-cfg-divider"></div>
            <div class="v2-cfg-side-right">
                <label class="v2-cfg-big-label">📚 科目列表管理</label>
                
                <div class="v2-cfg-tabs-wrapper">
                    <div id="v2-tab-tag-plus" class="v2-cfg-tab-btn active" 
                         onclick="SubjectTagHandler.switchView(1)">
                         ➕加分
                    </div>
                    <div id="v2-tab-tag-minus" class="v2-cfg-tab-btn" 
                         onclick="SubjectTagHandler.switchView(-1)">
                         ➖扣分
                    </div>
                </div>
                
                <div id="cfg_subject_tags" class="v2-cfg-tag-area">
                    <div class="v2-cfg-empty-hint">加载中...</div>
                </div>

                <div class="v2-cfg-tabs-wrapper" style="margin-top: 15px;">
                    <div id="v2-tab-edit-plus" class="v2-cfg-tab-btn active" 
                         onclick="
                            this.parentElement.querySelectorAll('.v2-cfg-tab-btn').forEach(t=>t.classList.remove('active'));
                            this.classList.add('active');
                            document.getElementById('v2-input-plus').style.display='block';
                            document.getElementById('v2-input-minus').style.display='none';
                         ">➕加分</div>
                    <div id="v2-tab-edit-minus" class="v2-cfg-tab-btn" 
                         onclick="
                            this.parentElement.querySelectorAll('.v2-cfg-tab-btn').forEach(t=>t.classList.remove('active'));
                            this.classList.add('active');
                            document.getElementById('v2-input-plus').style.display='none';
                            document.getElementById('v2-input-minus').style.display='block';
                         ">➖扣分</div>
                </div>
                
                <div class="v2-cfg-input-area">
                    <textarea id="v2-input-plus" class="v2-cfg-big-textarea" 
                              placeholder="在此输入【加分】科目，每行一个（点下方保存生效）"></textarea>
                    <textarea id="v2-input-minus" class="v2-cfg-big-textarea" 
                              style="display: none;" 
                              placeholder="在此输入【扣分】科目，每行一个（点下方保存生效）"></textarea>
                </div>
            </div> </div> <div class="v2-cfg-bottom-hints">
            <div class="v2-cfg-hint-left">
                💡 注意：修改这里的数字，现有学生等级不会自动变哦。建议定好了就别改了哈。
            </div>
            <div class="v2-cfg-hint-right">
                注：输入框里一行写一个科目。<br>科目胶囊点一下就能直接改名，点×就是删除。
            </div>
        </div>

        <div class="v2-cfg-footer">
            <button class="btn-submit" style="margin:0; width: 220px;" onclick="BasicConfigHandler.save()">应用并保存</button>
        </div>
    </div> </div> `;