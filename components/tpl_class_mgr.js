window.AppTemplates = window.AppTemplates || {};

window.AppTemplates.classMgr = `
<div class="modal-overlay" id="classMgrModal">
    <div class="modal" style="width: 850px; height: 85vh; max-height: 85vh;">
        <div class="modal-header">
            <span>🏫 班级档案管理</span>
            <span class="close-btn" onclick="closeModal('classMgrModal')">×</span>
        </div>
        
        <div class="mgr-container">
            <div class="mgr-sidebar">
                <div style="font-weight:bold; color:#5D4037; margin-bottom:15px; text-align:center; font-size:12px; border-bottom:1px solid #eee; padding-bottom:5px;">管理菜单</div>
                
                <div class="mgr-tab-btn active" onclick="switchMgrTab('class-list', this)">
                    <span>📋</span> 班级列表
                </div>
                
                <div class="mgr-tab-btn" onclick="switchMgrTab('new-class', this)">
                    <span>➕</span> 新建班级
                </div>

                <div class="mgr-tips-box">
                    <strong>💡 小贴士</strong>
                    • 新生请去管理页录入<br>
                    • 分组前请先建班
                </div>
            </div>
            
            <div class="mgr-main">
                
                <div id="panel-class-list" class="mgr-panel active">
                    
                    
                    <div class="panel-scroll-area" style="overflow-x: hidden;">
                        <table class="data-table" style="width:100%; min-width: 600px; font-size: 13px;"> 
                            <thead>
                                <tr>
                                    <th style="white-space: nowrap; min-width: 100px;">班级名称</th>
                                    <th width="60">人数</th>
                                    <th width="80">状态</th>
                                    <th width="210">操作</th>
                                </tr>
                            </thead>
                            <tbody id="classListBody">
                                </tbody>
                        </table> 
                    </div>
                </div>

                <div id="panel-new-class" class="mgr-panel">
                    <div class="panel-scroll-area" style="display: flex; flex-direction: column; height: 100%; padding: 0 5px 10px 5px; overflow-x: hidden;">
                        <div class="form-group" style="flex-shrink: 0; margin-bottom: 15px;">
                            <label class="form-label">🏫 班级名称 <span style="color:#FF5252">*</span></label>
                            <input type="text" id="newClassNameInput" class="form-input" placeholder="必填，例：四年三班">
                        </div>
                        <div class="form-group" style="flex: 1; display: flex; flex-direction: column; margin-bottom: 10px; min-height: 0;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                                <label class="form-label" style="margin-bottom: 0;">📝 初始名单 <span style="font-size:12px; color:#999; font-weight:normal;">(选填)</span></label>
                                <button onclick="document.getElementById('txtImportInput').click()" style="background:#FFF3E0; border:1px solid #FFCCBC; color:#E65100; padding:4px 12px; border-radius:6px; cursor:pointer; font-size:12px;">📂 导入 TXT</button>
                                <input type="file" id="txtImportInput" hidden accept=".txt" onchange="handleTxtImport(this)">
                            </div>
                            <textarea id="newClassStudentList" class="form-input" style="flex: 1; height: auto !important; padding: 15px; resize: none; line-height: 1.4;" placeholder="张三&#10;李四&#10;..."></textarea>
                        </div>
                        <div style="flex-shrink: 0;">
                            <button class="btn-submit" onclick="doCreateClass()">💾 立即创建</button>
                        </div>
                    </div>
                </div>

                <div id="view-student-mgr" class="mgr-panel">
                    <div class="panel-header-area">
                        <div style="display:flex; align-items:center; cursor:pointer; color:#FF7043;" onclick="showSubView('panel-class-list')">
                            <span style="font-size:18px; margin-right:5px;">◀</span> 
                            <span style="font-weight:bold;">返回列表</span>
                        </div>
                        <div style="font-weight:bold; color:#5D4037;" id="studentMgrTitle">🎓班级名单</div>
                        
                        <button class="chart-action-btn btn-add-stu" style="background:#4ECDC4; color:white; border:none;" 
                                onclick="openAddStudentModal()">
                            + 新增学生
                        </button>
                    </div>
                    
                    <div class="panel-scroll-area" style="overflow-x: hidden;">
                        <table class="data-table" style="width:100%; font-size: 13px;">
                            <thead>
                                <tr>
                                    <th style="min-width: 100px; white-space: nowrap;">姓名</th>
                                    <th>所属分组</th>
                                    <th width="180">操作</th>
                                </tr>
                            </thead>
                            <tbody id="mgrStudentListBody">
                                </tbody>
                        </table>
                    </div>

                    <div id="modal-add-student-sub" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; justify-content: center; align-items: center; backdrop-filter: blur(2px); animation: fadeIn 0.2s;">
                        <div style="background: white; width: 400px; padding: 20px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 2px solid #FFEEE4;">
                            <div style="font-weight:bold; font-size:18px; color:#5D4037; margin-bottom:15px; border-bottom:1px dashed #FFCCBC; padding-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                                <span>👨‍🎓 录入学生</span>
                                <span style="cursor:pointer; color:#ccc; font-size:24px; line-height:1;" onclick="document.getElementById('modal-add-student-sub').style.display='none'">×</span>
                            </div>

                            <div style="margin-bottom: 20px;">
                                <textarea id="input-new-students" class="form-input" 
                                          style="height: 120px; resize: none; line-height: 1.6; padding: 10px;" 
                                          placeholder="请输入学生姓名&#10;支持批量粘贴&#10;一行一个名字"></textarea>
                                <div style="font-size:12px; color:#999; margin-top:5px; text-align:right;">* 多个名字请换行分隔</div>
                            </div>

                            <div style="display: flex; gap: 10px;">
                                <button onclick="document.getElementById('modal-add-student-sub').style.display='none'" 
                                        style="flex: 1; height: 40px; border-radius: 20px; border: 1px solid #ddd; background: #f5f5f5; color: #666; cursor: pointer; font-weight:bold;">
                                    取消
                                </button>
                                <button onclick="submitAddStudents()" 
                                        style="flex: 1; height: 40px; border-radius: 20px; border: none; background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); color: white; cursor: pointer; font-weight:bold; box-shadow: 0 4px 10px rgba(255,107,107,0.3);">
                                    确认添加
                                </button>
                            </div>
                        </div>
                    </div>
					
					<div id="modal-rename-student" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2100; justify-content: center; align-items: center; backdrop-filter: blur(2px); animation: fadeIn 0.2s;">
                        <div style="background: white; width: 380px; padding: 25px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 2px solid #E3F2FD;">
                            <div style="font-weight:bold; font-size:18px; color:#1565C0; margin-bottom:20px; text-align:center;">
                                ✎ 修改姓名
                            </div>
                            
                            <div style="margin-bottom: 25px;">
                                <label style="display:block; color:#666; font-size:12px; margin-bottom:5px;">当前名字</label>
                                <div id="rename-old-name-display" style="padding: 10px; background:#f5f5f5; border-radius:8px; color:#999; margin-bottom:15px;"></div>
                                
                                <label style="display:block; color:#1565C0; font-size:12px; margin-bottom:5px; font-weight:bold;">新名字</label>
                                <input type="text" id="renameInput" class="form-input" placeholder="请输入新名字" 
                                       style="width:100%; padding:10px; border:1px solid #90CAF9; border-radius:8px; outline:none; font-size:16px;">
                            </div>

                            <div style="display: flex; gap: 10px;">
                                <button onclick="document.getElementById('modal-rename-student').style.display='none'" 
                                        style="flex: 1; height: 40px; border-radius: 20px; border: 1px solid #ddd; background: #f5f5f5; color: #666; cursor: pointer; font-weight:bold;">
                                    取消
                                </button>
                                <button onclick="submitRename()" 
                                        style="flex: 1; height: 40px; border-radius: 20px; border: none; background: linear-gradient(135deg, #42A5F5 0%, #1976D2 100%); color: white; cursor: pointer; font-weight:bold; box-shadow: 0 4px 10px rgba(33, 150, 243, 0.3);">
                                    确认修改
                                </button>
                            </div>
                        </div>
                    </div>
					
                </div>

                <div id="view-group-mgr" class="mgr-panel">
                    <div class="panel-header-area">
                        <div style="display:flex; align-items:center; cursor:pointer; color:#FF7043;" onclick="showSubView('panel-class-list')">
                            <span style="font-size:18px; margin-right:5px;">◀</span> 
                            <span style="font-weight:bold;">返回列表</span>
                        </div>
                        <div style="font-weight:bold; color:#5D4037;" id="groupMgrTitle">🧩 分组管理</div>
                        
                        <button class="chart-action-btn btn-new-grp" style="background: linear-gradient(135deg, #FF9966 0%, #FF5E62 100%); color:white; border:none; box-shadow: 0 4px 10px rgba(255, 94, 98, 0.3);" 
                                onclick="document.getElementById('modal-create-group').style.display='flex'">
                            ➕ 新建小组
                        </button>
                    </div>

                    <div class="group-matrix-layout" id="groupMatrixContainer">
                        </div>

                    <div id="modal-create-group" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; justify-content: center; align-items: center; backdrop-filter: blur(2px); animation: fadeIn 0.2s;">
                        <div style="background: white; width: 380px; padding: 25px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 2px solid #FFEEE4;">
                            <div style="font-weight:bold; font-size:18px; color:#5D4037; margin-bottom:20px; text-align:center;">
                                ✨ 新建小组
                            </div>
                            
                            <input type="text" id="newGroupNameInput" class="form-input" placeholder="请输入小组名称 (如: 飞虎队)" style="margin-bottom: 25px;">

                            <div style="display: flex; gap: 10px;">
                                <button onclick="document.getElementById('modal-create-group').style.display='none'" 
                                        style="flex: 1; height: 40px; border-radius: 20px; border: 1px solid #ddd; background: #f5f5f5; color: #666; cursor: pointer; font-weight:bold;">
                                    取消
                                </button>
                                <button onclick="doCreateGroup()" 
                                        style="flex: 1; height: 40px; border-radius: 20px; border: none; background: linear-gradient(135deg, #FF9966 0%, #FF5E62 100%); color: white; cursor: pointer; font-weight:bold; box-shadow: 0 4px 10px rgba(255, 94, 98, 0.3);">
                                    确认创建
                                </button>
                            </div>
                        </div>
                    </div>

                    <div id="modal-select-members" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; justify-content: center; align-items: center; backdrop-filter: blur(2px); animation: fadeIn 0.2s;">
                        <div style="background: white; width: 550px; padding: 25px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 2px solid #FFEEE4; display: flex; flex-direction: column; max-height: 80vh;">
                            <div style="margin-bottom: 15px; border-bottom: 1px dashed #FFCCBC; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end; flex-shrink: 0;">
                                <div>
                                    <span id="groupSelectTitle" style="font-weight:bold; font-size: 20px; color: #FF9966;">分组名称</span>
                                    <span style="font-size: 12px; color: #999; margin-left: 10px; font-weight: normal;">
                                        (仅显示“未分组”的学员)
                                    </span>
                                </div>
                                <span style="cursor:pointer; color:#ccc; font-size: 26px; line-height: 1; margin-bottom: 2px;" onclick="document.getElementById('modal-select-members').style.display='none'">×</span>
                            </div>

                            <div id="groupSelectList" class="member-select-list" style="overflow-y: auto; flex: 1; min-height: 200px;">
                                </div>

                            <div style="display: flex; gap: 15px; margin-top: 15px; flex-shrink: 0;">
                                <button onclick="document.getElementById('modal-select-members').style.display='none'" 
                                        style="flex: 1; height: 44px; border-radius: 22px; border: 1px solid #E0E0E0; background: #F5F5F5; color: #666; cursor: pointer; font-weight:bold; font-size:14px;">
                                    取消
                                </button>
                                <button onclick="submitAddMembersToGroup()" 
                                        style="flex: 1; height: 44px; border-radius: 22px; border: none; background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); color: white; cursor: pointer; font-weight:bold; box-shadow: 0 4px 12px rgba(255,107,107,0.3); font-size:14px;">
                                    确认添加
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div> 
        </div> 
    </div>
</div>
`;