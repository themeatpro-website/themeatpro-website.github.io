/**
 * THE MEAT PRO - Core Application Logic
 */

let allProducts = [];
let currentFilteredProducts = [];

// --- 1. STORAGE SYNC & MIGRATION ---
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
    
    const grid = document.getElementById('product-grid');
    grid.style.display = 'grid'; 
    
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
    
    if (products.length === 0) {
        grid.style.display = 'block';
        grid.innerHTML = `
            <div style="text-align: center; padding: 80px 20px; color: #888; grid-column: 1 / -1;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🥩</div>
                <h2 style="font-family: 'Roboto', sans-serif; color: #333; letter-spacing: 2px;">COMING SOON</h2>
                <p style="font-size: 1.1rem; margin-bottom: 30px; max-width: 400px; margin-left: auto; margin-right: auto;">
                    Our master butchers are currently preparing the finest selection for this category. Stay tuned!
                </p>
                <button class="add-btn" style="background: #C62828; color: white; padding: 12px 25px;" onclick="showCategories()">
                    Explore Other Categories
                </button>
            </div>
        `;
        return;
    }

    grid.style.display = 'grid'; 
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="openModal('${p.Name.replace(/'/g, "\\'")}')">
            <img src="${p.Image}" onerror="this.src='assets/logo.png'" style="width:100%; height:220px; object-fit:cover;">
            <div class="product-info" style="padding:20px;">
                <h3 style="margin:0 0 5px 0;">${p.Name}</h3>
                <p style="font-size:0.85rem; color:#666; margin-bottom:15px;">${p.ShortDescription}</p>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="price-tag">
                        AED ${parseFloat(p.Price).toFixed(2)}
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

    const modal = document.getElementById('product-modal');
    modal.innerHTML = `
        <div class="modal-content" style="background:white; max-width:500px; margin:50px auto; padding:30px; border-radius:20px; position:relative;">
            <button onclick="closeModal()" style="position:absolute; right:20px; top:20px; border:none; background:none; font-size:2rem; cursor:pointer;">&times;</button>
            <img id="modal-img" src="${p.Image}" onerror="this.src='assets/logo.png'" style="width:100%; height:300px; object-fit:cover; border-radius:15px; margin-bottom:20px;">
            <h2 id="modal-name">${p.Name}</h2>
            <p id="modal-long-desc" style="color:#666; line-height:1.6;">${p.LongDescription}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:25px;">
                <span style="font-size:1.5rem; font-weight:900; color:#C62828;">AED <span id="modal-price-val">${parseFloat(p.Price).toFixed(2)}</span></span>
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="display:flex; align-items:center; border:1px solid #ddd; border-radius:8px;">
                        <button onclick="adjustModalQty(-1)" style="padding:10px 15px; border:none; background:none; cursor:pointer;">-</button>
                        <input type="number" id="modal-qty-input" value="1" readonly style="width:40px; text-align:center; border:none; padding:0; font-weight:bold;">
                        <button onclick="adjustModalQty(1)" style="padding:10px 15px; border:none; background:none; cursor:pointer;">+</button>
                    </div>
                    <button class="add-btn" id="modal-add-btn">Add to Cart</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-add-btn').onclick = () => {
        const qty = parseInt(document.getElementById('modal-qty-input').value);
        addToCart(p.Name, p.Price, p.Image, qty);
        closeModal();
    };
    
    modal.classList.add('active');
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
                <button class="remove-item-btn" style="background:none; border:none; color:#999; cursor:pointer; font-size:1.2rem;" onclick="removeFromCart(${idx})">&times;</button>
            </div>
        `).join('');

        // --- ADDED: Points Preview Logic ---
        const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        const earnablePoints = Math.floor(subtotal);
        
        if (cart.length > 0) {
            itemsDiv.innerHTML += `
                <div style="background: #fffdf0; border: 1px solid #FFD700; border-radius: 8px; padding: 10px; margin-top: 20px; text-align: center;">
                    <span style="font-size: 0.8rem; color: #b8860b; font-weight: bold;">
                        🌟 You'll earn ${earnablePoints} points!
                    </span>
                </div>
            `;
        }
    }

    if (totalSpan) {
        const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        totalSpan.innerText = total.toFixed(2);
    }
};

window.toggleCart = function() { 
    document.getElementById('cart-sidebar').classList.toggle('active'); 
};

document.addEventListener('DOMContentLoaded', initStore);
