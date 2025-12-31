let allProducts = [];
let cart = JSON.parse(localStorage.getItem('meatProCart')) || [];

// Initial Load
async function initStore() {
    try {
        const resp = await fetch('products.xlsx');
        const data = await resp.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(data), {type: 'array'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // Column E must be named 'Category'
        allProducts = XLSX.utils.sheet_to_json(sheet);
        updateCartUI();
    } catch (e) {
        console.error("Store Init Error:", e);
    }
}

// Navigation Logic
window.filterByCategory = function(categoryName) {
    document.getElementById('category-section').style.display = 'none';
    document.getElementById('product-header').style.display = 'flex';
    document.getElementById('product-grid').style.display = 'grid';
    document.getElementById('current-category-name').innerText = categoryName;

    const filtered = allProducts.filter(p => 
        p.Category && p.Category.toString().trim().toLowerCase() === categoryName.toLowerCase()
    );
    renderProducts(filtered);
    window.scrollTo(0,0);
};

window.showCategories = function() {
    document.getElementById('category-section').style.display = 'grid';
    document.getElementById('product-header').style.display = 'none';
    document.getElementById('product-grid').style.display = 'none';
};

// Rendering
function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    if (products.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:100px; color:#888;">Coming Soon to this Category!</div>`;
        return;
    }
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.Image}" onerror="this.src='https://via.placeholder.com/400x300?text=Premium+Cut'">
            <div class="product-info">
                <h3>${p.Name}</h3>
                <p>${p.Description}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                    <span class="price-tag">
                        <img src="currency-logo.png" class="currency-icon">
                        ${parseFloat(p.Price).toFixed(2)}
                    </span>
                    <button class="add-btn" onclick="addToCart('${p.Name}', ${p.Price}, '${p.Image}')">Add +</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Cart Logic
window.addToCart = function(name, price, image) {
    const existing = cart.find(item => item.name === name);
    if (existing) { existing.quantity += 1; } 
    else { cart.push({ name, price: parseFloat(price), image, quantity: 1 }); }
    
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    updateCartUI();
    document.getElementById('cart-sidebar').classList.add('active');
};

window.updateCartUI = function() {
    const itemsDiv = document.getElementById('cart-items');
    const countSpan = document.getElementById('cart-count');
    const totalSpan = document.getElementById('cart-total');

    countSpan.innerText = cart.reduce((s, i) => s + i.quantity, 0);
    
    if (cart.length === 0) {
        itemsDiv.innerHTML = '<p style="color:#888; padding:20px;">Your cart is empty.</p>';
        totalSpan.innerText = "0.00";
    } else {
        itemsDiv.innerHTML = cart.map((item, idx) => `
            <div class="cart-item-row" style="display:flex; justify-content:space-between; padding:15px 0; border-bottom:1px solid #eee;">
                <div>
                    <div style="font-weight:700;">${item.name}</div>
                    <div style="font-size:0.85rem; color:#666;">
                        <img src="currency-logo.png" class="currency-icon" style="height:0.7em;">${item.price} x ${item.quantity}
                    </div>
                </div>
                <button onclick="removeFromCart(${idx})" style="color:var(--primary-red); background:none; border:none; cursor:pointer; font-size:1.2rem;">&times;</button>
            </div>
        `).join('');
        const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        totalSpan.innerText = total.toFixed(2);
    }
};

window.removeFromCart = function(idx) {
    cart.splice(idx, 1);
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    updateCartUI();
};

window.toggleCart = function() {
    document.getElementById('cart-sidebar').classList.toggle('active');
};

window.goToCheckout = function() {
    if(cart.length > 0) window.location.href = 'checkout.html';
};

document.addEventListener('DOMContentLoaded', initStore);
