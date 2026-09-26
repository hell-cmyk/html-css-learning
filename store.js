/**
 * ============================================================
 * THE WALL LAB — Storefront JavaScript (store.js)
 * ============================================================
 * UPDATED: Enhanced checkout with comprehensive order capture,
 * order confirmation with details, and secret admin access.
 * ============================================================
 */

// ========================
// STATE
// ========================
let currentFilter = 'all';
let searchQuery = '';

// ========================
// DOM REFERENCES
// ========================
const productGrid = document.getElementById('productGrid');
const emptyState = document.getElementById('emptyState');
const filterBar = document.getElementById('filterBar');
const searchInput = document.getElementById('searchInput');
const cartBadge = document.getElementById('cartBadge');
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartDrawer = document.getElementById('cartDrawer');
const cartItemsContainer = document.getElementById('cartItems');
const cartEmptyState = document.getElementById('cartEmpty');
const cartFooter = document.getElementById('cartFooter');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartShipping = document.getElementById('cartShipping');
const cartTotalEl = document.getElementById('cartTotal');
const cartItemCount = document.getElementById('cartItemCount');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutSummary = document.getElementById('checkoutSummary');
const checkoutTotal = document.getElementById('checkoutTotal');
const quickViewModal = document.getElementById('quickViewModal');
const quickViewContent = document.getElementById('quickViewContent');
const successModal = document.getElementById('successModal');
const toastContainer = document.getElementById('toastContainer');
const secretLoginModal = document.getElementById('secretLoginModal');
const secretLoginForm = document.getElementById('secretLoginForm');
const secretPasswordInput = document.getElementById('secretPasswordInput');
const secretLoginError = document.getElementById('secretLoginError');

// ========================
// INITIALIZATION
// ========================
document.addEventListener('DOMContentLoaded', () => {
    renderFilterButtons();
    renderProducts();
    updateCartUI();
    setupEventListeners();
    setupSecretAccess();
});

window.addEventListener('storage', (e) => {
    if (e.key === 'thewalllab_products') {
        renderFilterButtons();
        renderProducts();
    }
    if (e.key === 'thewalllab_cart') {
        updateCartUI();
    }
});

// ========================
// SECRET ADMIN ACCESS
// ========================
function setupSecretAccess() {
    // METHOD 1: Triple-click footer text
    const secretTrigger = document.getElementById('secretTrigger');
    let clickCount = 0;
    let clickTimer = null;

    if (secretTrigger) {
        secretTrigger.addEventListener('click', () => {
            clickCount++;
            if (clickTimer) clearTimeout(clickTimer);
            if (clickCount >= 3) {
                clickCount = 0;
                openSecretLogin();
            }
            clickTimer = setTimeout(() => { clickCount = 0; }, 600);
        });
    }

    // METHOD 2: Ctrl + Shift + A
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            openSecretLogin();
        }
    });

    // METHOD 3: Type "admin" on page
    const secretWord = 'admin';
    let typedKeys = '';
    let keyTimer = null;

    document.addEventListener('keypress', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        typedKeys += e.key.toLowerCase();
        if (keyTimer) clearTimeout(keyTimer);
        keyTimer = setTimeout(() => { typedKeys = ''; }, 2000);
        if (typedKeys.includes(secretWord)) {
            typedKeys = '';
            openSecretLogin();
        }
    });

    // Secret login form handler
    if (secretLoginForm) {
        secretLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = secretPasswordInput.value;
            if (!password) {
                showSecretError('Please enter a password.');
                return;
            }
            const result = attemptLogin(password);
            if (result.success) {
                closeSecretLogin();
                window.location.href = 'admin.html';
            } else {
                showSecretError(result.message);
                secretPasswordInput.value = '';
                secretPasswordInput.focus();
            }
        });
    }
}

function openSecretLogin() {
    if (typeof isAuthenticated === 'function' && isAuthenticated()) {
        window.location.href = 'admin.html';
        return;
    }
    secretLoginModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    secretLoginError.classList.add('hidden');
    secretPasswordInput.value = '';
    setTimeout(() => secretPasswordInput.focus(), 100);
}

function closeSecretLogin() {
    secretLoginModal.classList.add('hidden');
    document.body.style.overflow = '';
    secretPasswordInput.value = '';
    secretLoginError.classList.add('hidden');
}

function showSecretError(message) {
    secretLoginError.textContent = message;
    secretLoginError.classList.remove('hidden');
}

// ========================
// EVENT LISTENERS
// ========================
function setupEventListeners() {
    document.getElementById('cartToggleBtn').addEventListener('click', openCart);
    document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderProducts();
    });

    checkoutBtn.addEventListener('click', openCheckoutModal);
    checkoutForm.addEventListener('submit', handleCheckout);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCart();
            closeQuickView();
            closeCheckoutModal();
            closeSecretLogin();
        }
    });

    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.pageYOffset > 100) {
            navbar.classList.add('shadow-lg');
        } else {
            navbar.classList.remove('shadow-lg');
        }
    });
}

// ========================
// FILTER BUTTONS
// ========================
function renderFilterButtons() {
    const categories = getCategories();
    const existingBtns = filterBar.querySelectorAll('.filter-btn:not([data-filter="all"])');
    existingBtns.forEach(btn => btn.remove());

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.setAttribute('data-filter', cat);
        btn.className = 'filter-btn px-4 sm:px-5 py-2 text-xs sm:text-sm uppercase tracking-wider border border-studio-border rounded-sm font-medium text-charcoal-400 hover:text-white hover:border-charcoal-400';
        btn.textContent = getCategoryName(cat);
        btn.addEventListener('click', () => setFilter(cat));
        filterBar.appendChild(btn);
    });

    const allBtn = filterBar.querySelector('[data-filter="all"]');
    allBtn.onclick = () => setFilter('all');
}

function setFilter(filter) {
    currentFilter = filter;
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('bg-white', 'text-studio-bg');
            btn.classList.remove('text-charcoal-400');
        } else {
            btn.classList.remove('bg-white', 'text-studio-bg');
            btn.classList.add('text-charcoal-400');
        }
    });
    renderProducts();
}

// ========================
// PRODUCT RENDERING
// ========================
function renderProducts() {
    let products = getLiveProducts();

    if (currentFilter !== 'all') {
        products = products.filter(p => p.category === currentFilter);
    }
    if (searchQuery) {
        products = products.filter(p =>
            p.title.toLowerCase().includes(searchQuery) ||
            p.description.toLowerCase().includes(searchQuery) ||
            p.category.toLowerCase().includes(searchQuery)
        );
    }

    if (products.length === 0) {
        productGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        productGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');
    }

    productGrid.innerHTML = products.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
    const sizeBadges = product.sizes.map(s =>
        `<span class="text-[10px] px-1.5 py-0.5 border border-studio-border rounded-sm text-charcoal-400">${s}</span>`
    ).join('');

    return `
        <div class="group bg-studio-card border border-studio-border rounded-sm overflow-hidden hover:border-charcoal-500 flex flex-col" data-product-id="${product.id}">
            <div class="product-image-wrapper relative aspect-[4/5] overflow-hidden cursor-pointer" onclick="openQuickView('${product.id}')">
                <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover transition-transform duration-500" loading="lazy"
                     onerror="this.src='https://via.placeholder.com/400x500/242424/666?text=Image+Not+Found'">
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                    <span class="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 text-white text-xs uppercase tracking-wider bg-black/50 px-4 py-2 rounded-sm backdrop-blur-sm">Quick View</span>
                </div>
                <span class="absolute top-3 left-3 text-[10px] uppercase tracking-wider bg-studio-bg/80 backdrop-blur-sm px-2 py-1 rounded-sm text-charcoal-300 border border-studio-border/50">${getCategoryName(product.category)}</span>
            </div>
            <div class="p-4 flex flex-col flex-1">
                <h3 class="text-sm font-semibold text-white mb-1 line-clamp-1">${product.title}</h3>
                <p class="text-xs text-charcoal-500 mb-3 line-clamp-2 flex-1">${product.description}</p>
                <div class="flex flex-wrap gap-1 mb-3">${sizeBadges}</div>
                <div class="flex items-center justify-between">
                    <span class="text-base font-bold text-white">${formatPKR(product.price)}</span>
                    <button onclick="handleAddToCart('${product.id}')"
                            class="flex items-center gap-1.5 bg-white/10 hover:bg-white hover:text-studio-bg text-white px-3 py-1.5 text-xs font-medium rounded-sm border border-white/20 hover:border-white uppercase tracking-wide">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                        </svg>Add
                    </button>
                </div>
            </div>
        </div>`;
}

// ========================
// ADD TO CART
// ========================
function handleAddToCart(productId) {
    const product = getProductById(productId);
    if (!product) return;
    const defaultSize = product.sizes[0] || 'A4';
    addToCart(productId, defaultSize, 1);
    updateCartUI();
    showToast(`"${product.title}" (${defaultSize}) added to cart`);
}

function handleAddToCartWithSize(productId) {
    const sizeSelect = document.getElementById('qv-size-select');
    const qtyInput = document.getElementById('qv-quantity');
    const size = sizeSelect ? sizeSelect.value : 'A4';
    const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    const product = getProductById(productId);
    if (!product) return;
    addToCart(productId, size, qty);
    updateCartUI();
    closeQuickView();
    openCart();
    showToast(`"${product.title}" (${size}) × ${qty} added to cart`);
}

// ========================
// CART DRAWER
// ========================
function openCart() {
    cartDrawer.classList.remove('pointer-events-none');
    cartOverlay.classList.remove('opacity-0', 'pointer-events-none');
    cartOverlay.classList.add('opacity-100');
    cartPanel.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    updateCartUI();
}

function closeCart() {
    cartOverlay.classList.add('opacity-0', 'pointer-events-none');
    cartOverlay.classList.remove('opacity-100');
    cartPanel.classList.add('translate-x-full');
    document.body.style.overflow = '';
    setTimeout(() => { cartDrawer.classList.add('pointer-events-none'); }, 350);
}

function updateCartUI() {
    const cart = getCart();
    const count = getCartCount();
    const total = getCartTotal();

    if (count > 0) {
        cartBadge.textContent = count > 99 ? '99+' : count;
        cartBadge.classList.remove('hidden');
    } else {
        cartBadge.classList.add('hidden');
    }

    cartItemCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;

    if (cart.length === 0) {
        cartItemsContainer.classList.add('hidden');
        cartEmptyState.classList.remove('hidden');
        cartFooter.classList.add('hidden');
    } else {
        cartItemsContainer.classList.remove('hidden');
        cartEmptyState.classList.add('hidden');
        cartFooter.classList.remove('hidden');
    }

    cartItemsContainer.innerHTML = cart.map(item => {
        const product = getProductById(item.productId);
        if (!product) return '';
        const itemTotal = product.price * item.quantity;
        return `
            <div class="flex gap-4 py-4 border-b border-studio-border/50 last:border-0">
                <div class="w-16 h-20 flex-shrink-0 bg-studio-hover rounded-sm overflow-hidden">
                    <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover"
                         onerror="this.src='https://via.placeholder.com/64x80/242424/666?text=?'">
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-white truncate">${product.title}</h4>
                    <p class="text-xs text-charcoal-500 mt-0.5">Size: ${item.size}</p>
                    <p class="text-xs text-charcoal-400 mt-0.5">${formatPKR(product.price)} each</p>
                    <div class="flex items-center justify-between mt-2">
                        <div class="flex items-center border border-studio-border rounded-sm">
                            <button onclick="changeCartQty('${item.productId}', '${item.size}', ${item.quantity - 1})"
                                    class="w-7 h-7 flex items-center justify-center text-charcoal-400 hover:text-white hover:bg-studio-hover text-sm">−</button>
                            <span class="w-8 h-7 flex items-center justify-center text-xs text-white border-x border-studio-border">${item.quantity}</span>
                            <button onclick="changeCartQty('${item.productId}', '${item.size}', ${item.quantity + 1})"
                                    class="w-7 h-7 flex items-center justify-center text-charcoal-400 hover:text-white hover:bg-studio-hover text-sm">+</button>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium text-white">${formatPKR(itemTotal)}</span>
                            <button onclick="removeItem('${item.productId}', '${item.size}')" class="p-1 text-charcoal-600 hover:text-red-400" aria-label="Remove item">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    const shipping = total >= 5000 ? 0 : 350;
    const grandTotal = total + shipping;
    cartSubtotal.textContent = formatPKR(total);
    cartShipping.textContent = total >= 5000 ? 'FREE' : formatPKR(350);
    cartShipping.className = total >= 5000 ? 'text-green-400 text-sm font-medium' : 'text-charcoal-300 text-sm';
    cartTotalEl.textContent = formatPKR(grandTotal);
}

function changeCartQty(productId, size, newQty) {
    updateCartQuantity(productId, size, newQty);
    updateCartUI();
}

function removeItem(productId, size) {
    removeCartItem(productId, size);
    updateCartUI();
    showToast('Item removed from cart');
}

// ========================
// QUICK VIEW MODAL
// ========================
function openQuickView(productId) {
    const product = getProductById(productId);
    if (!product) return;
    const sizeOptions = product.sizes.map(s => `<option value="${s}">${s}</option>`).join('');

    quickViewContent.innerHTML = `
        <div class="aspect-[4/5] md:aspect-auto">
            <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover"
                 onerror="this.src='https://via.placeholder.com/600x750/242424/666?text=Image+Not+Found'">
        </div>
        <div class="p-6 sm:p-8 flex flex-col justify-center">
            <span class="text-[10px] uppercase tracking-[0.2em] text-charcoal-500 font-medium">${getCategoryName(product.category)}</span>
            <h2 class="font-serif text-2xl sm:text-3xl font-bold text-white mt-2 mb-3">${product.title}</h2>
            <p class="text-charcoal-400 text-sm leading-relaxed mb-6">${product.description}</p>
            <div class="text-2xl font-bold text-white mb-6">${formatPKR(product.price)}</div>
            <div class="mb-4">
                <label class="block text-xs uppercase tracking-wider text-charcoal-500 mb-2">Size</label>
                <select id="qv-size-select" class="w-full bg-studio-card border border-studio-border rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-charcoal-400">${sizeOptions}</select>
            </div>
            <div class="mb-6">
                <label class="block text-xs uppercase tracking-wider text-charcoal-500 mb-2">Quantity</label>
                <div class="flex items-center border border-studio-border rounded-sm w-fit">
                    <button onclick="document.getElementById('qv-quantity').stepDown();" class="w-10 h-10 flex items-center justify-center text-charcoal-400 hover:text-white hover:bg-studio-hover">−</button>
                    <input type="number" id="qv-quantity" value="1" min="1" max="10" class="w-14 h-10 text-center bg-transparent text-white text-sm border-x border-studio-border focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                    <button onclick="document.getElementById('qv-quantity').stepUp();" class="w-10 h-10 flex items-center justify-center text-charcoal-400 hover:text-white hover:bg-studio-hover">+</button>
                </div>
            </div>
            <button onclick="handleAddToCartWithSize('${product.id}')"
                    class="w-full bg-white text-studio-bg py-3.5 font-semibold text-sm uppercase tracking-wider hover:bg-charcoal-200 rounded-sm flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
                Add to Cart
            </button>
            <div class="mt-6 pt-5 border-t border-studio-border/50 space-y-2">
                <div class="flex items-center gap-2 text-xs text-charcoal-500"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Printed on 300gsm archival matte paper</div>
                <div class="flex items-center gap-2 text-xs text-charcoal-500"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>12-color pigment ink process</div>
                <div class="flex items-center gap-2 text-xs text-charcoal-500"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Free shipping on orders above PKR 5,000</div>
            </div>
        </div>`;

    quickViewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeQuickView() {
    quickViewModal.classList.add('hidden');
    if (cartPanel.classList.contains('translate-x-full')) {
        document.body.style.overflow = '';
    }
}

// ========================
// CHECKOUT — ENHANCED
// ========================
function openCheckoutModal() {
    const cart = getCart();
    if (cart.length === 0) return;

    let summaryHTML = '';
    cart.forEach(item => {
        const product = getProductById(item.productId);
        if (product) {
            summaryHTML += `
                <div class="flex justify-between">
                    <span class="truncate mr-2">${product.title} (${item.size}) × ${item.quantity}</span>
                    <span class="flex-shrink-0">${formatPKR(product.price * item.quantity)}</span>
                </div>`;
        }
    });

    const total = getCartTotal();
    const shipping = total >= 5000 ? 0 : 350;
    summaryHTML += `
        <div class="flex justify-between text-charcoal-500">
            <span>Shipping</span>
            <span>${shipping === 0 ? 'FREE' : formatPKR(shipping)}</span>
        </div>`;

    checkoutSummary.innerHTML = summaryHTML;
    checkoutTotal.textContent = formatPKR(total + shipping);

    closeCart();
    setTimeout(() => {
        checkoutModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }, 200);
}

function closeCheckoutModal() {
    checkoutModal.classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * ENHANCED CHECKOUT HANDLER
 * Captures all customer info and creates a comprehensive order
 */
function handleCheckout(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const customerInfo = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email') || '',
        address: formData.get('address'),
        city: formData.get('city'),
        payment: formData.get('payment')
    };

    // Validation
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address || !customerInfo.city || !customerInfo.payment) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Phone validation
    const phoneClean = customerInfo.phone.replace(/[\s-]/g, '');
    if (phoneClean.length < 10) {
        showToast('Please enter a valid phone number', 'error');
        return;
    }

    // Place the order using data.js (captures everything)
    const order = placeOrder(customerInfo);

    // Close checkout modal
    closeCheckoutModal();
    checkoutForm.reset();

    // Build rich success content
    const successItemsHTML = order.items.map(item =>
        `<div class="flex justify-between text-xs">
            <span class="text-charcoal-400 truncate mr-2">${item.title} (${item.size}) × ${item.quantity}</span>
            <span class="text-charcoal-300 flex-shrink-0">${formatPKR(item.lineTotal)}</span>
        </div>`
    ).join('');

    // Update success modal with order details
    document.getElementById('orderId').textContent = `Order ID: ${order.id}`;

    // Inject order breakdown into success modal
    const successBody = successModal.querySelector('.relative');
    let detailsDiv = document.getElementById('successOrderDetails');
    if (!detailsDiv) {
        detailsDiv = document.createElement('div');
        detailsDiv.id = 'successOrderDetails';
        const continueBtn = successBody.querySelector('button');
        successBody.insertBefore(detailsDiv, continueBtn);
    }

    detailsDiv.innerHTML = `
        <div class="bg-studio-card border border-studio-border rounded-sm p-4 mb-6 text-left max-h-40 overflow-y-auto">
            <div class="space-y-1.5 mb-3">
                ${successItemsHTML}
            </div>
            <div class="border-t border-studio-border pt-2 space-y-1">
                <div class="flex justify-between text-xs">
                    <span class="text-charcoal-500">Subtotal</span>
                    <span class="text-charcoal-300">${formatPKR(order.subtotal)}</span>
                </div>
                <div class="flex justify-between text-xs">
                    <span class="text-charcoal-500">Shipping</span>
                    <span class="${order.shipping === 0 ? 'text-green-400' : 'text-charcoal-300'}">${order.shipping === 0 ? 'FREE' : formatPKR(order.shipping)}</span>
                </div>
                <div class="flex justify-between text-sm font-semibold pt-1">
                    <span class="text-white">Total</span>
                    <span class="text-white">${formatPKR(order.total)}</span>
                </div>
            </div>
        </div>
        <p class="text-xs text-charcoal-500 mb-2">Payment: ${getPaymentMethodName(order.customer.payment)}</p>
    `;

    successModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Update cart UI
    updateCartUI();

    showToast('Order placed successfully!');
}

function closeSuccessModal() {
    successModal.classList.add('hidden');
    document.body.style.overflow = '';
    // Clean up the detail injection
    const detailsDiv = document.getElementById('successOrderDetails');
    if (detailsDiv) detailsDiv.innerHTML = '';
}

// ========================
// TOAST NOTIFICATIONS
// ========================
function showToast(message, type = 'success') {
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