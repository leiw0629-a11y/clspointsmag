window.AppTemplates = window.AppTemplates || {};

window.AppTemplates.groupDetail = `
<!-- ================= 小组详情弹窗 ================= -->
<div id="groupDetailModal" class="modal-overlay" onclick="if(event.target===this) closeModal('groupDetailModal')">
    <div class="modal" style="width: 900px; height: 80vh; max-height: 80vh;">
        <!-- 弹窗头部 -->
        <div class="modal-header">
            <div class="modal-title-badges" id="groupModalTitle">
                <!-- 动态填充 -->
            </div>
            <span class="close-btn" onclick="closeModal('groupDetailModal')">&times;</span>
        </div>
        
        <!-- 弹窗内容区 -->
        <div id="groupModalContent" style="height: calc(100% - 50px); overflow: hidden; padding: 0;">
            <!-- JS 动态填充内容 -->
        </div>
    </div>
</div>
`;