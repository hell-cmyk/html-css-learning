/**
 * ============================================================
 * THE WALL LAB — Shared Data Layer (data.js)
 * ============================================================
 * UPDATED: Enhanced order management with status tracking,
 * timestamps, notes, and comprehensive CRUD operations.
 * ============================================================
 */

const DATA_KEY = 'thewalllab_products';
const CART_KEY = 'thewalllab_cart';
const ORDERS_KEY = 'thewalllab_orders';

// ========================
// DEFAULT SEED PRODUCTS
// ========================
const DEFAULT_PRODUCTS = [
    {
        id: 'prod_001',
        title: 'Silent Streets of Lahore',
        category: 'urban',
        price: 3500,
        sizes: ['A4', 'A3', 'A2'],
        description: 'A moody capture of Lahore\'s old city streets at dawn, where history whispers through every brick and archway.',
        image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=750&fit=crop',
        status: 'live',
        createdAt: Date.now()
    },
    {
        id: 'prod_002',
        title: 'Monochrome Solitude',
        category: 'monochrome',
        price: 2800,
        sizes: ['A4', 'A3'],
        description: 'A striking black and white composition capturing the raw emotion of solitude against an urban backdrop.',
        image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&h=750&fit=crop',
        status: 'live',
        createdAt: Date.now() - 1000
    },
    {
        id: 'prod_003',
        title: 'Abstract Flow No. 7',
        category: 'abstract',
        price: 4200,
        sizes: ['A3', 'A2', 'Custom'],
        description: 'Fluid acrylic pour art captured in ultra-high resolution. Each print reveals new details and color transitions.',
        image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&h=750&fit=crop',
        status: 'live',
        createdAt: Date.now() - 2000
    },
    {
        id: 'prod_004',
        title: 'Vintage Karachi Café',
        category: 'vintage',
        price: 3200,
        sizes: ['A4', 'A3'],
        description: 'Warm-toned photograph of a classic Karachi café, evoking nostalgia for simpler times and rich conversations.',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=750&fit=crop',
        status: 'live',
        createdAt: Date.now() - 3000
    },
    {
        id: 'prod_005',
        title: 'Geometric Shadows',
        category: 'abstract',
        price: 3800,
        sizes: ['A3', 'A2'],
        description: 'Architectural photography transformed into abstract art through the interplay of light, shadow, and geometry.',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=750&fit=crop',
        status: 'live',
        createdAt: Date.now() - 4000
    },
    {
        id: 'prod_006',
        title: 'The Fading Portrait',
        category: 'vintage',
        price: 2500,
        sizes: ['A4', 'A3', 'Custom'],
        description: 'A digitally aged portrait that bridges the gap between contemporary photography and vintage darkroom aesthetics.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=750&fit=crop',
        status: 'live',
        createdAt: Date.now() - 5000
    },
    {
        id: 'prod_007',
        title: 'Concrete Jungle Reflections',
        category: 'urban',
        price: 4500,
        sizes: ['A3', 'A2', 'Custom'],
        description: 'Rain-soaked city streets reflecting neon lights create an otherworldly urban landscape worth framing.',
        image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&h=750&fit=crop',
        status: 'live',
        createdAt: Date.now() - 6000
    },
    {
        id: 'prod_008',
        title: 'Noir Whispers',
        category: 'monochrome',
        price: 3100,
        sizes: ['A4', 'A3', 'A2'],
        description: 'Deep contrast black and white photography inspired by film noir cinematography. Pure drama on your wall.',
        image: 'https://images.unsplash.com/photo-1489724077776-4dbe18f2272c?w=600&h=750&fit=crop',
        status: 'live',
        createdAt: Date.now() - 7000
    },
    {
        id: 'prod_009',
        title: 'Minimalist Horizon',
        category: 'monochrome',
        price: 2900,
        sizes: ['A3', 'A2'],
        description: 'Where sky meets earth in the most minimal way possible. A study in negative space and tranquility.',
        image: 'https://images.unsplash.com/photo-1553949345-eb786bb3f7ba?w=600&h=750&fit=crop',
        status: 'draft',
        createdAt: Date.now() - 8000
    },
    {
        id: 'prod_010',
        title: 'Heritage Doorways',
        category: 'vintage',
        price: 3600,
        sizes: ['A4', 'A3', 'A2', 'Custom'],
        description: 'Ornate doorways from the Mughal era, photographed with warm vintage grading that honors their timeless beauty.',
        image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=750&fit=crop',
        status: 'live',
        createdAt: Date.now() - 9000
    }
];

// ========================
// ORDER STATUS DEFINITIONS
// ========================
const ORDER_STATUSES = {
    pending: { label: 'Pending', color: 'amber', icon: '⏳' },
    confirmed: { label: 'Confirmed', color: 'blue', icon: '✓' },
    processing: { label: 'Processing', color: 'purple', icon: '⚙' },
    shipped: { label: 'Shipped', color: 'cyan', icon: '🚚' },
    delivered: { label: 'Delivered', color: 'green', icon: '✅' },
    cancelled: { label: 'Cancelled', color: 'red', icon: '✕' }
};

// ========================
// INITIALIZATION
// ========================
function initializeData() {
    if (!localStorage.getItem(DATA_KEY)) {
        localStorage.setItem(DATA_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem(CART_KEY)) {
        localStorage.setItem(CART_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(ORDERS_KEY)) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
    }
}

// ========================
// PRODUCT CRUD OPERATIONS
// ========================
function getAllProducts() {
    initializeData();
    return JSON.parse(localStorage.getItem(DATA_KEY)) || [];
}

function getLiveProducts() {
    return getAllProducts().filter(p => p.status === 'live');
}

function getProductById(id) {
    return getAllProducts().find(p => p.id === id) || null;
}

function addProduct(product) {
    const products = getAllProducts();
    const newProduct = {
        ...product,
        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        createdAt: Date.now()
    };
    products.unshift(newProduct);
    localStorage.setItem(DATA_KEY, JSON.stringify(products));
    return newProduct;
}

function updateProduct(id, updates) {
    const products = getAllProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...updates };
    localStorage.setItem(DATA_KEY, JSON.stringify(products));
    return products[index];
}

function deleteProduct(id) {
    const products = getAllProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    localStorage.setItem(DATA_KEY, JSON.stringify(filtered));
    removeFromCart(id);
    return true;
}

function toggleProductStatus(id) {
    const product = getProductById(id);
    if (!product) return null;
    const newStatus = product.status === 'live' ? 'draft' : 'live';
    updateProduct(id, { status: newStatus });
    return newStatus;
}

// ========================
// CART OPERATIONS
// ========================
function getCart() {
    initializeData();
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function addToCart(productId, size, quantity = 1) {
    const cart = getCart();
    const existingIndex = cart.findIndex(
        item => item.productId === productId && item.size === size
    );
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({ productId, size, quantity });
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartQuantity(productId, size, newQuantity) {
    let cart = getCart();
    if (newQuantity <= 0) {
        cart = cart.filter(
            item => !(item.productId === productId && item.size === size)
        );
    } else {
        const item = cart.find(
            item => item.productId === productId && item.size === size
        );
        if (item) item.quantity = newQuantity;
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function removeFromCart(productId) {
    const cart = getCart().filter(item => item.productId !== productId);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function removeCartItem(productId, size) {
    const cart = getCart().filter(
        item => !(item.productId === productId && item.size === size)
    );
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function clearCart() {
    localStorage.setItem(CART_KEY, JSON.stringify([]));
}

function getCartTotal() {
    const cart = getCart();
    let total = 0;
    cart.forEach(item => {
        const product = getProductById(item.productId);
        if (product) {
            total += product.price * item.quantity;
        }
    });
    return total;
}

function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

// ========================
// ORDER OPERATIONS
// ========================

/**
 * Place a new order from the customer checkout
 * Captures full snapshot of items, prices, and customer info
 * @param {Object} customerInfo - Customer details from checkout form
 * @returns {Object} The created order with all details
 */
function placeOrder(customerInfo) {
    const orders = getAllOrders();
    const cart = getCart();
    const now = Date.now();

    // Generate a human-readable order ID
    const dateStr = new Date(now).toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase();
    const orderId = `TWL-${dateStr}-${randomPart}`;

    // Build complete item snapshots (with current product info frozen in time)
    const items = cart.map(item => {
        const product = getProductById(item.productId);
        return {
            productId: item.productId,
            title: product ? product.title : 'Unknown Product',
            category: product ? product.category : 'unknown',
            image: product ? product.image : '',
            size: item.size,
            quantity: item.quantity,
            unitPrice: product ? product.price : 0,
            lineTotal: product ? product.price * item.quantity : 0
        };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shipping = subtotal >= 5000 ? 0 : 350;
    const grandTotal = subtotal + shipping;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const order = {
        id: orderId,
        items: items,
        totalItems: totalItems,
        subtotal: subtotal,
        shipping: shipping,
        total: grandTotal,
        customer: {
            name: customerInfo.name || '',
            phone: customerInfo.phone || '',
            email: customerInfo.email || '',
            address: customerInfo.address || '',
            city: customerInfo.city || '',
            payment: customerInfo.payment || 'cod'
        },
        status: 'pending',
        notes: '',
        createdAt: now,
        updatedAt: now
    };

    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    clearCart();
    return order;
}

/**
 * Get all orders from localStorage
 * @returns {Array} Array of order objects, newest first
 */
function getAllOrders() {
    initializeData();
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
}

/**
 * Get a single order by ID
 * @param {string} orderId - Order ID to find
 * @returns {Object|null} Order object or null
 */
function getOrderById(orderId) {
    return getAllOrders().find(o => o.id === orderId) || null;
}

/**
 * Update an order's status
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New status key
 * @returns {Object|null} Updated order or null
 */
function updateOrderStatus(orderId, newStatus) {
    const orders = getAllOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;
    orders[index].status = newStatus;
    orders[index].updatedAt = Date.now();
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return orders[index];
}

/**
 * Update an order's admin notes
 * @param {string} orderId - Order ID
 * @param {string} notes - Notes text
 * @returns {Object|null} Updated order or null
 */
function updateOrderNotes(orderId, notes) {
    const orders = getAllOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;
    orders[index].notes = notes;
    orders[index].updatedAt = Date.now();
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return orders[index];
}

/**
 * Delete an order permanently
 * @param {string} orderId - Order ID
 * @returns {boolean} Success
 */
function deleteOrder(orderId) {
    const orders = getAllOrders();
    const filtered = orders.filter(o => o.id !== orderId);
    if (filtered.length === orders.length) return false;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
    return true;
}

/**
 * Delete all orders with a specific status
 * @param {string} status - Status to filter by
 * @returns {number} Number of orders deleted
 */
function deleteOrdersByStatus(status) {
    const orders = getAllOrders();
    const filtered = orders.filter(o => o.status !== status);
    const deletedCount = orders.length - filtered.length;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
    return deletedCount;
}

/**
 * Get count of orders by status
 * @returns {Object} { pending: n, confirmed: n, processing: n, shipped: n, delivered: n, cancelled: n, total: n }
 */
function getOrderCounts() {
    const orders = getAllOrders();
    const counts = { total: orders.length };
    Object.keys(ORDER_STATUSES).forEach(status => {
        counts[status] = orders.filter(o => o.status === status).length;
    });
    return counts;
}

/**
 * Get the count of "actionable" orders (pending + confirmed + processing)
 * These are the orders that need attention
 * @returns {number}
 */
function getActiveOrderCount() {
    const orders = getAllOrders();
    return orders.filter(o =>
        o.status === 'pending' || o.status === 'confirmed' || o.status === 'processing'
    ).length;
}

/**
 * Get total revenue from delivered orders
 * @returns {number}
 */
function getTotalRevenue() {
    const orders = getAllOrders();
    return orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.total, 0);
}

// ========================
// UTILITY FUNCTIONS
// ========================

/**
 * Format price in PKR
 */
function formatPKR(amount) {
    return 'PKR ' + amount.toLocaleString('en-PK');
}

/**
 * Format a timestamp into readable date/time
 * @param {number} timestamp - Unix timestamp in ms
 * @returns {string} Formatted date string
 */
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const options = {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    };
    return date.toLocaleDateString('en-PK', options);
}

/**
 * Format relative time ago
 * @param {number} timestamp
 * @returns {string} e.g., "2 hours ago", "3 days ago"
 */
function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

/**
 * Get unique categories from all products
 */
function getCategories() {
    const products = getAllProducts();
    return [...new Set(products.map(p => p.category))];
}

const CATEGORY_NAMES = {
    'monochrome': 'Monochrome',
    'urban': 'Urban Architecture',
    'vintage': 'Vintage',
    'abstract': 'Abstract',
    'nature': 'Nature',
    'portrait': 'Portrait',
    'street': 'Street Photography'
};

function getCategoryName(key) {
    return CATEGORY_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Get payment method display name
 * @param {string} key
 * @returns {string}
 */
function getPaymentMethodName(key) {
    const methods = {
        'cod': 'Cash on Delivery',
        'bank': 'Bank Transfer',
        'jazzcash': 'JazzCash',
        'easypaisa': 'EasyPaisa'
    };
    return methods[key] || key;
}

// Initialize on load
initializeData();