/**
 * ============================================================
 * THE WALL LAB — Admin Dashboard JavaScript (admin.js)
 * ============================================================
 * Handles product CRUD operations, form management,
 * status toggles, and real-time inventory display.
 * ============================================================
 */

// ========================
// STATE
// ========================
let editingProductId = null;
let deleteTargetId = null;
let adminFilterStatus = 'all';
let adminSearchQuery = '';

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
const deleteModalText = document.getElementById('deleteModalText');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const toastContainer = document.getElementById('toastContainer');

// ========================
// INITIALIZATION
// ========================
document.addEventListener('DOMContentLoaded', () => {
    renderInventory();
    updateStats();
    setupAdminEventListeners();
});

// Cross-tab sync
window.addEventListener('storage', (e) => {
    if (e.key === 'thewalllab_products') {
        renderInventory();
        updateStats();
    }
});

// ========================
// EVENT LISTENERS
// ========================
function setupAdminEventListeners() {
    // Form submission
    productForm.addEventListener('submit', handleFormSubmit);

    // Admin filters
    adminStatusFilter.addEventListener('change', (e) => {
        adminFilterStatus = e.target.value;
        renderInventory();
    });

    adminSearchInput.addEventListener('input', (e) => {
        adminSearchQuery = e.target.value.toLowerCase().trim();
        renderInventory();
    });
}

// ========================
// FORM HANDLING
// ========================
function handleFormSubmit(e) {
    e.preventDefault();

    // Gather form data
    const title = document.getElementById('productTitle').value.trim();
    const category = document.getElementById('productCategory').value;
    const price = parseInt(document.getElementById('productPrice').value);
    const image = document.getElementById('productImage').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const statusChecked = document.getElementById('productStatus').checked;
    const status = statusChecked ? 'live' : 'draft';

    // Get selected sizes
    const sizeCheckboxes = document.querySelectorAll('input[name="sizes"]:checked');
    const sizes = Array.from(sizeCheckboxes).map(cb => cb.value);

    // Validate
    if (!title || !category || !price || !image || !description) {
        showAdminToast('Please fill in all required fields', 'error');
        return;
    }
    if (sizes.length === 0) {
        showAdminToast('Please select at least one size', 'error');
        return;
    }
    if (price < 100) {
        showAdminToast('Price must be at least PKR 100', 'error');
        return;
    }

    const productData = { title, category, price, image, description, sizes, status };

    if (editingProductId) {
        // UPDATE existing product
        const updated = updateProduct(editingProductId, productData);
        if (updated) {
            showAdminToast(`"${title}" updated successfully`);
            cancelEdit();
        } else {
            showAdminToast('Failed to update product', 'error');
        }
    } else {
        // ADD new product
        const newProduct = addProduct(productData);
        showAdminToast(`"${title}" added successfully`);
        resetForm();
    }

    renderInventory();
    updateStats();
}

/**
 * Populate form with product data for editing
 */
function editProduct(id) {
    const product = getProductById(id);
    if (!product) return;

    editingProductId = id;
    editProductIdInput.value = id;

    // Fill form fields
    document.getElementById('productTitle').value = product.title;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productStatus').checked = product.status === 'live';

    // Set size checkboxes
    document.querySelectorAll('input[name="sizes"]').forEach(cb => {
        cb.checked = product.sizes.includes(cb.value);
    });

    // Show image preview
    previewImage(product.image);

    // Update UI to edit mode
    formTitle.innerHTML = `
        <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
        </svg>
        Edit Product
    `;
    submitBtnText.textContent = 'Update Product';
    cancelEditBtn.classList.remove('hidden');

    // Scroll to form on mobile
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Cancel edit mode and reset form
 */
function cancelEdit() {
    editingProductId = null;
    editProductIdInput.value = '';
    resetForm();

    formTitle.innerHTML = `
        <svg class="w-5 h-5 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
        </svg>
        Add New Product
    `;
    submitBtnText.textContent = 'Add Product';
    cancelEditBtn.classList.add('hidden');
}

/**
 * Reset form fields to defaults
 */
function resetForm() {
    productForm.reset();
    // Re-check default sizes
    document.querySelectorAll('input[name="sizes"]').forEach(cb => {
        cb.checked = (cb.value === 'A4' || cb.value === 'A3');
    });
    document.getElementById('productStatus').checked = true;
    hideImagePreview();
}

// ========================
// IMAGE PREVIEW
// ========================
function previewImage(url) {
    const previewWrapper = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (url && url.startsWith('http')) {
        previewImg.src = url;
        previewImg.onerror = () => {
            previewWrapper.classList.add('hidden');
        };
        previewWrapper.classList.remove('hidden');
    } else {
        previewWrapper.classList.add('hidden');
    }
}

function hideImagePreview() {
    document.getElementById('imagePreview').classList.add('hidden');
}

// ========================
// INVENTORY RENDERING
// ========================
function renderInventory() {
    let products = getAllProducts();

    // Filter by status
    if (adminFilterStatus !== 'all') {
        products = products.filter(p => p.status === adminFilterStatus);
    }

    // Search
    if (adminSearchQuery) {
        products = products.filter(p =>
            p.title.toLowerCase().includes(adminSearchQuery) ||
            p.category.toLowerCase().includes(adminSearchQuery) ||
            p.description.toLowerCase().includes(adminSearchQuery)
        );
    }

    // Show/hide empty state
    if (products.length === 0) {
        inventoryList.classList.add('hidden');
        adminEmptyState.classList.remove('hidden');
    } else {
        inventoryList.classList.remove('hidden');
        adminEmptyState.classList.add('hidden');
    }

    // Render product cards
    inventoryList.innerHTML = products.map(product => createInventoryCard(product)).join('');
}

/**
 * Create HTML for an inventory card/row
 */
function createInventoryCard(product) {
    const isLive = product.status === 'live';
    const statusColor = isLive ? 'text-green-400' : 'text-charcoal-500';
    const statusBg = isLive ? 'bg-green-400/10 border-green-400/20' : 'bg-charcoal-800/50 border-charcoal-700/50';
    const statusText = isLive ? 'Live' : 'Draft';

    const sizeBadges = product.sizes.map(s =>
        `<span class="text-[10px] px-1.5 py-0.5 border border-studio-border rounded-sm text-charcoal-500">${s}</span>`
    ).join('');

    const isEditing = editingProductId === product.id;
    const editingClass = isEditing ? 'ring-2 ring-amber-400/50 border-amber-400/50' : '';

    return `
        <div class="bg-studio-card border border-studio-border rounded-sm p-4 hover:border-charcoal-500 ${editingClass}" data-product-id="${product.id}">
            <div class="flex gap-4">
                <!-- Thumbnail -->
                <div class="w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 bg-studio-bg rounded-sm overflow-hidden">
                    <img src="${product.image}" alt="${product.title}"
                         class="w-full h-full object-cover"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/80x96/242424/666?text=?'">
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                            <h3 class="text-sm font-semibold text-white truncate">${product.title}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-[10px] uppercase tracking-wider text-charcoal-500">${getCategoryName(product.category)}</span>
                                <span class="text-charcoal-700">•</span>
                                <span class="text-sm font-bold text-white">${formatPKR(product.price)}</span>
                            </div>
                        </div>
                        <!-- Status Badge -->
                        <span class="flex-shrink-0 text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-sm border ${statusBg} ${statusColor}">
                            ${statusText}
                        </span>
                    </div>

                    <!-- Sizes -->
                    <div class="flex flex-wrap gap-1 mt-2">${sizeBadges}</div>

                    <!-- Description preview -->
                    <p class="text-xs text-charcoal-600 mt-2 line-clamp-1 hidden sm:block">${product.description}</p>

                    <!-- Actions Row -->
                    <div class="flex items-center justify-between mt-3 pt-3 border-t border-studio-border/50">
                        <!-- Toggle Status -->
                        <div class="flex items-center gap-2">
                            <label class="toggle-switch" title="${isLive ? 'Set to Draft' : 'Publish Live'}">
                                <input type="checkbox" ${isLive ? 'checked' : ''}
                                       onchange="handleToggleStatus('${product.id}')">
                                <span class="toggle-slider"></span>
                            </label>
                            <span class="text-[10px] uppercase tracking-wider ${statusColor}">${statusText}</span>
                        </div>

                        <!-- Edit & Delete -->
                        <div class="flex items-center gap-1">
                            <button onclick="editProduct('${product.id}')"
                                    class="p-2 text-charcoal-500 hover:text-amber-400 hover:bg-studio-hover rounded-sm" title="Edit">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                                </svg>
                            </button>
                            <button onclick="promptDelete('${product.id}', '${product.title.replace(/'/g, "\\'")}')"
                                    class="p-2 text-charcoal-500 hover:text-red-400 hover:bg-studio-hover rounded-sm" title="Delete">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ========================
// STATUS TOGGLE
// ========================
function handleToggleStatus(id) {
    const newStatus = toggleProductStatus(id);
    if (newStatus) {
        const product = getProductById(id);
        const statusLabel = newStatus === 'live' ? 'published' : 'set to draft';
        showAdminToast(`"${product.title}" ${statusLabel}`);
        renderInventory();
        updateStats();
    }
}

// ========================
// DELETE OPERATIONS
// ========================
function promptDelete(id, title) {
    deleteTargetId = id;
    deleteModalText.textContent = `Are you sure you want to delete "${title}"? This action cannot be undone.`;
    deleteModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    confirmDeleteBtn.onclick = () => {
        performDelete();
    };
}

function performDelete() {
    if (!deleteTargetId) return;

    const product = getProductById(deleteTargetId);
    const success = deleteProduct(deleteTargetId);

    if (success) {
        showAdminToast(`"${product.title}" deleted`);
        // If we were editing this product, cancel edit
        if (editingProductId === deleteTargetId) {
            cancelEdit();
        }
    }

    closeDeleteModal();
    renderInventory();
    updateStats();
}

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    document.body.style.overflow = '';
    deleteTargetId = null;
}

// ========================
// DANGER ZONE ACTIONS
// ========================
function confirmResetProducts() {
    if (confirm('⚠️ This will replace all products with the default collection. Continue?')) {
        localStorage.removeItem('thewalllab_products');
        initializeData();
        cancelEdit();
        renderInventory();
        updateStats();
        showAdminToast('Products reset to defaults');
    }
}

function confirmDeleteAll() {
    if (confirm('⚠️ This will permanently delete ALL products. Are you absolutely sure?')) {
        localStorage.setItem('thewalllab_products', JSON.stringify([]));
        cancelEdit();
        renderInventory();
        updateStats();
        showAdminToast('All products deleted', 'error');
    }
}

// ========================
// STATS
// ========================
function updateStats() {
    const products = getAllProducts();
    const total = products.length;
    const live = products.filter(p => p.status === 'live').length;
    const draft = products.filter(p => p.status === 'draft').length;

    // Desktop stats
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statLive').textContent = live;
    document.getElementById('statDraft').textContent = draft;

    // Mobile stats
    document.getElementById('statTotalMobile').textContent = total;
    document.getElementById('statLiveMobile').textContent = live;
    document.getElementById('statDraftMobile').textContent = draft;
}

// ========================
// TOAST NOTIFICATIONS
// ========================
function showAdminToast(message, type = 'success') {
    const toast = document.createElement('div');

    const bgClass = type === 'error'
        ? 'bg-red-900/90 border-red-700'
        : 'bg-studio-card/95 border-studio-border';

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