let allProducts = [];
let currentFilteredProducts = [];
let cart = JSON.parse(localStorage.getItem('meatProCart')) || [];

function parseCSV(text) {
    const regex = /(".*?"|[^",\n]+)(?=\s*,|\s*\n|$)/g;
    const rows = text.split('\n').filter(row => row.trim() !== '');
    return rows.slice(1).map(row => {
        const matches = row.match(regex).map(val => val.replace(/^"|"$/g, "").trim());
        return { Name: matches[0], Price: matches[1], ShortDescription: matches[2], LongDescription: matches[3], Image: matches[4], Category: matches[5] };
    });
}

async function initStore() {
    try {
        const response = await fetch('products.csv');
        const data = await response.text();
        allProducts = parseCSV(data);
        updateCartUI();
    } catch (e) { console.error(e); }
}

window.filterByCategory = function(category) {
    document.getElementById('category-section').style.display = 'none';
    document.getElementById('product-header').style.display = 'flex';
    document.getElementById('product-grid').style.display = 'grid';
    document.getElementById('current-category-name').innerText = category;
    currentFilteredProducts = allProducts.filter(p => p.Category.toLowerCase() === category.toLowerCase());
    renderProducts(currentFilteredProducts);
};

window.showCategories = function() {
    document.getElementById('category-section').style.display = 'grid';
    document.getElementById('product-header').style.display = 'none';
    document.getElementById('product-grid').style.display = 'none';
};

window.handleSearch = function() {
    const term = document.getElementById('product-search').value.toLowerCase();
    const searched = currentFilteredProducts.filter(p => p.Name.toLowerCase().includes(term));
    renderProducts(searched);
};

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="openModal('${p.Name.replace(/'/g, "\\'")}')">
            <img src="${p.Image}" style="width:100%; height:200px; object-fit:cover;">
            <div class="product-info">
                <h3>${p.Name}</h3>
                <p>${p.ShortDescription}</p>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="price-tag">${parseFloat(p.Price).toFixed(2)}</span>
                    <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.Name.replace(/'/g, "\\'")}', ${p.Price}, '${p.Image}')">Add +</button>
                </div>
            </div>
        </div>
    `).join('');
}

window.openModal = function(name) {
    const p = allProducts.find(i => i.Name === name);
    document.getElementById('modal-img').src = p.Image;
    document.getElementById('modal-name').innerText = p.Name;
    document.getElementById('modal-price-val').innerText = parseFloat(p.Price).toFixed(2);
    document.getElementById('modal-long-desc').innerText = p.LongDescription;
    document.getElementById('modal-qty-input').value = 1;
    document.getElementById('modal-add-btn').onclick = () => {
        addToCart(p.Name, p.Price, p.Image, parseInt(document.getElementById('modal-qty-input').value));
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

window.addToCart = function(name, price, image, qty = 1) {
    const existing = cart.find(i => i.name === name);
    if(existing) existing.quantity += qty;
    else cart.push({ name, price: parseFloat(price), image, quantity: qty });
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
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.quantity, 0);
    itemsDiv.innerHTML = cart.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <div style="display:flex; gap:10px; align-items:center;">
                <img src="${item.image}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
                <div><b>${item.name}</b><br><small>${item.quantity} x ${item.price}</small></div>
            </div>
            <button class="remove-item-btn" onclick="removeFromCart(${idx})">&times;</button>
        </div>
    `).join('');
    document.getElementById('cart-total').innerText = cart.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2);
};

window.toggleCart = function() { document.getElementById('cart-sidebar').classList.toggle('active'); };
window.goToCheckout = function() { if(cart.length > 0) window.location.href = 'checkout.html'; };

document.addEventListener('DOMContentLoaded', initStore);
