// 1. Initialize Cart
let cart = JSON.parse(localStorage.getItem('meatProCart')) || [];

// 2. Define UI Functions FIRST
window.updateCartUI = function() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (!cartCount || !cartItems || !cartTotal) return;

    // Update Nav Count
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalQty;

    // Update Sidebar
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:10px;">
            <div>
                <div style="font-weight:bold; color: #1a1a1a;">${item.name}</div>
                <div style="font-size:0.85rem; color:#666;">$${item.price.toFixed(2)} x ${item.quantity}</div>
            </div>
            <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#C62828; cursor:pointer; font-size:1.2rem;">&times;</button>
        </div>
    `).join('');

    // Update Total
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.innerText = totalAmount.toFixed(2);
};

// 3. Define Interaction Functions
window.addToCart = function(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price: parseFloat(price), quantity: 1 });
    }
    
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    window.updateCartUI();
    
    // Open cart sidebar automatically
    const sidebar = document.getElementById('cart-sidebar');
    if(sidebar) sidebar.classList.add('active');
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    window.updateCartUI();
};

window.toggleCart = function() {
    console.log("Cart Toggle Clicked"); // Check your browser console (F12) to see if this appears
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    } else {
        console.error("Could not find element with ID 'cart-sidebar'");
    }
};

// 4. Data Loading
async function loadProducts() {
    try {
        const response = await fetch('products.xlsx');
        if (!response.ok) throw new Error("Excel file not found");
        
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const products = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        renderProducts(products);
        window.updateCartUI(); // Initial UI sync
    } catch (error) {
        console.error("The Meat Pro Load Error:", error);
    }
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.Image}" alt="${p.Name}" onerror="this.src='https://via.placeholder.com/400x300?text=Premium+Meat'">
            <div class="product-info">
                <h3>${p.Name}</h3>
                <p>${p.Description}</p>
                <div class="price-row" style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="price-tag">$${parseFloat(p.Price).toFixed(2)}</span>
                    <button class="add-btn" onclick="addToCart('${p.Name}', ${p.Price})" style="width:auto; margin:0; padding: 10px 20px;">Add +</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Start everything
document.addEventListener('DOMContentLoaded', loadProducts);
