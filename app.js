/**
 * THE MEAT PRO - Core Application Logic
 * Standardized to use 'cart' as the localStorage key
 */

let allProducts = [];
let currentFilteredProducts = [];

// --- 1. STORAGE SYNC & MIGRATION ---
// If the user has items in the old key name, move them to the new one
if (localStorage.getItem('meatProCart') && !localStorage.getItem('cart')) {
    localStorage.setItem('cart', localStorage.getItem('meatProCart'));
}

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- 2. DATA LOADING ---
function parseCSV(text) {
    const regex = /(".*?"|[^",\n]+)(?=\s*,|\s*\n|$)/g;
    const rows = text.split('\n').filter(row => row.trim() !== '');
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

async function initStore() {
    try {
        const response = await fetch('products.csv');
        const data = await response.text();
        allProducts = parseCSV(data);
        updateCartUI();
    } catch (e) { 
        console.error("CSV Load Error: Make sure products.csv exists.", e); 
    }
}

// --- 3. UI NAVIGATION ---
window.filterByCategory = function(category) {
    document.getElementById('category-section').style.display = 'none';
    document.getElementById('product-header').style.display = 'flex';
    document.getElementById('product-grid').style.display = 'grid';
    document.getElementById('current-category-name').innerText = category;
    
    currentFilteredProducts = allProducts.filter(p => 
        p.Category.toLowerCase() === category.toLowerCase()
    );
    renderProducts(currentFilteredProducts);
};

window.showCategories = function() {
    document.getElementById('category-section').style.display = 'grid';
    document.getElementById('product-header').style.display = 'none';
    document.getElementById('product-grid').style.display = 'none';
};

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="openModal('${p.Name.replace(/'/g, "\\'")}')">
            <img src="${p.Image}" onerror="this.src='assets/logo.png'" style="width:100%; height:220px; object-fit:cover;">
            <div class="product-info" style="padding:20px;">
                <h3 style="margin:0 0 5px 0;">${p.Name}</h3>
                <p style="font-size:0.85rem; color:#666; margin-bottom:15px;">${p.ShortDescription}</p>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="price-tag">
                        <img src="assets/currency-logo.png" class="currency-icon">
                        ${parseFloat(p.Price).toFixed(2)}
                    </span>
                    <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.Name.replace(/'/g, "\\'")}', ${p.Price}, '${p.Image}')">Add +</button>
                </div>
            </div>
        </div>
    `).join('');
}

// --- 4. MODAL LOGIC ---
window.openModal = function(name) {
    const p = allProducts.find(i => i.Name === name);
    if (!p) return;

    document.getElementById('modal-img').src = p.Image;
    document.getElementById('modal-img').onerror = function() { this.src='assets/logo.png'; };
    document.getElementById('modal-name').innerText = p.Name;
    document.getElementById('modal-price-val').innerText = parseFloat(p.Price).toFixed(2);
    document.getElementById('modal-long-desc').innerText = p.LongDescription;
    document.getElementById('modal-qty-input').value = 1;
    
    document.getElementById('modal-add-btn').onclick = () => {
        const qty = parseInt(document.getElementById('modal-qty-input').value);
        addToCart(p.Name, p.Price, p.Image, qty);
        closeModal();
    };
    
    document.getElementById('product-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeModal = function() {
    document.getElementById('product-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
};

window.adjustModalQty = function(amt) {
    let input = document.getElementById('modal-qty-input');
    let val = parseInt(input.value) + amt;
    if(val >= 1) input.value = val;
};

// --- 5. CART OPERATIONS ---
window.addToCart = function(name, price, image, qty = 1) {
    const existing = cart.find(i => i.name === name);
    
    if(existing) {
        existing.quantity += qty;
    } else {
        cart.push({ 
            name: name, 
            price: parseFloat(price), 
            image: image, 
            quantity: qty 
        });
    }
    
    // Save to 'cart' so checkout.html can read it
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
};

window.removeFromCart = function(idx) {
    cart.splice(idx, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
};

window.updateCartUI = function() {
    const itemsDiv = document.getElementById('cart-items');
    const countSpan = document.getElementById('cart-count');
    const totalSpan = document.getElementById('cart-total');

    if (countSpan) countSpan.innerText = cart.reduce((s, i) => s + i.quantity, 0);
    
    if (itemsDiv) {
        itemsDiv.innerHTML = cart.map((item, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <div style="display:flex; gap:12px; align-items:center;">
                    <img src="${item.image}" onerror="this.src='assets/logo.png'" style="width:45px; height:45px; object-fit:cover; border-radius:6px;">
                    <div>
                        <div style="font-weight:700; font-size:0.85rem;">${item.name}</div>
                        <div style="font-size:0.75rem; color:#666;">${item.quantity} x AED ${item.price.toFixed(2)}</div>
                    </div>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart(${idx})">&times;</button>
            </div>
        `).join('');
    }

    if (totalSpan) {
        const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        totalSpan.innerText = total.toFixed(2);
    }
};

window.toggleCart = function() { 
    document.getElementById('cart-sidebar').classList.toggle('active'); 
};

// Initialize the store on load
document.addEventListener('DOMContentLoaded', initStore);
