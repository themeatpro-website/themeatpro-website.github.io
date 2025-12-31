// 1. GLOBAL STATE
let cart = JSON.parse(localStorage.getItem('meatProCart')) || [];

// 2. DEFINE UI UPDATE FUNCTION FIRST (Prevents "Not Defined" Error)
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (!cartCount || !cartItems || !cartTotal) return;

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalQty;

    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item" style="display:flex; justify-content:space-between; margin-bottom:15px;">
            <div>
                <div style="font-weight:bold;">${item.name}</div>
                <div style="font-size:0.8rem; color:#666;">$${item.price.toFixed(2)} x ${item.quantity}</div>
            </div>
            <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#C62828; cursor:pointer; font-weight:bold;">✕</button>
        </div>
    `).join('');

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.innerText = totalAmount.toFixed(2);
}

// 3. CART ACTIONS
window.addToCart = function(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price: parseFloat(price), quantity: 1 });
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

window.toggleCart = function() {
    const sidebar = document.getElementById('cart-sidebar');
    sidebar.classList.toggle('active');
};

window.goToCheckout = function() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    window.location.href = 'checkout.html';
};

// 4. LOAD PRODUCTS FROM EXCEL
async function loadProducts() {
    try {
        const response = await fetch('products.xlsx');
        if (!response.ok) throw new Error("Excel file not found");
        
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const products = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        renderProducts(products);
        updateCartUI();
    } catch (error) {
        console.error("Setup Error:", error);
    }
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.Image}" alt="${p.Name}" onerror="this.src='https://via.placeholder.com/300x200?text=Meat+Pro'">
            <div class="product-info">
                <h3>${p.Name}</h3>
                <p style="color: #777; font-size: 0.85rem; height: 40px; overflow: hidden;">${p.Description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <span class="price-tag">$${parseFloat(p.Price).toFixed(2)}</span>
                    <button class="add-btn" onclick="addToCart('${p.Name}', ${p.Price})" style="width: auto; padding: 8px 15px; margin: 0;">Add +</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Start
document.addEventListener('DOMContentLoaded', loadProducts);
