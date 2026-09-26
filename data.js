/**
 * ============================================================
 * THE WALL LAB — Shared Data Layer (data.js)
 * ============================================================
 * This module manages all product data via localStorage.
 * Both the storefront and admin dashboard use these functions
 * to ensure data consistency across views.
 * ============================================================
 */

const DATA_KEY = 'thewalllab_products';
const CART_KEY = 'thewalllab_cart';
const ORDERS_KEY = 'thewalllab_orders';

/**
 * Default seed products — loaded on first visit
 * These showcase various categories and price points
 */
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

/**
 * Initialize products in localStorage if not present
 */
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

/**
 * Get all products from localStorage
 * @returns {Array} Array of product objects
 */
function getAllProducts() {
    initializeData();
    return JSON.parse(localStorage.getItem(DATA_KEY)) || [];
}

/**
 * Get only live (published) products
 * @returns {Array} Array of live product objects
 */
function getLiveProducts() {
    return getAllProducts().filter(p => p.status === 'live');
}

/**
 * Get a single product by ID
 * @param {string} id - Product ID
 * @returns {Object|null} Product object or null
 */
function getProductById(id) {
    return getAllProducts().find(p => p.id === id) || null;
}

/**
 * Add a new product
 * @param {Object} product - Product data (without id/createdAt)
 * @returns {Object} The created product with generated id
 */
function addProduct(product) {
    const products = getAllProducts();
    const newProduct = {
        ...product,
        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        createdAt: Date.now()
    };
    products.unshift(newProduct); // Add to beginning
    localStorage.setItem(DATA_KEY, JSON.stringify(products));
    return newProduct;
}

/**
 * Update an existing product
 * @param {string} id - Product ID to update
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated product or null if not found
 */
function updateProduct(id, updates) {
    const products = getAllProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...updates };
    localStorage.setItem(DATA_KEY, JSON.stringify(products));
    return products[index];
}

/**
 * Delete a product by ID
 * @param {string} id - Product ID to delete
 * @returns {boolean} Whether deletion was successful
 */
function deleteProduct(id) {
    const products = getAllProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    localStorage.setItem(DATA_KEY, JSON.stringify(filtered));
    // Also remove from cart if present
    removeFromCart(id);
    return true;
}

/**
 * Toggle product status between 'live' and 'draft'
 * @param {string} id - Product ID
 * @returns {string|null} New status or null if not found
 */
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

/**
 * Get current cart contents
 * @returns {Array} Array of cart item objects
 */
function getCart() {
    initializeData();
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

/**
 * Add item to cart or increment quantity if exists
 * @param {string} productId - Product ID
 * @param {string} size - Selected size
 * @param {number} quantity - Quantity to add
 */
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

/**
 * Update cart item quantity
 * @param {string} productId - Product ID
 * @param {string} size - Size variant
 * @param {number} newQuantity - New quantity (0 removes item)
 */
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

/**
 * Remove all instances of a product from cart
 * @param {string} productId - Product ID to remove
 */
function removeFromCart(productId) {
    const cart = getCart().filter(item => item.productId !== productId);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/**
 * Remove a specific cart item (product + size combo)
 * @param {string} productId
 * @param {string} size
 */
function removeCartItem(productId, size) {
    const cart = getCart().filter(
        item => !(item.productId === productId && item.size === size)
    );
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/**
 * Clear the entire cart
 */
function clearCart() {
    localStorage.setItem(CART_KEY, JSON.stringify([]));
}

/**
 * Get cart total in PKR
 * @returns {number} Total price
 */
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

/**
 * Get total number of items in cart
 * @returns {number} Total quantity
 */
function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

// ========================
// ORDER OPERATIONS
// ========================

/**
 * Place an order
 * @param {Object} customerInfo - Customer details
 * @returns {Object} The created order
 */
function placeOrder(customerInfo) {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    const cart = getCart();

    const order = {
        id: 'ORD_' + Date.now(),
        items: cart.map(item => {
            const product = getProductById(item.productId);
            return {
                ...item,
                title: product ? product.title : 'Unknown',
                price: product ? product.price : 0
            };
        }),
        total: getCartTotal(),
        customer: customerInfo,
        status: 'pending',
        createdAt: Date.now()
    };

    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    clearCart();
    return order;
}

/**
 * Format price in PKR
 * @param {number} amount
 * @returns {string} Formatted price string
 */
function formatPKR(amount) {
    return 'PKR ' + amount.toLocaleString('en-PK');
}

/**
 * Get unique categories from all products
 * @returns {Array} Array of category strings
 */
function getCategories() {
    const products = getAllProducts();
    return [...new Set(products.map(p => p.category))];
}

// Category display names mapping
const CATEGORY_NAMES = {
    'monochrome': 'Monochrome',
    'urban': 'Urban Architecture',
    'vintage': 'Vintage',
    'abstract': 'Abstract',
    'nature': 'Nature',
    'portrait': 'Portrait',
    'street': 'Street Photography'
};

/**
 * Get display name for a category
 * @param {string} key - Category key
 * @returns {string} Human-readable category name
 */
function getCategoryName(key) {
    return CATEGORY_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

// Initialize data on script load
initializeData();