/**
 * SMS 验证码服务前端 JavaScript
 * 主要功能：短信记录查询和验证码获取
 */
document.addEventListener("DOMContentLoaded", function() {
    // 初始化常量和变量
    const PAGE_SIZE = 10;
    let currentPage = 1;
    let totalRecords = 0;
    
    // DOM 元素
    const codeQueryForm = document.getElementById('codeQueryForm');
    const queryResult = document.getElementById('queryResult');
    const resultContent = document.getElementById('resultContent');
    const smsRecordsTable = document.getElementById('smsRecordsTable');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noRecords = document.getElementById('noRecords');
    const pagination = document.getElementById('pagination');
    const refreshButton = document.querySelector('.refresh-records');
    
    // 初始化页面
    initializePage();
    
    /**
     * 初始化页面
     */
    function initializePage() {
        // 加载短信记录
        loadSMSRecords(currentPage);
        
        // 绑定事件监听器
        bindEventListeners();
        
        // 初始化工具提示
        initializeTooltips();
    }
    
    /**
     * 绑定事件监听器
     */
    function bindEventListeners() {
        // 验证码查询表单提交
        if (codeQueryForm) {
            codeQueryForm.addEventListener('submit', function(e) {
                e.preventDefault();
                queryVerificationCode();
            });
        }
        
        // 刷新按钮点击
        if (refreshButton) {
            refreshButton.addEventListener('click', function() {
                loadSMSRecords(currentPage);
            });
        }
        
        // 监听窗口大小变化，调整表格显示
        window.addEventListener('resize', function() {
            adjustTableColumns();
        });
    }
    
    /**
     * 初始化工具提示
     */
    function initializeTooltips() {
        // 如果Bootstrap tooltip可用
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            tooltips.forEach(tooltip => {
                new bootstrap.Tooltip(tooltip);
            });
        }
    }
    
    /**
     * 加载短信记录
     * @param {number} page - 页码
     */
    function loadSMSRecords(page) {
        const offset = (page - 1) * PAGE_SIZE;
        
        // 显示加载指示器
        if (loadingIndicator) {
            loadingIndicator.classList.remove('d-none');
        }
        
        // 隐藏无记录提示
        if (noRecords) {
            noRecords.classList.add('d-none');
        }
        
        // 清空表格内容
        if (smsRecordsTable) {
            const tableBody = smsRecordsTable.querySelector('tbody');
            if (tableBody) {
                tableBody.innerHTML = '';
            }
        }
        
        // 获取短信记录
        fetch(`/v1/sms/history?limit=${PAGE_SIZE}&offset=${offset}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应异常');
                }
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    // 更新记录总数
                    totalRecords = data.length === PAGE_SIZE ? -1 : offset + data.length;
                    
                    // 渲染记录
                    renderSMSRecords(data);
                    
                    // 更新分页
                    updatePagination(data.length === PAGE_SIZE);
                    
                    // 调整表格列
                    adjustTableColumns();
                    
                    // 显示无记录提示
                    if (data.length === 0 && noRecords) {
                        noRecords.classList.remove('d-none');
                    }
                }
            })
            .catch(error => {
                console.error('获取短信记录失败:', error);
                showToast('error', '获取短信记录失败', error.message);
            })
            .finally(() => {
                // 隐藏加载指示器
                if (loadingIndicator) {
                    loadingIndicator.classList.add('d-none');
                }
            });
    }
    
    /**
     * 渲染短信记录到表格
     * @param {Array} records - 短信记录数组
     */
    function renderSMSRecords(records) {
        if (!smsRecordsTable) return;
        
        const tableBody = smsRecordsTable.querySelector('tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (records.length === 0) {
            return;
        }
        
        records.forEach(record => {
            const row = document.createElement('tr');
            row.classList.add('fade-in');
            
            // 为验证码创建适当的徽章
            const codeElement = record.extracted_code 
                ? `<span class="badge bg-success">${record.extracted_code}</span>` 
                : `<span class="badge bg-secondary">未提取</span>`;
            
            row.innerHTML = `
                <td>${record.id}</td>
                <td>${escapeHtml(record.from_ || record.from)}</td>
                <td class="sms-content" title="${escapeHtml(record.sms)}">${escapeHtml(record.sms)}</td>
                <td>${codeElement}</td>
                <td>${formatDateTime(record.receive_time)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary view-sms" data-id="${record.id}" 
                            data-bs-toggle="tooltip" title="查看详情">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // 添加查看按钮事件监听
        tableBody.querySelectorAll('.view-sms').forEach(button => {
            button.addEventListener('click', function() {
                const smsId = this.getAttribute('data-id');
                viewSMSDetail(smsId);
            });
        });
        
        // 重新初始化工具提示
        initializeTooltips();
    }
    
    /**
     * 更新分页控件
     * @param {boolean} hasMore - 是否有更多记录
     */
    function updatePagination(hasMore) {
        if (!pagination) return;
        
        pagination.innerHTML = '';
        
        // 上一页按钮
        pagination.appendChild(createPageItem('上一页', currentPage - 1, currentPage === 1, 'fas fa-chevron-left'));
        
        // 数字页码
        const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / PAGE_SIZE) : currentPage + (hasMore ? 1 : 0);
        let startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        // 首页按钮
        if (startPage > 1) {
            pagination.appendChild(createPageItem('1', 1, false));
            if (startPage > 2) {
                const ellipsis = document.createElement('li');
                ellipsis.className = 'page-item disabled';
                ellipsis.innerHTML = '<span class="page-link">...</span>';
                pagination.appendChild(ellipsis);
            }
        }
        
        // 页码按钮
        for (let i = startPage; i <= endPage; i++) {
            pagination.appendChild(createPageItem(i.toString(), i, i === currentPage));
        }
        
        // 最后一页按钮
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('li');
                ellipsis.className = 'page-item disabled';
                ellipsis.innerHTML = '<span class="page-link">...</span>';
                pagination.appendChild(ellipsis);
            }
            pagination.appendChild(createPageItem(totalPages.toString(), totalPages, false));
        }
        
        // 下一页按钮
        pagination.appendChild(createPageItem('下一页', currentPage + 1, !hasMore && totalRecords > 0 && currentPage >= totalPages, 'fas fa-chevron-right'));
    }
    
    /**
     * 创建分页项
     * @param {string} text - 显示文本
     * @param {number} page - 页码
     * @param {boolean} isActive - 是否是当前页
     * @param {string} icon - 图标类名（可选）
     * @returns {HTMLElement} 分页项元素
     */
    function createPageItem(text, page, isDisabled, icon) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${isDisabled ? 'disabled' : ''} ${page === currentPage ? 'active' : ''}`;
        
        const link = document.createElement('a');
        link.className = 'page-link';
        link.href = '#';
        link.setAttribute('data-page', page);
        
        if (icon) {
            link.innerHTML = `<i class="${icon}"></i>`;
            link.setAttribute('aria-label', text);
        } else {
            link.textContent = text;
        }
        
        pageItem.appendChild(link);
        
        if (!isDisabled) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                if (page !== currentPage) {
                    currentPage = page;
                    loadSMSRecords(currentPage);
                }
            });
        }
        
        return pageItem;
    }
    
    /**
     * 查询验证码
     */
    function queryVerificationCode() {
        const phoneNumber = document.getElementById('phoneNumber').value;
        const platformKeyword = document.getElementById('platformKeyword').value;
        const timeout = document.getElementById('timeout').value;
        
        if (!phoneNumber) {
            showToast('warning', '请输入手机号码', '请输入有效的手机号码以查询验证码');
            return;
        }
        
        // 显示查询结果区域
        if (queryResult) {
            queryResult.classList.remove('d-none');
        }
        
        // 显示加载状态
        if (resultContent) {
            resultContent.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-3 text-muted">正在查询验证码，请稍候...</p>
                </div>
            `;
        }
        
        // 构建请求URL
        let url = `/v1/sms/code?phone_number=${encodeURIComponent(phoneNumber)}&wait_timeout=${timeout}`;
        if (platformKeyword) {
            url += `&platform_keyword=${encodeURIComponent(platformKeyword)}`;
        }
        
        // 发送请求
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应异常');
                }
                return response.json();
            })
            .then(data => {
                // 显示查询结果
                if (resultContent) {
                    if (data.result === 'ok') {
                        resultContent.innerHTML = `
                            <div class="alert alert-success mb-0">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-check-circle fa-2x me-3"></i>
                                    <h5 class="mb-0">验证码获取成功!</h5>
                                </div>
                                <hr>
                                <div class="row">
                                    <div class="col-md-6 mb-2">
                                        <strong><i class="fas fa-key me-1"></i> 验证码:</strong>
                                        <div class="code-display mt-1">${data.data.code}</div>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <strong><i class="fas fa-clock me-1"></i> 接收时间:</strong>
                                        <div class="mt-1">${formatDateTime(data.data.received_time)}</div>
                                    </div>
                                </div>
                                <div class="mb-2">
                                    <strong><i class="fas fa-envelope me-1"></i> 短信内容:</strong>
                                    <div class="sms-excerpt mt-1 p-2 bg-light rounded">${escapeHtml(data.data.sms_excerpt)}...</div>
                                </div>
                                <div class="text-end mt-3">
                                    <button class="btn btn-sm btn-outline-success copy-code" data-code="${data.data.code}">
                                        <i class="fas fa-copy me-1"></i> 复制验证码
                                    </button>
                                </div>
                            </div>
                        `;
                        
                        // 添加复制验证码功能
                        const copyButton = resultContent.querySelector('.copy-code');
                        if (copyButton) {
                            copyButton.addEventListener('click', function() {
                                const code = this.getAttribute('data-code');
                                copyToClipboard(code);
                                showToast('success', '已复制验证码', `验证码 ${code} 已复制到剪贴板`);
                            });
                        }
                    } else {
                        resultContent.innerHTML = `
                            <div class="alert alert-warning mb-0">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
                                    <h5 class="mb-0">未找到验证码</h5>
                                </div>
                                <hr>
                                <p>${data.message}</p>
                                <p class="mb-0">请检查手机号码是否正确，或稍后再试。</p>
                            </div>
                        `;
                    }
                }
                
                // 刷新短信记录，以便查看最新记录
                loadSMSRecords(1);
            })
            .catch(error => {
                console.error('查询验证码失败:', error);
                if (resultContent) {
                    resultContent.innerHTML = `
                        <div class="alert alert-danger mb-0">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-times-circle fa-2x me-3"></i>
                                <h5 class="mb-0">查询失败</h5>
                            </div>
                            <hr>
                            <p>发生错误: ${escapeHtml(error.message)}</p>
                            <p class="mb-0">请检查网络连接或稍后再试。</p>
                        </div>
                    `;
                }
            });
    }
    
    /**
     * 查看短信详情
     * @param {string} smsId - 短信ID
     */
    function viewSMSDetail(smsId) {
        // 显示加载中模态框
        showLoadingModal('正在加载短信详情...');
        
        fetch(`/v1/sms/${smsId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应异常');
                }
                return response.json();
            })
            .then(data => {
                // 关闭加载中模态框
                closeModal('loadingModal');
                
                // 创建详情模态框
                const modalHtml = `
                    <div class="modal fade" id="smsDetailModal" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">
                                        <i class="fas fa-envelope me-2"></i>
                                        短信详情 #${data.id}
                                    </h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <div class="detail-group">
                                                <label class="detail-label">
                                                    <i class="fas fa-user me-1"></i> 发送方
                                                </label>
                                                <div class="detail-value">${escapeHtml(data.from_ || data.from)}</div>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <div class="detail-group">
                                                <label class="detail-label">
                                                    <i class="fas fa-address-book me-1"></i> 联系人
                                                </label>
                                                <div class="detail-value">${escapeHtml(data.contact_name || '未知')}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <div class="detail-group">
                                            <label class="detail-label">
                                                <i class="fas fa-envelope-open-text me-1"></i> 短信内容
                                            </label>
                                            <div class="detail-value">
                                                <div class="sms-content-box p-3 bg-light rounded">
                                                    ${escapeHtml(data.sms).replace(/\n/g, '<br>')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <div class="detail-group">
                                                <label class="detail-label">
                                                    <i class="fas fa-key me-1"></i> 提取的验证码
                                                </label>
                                                <div class="detail-value">
                                                    ${data.extracted_code ? 
                                                        `<span class="badge bg-success">${data.extracted_code}</span>` : 
                                                        '<span class="badge bg-secondary">未提取</span>'}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <div class="detail-group">
                                                <label class="detail-label">
                                                    <i class="fas fa-mobile-alt me-1"></i> 手机号
                                                </label>
                                                <div class="detail-value">${data.phone_number || '未提取'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <div class="detail-group">
                                                <label class="detail-label">
                                                    <i class="fas fa-sim-card me-1"></i> SIM卡信息
                                                </label>
                                                <div class="detail-value text-break">${escapeHtml(data.sim_slot || '未知')}</div>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <div class="detail-group">
                                                <label class="detail-label">
                                                    <i class="fas fa-clock me-1"></i> 接收时间
                                                </label>
                                                <div class="detail-value">${formatDateTime(data.receive_time)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    ${data.extracted_code ? 
                                        `<button type="button" class="btn btn-success copy-code" data-code="${data.extracted_code}">
                                            <i class="fas fa-copy me-1"></i> 复制验证码
                                        </button>` : ''}
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                        <i class="fas fa-times me-1"></i> 关闭
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // 添加到DOM并显示
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHtml;
                document.body.appendChild(modalContainer);
                
                const modal = new bootstrap.Modal(document.getElementById('smsDetailModal'));
                modal.show();
                
                // 添加复制验证码功能
                const copyButton = document.querySelector('.copy-code');
                if (copyButton) {
                    copyButton.addEventListener('click', function() {
                        const code = this.getAttribute('data-code');
                        copyToClipboard(code);
                        showToast('success', '已复制验证码', `验证码 ${code} 已复制到剪贴板`);
                    });
                }
                
                // 模态框关闭后从DOM中移除
                document.getElementById('smsDetailModal').addEventListener('hidden.bs.modal', function () {
                    this.remove();
                });
            })
            .catch(error => {
                // 关闭加载中模态框
                closeModal('loadingModal');
                
                console.error('获取短信详情失败:', error);
                showToast('error', '获取短信详情失败', error.message);
            });
    }
    
    /**
     * 显示加载中模态框
     * @param {string} message - 加载提示信息
     */
    function showLoadingModal(message) {
        const modalHtml = `
            <div class="modal fade" id="loadingModal" tabindex="-1" data-bs-backdrop="static" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-body text-center py-4">
                            <div class="spinner-border text-primary mb-3" role="status"></div>
                            <p class="mb-0">${message || '正在加载...'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
        modal.show();
    }
    
    /**
     * 关闭模态框
     * @param {string} modalId - 模态框ID
     */
    function closeModal(modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
                modalElement.addEventListener('hidden.bs.modal', function() {
                    this.remove();
                });
            } else {
                modalElement.remove();
            }
        }
    }
    
    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     */
    function copyToClipboard(text) {
        // 创建临时文本区域
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // 执行复制命令
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('复制失败:', err);
        }
        
        // 移除临时文本区域
        document.body.removeChild(textArea);
    }
    
    /**
     * 显示提示消息
     * @param {string} type - 提示类型（success, warning, error, info）
     * @param {string} title - 提示标题
     * @param {string} message - 提示内容
     */
    function showToast(type, title, message) {
        // 映射类型到Bootstrap颜色
        const typeMap = {
            'success': 'bg-success',
            'warning': 'bg-warning',
            'error': 'bg-danger',
            'info': 'bg-info'
        };
        
        // 映射类型到图标
        const iconMap = {
            'success': 'fas fa-check-circle',
            'warning': 'fas fa-exclamation-triangle',
            'error': 'fas fa-times-circle',
            'info': 'fas fa-info-circle'
        };
        
        // 创建Toast元素
        const toastId = `toast-${Date.now()}`;
        const toastHtml = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
                <div class="toast-header ${typeMap[type] || 'bg-primary'} text-white">
                    <i class="${iconMap[type] || 'fas fa-bell'} me-2"></i>
                    <strong class="me-auto">${title}</strong>
                    <small>刚刚</small>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="关闭"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        // 创建或获取Toast容器
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // 添加Toast到容器
        const toastElement = document.createElement('div');
        toastElement.innerHTML = toastHtml;
        toastContainer.appendChild(toastElement.firstChild);
        
        // 显示Toast
        const toast = new bootstrap.Toast(document.getElementById(toastId));
        toast.show();
        
        // Toast关闭后移除DOM元素
        document.getElementById(toastId).addEventListener('hidden.bs.toast', function() {
            this.remove();
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        });
    }
    
    /**
     * 格式化日期时间
     * @param {string} dateTimeStr - ISO格式的日期时间字符串
     * @returns {string} 格式化后的日期时间字符串
     */
    function formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return '未知时间';
        
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return dateTimeStr;
        
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    /**
     * 转义HTML特殊字符
     * @param {string} text - 要转义的文本
     * @returns {string} 转义后的文本
     */
    function escapeHtml(text) {
        if (!text) return '';
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    /**
     * 根据窗口宽度调整表格列显示
     */
    function adjustTableColumns() {
        if (!smsRecordsTable) return;
        
        const tableHeaders = smsRecordsTable.querySelectorAll('th');
        const tableRows = smsRecordsTable.querySelectorAll('tbody tr');
        
        // 如果窗口宽度小于768px，隐藏某些列
        if (window.innerWidth < 768) {
            // 例如，隐藏ID列和操作列之外的第3列
            tableHeaders.forEach((th, index) => {
                if (index === 2) { // 短信内容列
                    th.style.width = '30%';
                }
            });
        } else {
            // 重置列宽
            tableHeaders.forEach((th, index) => {
                if (index === 2) { // 短信内容列
                    th.style.width = 'auto';
                }
            });
        }
    }
});

// 在文档加载完成后添加样式类
document.addEventListener('DOMContentLoaded', function() {
    // 为导航栏添加阴影效果
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 0) {
                navbar.classList.add('navbar-shadow');
            } else {
                navbar.classList.remove('navbar-shadow');
            }
        });
    }
});

// 处理敏感信息的函数
function maskPhoneNumber(phone) {
    if (!phone) return '';
    
    // 查找符合手机号格式的内容
    const phonePattern = /1[3-9]\d{9}/g;
    return phone.replace(phonePattern, match => {
        // 保留前3位和后4位，中间用星号替换
        return match.substring(0, 3) + '****' + match.substring(match.length - 4);
    });
}

function maskSensitiveInfo(text) {
    if (!text) return '';
    
    // 处理可能包含的手机号
    let maskedText = maskPhoneNumber(text);
    
    // 处理身份证号 (18位或15位)
    const idCardPattern = /(\d{6})\d{8,11}(\d{2}[0-9Xx]?)/g;
    maskedText = maskedText.replace(idCardPattern, '$1********$2');
    
    return maskedText;
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 查询验证码表单处理
    const codeQueryForm = document.getElementById('codeQueryForm');
    const queryResult = document.getElementById('queryResult');
    const resultContent = document.getElementById('resultContent');
    
    if (codeQueryForm) {
        codeQueryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const phoneNumber = document.getElementById('phoneNumber').value;
            const platformKeyword = document.getElementById('platformKeyword').value;
            const timeout = document.getElementById('timeout').value;
            
            // 显示加载状态
            resultContent.innerHTML = `
                <div class="text-center my-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">正在查询验证码，请稍候...</p>
                </div>
            `;
            queryResult.classList.remove('d-none');
            
            try {
                // 调用API查询验证码
                const response = await fetch(`/v1/sms/code?phone_number=${encodeURIComponent(phoneNumber)}&platform_keyword=${encodeURIComponent(platformKeyword || '')}&wait_timeout=${timeout}`);
                const data = await response.json();
                
                // 显示结果
                if (data.result === 'ok') {
                    resultContent.innerHTML = `
                        <div class="alert alert-success mb-0">
                            <h5 class="alert-heading"><i class="fas fa-check-circle me-2"></i>验证码获取成功</h5>
                            <hr>
                            <p class="mb-1"><strong>验证码:</strong> <span class="fs-5 fw-bold">${data.data.code}</span></p>
                            <p class="mb-1"><strong>接收时间:</strong> ${new Date(data.data.received_time).toLocaleString()}</p>
                            <p class="mb-0"><strong>短信内容:</strong> ${maskSensitiveInfo(data.data.sms_excerpt)}...</p>
                        </div>
                    `;
                } else {
                    resultContent.innerHTML = `
                        <div class="alert alert-warning mb-0">
                            <h5 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>未找到验证码</h5>
                            <hr>
                            <p class="mb-0">${data.message}</p>
                        </div>
                    `;
                }
            } catch (error) {
                resultContent.innerHTML = `
                    <div class="alert alert-danger mb-0">
                        <h5 class="alert-heading"><i class="fas fa-times-circle me-2"></i>查询出错</h5>
                        <hr>
                        <p class="mb-0">请求失败: ${error.message}</p>
                    </div>
                `;
            }
        });
    }
    
    // 加载短信历史记录
    loadSMSRecords();
    
    // 监听刷新按钮
    const refreshButton = document.querySelector('.refresh-records');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => loadSMSRecords());
    }
});

// 加载短信历史记录
async function loadSMSRecords(page = 1, limit = 10) {
    const tableBody = document.querySelector('#smsRecordsTable tbody');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noRecords = document.getElementById('noRecords');
    const pagination = document.getElementById('pagination');
    
    if (!tableBody) return;
    
    // 显示加载指示器
    tableBody.innerHTML = '';
    loadingIndicator.classList.remove('d-none');
    noRecords.classList.add('d-none');
    
    try {
        // 计算偏移量
        const offset = (page - 1) * limit;
        
        // 获取短信历史记录
        const response = await fetch(`/v1/sms/history?limit=${limit}&offset=${offset}`);
        const records = await response.json();
        
        // 隐藏加载指示器
        loadingIndicator.classList.add('d-none');
        
        if (records.length === 0) {
            // 显示无记录提示
            noRecords.classList.remove('d-none');
            pagination.innerHTML = '';
        } else {
            // 渲染记录
            records.forEach(record => {
                const row = document.createElement('tr');
                
                // 格式化日期时间
                const date = new Date(record.receive_time);
                const formattedDate = date.toLocaleString();
                
                // 应用敏感信息掩码
                const maskedSMS = maskSensitiveInfo(record.sms);
                const maskedFrom = maskSensitiveInfo(record.from_);
                const maskedSimSlot = record.sim_slot ? maskSensitiveInfo(record.sim_slot) : '';
                
                row.innerHTML = `
                    <td>${record.id}</td>
                    <td title="${maskedFrom}${maskedSimSlot ? '\n' + maskedSimSlot : ''}">${maskedFrom}</td>
                    <td>
                        <div class="sms-content" title="${maskedSMS}">${maskedSMS}</div>
                    </td>
                    <td>
                        <span class="badge ${record.extracted_code ? 'bg-success' : 'bg-secondary'}">
                            ${record.extracted_code || '无'}
                        </span>
                    </td>
                    <td>${formattedDate}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-info view-details" data-id="${record.id}" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // 添加事件监听器到查看详情按钮
            document.querySelectorAll('.view-details').forEach(button => {
                button.addEventListener('click', async () => {
                    const id = button.getAttribute('data-id');
                    await showRecordDetails(id);
                });
            });
            
            // 创建简单分页
            generatePagination(page, limit, records.length === limit);
        }
    } catch (error) {
        console.error('加载短信记录失败:', error);
        loadingIndicator.classList.add('d-none');
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>加载失败: ${error.message}
                </td>
            </tr>
        `;
    }
}

// 生成分页控件
function generatePagination(currentPage, limit, hasMore) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    // 上一页按钮
    const prevItem = document.createElement('li');
    prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevItem.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    if (currentPage > 1) {
        prevItem.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            loadSMSRecords(currentPage - 1, limit);
        });
    }
    pagination.appendChild(prevItem);
    
    // 当前页
    const currentItem = document.createElement('li');
    currentItem.className = 'page-item active';
    currentItem.innerHTML = `<a class="page-link" href="#">${currentPage}</a>`;
    pagination.appendChild(currentItem);
    
    // 下一页按钮
    const nextItem = document.createElement('li');
    nextItem.className = `page-item ${!hasMore ? 'disabled' : ''}`;
    nextItem.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    if (hasMore) {
        nextItem.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            loadSMSRecords(currentPage + 1, limit);
        });
    }
    pagination.appendChild(nextItem);
}

// 显示记录详情
async function showRecordDetails(id) {
    try {
        const response = await fetch(`/v1/sms/${id}`);
        const record = await response.json();
        
        // 应用敏感信息掩码
        const maskedSMS = maskSensitiveInfo(record.sms);
        const maskedFrom = maskSensitiveInfo(record.from_);
        const maskedSimSlot = record.sim_slot ? maskSensitiveInfo(record.sim_slot) : '未知';
        const maskedPhoneNumber = record.phone_number ? maskSensitiveInfo(record.phone_number) : '未提取';
        
        // 创建模态框
        const modalId = 'recordDetailModal';
        let modal = document.getElementById(modalId);
        
        // 如果模态框不存在，创建一个
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.tabIndex = -1;
            modal.setAttribute('aria-hidden', 'true');
            document.body.appendChild(modal);
        }
        
        // 格式化日期时间
        const formattedDate = new Date(record.receive_time).toLocaleString();
        
        // 设置模态框内容
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-gradient-primary">
                        <h5 class="modal-title">短信详情 #${record.id}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">发送方</label>
                            <div>${maskedFrom}</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">SIM卡信息</label>
                            <div>${maskedSimSlot}</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">提取的手机号</label>
                            <div>${maskedPhoneNumber}</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">短信内容</label>
                            <div class="p-2 bg-light rounded">${maskedSMS.replace(/\n/g, '<br>')}</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">验证码</label>
                            <div class="fs-5 fw-bold">${record.extracted_code || '未提取'}</div>
                        </div>
                        <div class="mb-0">
                            <label class="form-label fw-bold">接收时间</label>
                            <div>${formattedDate}</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        // 显示模态框
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } catch (error) {
        console.error('获取记录详情失败:', error);
        alert('获取详情失败: ' + error.message);
    }
}