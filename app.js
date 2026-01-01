// Global State
let allProducts = [];
let currentFilteredProducts = [];
let cart = JSON.parse(localStorage.getItem('meatProCart')) || [];

/**
 * 1. SMART CSV PARSER
 * This regex correctly handles commas inside quoted strings.
 * Example: "Ribeye, Wagyu", 120.00 -> handles as two columns.
 */
function parseCSV(text) {
    const regex = /(".*?"|[^",\n]+)(?=\s*,|\s*\n|$)/g;
    const rows = text.split('\n').filter(row => row.trim() !== '');
    
    // Skip headers (Row 0) and map the rest
    return rows.slice(1).map(row => {
        const matches = row.match(regex).map(val => val.replace(/^"|"$/g, "").trim());
        return {
            Name: matches[0],
            Price: matches[1],
            ShortDescription: matches[2],
            LongDescription: matches[3],
            Image: matches[4],
            Category: matches[5]
        };
    });
}

/**
 * 2. INITIALIZE STORE
 */
async function initStore() {
    try {
        const response = await fetch('products.csv');
        const data = await response.text();
        allProducts = parseCSV(data);
        updateCartUI();
        console.log("Store initialized with " + allProducts.length + " items.");
    } catch (e) {
        console.error("Critical Error: Could not load products.csv", e);
    }
}

/**
 * 3. CATEGORY & SEARCH NAVIGATION
 */
window.filterByCategory = function(categoryName) {
    // UI Transitions
    document.getElementById('category-section').style.display = 'none';
    document.getElementById('product-header').style.display = 'flex';
    document.getElementById('product-grid').style.display = 'grid';
    document.getElementById('current-category-name').innerText = categoryName;
    document.getElementById('product-search').value = ''; // Reset search

    // Filter by Category Column (Matches Column E)
    currentFilteredProducts = allProducts.filter(p => 
        p.Category && p.Category.toLowerCase() === categoryName.toLowerCase()
    );
    
    renderProducts(currentFilteredProducts);
    window.scrollTo(0, 0);
};

window.showCategories = function() {
    document.getElementById('category-section').style.display = 'grid';
    document.getElementById('product-header').style.display = 'none';
    document.getElementById('product-grid').style.display = 'none';
};

window.handleSearch = function() {
    const term = document.getElementById('product-search').value.toLowerCase();
    const searchedItems = currentFilteredProducts.filter(p => 
        p.Name.toLowerCase().includes(term) || 
        p.ShortDescription.toLowerCase().includes(term)
    );
    renderProducts(searchedItems);
};

/**
 * 4. RENDERING PRODUCTS
 */
function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    if (products.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#888;">No items found.</div>`;
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="openModal('${p.Name.replace(/'/g, "\\'")}')">
            <div class="img-container">
                <img src="${p.Image}" onerror="this.src='https://via.placeholder.com/300x200?text=Premium+Cut'">
            </div>
            <div class="product-info">
                <h3>${p.Name}</h3>
                <p>${p.ShortDescription}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                    <span class="price-tag">
                        <img src="currency-logo.png" class="currency-icon">
                        ${parseFloat(p.Price).toFixed(2)}
                    </span>
                    <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.Name.replace(/'/g, "\\'")}', ${p.Price}, '${p.Image}')">Add +</button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 5. MODAL (BIG CARD) LOGIC
 */
window.openModal = function(productName) {
    const p = allProducts.find(item => item.Name === productName);
    if (!p) return;

    document.getElementById('modal-img').src = p.Image;
    document.getElementById('modal-name').innerText = p.Name;
    document.getElementById('modal-price-val').innerText = parseFloat(p.Price).toFixed(2);
    document.getElementById('modal-long-desc').innerText = p.LongDescription;
    
    // Update Add Button in Modal
    document.getElementById('modal-add-btn').onclick = () => {
        addToCart(p.Name, p.Price, p.Image);
        closeModal();
    };

    document.getElementById('product-modal').classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
};

window.closeModal = function() {
    document.getElementById('product-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
};

/**
 * 6. CART CORE LOGIC
 */
window.addToCart = function(name, price, image) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price: parseFloat(price), image, quantity: 1 });
    }
    
    saveAndRefresh();
    document.getElementById('cart-sidebar').classList.add('active');
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveAndRefresh();
};

function saveAndRefresh() {
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    updateCartUI();
}

window.updateCartUI = function() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    cartCount.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="color:#888; text-align:center; padding-top:20px;">Your cart is empty.</p>';
        cartTotal.innerText = "0.00";
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <img src="${item.image}" style="width:40px; height:40px; object-fit:cover; border-radius:5px;">
                    <div>
                        <div style="font-weight:700; font-size:0.9rem;">${item.name}</div>
                        <div style="font-size:0.8rem; color:#666;">Qty: ${item.quantity}</div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:700; font-size:0.9rem;">${(item.price * item.quantity).toFixed(2)}</div>
                    <button onclick="removeFromCart(${index})" style="color:var(--primary-red); background:none; border:none; cursor:pointer; font-size:0.8rem;">Remove</button>
                </div>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.innerText = total.toFixed(2);
    }
};

window.toggleCart = function() {
    document.getElementById('cart-sidebar').classList.toggle('active');
};

window.goToCheckout = function() {
    if (cart.length > 0) window.location.href = 'checkout.html';
};

// Start the app
document.addEventListener('DOMContentLoaded', initStore);
