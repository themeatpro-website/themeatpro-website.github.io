let cart = JSON.parse(localStorage.getItem('meatProCart')) || [];

window.toggleCart = function() {
    document.getElementById('cart-sidebar').classList.toggle('active');
};

window.updateCartUI = function() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    cartCount.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
        cartTotal.innerText = "0.00";
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <div>
                    <strong>${item.name}</strong><br>
                    <small><img src="currency-logo.png" class="currency-icon" style="height:0.7em;">${item.price} x ${item.quantity}</small>
                </div>
                <button onclick="removeFromCart(${index})" style="color:red; background:none; border:none; cursor:pointer;">&times;</button>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.innerText = total.toFixed(2);
    }
};

window.addToCart = function(name, price, image) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price: parseFloat(price), image: image, quantity: 1 });
    }
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    updateCartUI();
    document.getElementById('cart-sidebar').classList.add('active');
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('meatProCart', JSON.stringify(cart));
    updateCartUI();
};

window.goToCheckout = function() {
    if (cart.length > 0) window.location.href = 'checkout.html';
};

async function loadProducts() {
    try {
        const resp = await fetch('products.xlsx');
        const data = await resp.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(data), {type: 'array'});
        const products = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        document.getElementById('product-grid').innerHTML = products.map(p => `
            <div class="product-card">
                <img src="${p.Image}" style="width:100%; height:200px; object-fit:cover;">
                <div class="product-info">
                    <h3>${p.Name}</h3>
                    <p>${p.Description}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                        <span class="price-tag"><img src="currency-logo.png" class="currency-icon">${parseFloat(p.Price).toFixed(2)}</span>
                        <button class="add-btn" onclick="addToCart('${p.Name}', ${p.Price}, '${p.Image}')">Add +</button>
                    </div>
                </div>
            </div>
        `).join('');
        updateCartUI();
    } catch (e) { console.error("Excel Load Error", e); }
}

document.addEventListener('DOMContentLoaded', loadProducts);
