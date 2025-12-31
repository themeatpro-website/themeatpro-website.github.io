// 1. GLOBAL STATE
let cart = JSON.parse(localStorage.getItem('meatProCart')) || [];

// 2. LOAD PRODUCTS FROM EXCEL
async function loadProducts() {
    try {
        const response = await fetch('products.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const products = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        renderProducts(products);
        updateCartUI(); // Sync UI with localStorage on page load
    } catch (error) {
        console.error("Error loading Excel file:", error);
        document.getElementById('product-grid').innerHTML = "<p>Error loading products. Please check console.</p>";
    }
}

// 3. RENDER PRODUCTS TO GRID
function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.Image}" alt="${p.Name}" onerror="this.src='https://via.placeholder.com/300x200?text=Meat+Image'">
            <div class="product-info">
                <h3>${p.Name}</h3>
                <p style="color: #777; font-size: 0.9rem;">${p.Description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <span class="price-tag">$${parseFloat(p.Price).toFixed(2)}</span>
                </div>
                <button class="add-btn" onclick="addToCart('${p.Name}', ${p.Price})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// 4. CART LOGIC
function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price: parseFloat(price), quantity: 1 });
    }
    
    saveAndRefresh();
    
    // Optional: Open cart automatically when adding
    document.getElementById('cart-sidebar').classList.add('active');
}

function saveAndRefresh() {
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    // Update Navbar Count
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalQty;

    // Update Sidebar HTML
    cartItems.innerHTML = cart.map((item, index) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center;">
            <div>
                <div style="font-weight:bold;">${item.name}</div>
                <div style="font-size:0.8rem; color:#666;">$${item.price.toFixed(2)} x ${item.quantity}</div>
            </div>
            <button onclick="removeFromCart(${index})" style="background:none; border:none; color:red; cursor:pointer;">✕</button>
        </div>
    `).join('');

    // Update Total
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.innerText = totalAmount.toFixed(2);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveAndRefresh();
}

// 5. NAVIGATION
function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
}

function goToCheckout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    window.location.href = 'checkout.html';
}

// Start the app
loadProducts();
