let allProducts = [];
let currentFilteredProducts = [];
let cart = JSON.parse(localStorage.getItem('meatProCart')) || [];

/**
 * 1. CSV Parser (Handles quoted commas)
 */
function parseCSV(text) {
    // Regex matches either content inside quotes OR content between commas
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

/**
 * 2. Store Initialization
 */
async function initStore() {
    try {
        const response = await fetch('products.csv');
        const data = await response.text();
        allProducts = parseCSV(data);
        updateCartUI();
    } catch (e) {
        console.error("Store error:", e);
    }
}

/**
 * 3. Navigation & Search
 */
window.filterByCategory = function(category) {
    document.getElementById('category-section').style.display = 'none';
    document.getElementById('product-header').style.display = 'flex';
    document.getElementById('product-grid').style.display = 'grid';
    document.getElementById('current-category-name').innerText = category;
    document.getElementById('product-search').value = '';

    currentFilteredProducts = allProducts.filter(p => 
        p.Category && p.Category.toLowerCase() === category.toLowerCase()
    );
    renderProducts(currentFilteredProducts);
    window.scrollTo(0,0);
};

window.showCategories = function() {
    document.getElementById('category-section').style.display = 'grid';
    document.getElementById('product-header').style.display = 'none';
    document.getElementById('product-grid').style.display = 'none';
};

window.handleSearch = function() {
    const term = document.getElementById('product-search').value.toLowerCase();
    const searched = currentFilteredProducts.filter(p => 
        p.Name.toLowerCase().includes(term) || p.ShortDescription.toLowerCase().includes(term)
    );
    renderProducts(searched);
};

/**
 * 4. Rendering
 */
function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    if(products.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center;">No items found.</p>`;
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="openModal('${p.Name.replace(/'/g, "\\'")}')">
            <img src="${p.Image}" onerror="this.src='https://via.placeholder.com/300x200'">
            <div class="product-info">
                <h3>${p.Name}</h3>
                <p>${p.ShortDescription}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                    <span class="price-tag"><img src="currency-logo.png" class="currency-icon">${parseFloat(p.Price).toFixed(2)}</span>
                    <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.Name.replace(/'/g, "\\'")}', ${p.Price}, '${p.Image}')">Add +</button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 5. Modal Logic
 */
window.openModal = function(name) {
    const p = allProducts.find(i => i.Name === name);
    if(!p) return;

    document.getElementById('modal-img').src = p.Image;
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
    const input = document.getElementById('modal-qty-input');
    let val = parseInt(input.value) + amt;
    if(val >= 1) input.value = val;
};

/**
 * 6. Cart Logic
 */
window.addToCart = function(name, price, image, qty = 1) {
    const existing = cart.find(i => i.name === name);
    if(existing) {
        existing.quantity += qty;
    } else {
        cart.push({ name, price: parseFloat(price), image, quantity: qty });
    }
    saveCart();
    document.getElementById('cart-sidebar').classList.add('active');
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveCart();
};

function saveCart() {
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    updateCartUI();
}

window.updateCartUI = function() {
    const itemsDiv = document.getElementById('cart-items');
    const totalSpan = document.getElementById('cart-total');
    const countSpan = document.getElementById('cart-count');

    countSpan.innerText = cart.reduce((s, i) => s + i.quantity, 0);

    if(cart.length === 0) {
        itemsDiv.innerHTML = `<p style="text-align:center; color:#888;">Empty cart</p>`;
        totalSpan.innerText = "0.00";
    } else {
        itemsDiv.innerHTML = cart.map((item, idx) => `
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <img src="${item.image}" style="width:40px; height:40px; object-fit:cover; border-radius:5px;">
                    <div>
                        <div style="font-weight:700; font-size:0.9rem;">${item.name}</div>
                        <div style="font-size:0.8rem; color:#666;">${item.quantity} x ${item.price}</div>
                    </div>
                </div>
                <button onclick="removeFromCart(${idx})" style="border:none; background:none; color:red; cursor:pointer;">&times;</button>
            </div>
        `).join('');
        const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        totalSpan.innerText = total.toFixed(2);
    }
};

window.toggleCart = function() {
    document.getElementById('cart-sidebar').classList.toggle('active');
};

window.goToCheckout = function() {
    if(cart.length > 0) window.location.href = 'checkout.html';
};

document.addEventListener('DOMContentLoaded', initStore);
