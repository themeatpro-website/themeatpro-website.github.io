let allProducts = [];
let currentFilteredProducts = [];
let cart = JSON.parse(localStorage.getItem('meatProCart')) || [];

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
        console.error("Failed to load products.csv", e); 
    }
}

window.filterByCategory = function(category) {
    document.getElementById('category-section').style.display = 'none';
    document.getElementById('product-header').style.display = 'flex';
    document.getElementById('product-grid').style.display = 'grid';
    document.getElementById('current-category-name').innerText = category;
    
    currentFilteredProducts = allProducts.filter(p => 
        p.Category && p.Category.toLowerCase() === category.toLowerCase()
    );
    renderProducts(currentFilteredProducts);
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

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    if (products.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#888;">Coming Soon!</div>`;
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="openModal('${p.Name.replace(/'/g, "\\'")}')">
            <img src="${p.Image}" onerror="this.src='assets/logo.png'" style="width:100%; height:220px; object-fit:cover;">
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

window.openModal = function(name) {
    const p = allProducts.find(i => i.Name === name);
    if (!p) return;

    const modalImg = document.getElementById('modal-img');
    modalImg.src = p.Image;
    // Extra insurance for modal image fallback
    modalImg.onerror = () => { modalImg.src = 'assets/logo.png'; };

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
    if (val >= 1) input.value = val;
};

window.addToCart = function(name, price, image, qty = 1) {
    const existing = cart.find(i => i.name === name);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ name, price: parseFloat(price), image, quantity: qty });
    }
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    updateCartUI();
    document.getElementById('cart-sidebar').classList.add('active');
};

window.removeFromCart = function(idx) {
    cart.splice(idx, 1);
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    updateCartUI();
};

window.updateCartUI = function() {
    const itemsDiv = document.getElementById('cart-items');
    const countSpan = document.getElementById('cart-count');
    const totalSpan = document.getElementById('cart-total');

    const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
    countSpan.innerText = totalQty;

    if (cart.length === 0) {
        itemsDiv.innerHTML = `<p style="text-align:center; color:#888; padding-top:20px;">Your cart is empty</p>`;
        totalSpan.innerText = "0.00";
    } else {
        itemsDiv.innerHTML = cart.map((item, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <div style="display:flex; gap:12px; align-items:center;">
                    <img src="${item.image}" onerror="this.src='assets/logo.png'" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
                    <div>
                        <div style="font-weight:700; font-size:0.9rem;">${item.name}</div>
                        <div style="font-size:0.8rem; color:#666;">${item.quantity} x ${parseFloat(item.price).toFixed(2)}</div>
                    </div>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart(${idx})">&times;</button>
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
    if (cart.length > 0) window.location.href = 'checkout.html';
};

document.addEventListener('DOMContentLoaded', initStore);
