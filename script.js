// Global State
let allProducts = [];
let filteredProducts = [];
let categories = [];
let mainCategories = [];
let cart = [];
let currentProduct = null;
let currentMainCategory = 'All';
let currentSubCategory = 'All';

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const productModal = document.getElementById('productModal');
const searchInput = document.getElementById('searchInput');
const mainCategoryButtons = document.getElementById('mainCategoryButtons');
const subCategoryFilter = document.getElementById('subCategoryFilter');
const subCategoryButtons = document.getElementById('subCategoryButtons');
const categoryDropdown = document.getElementById('categoryDropdown');
const resultsCount = document.getElementById('resultsCount');
const sortSelect = document.getElementById('sortSelect');

// Category Icons Mapping
const categoryIcons = {
    'Footwear': 'fa-shoe-prints',
    'Apparel': 'fa-tshirt',
    'Accessories': 'fa-glasses',
    'One-Piece': 'fa-user',
    'Hoodie': 'fa-hood-cloak',
    'Bag': 'fa-bag-shopping',
    'Dress': 'fa-person-dress',
    'Top': 'fa-shirt',
    'Skirt': 'fa-venus',
    'All': 'fa-th-large'
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
    loadCart();
});

// Load Products from JSON
async function loadProducts() {
    try {
        const response = await fetch('roftu_product_data.json');
        const data = await response.json();
        
        // Process products and extract categories
        allProducts = [];
        categories = [];
        const mainCategorySet = new Set();
        
        data.products.forEach(categoryGroup => {
            const fullCategory = categoryGroup.category;
            categories.push(fullCategory);
            
            // Extract main category (before the " - " if exists)
            const mainCategory = fullCategory.includes(' - ') 
                ? fullCategory.split(' - ')[0] 
                : fullCategory;
            mainCategorySet.add(mainCategory);
            
            // Process items in this category
            categoryGroup.items.forEach(item => {
                allProducts.push({
                    ...item,
                    fullCategory: fullCategory,
                    mainCategory: mainCategory,
                    subCategory: fullCategory.includes(' - ') 
                        ? fullCategory.split(' - ')[1] 
                        : null,
                    price: item.price || 99.00, // Default price if not provided
                    id: allProducts.length + 1
                });
            });
        });
        
        mainCategories = Array.from(mainCategorySet);
        filteredProducts = [...allProducts];
        
        // Render UI
        renderMainCategories();
        renderCategoryDropdown();
        renderProducts(filteredProducts);
        updateResultsCount();
        
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error loading products</h3>
                <p>Please refresh the page or try again later.</p>
            </div>
        `;
    }
}

// Render Main Category Buttons
function renderMainCategories() {
    mainCategoryButtons.innerHTML = `
        <button class="main-category-btn active" data-main-category="All">
            <i class="fas fa-th-large"></i>
            <span>All Products</span>
        </button>
    `;
    
    mainCategories.forEach(category => {
        const iconClass = categoryIcons[category] || 'fa-tag';
        const btn = document.createElement('button');
        btn.className = 'main-category-btn';
        btn.dataset.mainCategory = category;
        btn.innerHTML = `
            <i class="fas ${iconClass}"></i>
            <span>${category}</span>
        `;
        mainCategoryButtons.appendChild(btn);
    });
    
    // Add click event listeners
    document.querySelectorAll('.main-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.main-category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMainCategory = btn.dataset.mainCategory;
            currentSubCategory = 'All';
            
            // Show/hide sub-category filter
            if (currentMainCategory !== 'All') {
                renderSubCategories(currentMainCategory);
            } else {
                subCategoryFilter.classList.remove('active');
            }
            
            filterProducts();
        });
    });
}

// Render Sub-Category Buttons
function renderSubCategories(mainCategory) {
    // Get sub-categories for this main category
    const subCategories = categories
        .filter(cat => cat.startsWith(mainCategory + ' - '))
        .map(cat => cat.split(' - ')[1]);
    
    if (subCategories.length > 0) {
        subCategoryButtons.innerHTML = `
            <button class="sub-category-btn active" data-sub-category="All">All ${mainCategory}</button>
        `;
        
        subCategories.forEach(subCat => {
            const btn = document.createElement('button');
            btn.className = 'sub-category-btn';
            btn.dataset.subCategory = subCat;
            btn.textContent = subCat;
            subCategoryButtons.appendChild(btn);
        });
        
        subCategoryFilter.classList.add('active');
        
        // Add click event listeners
        document.querySelectorAll('.sub-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sub-category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSubCategory = btn.dataset.subCategory;
                filterProducts();
            });
        });
    } else {
        subCategoryFilter.classList.remove('active');
    }
}

// Render Category Dropdown (for mobile)
function renderCategoryDropdown() {
    categoryDropdown.innerHTML = '<option value="All">All Categories</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryDropdown.appendChild(option);
    });
}

// Filter Products
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    
    filteredProducts = allProducts.filter(product => {
        // Main category filter
        const matchesMainCategory = currentMainCategory === 'All' || 
            product.mainCategory === currentMainCategory;
        
        // Sub-category filter
        const matchesSubCategory = currentSubCategory === 'All' || 
            product.subCategory === currentSubCategory;
        
        // Search filter
        const matchesSearch = searchTerm === '' ||
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.fullCategory.toLowerCase().includes(searchTerm);
        
        return matchesMainCategory && matchesSubCategory && matchesSearch;
    });
    
    // Apply sorting
    sortProducts();
    
    renderProducts(filteredProducts);
    updateResultsCount();
}

// Sort Products
function sortProducts() {
    const sortValue = sortSelect.value;
    
    switch (sortValue) {
        case 'name-asc':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-asc':
            filteredProducts.sort((a, b) => (a.price || 99) - (b.price || 99));
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => (b.price || 99) - (a.price || 99));
            break;
        default:
            // Keep original order
            break;
    }
}

// Update Results Count
function updateResultsCount() {
    const categoryText = currentMainCategory === 'All' 
        ? 'all categories' 
        : currentSubCategory === 'All' 
            ? currentMainCategory 
            : `${currentMainCategory} - ${currentSubCategory}`;
    
    resultsCount.textContent = `Showing ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} in ${categoryText}`;
}

// Render Products
function renderProducts(productsList) {
    if (productsList.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria.</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = productsList.map(product => {
        const badgeClass = getBadgeClass(product.mainCategory);
        const price = product.price || 99.00;
        
        return `
            <div class="product-card" data-id="${product.id}">
                <span class="badge ${badgeClass}">${product.mainCategory}</span>
                <div class="product-image">
                    <img src="products/${product.filename}" 
                         alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/300x300/f5f5f5/333333?text=Image+Not+Found'">
                </div>
                <div class="product-info">
                    <p class="product-category">${product.fullCategory}</p>
                    <h3>${product.name}</h3>
                    <div class="price-divider"></div>
                    <p class="price">$${price.toFixed(2)}</p>
                </div>
                <button class="quick-add-btn">Quick Add</button>
            </div>
        `;
    }).join('');

    // Add event listeners
    document.querySelectorAll('.product-card').forEach(card => {
        const productId = parseInt(card.dataset.id);
        const product = allProducts.find(p => p.id === productId);

        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('quick-add-btn')) {
                openProductModal(product);
            }
        });

        const quickAddBtn = card.querySelector('.quick-add-btn');
        quickAddBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(product);
        });
    });
}

// Get Badge Class based on category
function getBadgeClass(mainCategory) {
    const categoryLower = mainCategory.toLowerCase();
    if (categoryLower.includes('footwear')) return 'footwear';
    if (categoryLower.includes('apparel')) return 'apparel';
    if (categoryLower.includes('accessor')) return 'accessories';
    return '';
}

// Open Product Modal
function openProductModal(product) {
    currentProduct = product;
    
    document.getElementById('modalImage').src = `products/${product.filename}`;
    document.getElementById('modalImage').alt = product.name;
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalCategory').textContent = product.fullCategory;
    document.getElementById('modalPrice').textContent = `$${(product.price || 99.00).toFixed(2)}`;
    document.getElementById('modalDescription').textContent = product.description;
    document.getElementById('modalColor').textContent = product.color || '-';
    
    document.getElementById('qtyInput').value = 1;
    productModal.classList.add('active');
}

// Close Product Modal
function closeProductModal() {
    productModal.classList.remove('active');
    currentProduct = null;
}

// Add to Cart
function addToCart(product, quantity = 1) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            ...product,
            quantity: quantity
        });
    }
    
    updateCart();
    showNotification(`${product.name} added to cart!`);
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

// Update Cart
function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="products/${item.filename}" 
                     alt="${item.name}" 
                     onerror="this.src='https://via.placeholder.com/80x80/f5f5f5/333333?text=No+Image'">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>$${(item.price || 99.00).toFixed(2)} x ${item.quantity}</p>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                removeFromCart(parseInt(btn.dataset.id));
            });
        });
    }
    
    const total = cart.reduce((sum, item) => sum + ((item.price || 99.00) * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
    
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load Cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

// Show Notification
function showNotification(message) {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Setup Event Listeners
function setupEventListeners() {
    // Cart Icon
    document.getElementById('cartIcon').addEventListener('click', () => {
        cartDrawer.classList.add('active');
        cartOverlay.classList.add('active');
    });
    
    // Close Cart
    document.getElementById('closeCart').addEventListener('click', () => {
        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
    });
    
    cartOverlay.addEventListener('click', () => {
        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
    });
    
    // Close Modal
    document.getElementById('closeModal').addEventListener('click', closeProductModal);
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) closeProductModal();
    });
    
    // Quantity Buttons
    document.getElementById('qtyMinus').addEventListener('click', () => {
        const input = document.getElementById('qtyInput');
        if (parseInt(input.value) > 1) {
            input.value = parseInt(input.value) - 1;
        }
    });
    
    document.getElementById('qtyPlus').addEventListener('click', () => {
        const input = document.getElementById('qtyInput');
        input.value = parseInt(input.value) + 1;
    });
    
    // Modal Add to Cart
    document.getElementById('modalAddToCart').addEventListener('click', () => {
        if (currentProduct) {
            const quantity = parseInt(document.getElementById('qtyInput').value);
            addToCart(currentProduct, quantity);
            closeProductModal();
        }
    });
    
    // Category Dropdown (Mobile)
    categoryDropdown.addEventListener('change', (e) => {
        const selectedCategory = e.target.value;
        
        if (selectedCategory === 'All') {
            currentMainCategory = 'All';
            currentSubCategory = 'All';
        } else {
            const parts = selectedCategory.split(' - ');
            currentMainCategory = parts[0];
            currentSubCategory = parts[1] || 'All';
        }
        
        filterProducts();
    });
    
    // Search
    searchInput.addEventListener('input', filterProducts);
    
    // Sort
    sortSelect.addEventListener('change', () => {
        sortProducts();
        renderProducts(filteredProducts);
    });
    
    // Chat Widget
    document.querySelector('.chat-widget').addEventListener('click', () => {
        alert('Chat support coming soon!');
    });
}
