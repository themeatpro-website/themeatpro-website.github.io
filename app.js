let cart = [];

// Load Excel Data
async function loadProducts() {
    const response = await fetch('products.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Assume products are in the first sheet
    const sheetName = workbook.SheetNames[0];
    const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    renderProducts(json);
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.Image}" alt="${p.Name}">
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

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
}
function goToCheckout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    // Save the cart to local storage so checkout.html can read it
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

// Update your addToCart function to also save to localStorage for persistence
function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    updateCartUI();
}

// Initial Load
loadProducts();
