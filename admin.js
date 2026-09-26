/**
 * ============================================================
 * THE WALL LAB — Admin Dashboard JavaScript (admin.js)
 * ============================================================
 * COMPLETE REWRITE: Added full orders management with tabs,
 * order status tracking, detail views, and bulk operations.
 * ============================================================
 */

// ========================
// AUTHENTICATION GATE
// ========================
(function authGuard() {
    const authGate = document.getElementById('authGate');
    const dashboardContent = document.getElementById('dashboardContent');
    if (!isAuthenticated()) {
        if (authGate) authGate.style.display = 'flex';
        if (dashboardContent) dashboardContent.style.display = 'none';
        setTimeout(() => { window.location.href = 'admin-login.html'; }, 500);
        return;
    }
    if (authGate) authGate.style.display = 'none';
    if (dashboardContent) {
        dashboardContent.style.display = 'block';
        dashboardContent.classList.add('authenticated');
    }
})();

// ========================
// STATE
// ========================
let editingProductId = null;
let deleteTargetId = null;
let deleteTargetType = null; // 'product' or 'order'
let adminFilterStatus = 'all';
let adminSearchQuery = '';
let orderFilterStatus = 'all';
let orderSearchQuery = '';
let currentTab = 'products';

// ========================
// DOM REFERENCES
// ========================
const productForm = document.getElementById('productForm');
const formTitle = document.getElementById('formTitle');
const submitBtnText = document.getElementById('submitBtnText');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editProductIdInput = document.getElementById('editProductId');
const inventoryList = document.getElementById('inventoryList');
const adminEmptyState = document.getElementById('adminEmptyState');
const adminStatusFilter = document.getElementById('adminStatusFilter');
const adminSearchInput = document.getElementById('adminSearch');
const deleteModal = document.getElementById('deleteModal');
const deleteModalTitle = document.getElementById('deleteModalTitle');
const deleteModalText = document.getElementById('deleteModalText');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const toastContainer = document.getElementById('toastContainer');
const changePasswordForm = document.getElementById('changePasswordForm');
const orderStatusFilter = document.getElementById('orderStatusFilter');
const orderSearchInput = document.getElementById('orderSearch');
const ordersList = document.getElementById('ordersList');
const ordersEmptyState = document.getElementById('ordersEmptyState');
const orderDetailModal = document.getElementById('orderDetailModal');
const orderDetailContent = document.getElementById('orderDetailContent');

// ========================
// INITIALIZATION
// ========================
document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) return;
    renderInventory();
    renderOrders();
    updateAllStats();
    setupAdminEventListeners();
    displaySessionInfo();

    // Check for tab in URL hash
    const hash = window.location.hash.replace('#', '');
    if (['products', 'orders', 'settings'].includes(hash)) {
        switchTab(hash);
    }

    // Periodic session & data refresh
    setInterval(() => {
        if (!isAuthenticated()) { handleLogout(); return; }
        updateAllStats();
        displaySessionInfo();
    }, 15000);
});

// Cross-tab sync
window.addEventListener('storage', (e) => {
    if (e.key === 'thewalllab_products') {
        renderInventory();
        updateAllStats();
    }
    if (e.key === 'thewalllab_orders') {
        renderOrders();
        updateAllStats();
    }
});

// ========================
// TAB NAVIGATION
// ========================
function switchTab(tabName) {
    currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(tab => {
        const isActive = tab.id === `tab-${tabName}`;
        tab.classList.toggle('text-white', isActive);
        tab.classList.toggle('border-white', isActive);
        tab.classList.toggle('text-charcoal-400', !isActive);
        tab.classList.toggle('border-transparent', !isActive);
    });

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tabName}`);
    });

    // Update URL hash
    window.location.hash = tabName;

    // Refresh data for the active tab
    if (tabName === 'orders') renderOrders();
    if (tabName === 'products') renderInventory();
}

// ========================
// LOGOUT
// ========================
function handleLogout() {
    if (typeof destroySession === 'function') destroySession();
    window.location.href = 'admin-login.html';
}

// ========================
// SESSION INFO
// ========================
function displaySessionInfo() {
    const el = document.getElementById('sessionInfo');
    if (!el) return;
    const info = getSessionInfo();
    if (info) {
        el.innerHTML = `
            <p>Login: <span class="text-charcoal-400">${info.loginTime}</span></p>
            <p>Active: <span class="text-charcoal-400">${info.minutesActive}m</span></p>
            <p>Session: <span class="text-charcoal-400 font-mono text-[10px]">${info.token}</span></p>`;
    }
}

// ========================
// STATS
// ========================
function updateAllStats() {
    const products = getAllProducts();
    const orderCounts = getOrderCounts();
    const revenue = getTotalRevenue();
    const activeOrders = getActiveOrderCount();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('statTotal', products.length);
    set('statLive', products.filter(p => p.status === 'live').length);
    set('statDraft', products.filter(p => p.status === 'draft').length);
    set('statOrders', orderCounts.total);
    set('statPending', orderCounts.pending || 0);
    set('statRevenue', revenue > 0 ? formatPKR(revenue).replace('PKR ', '') : '0');

    // Product count badge on tab
    set('productCountBadge', products.length);

    // Order count badge on tab (show active/pending orders)
    const orderBadge = document.getElementById('orderCountBadge');
    if (orderBadge) {
        if (activeOrders > 0) {
            orderBadge.textContent = activeOrders;
            orderBadge.classList.remove('hidden');
        } else {
            orderBadge.classList.add('hidden');
        }
    }

    // Orders total badge inside orders panel
    set('ordersTotalBadge', `${orderCounts.total} total`);
}

// ========================
// EVENT LISTENERS
// ========================
function setupAdminEventListeners() {
    if (productForm) productForm.addEventListener('submit', handleFormSubmit);
    if (adminStatusFilter) adminStatusFilter.addEventListener('change', (e) => { adminFilterStatus = e.target.value; renderInventory(); });
    if (adminSearchInput) adminSearchInput.addEventListener('input', (e) => { adminSearchQuery = e.target.value.toLowerCase().trim(); renderInventory(); });
    if (changePasswordForm) changePasswordForm.addEventListener('submit', handlePasswordChange);

    // Order filters
    if (orderStatusFilter) orderStatusFilter.addEventListener('change', (e) => { orderFilterStatus = e.target.value; renderOrders(); });
    if (orderSearchInput) orderSearchInput.addEventListener('input', (e) => { orderSearchQuery = e.target.value.toLowerCase().trim(); renderOrders(); });
}

// ========================
// PASSWORD CHANGE
// ========================
function handlePasswordChange(e) {
    e.preventDefault();
    const currentPwd = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirmPwd = document.getElementById('confirmPassword').value;
    const resultEl = document.getElementById('passwordChangeResult');

    if (newPwd !== confirmPwd) {
        resultEl.className = 'p-2.5 rounded-sm text-xs bg-red-950/30 border border-red-900/30 text-red-300';
        resultEl.textContent = 'New passwords do not match.';
        resultEl.classList.remove('hidden');
        return;
    }

    const result = changePassword(currentPwd, newPwd);
    resultEl.className = result.success
        ? 'p-2.5 rounded-sm text-xs bg-green-950/30 border border-green-900/30 text-green-300'
        : 'p-2.5 rounded-sm text-xs bg-red-950/30 border border-red-900/30 text-red-300';
    resultEl.textContent = result.message;
    resultEl.classList.remove('hidden');
    if (result.success) { changePasswordForm.reset(); showAdminToast('Password updated'); }
    setTimeout(() => resultEl.classList.add('hidden'), 5000);
}

// ====================================================
// PRODUCT MANAGEMENT (same as before, condensed)
// ====================================================
function handleFormSubmit(e) {
    e.preventDefault();
    if (!isAuthenticated()) { handleLogout(); return; }

    const title = document.getElementById('productTitle').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = parseInt(document.getElementById('productPrice').value);
    const image = document.getElementById('productImage').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const status = document.getElementById('productStatus').checked ? 'live' : 'draft';
    const sizes = Array.from(document.querySelectorAll('input[name="sizes"]:checked')).map(cb => cb.value);

    if (!title || !category || !price || !image || !description) { showAdminToast('Fill all required fields', 'error'); return; }
    if (sizes.length === 0) { showAdminToast('Select at least one size', 'error'); return; }
    if (price < 100) { showAdminToast('Price must be at least PKR 100', 'error'); return; }

    const data = { title, category, price, image, description, sizes, status };

    if (editingProductId) {
        if (updateProduct(editingProductId, data)) { showAdminToast(`"${title}" updated`); cancelEdit(); }
        else showAdminToast('Update failed', 'error');
    } else {
        addProduct(data);
        showAdminToast(`"${title}" added`);
        resetForm();
    }
    renderInventory();
    updateAllStats();
}

function editProduct(id) {
    const p = getProductById(id);
    if (!p) return;
    editingProductId = id;
    editProductIdInput.value = id;
    document.getElementById('productTitle').value = p.title;
    document.getElementById('productCategory').value = p.category;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productImage').value = p.image;
    document.getElementById('productDescription').value = p.description;
    document.getElementById('productStatus').checked = p.status === 'live';
    document.querySelectorAll('input[name="sizes"]').forEach(cb => { cb.checked = p.sizes.includes(cb.value); });
    previewImage(p.image);
    formTitle.innerHTML = `<svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg> Edit Product`;
    submitBtnText.textContent = 'Update Product';
    cancelEditBtn.classList.remove('hidden');
    switchTab('products');
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() {
    editingProductId = null;
    editProductIdInput.value = '';
    resetForm();
    formTitle.innerHTML = `<svg class="w-5 h-5 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg> Add New Product`;
    submitBtnText.textContent = 'Add Product';
    cancelEditBtn.classList.add('hidden');
}

function resetForm() {
    productForm.reset();
    document.querySelectorAll('input[name="sizes"]').forEach(cb => { cb.checked = (cb.value === 'A4' || cb.value === 'A3'); });
    document.getElementById('productStatus').checked = true;
    hideImagePreview();
}

function previewImage(url) {
    const w = document.getElementById('imagePreview'), img = document.getElementById('previewImg');
    if (url && url.startsWith('http')) { img.src = url; img.onerror = () => w.classList.add('hidden'); w.classList.remove('hidden'); }
    else w.classList.add('hidden');
}
function hideImagePreview() { document.getElementById('imagePreview').classList.add('hidden'); }

function handleToggleStatus(id) {
    if (!isAuthenticated()) { handleLogout(); return; }
    const s = toggleProductStatus(id);
    if (s) { const p = getProductById(id); showAdminToast(`"${p.title}" ${s === 'live' ? 'published' : 'set to draft'}`); renderInventory(); updateAllStats(); }
}

// ========================
// INVENTORY RENDERING
// ========================
function renderInventory() {
    let products = getAllProducts();
    if (adminFilterStatus !== 'all') products = products.filter(p => p.status === adminFilterStatus);
    if (adminSearchQuery) products = products.filter(p => p.title.toLowerCase().includes(adminSearchQuery) || p.category.toLowerCase().includes(adminSearchQuery));

    if (products.length === 0) { inventoryList.classList.add('hidden'); adminEmptyState.classList.remove('hidden'); }
    else { inventoryList.classList.remove('hidden'); adminEmptyState.classList.add('hidden'); }

    inventoryList.innerHTML = products.map(p => {
        const isLive = p.status === 'live';
        const sc = isLive ? 'text-green-400' : 'text-charcoal-500';
        const sb = isLive ? 'bg-green-400/10 border-green-400/20' : 'bg-charcoal-800/50 border-charcoal-700/50';
        const st = isLive ? 'Live' : 'Draft';
        const sizes = p.sizes.map(s => `<span class="text-[10px] px-1.5 py-0.5 border border-studio-border rounded-sm text-charcoal-500">${s}</span>`).join('');
        const ec = editingProductId === p.id ? 'ring-2 ring-amber-400/50 border-amber-400/50' : '';

        return `<div class="bg-studio-card border border-studio-border rounded-sm p-4 hover:border-charcoal-500 ${ec}">
            <div class="flex gap-4">
                <div class="w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 bg-studio-bg rounded-sm overflow-hidden">
                    <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover" loading="lazy" onerror="this.src='https://via.placeholder.com/80x96/242424/666?text=?'">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0"><h3 class="text-sm font-semibold text-white truncate">${p.title}</h3>
                        <div class="flex items-center gap-2 mt-1"><span class="text-[10px] uppercase tracking-wider text-charcoal-500">${getCategoryName(p.category)}</span><span class="text-charcoal-700">•</span><span class="text-sm font-bold text-white">${formatPKR(p.price)}</span></div></div>
                        <span class="flex-shrink-0 text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-sm border ${sb} ${sc}">${st}</span>
                    </div>
                    <div class="flex flex-wrap gap-1 mt-2">${sizes}</div>
                    <div class="flex items-center justify-between mt-3 pt-3 border-t border-studio-border/50">
                        <div class="flex items-center gap-2"><label class="toggle-switch"><input type="checkbox" ${isLive ? 'checked' : ''} onchange="handleToggleStatus('${p.id}')"><span class="toggle-slider"></span></label><span class="text-[10px] uppercase tracking-wider ${sc}">${st}</span></div>
                        <div class="flex items-center gap-1">
                            <button onclick="editProduct('${p.id}')" class="p-2 text-charcoal-500 hover:text-amber-400 hover:bg-studio-hover rounded-sm" title="Edit"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg></button>
                            <button onclick="promptDeleteProduct('${p.id}', '${p.title.replace(/'/g, "\\'")}')" class="p-2 text-charcoal-500 hover:text-red-400 hover:bg-studio-hover rounded-sm" title="Delete"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ====================================================
// ORDERS MANAGEMENT — THE NEW SECTION
// ====================================================

/**
 * Render the orders list with filters and search
 */
function renderOrders() {
    let orders = getAllOrders();

    // Apply status filter
    if (orderFilterStatus !== 'all') {
        orders = orders.filter(o => o.status === orderFilterStatus);
    }

    // Apply search (searches customer name, phone, order ID, item titles)
    if (orderSearchQuery) {
        orders = orders.filter(o => {
            const searchTarget = [
                o.id,
                o.customer.name,
                o.customer.phone,
                o.customer.email,
                o.customer.city,
                ...o.items.map(i => i.title)
            ].join(' ').toLowerCase();
            return searchTarget.includes(orderSearchQuery);
        });
    }

    // Render status chips
    renderOrderStatusChips();

    // Show/hide empty state
    if (orders.length === 0) {
        ordersList.classList.add('hidden');
        ordersEmptyState.classList.remove('hidden');
    } else {
        ordersList.classList.remove('hidden');
        ordersEmptyState.classList.add('hidden');
    }

    // Render each order card
    ordersList.innerHTML = orders.map(order => createOrderCard(order)).join('');
}

/**
 * Render clickable status filter chips above the orders list
 */
function renderOrderStatusChips() {
    const counts = getOrderCounts();
    const chipsEl = document.getElementById('orderStatusChips');
    if (!chipsEl) return;

    let html = `<button onclick="setOrderFilter('all')" class="text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border font-medium ${orderFilterStatus === 'all' ? 'bg-white text-studio-bg border-white' : 'text-charcoal-400 border-studio-border hover:border-charcoal-400'}">All (${counts.total})</button>`;

    Object.entries(ORDER_STATUSES).forEach(([key, info]) => {
        const count = counts[key] || 0;
        if (count > 0 || orderFilterStatus === key) {
            const active = orderFilterStatus === key;
            html += `<button onclick="setOrderFilter('${key}')" class="text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border font-medium ${active ? `status-${key} border-current` : `text-charcoal-400 border-studio-border hover:border-charcoal-400`}">${info.icon} ${info.label} (${count})</button>`;
        }
    });

    chipsEl.innerHTML = html;
}

function setOrderFilter(status) {
    orderFilterStatus = status;
    if (orderStatusFilter) orderStatusFilter.value = status;
    renderOrders();
}

/**
 * Create a single order card
 */
function createOrderCard(order) {
    const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
    const itemCount = order.totalItems || order.items.reduce((s, i) => s + i.quantity, 0);

    // Item thumbnails (show first 3)
    const thumbs = order.items.slice(0, 3).map(item =>
        `<div class="w-10 h-10 rounded-sm overflow-hidden border border-studio-border bg-studio-bg flex-shrink-0">
            <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/40x40/242424/666?text=?'">
        </div>`
    ).join('');
    const moreCount = order.items.length > 3 ? `<div class="w-10 h-10 rounded-sm border border-studio-border bg-studio-bg flex items-center justify-center flex-shrink-0"><span class="text-[10px] text-charcoal-500">+${order.items.length - 3}</span></div>` : '';

    // Item summary text
    const itemNames = order.items.map(i => `${i.title} (${i.size}) ×${i.quantity}`).join(', ');

    // Status select options
    const statusOptions = Object.entries(ORDER_STATUSES).map(([key, info]) =>
        `<option value="${key}" ${order.status === key ? 'selected' : ''}>${info.icon} ${info.label}</option>`
    ).join('');

    return `
        <div class="bg-studio-card border border-studio-border rounded-sm overflow-hidden hover:border-charcoal-500" data-order-id="${order.id}">
            <!-- Order Header -->
            <div class="px-4 sm:px-5 py-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div class="flex items-center gap-3">
                        <span class="font-mono text-xs text-charcoal-400 bg-studio-bg px-2 py-1 rounded-sm border border-studio-border">${order.id}</span>
                        <span class="status-${order.status} text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-sm border">${statusInfo.icon} ${statusInfo.label}</span>
                    </div>
                    <div class="flex items-center gap-2 text-[10px] text-charcoal-500">
                        <span>${formatDateTime(order.createdAt)}</span>
                        <span class="text-charcoal-700">•</span>
                        <span>${timeAgo(order.createdAt)}</span>
                    </div>
                </div>

                <!-- Customer & Items Row -->
                <div class="grid sm:grid-cols-2 gap-4">
                    <!-- Customer Info -->
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <svg class="w-3.5 h-3.5 text-charcoal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                            <span class="text-sm font-medium text-white">${order.customer.name}</span>
                        </div>
                        <div class="flex items-center gap-2 mb-1">
                            <svg class="w-3.5 h-3.5 text-charcoal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                            <span class="text-xs text-charcoal-300">${order.customer.phone}</span>
                        </div>
                        <div class="flex items-start gap-2">
                            <svg class="w-3.5 h-3.5 text-charcoal-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                            <span class="text-xs text-charcoal-400 line-clamp-1">${order.customer.address}, ${order.customer.city}</span>
                        </div>
                    </div>

                    <!-- Items Preview -->
                    <div>
                        <div class="flex items-center gap-1.5 mb-2">
                            ${thumbs}${moreCount}
                        </div>
                        <p class="text-[10px] text-charcoal-500 line-clamp-1">${itemNames}</p>
                        <div class="flex items-center gap-3 mt-2">
                            <span class="text-xs text-charcoal-400">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
                            <span class="text-charcoal-700">•</span>
                            <span class="text-sm font-bold text-white">${formatPKR(order.total)}</span>
                            <span class="text-charcoal-700">•</span>
                            <span class="text-[10px] text-charcoal-500">${getPaymentMethodName(order.customer.payment)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Bar -->
            <div class="px-4 sm:px-5 py-3 bg-studio-bg/50 border-t border-studio-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <!-- Status Changer -->
                <div class="flex items-center gap-2">
                    <label class="text-[10px] uppercase tracking-wider text-charcoal-500 font-medium">Status:</label>
                    <select onchange="handleOrderStatusChange('${order.id}', this.value)"
                            class="bg-studio-card border border-studio-border rounded-sm px-2 py-1.5 text-xs text-charcoal-300 focus:outline-none focus:border-charcoal-400 cursor-pointer">
                        ${statusOptions}
                    </select>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2">
                    <button onclick="openOrderDetail('${order.id}')"
                            class="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-charcoal-400 hover:text-white border border-studio-border px-3 py-1.5 rounded-sm hover:border-charcoal-400">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        View Details
                    </button>
                    <button onclick="promptDeleteOrder('${order.id}')"
                            class="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-charcoal-500 hover:text-red-400 border border-studio-border px-3 py-1.5 rounded-sm hover:border-red-900/50">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                        Delete
                    </button>
                </div>
            </div>
        </div>`;
}

// ========================
// ORDER STATUS CHANGE
// ========================
function handleOrderStatusChange(orderId, newStatus) {
    if (!isAuthenticated()) { handleLogout(); return; }
    const updated = updateOrderStatus(orderId, newStatus);
    if (updated) {
        const statusInfo = ORDER_STATUSES[newStatus];
        showAdminToast(`Order ${orderId} → ${statusInfo.label}`);
        renderOrders();
        updateAllStats();
    }
}

// ========================
// ORDER DETAIL MODAL
// ========================
function openOrderDetail(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;

    // Build items table
    const itemRows = order.items.map(item => `
        <tr class="border-b border-studio-border/30 last:border-0">
            <td class="py-3 pr-3">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-14 rounded-sm overflow-hidden border border-studio-border bg-studio-bg flex-shrink-0">
                        <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/48x56/242424/666?text=?'">
                    </div>
                    <div>
                        <p class="text-sm text-white font-medium">${item.title}</p>
                        <p class="text-[10px] text-charcoal-500 uppercase">${getCategoryName(item.category)} • ${item.size}</p>
                    </div>
                </div>
            </td>
            <td class="py-3 text-center text-xs text-charcoal-300">${item.quantity}</td>
            <td class="py-3 text-right text-xs text-charcoal-300">${formatPKR(item.unitPrice)}</td>
            <td class="py-3 text-right text-sm text-white font-medium">${formatPKR(item.lineTotal)}</td>
        </tr>
    `).join('');

    // Status options for dropdown
    const statusOptions = Object.entries(ORDER_STATUSES).map(([key, info]) =>
        `<option value="${key}" ${order.status === key ? 'selected' : ''}>${info.icon} ${info.label}</option>`
    ).join('');

    orderDetailContent.innerHTML = `
        <!-- Order Header -->
        <div class="flex flex-wrap items-center gap-3 mb-6">
            <span class="font-mono text-sm text-white bg-studio-bg px-3 py-1.5 rounded-sm border border-studio-border">${order.id}</span>
            <span class="status-${order.status} text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-sm border">${statusInfo.icon} ${statusInfo.label}</span>
            <span class="text-xs text-charcoal-500">${formatDateTime(order.createdAt)}</span>
        </div>

        <!-- Customer Details -->
        <div class="bg-studio-bg border border-studio-border rounded-sm p-4 mb-5">
            <h4 class="text-xs uppercase tracking-wider text-charcoal-500 font-medium mb-3">Customer Information</h4>
            <div class="grid sm:grid-cols-2 gap-3 text-sm">
                <div><span class="text-charcoal-500 text-xs">Name:</span><p class="text-white">${order.customer.name}</p></div>
                <div><span class="text-charcoal-500 text-xs">Phone:</span><p class="text-white">${order.customer.phone}</p></div>
                <div><span class="text-charcoal-500 text-xs">Email:</span><p class="text-white">${order.customer.email || '—'}</p></div>
                <div><span class="text-charcoal-500 text-xs">City:</span><p class="text-white">${order.customer.city}</p></div>
                <div class="sm:col-span-2"><span class="text-charcoal-500 text-xs">Address:</span><p class="text-white">${order.customer.address}</p></div>
                <div><span class="text-charcoal-500 text-xs">Payment:</span><p class="text-white">${getPaymentMethodName(order.customer.payment)}</p></div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="mb-5">
            <h4 class="text-xs uppercase tracking-wider text-charcoal-500 font-medium mb-3">Ordered Items</h4>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="border-b border-studio-border text-[10px] uppercase tracking-wider text-charcoal-500">
                            <th class="pb-2 pr-3 font-medium">Product</th>
                            <th class="pb-2 text-center font-medium">Qty</th>
                            <th class="pb-2 text-right font-medium">Price</th>
                            <th class="pb-2 text-right font-medium">Total</th>
                        </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                </table>
            </div>
        </div>

        <!-- Totals -->
        <div class="bg-studio-bg border border-studio-border rounded-sm p-4 mb-5">
            <div class="space-y-2">
                <div class="flex justify-between text-sm"><span class="text-charcoal-400">Subtotal</span><span class="text-white">${formatPKR(order.subtotal)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-charcoal-400">Shipping</span><span class="${order.shipping === 0 ? 'text-green-400' : 'text-white'}">${order.shipping === 0 ? 'FREE' : formatPKR(order.shipping)}</span></div>
                <div class="h-px bg-studio-border"></div>
                <div class="flex justify-between text-lg font-bold"><span class="text-white">Total</span><span class="text-white">${formatPKR(order.total)}</span></div>
            </div>
        </div>

        <!-- Status Update & Notes -->
        <div class="grid sm:grid-cols-2 gap-4">
            <div>
                <label class="block text-xs uppercase tracking-wider text-charcoal-500 font-medium mb-2">Update Status</label>
                <select onchange="handleOrderStatusChange('${order.id}', this.value); openOrderDetail('${order.id}');"
                        class="w-full bg-studio-bg border border-studio-border rounded-sm px-3 py-2.5 text-sm text-white focus:outline-none focus:border-charcoal-400">
                    ${statusOptions}
                </select>
            </div>
            <div>
                <label class="block text-xs uppercase tracking-wider text-charcoal-500 font-medium mb-2">Admin Notes</label>
                <textarea id="orderNotes-${order.id}" rows="2"
                          class="w-full bg-studio-bg border border-studio-border rounded-sm px-3 py-2 text-sm text-white placeholder-charcoal-600 focus:outline-none focus:border-charcoal-400 resize-none"
                          placeholder="Internal notes..."
                          onblur="saveOrderNotes('${order.id}')">${order.notes || ''}</textarea>
            </div>
        </div>

        <!-- Timestamps -->
        <div class="mt-5 pt-4 border-t border-studio-border/50 flex flex-wrap gap-4 text-[10px] text-charcoal-600">
            <span>Created: ${formatDateTime(order.createdAt)}</span>
            <span>Updated: ${formatDateTime(order.updatedAt)}</span>
        </div>`;

    orderDetailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeOrderDetail() {
    orderDetailModal.classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Save admin notes for an order
 */
function saveOrderNotes(orderId) {
    const textarea = document.getElementById(`orderNotes-${orderId}`);
    if (!textarea) return;
    updateOrderNotes(orderId, textarea.value);
}

// ========================
// DELETE OPERATIONS
// ========================
function promptDeleteProduct(id, title) {
    deleteTargetId = id;
    deleteTargetType = 'product';
    deleteModalTitle.textContent = 'Delete Product';
    deleteModalText.textContent = `Are you sure you want to delete "${title}"? This cannot be undone.`;
    deleteModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    confirmDeleteBtn.onclick = () => performDelete();
}

function promptDeleteOrder(orderId) {
    deleteTargetId = orderId;
    deleteTargetType = 'order';
    deleteModalTitle.textContent = 'Delete Order';
    deleteModalText.textContent = `Are you sure you want to delete order ${orderId}? This cannot be undone.`;
    deleteModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    confirmDeleteBtn.onclick = () => performDelete();
}

function performDelete() {
    if (!isAuthenticated()) { handleLogout(); return; }

    if (deleteTargetType === 'product') {
        const product = getProductById(deleteTargetId);
        if (deleteProduct(deleteTargetId)) {
            showAdminToast(`"${product.title}" deleted`);
            if (editingProductId === deleteTargetId) cancelEdit();
            renderInventory();
        }
    } else if (deleteTargetType === 'order') {
        if (deleteOrder(deleteTargetId)) {
            showAdminToast(`Order ${deleteTargetId} deleted`);
            renderOrders();
        }
    }

    closeDeleteModal();
    updateAllStats();
}

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    document.body.style.overflow = '';
    deleteTargetId = null;
    deleteTargetType = null;
}

// ========================
// BULK OPERATIONS
// ========================
function confirmClearDelivered() {
    const count = getOrderCounts().delivered || 0;
    if (count === 0) { showAdminToast('No delivered orders to clear', 'error'); return; }
    if (confirm(`⚠️ Delete all ${count} delivered order${count !== 1 ? 's' : ''}? This cannot be undone.`)) {
        const deleted = deleteOrdersByStatus('delivered');
        showAdminToast(`${deleted} delivered order${deleted !== 1 ? 's' : ''} cleared`);
        renderOrders();
        updateAllStats();
    }
}

function confirmResetProducts() {
    if (!isAuthenticated()) { handleLogout(); return; }
    if (confirm('⚠️ Reset all products to defaults?')) {
        localStorage.removeItem('thewalllab_products');
        initializeData();
        cancelEdit();
        renderInventory();
        updateAllStats();
        showAdminToast('Products reset');
    }
}

function confirmDeleteAll() {
    if (!isAuthenticated()) { handleLogout(); return; }
    if (confirm('⚠️ Delete ALL products permanently?')) {
        localStorage.setItem('thewalllab_products', JSON.stringify([]));
        cancelEdit();
        renderInventory();
        updateAllStats();
        showAdminToast('All products deleted', 'error');
    }
}

function confirmDeleteAllOrders() {
    if (!isAuthenticated()) { handleLogout(); return; }
    const count = getOrderCounts().total;
    if (count === 0) { showAdminToast('No orders to delete', 'error'); return; }
    if (confirm(`⚠️ Delete ALL ${count} orders permanently?`)) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
        renderOrders();
        updateAllStats();
        showAdminToast('All orders deleted', 'error');
    }
}

// ========================
// TOAST NOTIFICATIONS
// ========================
function showAdminToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgClass = type === 'error' ? 'bg-red-900/90 border-red-700' : 'bg-studio-card/95 border-studio-border';
    const iconSVG = type === 'error'
        ? `<svg class="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>`
        : `<svg class="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>`;

    toast.className = `toast-enter pointer-events-auto flex items-center gap-3 ${bgClass} border backdrop-blur-md rounded-sm px-4 py-3 shadow-xl max-w-sm`;
    toast.innerHTML = `${iconSVG}<span class="text-sm text-white">${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}