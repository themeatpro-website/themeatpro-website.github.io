/**
 * THE MEAT PRO - Core Application Logic
 */

let allProducts = [];
let currentFilteredProducts = [];

// --- 1. STORAGE SYNC ---
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- 2. DATA LOADING & PARSING ---
function parseCSV(text) {
    // Regex explanation: Matches either a quoted string or unquoted text between commas
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
            Category: matches[5],
            Type: matches[6] // RAW or Marinated
        };
    });
}

async function initStore() {
    try {
        // Fetches from your Cloudflare Worker proxy
        const response = await fetch('products.csv');
        const data = await response.text();
        allProducts = parseCSV(data);
        updateCartUI();
        console.log("Store Initialized with", allProducts.length, "products.");
    } catch (e) { 
        console.error("CSV Load Error:", e); 
    }
}

// --- 3. UI NAVIGATION ---
window.filterByCategory = function(category) {
    const banner = document.getElementById('promo-ad-container');
    if (banner) banner.style.display = 'none';

    document.getElementById('category-section').style.display = 'none';
    document.getElementById('product-header').style.display = 'flex';
    
    const grid = document.getElementById('product-grid');
    grid.style.display = 'grid'; 
    
    document.getElementById('current-category-name').innerText = category;
    
    // Logic: Match by Category name OR by the 'Marinated' Type
    currentFilteredProducts = allProducts.filter(p => {
        if (category === 'Marinades') return p.Type === 'Marinated';
        return p.Category.toLowerCase() === category.toLowerCase();
    });
    
    renderProducts(currentFilteredProducts);
    window.scrollTo(0, 0);
};

window.showCategories = function() {
    const banner = document.getElementById('promo-ad-container');
    if (banner) banner.style.display = 'block';

    document.getElementById('category-section').style.display = 'grid';
    document.getElementById('product-header').style.display = 'none';
    document.getElementById('product-grid').style.display = 'none';
};

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    
    if (products.length === 0) {
        grid.style.display = 'block';
        grid.innerHTML = `
            <div style="text-align: center; padding: 80px 20px; color: #888;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🥩</div>
                <h2 style="font-family: 'Roboto', sans-serif; color: #333; letter-spacing: 2px;">COMING SOON</h2>
                <p>Our master butchers are preparing the finest selection. Stay tuned!</p>
                <button class="add-btn" style="background: #C62828; color: white;" onclick="showCategories()">Back to Categories</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="openModal('${p.Name.replace(/'/g, "\\'")}')">
            <div style="position:relative;">
                <img src="${p.Image}" onerror="this.src='assets/logo.png'" style="width:100%; height:220px; object-fit:cover;">
                <span style="position:absolute; top:10px; left:10px; background:rgba(255,255,255,0.9); padding:4px 8px; border-radius:4px; font-size:0.7rem; font-weight:bold; border:1px solid #ddd;">${p.Type}</span>
            </div>
            <div class="product-info" style="padding:20px;">
                <h3 style="margin:0 0 5px 0;">${p.Name}</h3>
                <p style="font-size:0.85rem; color:#666; margin-bottom:15px;">${p.ShortDescription}</p>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="price-tag" style="font-weight:900; color:#C62828;">AED ${parseFloat(p.Price).toFixed(2)}</span>
                    <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.Name.replace(/'/g, "\\'")}', ${p.Price}, '${p.Image}')">Add +</button>
                </div>
            </div>
        </div>
    `).join('');
}

// --- 4. MODAL & CART OPS ---
window.openModal = function(name) {
    const p = allProducts.find(i => i.Name === name);
    if (!p) return;

    const modal = document.getElementById('product-modal');
    modal.innerHTML = `
        <div class="modal-content" style="background:white; max-width:500px; margin:50px auto; padding:30px; border-radius:20px; position:relative; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
            <button onclick="closeModal()" style="position:absolute; right:20px; top:20px; border:none; background:none; font-size:2rem; cursor:pointer;">&times;</button>
            <img src="${p.Image}" onerror="this.src='assets/logo.png'" style="width:100%; height:300px; object-fit:cover; border-radius:15px; margin-bottom:20px;">
            <h2 style="margin-bottom:10px;">${p.Name}</h2>
            <p style="color:#666; line-height:1.6; margin-bottom:20px;">${p.LongDescription}</p>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:1.5rem; font-weight:900; color:#C62828;">AED ${parseFloat(p.Price).toFixed(2)}</span>
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="display:flex; align-items:center; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
                        <button onclick="adjustModalQty(-1)" style="padding:10px 15px; border:none; background:#f9f9f9; cursor:pointer;">-</button>
                        <input type="number" id="modal-qty-input" value="1" readonly style="width:40px; text-align:center; border:none; font-weight:bold;">
                        <button onclick="adjustModalQty(1)" style="padding:10px 15px; border:none; background:#f9f9f9; cursor:pointer;">+</button>
                    </div>
                    <button class="add-btn" id="modal-add-btn" style="padding:12px 20px;">Add to Cart</button>
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

window.addToCart = function(name, price, image, qty = 1) {
    const existing = cart.find(i => i.name === name);
    if(existing) {
        existing.quantity += qty;
    } else {
        cart.push({ name, price: parseFloat(price), image, quantity: qty });
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
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <div style="display:flex; gap:12px; align-items:center;">
                    <img src="${item.image}" onerror="this.src='assets/logo.png'" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
                    <div>
                        <div style="font-weight:700; font-size:0.85rem;">${item.name}</div>
                        <div style="font-size:0.75rem; color:#C62828; font-weight:bold;">${item.quantity} x AED ${item.price.toFixed(2)}</div>
                    </div>
                </div>
                <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:#ccc; cursor:pointer; font-size:1.5rem;">&times;</button>
            </div>
        `).join('');

        const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        if (cart.length > 0) {
            itemsDiv.innerHTML += `
                <div style="background: #FFF9C4; border: 1px dashed #FBC02D; border-radius: 8px; padding: 12px; margin-top: 20px; text-align: center;">
                    <span style="font-size: 0.85rem; color: #827717; font-weight: bold;">
                        🌟 Potential Earnings: ${Math.floor(subtotal)} Points
                    </span>
                </div>
            `;
        }
    }

    if (totalSpan) {
        totalSpan.innerText = cart.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2);
    }
};

window.toggleCart = function() { 
    document.getElementById('cart-sidebar').classList.toggle('active'); 
};

// Start the engine
document.addEventListener('DOMContentLoaded', initStore);
