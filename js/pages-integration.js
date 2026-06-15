
// Global Toast Notification System
window.showToast = function(message, type = 'ok') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const bgColor = type === 'err' ? '#e63946' : '#2ecc71';
    toast.style.cssText = `background:${bgColor}; color:white; padding:14px 24px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.2); opacity:0; transform:translateY(20px); transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); font-weight:700; font-family:var(--font-body); letter-spacing:0.5px; pointer-events:auto;`;
    toast.innerHTML = type === 'err' ? '⚠️ ' + message : '✓ ' + message;
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Animate out
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px) scale(0.95)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};



// Product Details Rendering Logic
window.renderProductDetails = async function(productId) {
    if (!window.Database) return;
    
    const product = await window.Database.getProductById(productId);
    if (!product) {
        window.location.hash = '#/products';
        return;
    }

    const imgEl = document.getElementById('pd-img');
    const catEl = document.getElementById('pd-category');
    const titleEl = document.getElementById('pd-title');
    const priceEl = document.getElementById('pd-price');
    const qtyEl = document.getElementById('pd-qty');
    const minusBtn = document.getElementById('pd-btn-minus');
    const plusBtn = document.getElementById('pd-btn-plus');
    const addBtn = document.getElementById('pd-add-to-cart');

    if (!imgEl) return; // Not injected properly yet

    imgEl.src = product.imageUrl || 'images/logo.png';
    catEl.textContent = product.category;
    titleEl.textContent = product.name;
    priceEl.textContent = '₹' + Number(product.price).toFixed(2);
    
    let currentQty = 1;
    qtyEl.textContent = currentQty;

    // Remove old listeners to prevent duplicates
    const newMinus = minusBtn.cloneNode(true);
    const newPlus = plusBtn.cloneNode(true);
    const newAdd = addBtn.cloneNode(true);
    
    minusBtn.parentNode.replaceChild(newMinus, minusBtn);
    plusBtn.parentNode.replaceChild(newPlus, plusBtn);
    addBtn.parentNode.replaceChild(newAdd, addBtn);

    newMinus.addEventListener('click', () => {
        if (currentQty > 1) {
            currentQty--;
            qtyEl.textContent = currentQty;
        }
    });

    newPlus.addEventListener('click', () => {
        currentQty++;
        qtyEl.textContent = currentQty;
    });

    newAdd.addEventListener('click', (e) => {
        if (window.Store) {
            window.Store.addToCart({
                productId: product.id,
                variantId: product.id,
                name: product.name,
                price: Number(product.price) || 0,
                qty: currentQty,
                imageUrl: product.imageUrl || 'images/logo.png',
                category: product.category
            });
            window.showToast(currentQty + 'x ' + product.name + ' added to cart!');
            
            e.target.style.transform = 'scale(0.95)';
            setTimeout(() => e.target.style.transform = '', 150);
        }
    });
};




// ── Shop Page ─────────────────────────────────────────────
(function shopPage() {
        const getGrid = () => document.getElementById('shop-grid');
        const getSearch = () => document.getElementById('shop-search');
        const getFilterContainer = () => document.getElementById('category-filters');

        let allProducts = [];
        let currentCat = 'all';
        let searchQuery = '';
        let setupDone = false;

        function render() {
            const grid = getGrid();
            if (!grid) return;
            const filtered = allProducts.filter(p => {
                const matchesCat = currentCat === 'all' || p.category === currentCat;
                const pName = (p.name || '').toLowerCase();
                const pDesc = (p.description || '').toLowerCase();
                const matchesSearch = pName.includes(searchQuery) || pDesc.includes(searchQuery);
                return matchesCat && matchesSearch;
            });

            if (filtered.length === 0) {
                grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:5rem; opacity:0.5;">No products found.</div>';
                return;
            }

            let html = '';
            filtered.forEach((p, i) => {
                const soonBadge = p.isComingSoon ? '<span class="p-badge" style="background:#facc15; color:#000;">Soon</span>' : '';
                const featBadge = p.isFeatured ? '<span class="p-badge" style="right:auto; left:1.2rem;">Featured</span>' : '';
                const price = Number(p.price).toFixed(2);
                
                html += '<div class="p-card">'
                     + '<a href="#/product/' + p.id + '" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; height:100%;">'
                     + '<div class="p-img-wrap">'
                     + soonBadge + featBadge
                     + '<img src="' + p.imageUrl + '" class="p-img" alt="' + p.name + '" onerror="this.src=\'images/logo.png\';">'
                     + '</div>'
                     + '<div class="p-body">'
                     + '<span class="p-cat">' + p.category + '</span>'
                     + '<h3 class="p-name">' + p.name + '</h3>'
                     + '<div class="p-price">\u20B9' + price + '</div>'
                     + '</div>'
                     + '</a>'
                     + '<div class="p-overlay">'
                     + '<button class="add-btn" onclick="addToCart(event, \'' + p.id + '\')">'
                     + (p.isComingSoon ? 'Notify Me' : 'Add to Cart')
                     + '</button>'
                     + '</div>'
                     + '</div>';
            });
            grid.innerHTML = html;
        }

        async function initShop() {
            if (!window.Database) return;

            const grid = getGrid();
            if (grid) grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:5rem; opacity:0.5;">Loading flavors...</div>';

            allProducts = await window.Database.getProducts();
            render();

            if (!setupDone) {
                setupDone = true;
                const searchInp = getSearch();
                if (searchInp) {
                    searchInp.addEventListener('input', (e) => {
                        searchQuery = e.target.value.toLowerCase();
                        render();
                    });
                }

                const filterContainer = getFilterContainer();
                if (filterContainer) {
                    const chips = filterContainer.querySelectorAll('.chip');
                    chips.forEach(chip => {
                        chip.addEventListener('click', () => {
                            chips.forEach(c => c.classList.remove('active'));
                            chip.classList.add('active');
                            currentCat = chip.dataset.cat;
                            render();
                        });
                    });
                }
            }
        }

        // Global helper for add to cart
        window.addToCart = (e, id) => {
            const p = allProducts.find(x => x.id === id);
            if (!p) return;

            if (p.isComingSoon) {
                if (window.showToast) window.showToast('We will notify you when back in stock!', 'ok');
                return;
            }

            if (window.Store) {
                window.Store.addToCart({
                    productId: p.id,
                    variantId: p.id,
                    name: p.name,
                    price: Number(p.price) || 0,
                    qty: 1,
                    imageUrl: p.imageUrl || 'images/logo.png',
                    category: p.category
                });
                if (window.showToast) window.showToast(p.name + ' added to cart!');

                const btn = e.currentTarget || e.target;
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => btn.style.transform = '', 150);
            }
        };

        // Expose globally for router
        window.initShopPage = initShop;

        // Run after DOM is fully ready so the grid is accessible
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initShop);
        } else {
            initShop();
        }
    })();


(function cartPage() {
    var root  = document.getElementById('cart-root');
    var Store = window.Store;
    if (!root) return;

    function getCart() {
        return Store ? Store.getState().cart : [];
    }

    function render() {
        var cart = getCart();
        // empty cart check removed

        var totals   = Store.getCartTotals();
        var subtotal = totals.subtotal;
        var delivery = totals.delivery;
        var total    = totals.total;

        var itemsHtml = cart.map(function(item, idx) {
            var img = item.imageUrl || 'images/logo.png';
            return '<div class="cart-item" data-idx="' + idx + '">'
                 + '<div class="cart-item__img"><img src="' + img + '" alt="' + item.name + '"></div>'
                 + '<div class="cart-item__info">'
                 + '<span class="cat">' + (item.category || 'JustCook') + '</span>'
                 + '<h3>' + item.name + '</h3>'
                 + '<div class="cart-item__price">₹' + (Number(item.price) * Number(item.qty)).toFixed(2) + '</div>'
                 + '</div>'
                 + '<div class="cart-item__controls">'
                 + '<div class="qty-row">'
                 + '<button class="cqty-btn" data-action="minus" data-idx="' + idx + '">−</button>'
                 + '<span class="cqty-num">' + item.qty + '</span>'
                 + '<button class="cqty-btn" data-action="plus" data-idx="' + idx + '">+</button>'
                 + '</div>'
                 + '<button class="remove-btn" data-action="remove" data-idx="' + idx + '">🗑 Remove</button>'
                 + '</div>'
                 + '</div>';
        }).join('');

        var freeShipNote = '<div style="color:#16a34a;font-size:0.85rem;font-weight:600;margin-top:0.5rem;">🎉 Free delivery on all orders!</div>';

        root.innerHTML =
            '<h1 class="cart-title">Your Cart (' + cart.length + ' item' + (cart.length !== 1 ? 's' : '') + ')</h1>'
          + '<div class="cart-layout">'
          + '<div class="cart-items">' + itemsHtml + '</div>'
          + '<div class="cart-summary">'
          + '<h2>Order Summary</h2>'
          + '<div class="summary-row"><span>Subtotal</span><span>₹' + subtotal.toFixed(2) + '</span></div>'
          + '<div class="summary-row"><span>Delivery Charge</span><span>₹' + delivery.toFixed(2) + '</span></div>'
          + '<div class="summary-row total"><span>Total</span><span>₹' + total.toFixed(2) + '</span></div>'
          + '<button class="btn-checkout" id="go-checkout">Proceed to Checkout →</button>'
          + '<button onclick="window.location.hash=\'#/products\'" style="display:block;width:100%;margin-top:1rem;background:none;border:none;opacity:0.6;font-size:0.9rem;cursor:pointer;font-family:inherit;font-weight:600;">← Continue Shopping</button>'
          + '</div>'
          + '</div>';

        // Event delegation
        root.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) {
                if (e.target.id === 'go-checkout') {
                    window.location.hash = '#/checkout';
                }
                return;
            }
            var action = btn.dataset.action;
            var idx    = parseInt(btn.dataset.idx);
            var cart2  = Store.getState().cart;
            var item   = cart2[idx];
            if (!item) return;

            if (action === 'plus') {
                Store.addToCart({ productId: item.productId, variantId: item.variantId, qty: 1, price: item.price, name: item.name, variantName: item.variantName, imageUrl: item.imageUrl });
            } else if (action === 'minus') {
                if (item.qty > 1) {
                    var updated = Store.getState().cart.map(function(c, i) {
                        if (i === idx) return Object.assign({}, c, { qty: c.qty - 1 });
                        return c;
                    });
                    Store.setState({ cart: updated });
                    Store.saveCart();
                    Store.updateCartBadge();
                } else {
                    Store.removeFromCart(item.productId, item.variantId);
                }
            } else if (action === 'remove') {
                Store.removeFromCart(item.productId, item.variantId);
            }
            render();
        });
    }

    render();

    if (window.gsap) {
        gsap.from('.cart-item', { y:30, opacity:0, duration:0.5, stagger:0.1, ease:'power2.out' });
    }
})();


// From pages/checkout.html

        (function checkoutFlow() {
            const root = document.getElementById('co-root');
            const Store = window.Store;
            const DB = window.Database;

            if (!Store) return;

            // ── Authentication Check ────────────────────────────────────
            // Removed to allow guest checkout
            // const currentUser = Store.getState().user;
            // if (!currentUser) {
            //     document.getElementById('auth-requirement-screen').style.display = 'block';
            //     document.getElementById('checkout-main-content').style.display = 'none';
            //     return;
            // }

            // ── Get cart & normalize ALL data upfront ─────────────────
            const rawCart = Store.getState().cart || [];

            // Safety normalize: force price/qty to numbers
            const safeCart = rawCart.map(i => ({
                productId: i.productId || i.id || '',
                variantId: i.variantId || i.id || '',
                name: i.name || 'Product',
                price: Number(i.price) || 0,
                qty: Number(i.qty) || 1,
                imageUrl: i.imageUrl || 'images/logo.png',
                category: i.category || ''
            }));

            // empty checkout check removed

            // Pre-fill from active user or saved customer
            try {
                const currentUser = Store.getState().user;
                const saved = DB ? DB.getSavedCustomer() : null;

                if (currentUser) {
                    document.getElementById('co-name').value = currentUser.name || '';
                    document.getElementById('co-email-input').value = currentUser.email || '';
                } else if (saved) {
                    if (saved.name) document.getElementById('co-name').value = saved.name;
                    if (saved.email) document.getElementById('co-email-input').value = saved.email;
                    if (saved.phone) document.getElementById('co-phone').value = saved.phone;
                    if (saved.address) document.getElementById('co-address').value = saved.address;
                    if (saved.city) document.getElementById('co-city').value = saved.city;
                    if (saved.pincode) document.getElementById('co-pin').value = saved.pincode;
                }
            } catch (e) { }

            // ── Summary ───────────────────────────────────────────────
            const totals = Store.getCartTotals();
            const subtotal = totals.subtotal;
            const delivery = totals.delivery;
            const total = totals.total;

            document.getElementById('co-subtotal').textContent = '₹' + subtotal.toFixed(2);
            document.getElementById('co-total').textContent = '₹' + total.toFixed(2);

            // Update Delivery text in sidebar
            const deliveryEl = document.getElementById('co-shipping');
            if (deliveryEl) {
                deliveryEl.textContent = '₹' + delivery.toFixed(2);
            }

            let summaryHtml = '';
            safeCart.forEach(i => {
                summaryHtml += '<div class="co-sum-item">'
                    + '<img class="co-sum-img" src="' + i.imageUrl + '" alt="' + i.name + '" onerror="this.src=\'images/logo.png\'">'
                    + '<div class="co-sum-info"><b>' + i.name + '</b><p>' + i.qty + ' × ₹' + i.price.toFixed(2) + '</p></div>'
                    + '<span class="co-sum-price">₹' + (i.price * i.qty).toFixed(2) + '</span>'
                    + '</div>';
            });
            document.getElementById('co-summary-items').innerHTML = summaryHtml;

            // Step logic
            function goStep(n) {
                const panels = document.querySelectorAll('.co-panel');
                const items = document.querySelectorAll('.co-step-item');
                const next = document.getElementById('cp' + n);

                if (window.gsap) {
                    const current = document.querySelector('.co-panel.active');

                    gsap.to(current, {
                        opacity: 0,
                        x: -50,
                        scale: 0.95,
                        duration: 0.4,
                        ease: 'power2.in',
                        onComplete: () => {
                            panels.forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
                            next.style.display = 'block';
                            next.classList.add('active');
                            gsap.fromTo(next,
                                { opacity: 0, x: 50, scale: 1.05 },
                                { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: 'power3.out' }
                            );
                        }
                    });
                } else {
                    panels.forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
                    next.style.display = 'block';
                    next.classList.add('active');
                }

                items.forEach((item, i) => {
                    item.classList.remove('active', 'done');
                    if (i + 1 < n) item.classList.add('done');
                    else if (i + 1 === n) item.classList.add('active');
                });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Nav
            document.getElementById('btn-next-1').addEventListener('click', () => {
                const name = document.getElementById('co-name').value.trim();
                const email = document.getElementById('co-email-input').value.trim();
                const phone = document.getElementById('co-phone').value.trim();

                if (!name) return alert('Please enter your Full Name.');
                if (!email || !email.includes('@')) return alert('Please enter a valid Email Address.');
                if (phone.length < 10) return alert('Please enter a valid 10-digit Mobile Number.');

                goStep(2);
            });

            document.getElementById('btn-back-1').addEventListener('click', () => goStep(1));

            document.getElementById('btn-next-2').addEventListener('click', () => {
                const addr = document.getElementById('co-address').value.trim();
                const city = document.getElementById('co-city').value.trim();
                const pin = document.getElementById('co-pin').value.trim();

                if (!addr) return alert('Please enter your Shipping Address.');
                if (!city) return alert('Please enter your City.');
                if (pin.length < 6) return alert('Please enter a valid 6-digit PIN Code.');

                goStep(3);
                setupUpi();
            });

            document.getElementById('btn-back-2').addEventListener('click', () => goStep(2));

            // ── Razorpay Integration ──────────────────────────────────────
            window.initRazorpay = (preferredMethod) => {
                const totals = Store.getCartTotals();
                const amountInPaise = Math.round(totals.total * 100);
                const customer = getCustomer();

                const btn1 = document.getElementById('btn-place-order');
                const btn2 = document.getElementById('btn-card-order');
                
                if (btn1) btn1.disabled = true;
                if (btn2) { btn2.disabled = true; btn2.innerHTML = 'Processing...'; }
                if (btn1 && !preferredMethod) btn1.innerHTML = 'Processing...';

                function resetButtons() {
                    if (btn1) { btn1.disabled = false; btn1.innerHTML = '📱 Pay with UPI or Netbanking'; }
                    if (btn2) { btn2.disabled = false; btn2.innerHTML = '💳 Pay with Credit / Debit Card'; }
                }

                // Client-Side Razorpay Checkout (Without Order API)
                const options = {
                    "key": "rzp_live_SvYy46yyInMuhO", // Live key provided by user
                    "amount": amountInPaise,
                    "currency": "INR",
                    "name": "JustCook",
                    "description": "Flavor Revolution Order",
                    "image": "images/logo.png",
                    "handler": function (response) {
                        // Success callback
                        if (window.showToast) window.showToast('Payment Successful!', 'ok');
                        finalizeOrder(response.razorpay_payment_id, 'Razorpay (Card/UPI)', totals.total);
                    },
                    "prefill": {
                        "name": customer.name,
                        "email": customer.email,
                        "contact": customer.phone
                    },
                    "theme": {
                        "color": "#E63946" // JustCook Primary Color
                    },
                    "modal": {
                        "ondismiss": function() {
                            resetButtons();
                            if (window.showToast) window.showToast('Payment window closed.', 'err');
                        }
                    }
                };
                
                // If the user clicked the specific Card button, open directly to Card tab
                if (preferredMethod) {
                    options.prefill.method = preferredMethod;
                }

                try {
                    const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', function (response){
                        resetButtons();
                        alert('Payment Failed: ' + response.error.description);
                    });
                    rzp.open();
                } catch (e) {
                    resetButtons();
                    alert('Razorpay SDK failed to load. Please check your internet connection or ensure you placed the script tag.');
                    console.error(e);
                }
            };

            window.setupUpi = () => {
                // Initialize display on step 3 for Razorpay
                const totals = Store.getCartTotals();
                const amtDisplay = document.getElementById('rzp-amount-display');
                if (amtDisplay) amtDisplay.textContent = '₹' + totals.total.toFixed(2);
            };

            function getCustomer() {
                return {
                    name: document.getElementById('co-name').value,
                    phone: document.getElementById('co-phone').value,
                    email: document.getElementById('co-email-input').value,
                    address: document.getElementById('co-address').value,
                    city: document.getElementById('co-city').value,
                    state: 'Tamil Nadu',
                    pincode: document.getElementById('co-pin').value
                };
            }

            function finalizeOrder(paymentId, method, paidTotal) {
                const customer = getCustomer();
                DB.placeOrder({
                    customer,
                    items: safeCart,
                    total: paidTotal || totals.total,
                    paymentMethod: method,
                    paymentId: paymentId
                }).then(res => {
                    if (res.success) {
                        // Send Email Notification via EmailJS
                        if (window.emailjs) {
                            // Format the list of items for the email body
                            const itemsList = safeCart.map(item => `- ${item.name} (Qty: ${item.qty})`).join('
');

                            const templateParams = {
                                customer_name: customer.name,
                                customer_phone: customer.phone,
                                customer_email: customer.email,
                                customer_address: `${customer.address}, ${customer.city}, ${customer.pincode}`,
                                order_id: res.orderId,
                                payment_id: paymentId || 'N/A',
                                total_amount: paidTotal || totals.total,
                                order_items: itemsList
                            };
                            emailjs.send('service_pt20bl6', 'template_2g3iulj', templateParams)
                                .then(function(response) {
                                   console.log('Email sent SUCCESS!', response.status, response.text);
                                }, function(error) {
                                   console.log('Email FAILED...', error);
                                });
                        }

                        Store.clearCart();
                        showSuccess(res.orderId, customer.name);
                    } else {
                        // Reset processing buttons if there's an error
                        const btn1 = document.getElementById('btn-place-order');
                        const btn2 = document.getElementById('btn-card-order');
                        if (btn1) { btn1.disabled = false; btn1.innerHTML = '📱 Pay with UPI or Netbanking'; }
                        if (btn2) { btn2.disabled = false; btn2.innerHTML = '💳 Pay with Credit / Debit Card'; }
                        
                        alert('Payment was successful, but there was an error placing your order: ' + (res.error || 'Unknown error. Please contact support.'));
                    }
                }).catch(err => {
                    // Reset processing buttons if there's an exception
                    const btn1 = document.getElementById('btn-place-order');
                    const btn2 = document.getElementById('btn-card-order');
                    if (btn1) { btn1.disabled = false; btn1.innerHTML = '📱 Pay with UPI or Netbanking'; }
                    if (btn2) { btn2.disabled = false; btn2.innerHTML = '💳 Pay with Credit / Debit Card'; }

                    alert('Payment was successful, but there was an error communicating with the server: ' + err.message + '. Please contact support.');
                    console.error("finalizeOrder error:", err);
                });
            }

            function showSuccess(id, name) {
                root.innerHTML = '<div class="co-success-card" >'
                    + '<div class="success-icon-wrap">✓</div>'
                    + '<h1 class="jc-big-title">Flavor Revolution Started! 🚀</h1>'
                    + '<p style="font-size:1.2rem; opacity:0.6; margin-bottom:2rem;">Thank you <b>' + name + '</b>! Your order <b>#' + id + '</b> is being prepared with love.</p>'
                    + '<div style="display:flex; gap:1.5rem; justify-content:center; flex-wrap:wrap;">'
                    + '<a href="https://wa.me/919840462831?text=Hi, I just paid for Order %23' + id + '. Please verify my address." target="_blank" class="btn" style="background:#25d366; color:white;">Verify Address on WhatsApp</a>'
                    + '<a href="#/" class="btn btn-secondary">Back to Home</a>'
                    + '</div>'
                    + '</div>';
            }

            // GSAP initialization
            if (window.gsap) {
                gsap.from('.co-blob', { opacity: 0, scale: 0.2, duration: 2.5, stagger: 0.4, ease: 'power2.out' });
                gsap.from('.co-card', { opacity: 0, y: 100, duration: 1, delay: 0.3, ease: 'power4.out' });
            }
        })();
    

// From pages/admin.html

(function realTimeAdmin() {
    let _unsub = null;
    let _orders = [];

    // Start live sync automatically since login is removed
    initLiveSync();

    // ── Live Firestore Sync ──────────────────────────────
    function initLiveSync() {
        if (_unsub) return;
        const DB = window.Database;
        if (!DB) return;

        _unsub = DB.subscribeToOrders(orders => {
            _orders = orders;
            updateStats(orders);
            renderSheet(orders);
            renderMonitor(orders);
        });
    }

    function updateStats(orders) {
        let rev = 0;
        let custs = new Set();
        orders.forEach(o => {
            rev += (o.total || 0);
            if (o.customer?.phone) custs.add(o.customer.phone);
        });

        document.getElementById('kRevenue').textContent = '₹' + Math.round(rev).toLocaleString('en-IN');
        document.getElementById('kOrders').textContent = orders.length;
        document.getElementById('kCust').textContent = custs.size;
    }

    function renderMonitor(orders) {
        const grid = document.getElementById('monitorGrid');
        // Only show pending/active orders in monitor
        const active = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').slice(0, 12);
        
        if (active.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:4rem; opacity:0.4;">No active orders right now.</div>';
            return;
        }

        grid.innerHTML = active.map(o => `
            <div class="kpi-card" style="border-left: 5px solid var(--primary);">
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                    <span style="font-weight:900; color:var(--primary);">${o.id}</span>
                    <span class="badge b-pending">${o.status}</span>
                </div>
                <div style="margin-bottom:1.5rem;">
                    <div style="font-weight:800;">${o.customer?.name || 'Guest'}</div>
                    <div style="font-size:0.8rem; opacity:0.6;">${o.customer?.phone || ''}</div>
                </div>
                <div style="font-size:1.2rem; font-weight:900; margin-bottom:1.5rem;">₹${(o.total || 0).toFixed(2)}</div>
                <div style="margin-bottom:1rem; font-size:0.75rem;">
                    <span style="opacity:0.6;">UTR:</span> 
                    <span style="font-family:monospace; font-weight:700;">${o.paymentId || 'N/A'}</span>
                </div>
                <select onchange="window.Database.updateOrderStatus('${o.docId}', this.value)" style="width:100%; padding:0.8rem; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); font-weight:700;">
                    <option value="Confirmed" ${o.status==='Confirmed'?'selected':''}>Confirmed</option>
                    <option value="Processing" ${o.status==='Processing'?'selected':''}>Processing</option>
                    <option value="Delivered" ${o.status==='Delivered'?'selected':''}>Mark Delivered</option>
                </select>
            </div>
        `).join('');
    }

    // ── Tab Switching ────────────────────────────────────
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.view-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const target = btn.dataset.tab;
            sections.forEach(s => {
                if (s.id === `view-${target}`) s.classList.remove('hidden');
                else s.classList.add('hidden');
            });
        });
    });

    // ── Simulation ──────────────────────────────────────
    document.getElementById('simulateOrder').addEventListener('click', async () => {
        const testData = {
            customer: { name: "Test User", phone: "9876543210", address: "123 Demo St" },
            items: [{ id: "pani-puri-mint", name: "Pani Puri Masala", price: 15, qty: 2 }],
            total: 30,
            paymentMethod: "UPI"
        };
        await window.Database.placeOrder(testData);
        if (window.showToast) window.showToast("Test order incoming!");
    });

    function renderSheet(orders) {
        const tbody = document.getElementById('ordersBody');
        const q = document.getElementById('orderSearch').value.toLowerCase();
        
        const filtered = orders.filter(o => 
            o.id.toLowerCase().includes(q) || 
            (o.customer?.name || '').toLowerCase().includes(q)
        );

        tbody.innerHTML = filtered.map(o => `
            <tr>
                <td style="color:var(--primary); font-weight:800;">${o.id}</td>
                <td style="opacity:0.6; font-size:0.8rem;">${new Date(o.createdAt).toLocaleString()}</td>
                <td>${o.customer?.name || 'Guest'}</td>
                <td>${o.customer?.phone || 'N/A'}</td>
                <td>₹${(o.total || 0).toFixed(2)}</td>
                <td>
                    <code style="font-size:0.8rem; font-weight:700;">${o.paymentId || 'N/A'}</code>
                </td>
                <td><span class="badge ${o.status==='Delivered'?'b-done':'b-pending'}">${o.status || 'Confirmed'}</span></td>
                <td>
                    <select onchange="window.Database.updateOrderStatus('${o.docId}', this.value)" style="padding:0.4rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); font-size:0.8rem;">
                        <option value="Confirmed" ${o.status==='Confirmed'?'selected':''}>Confirmed</option>
                        <option value="Processing" ${o.status==='Processing'?'selected':''}>Processing</option>
                        <option value="Delivered" ${o.status==='Delivered'?'selected':''}>Delivered</option>
                        <option value="Cancelled" ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');
    }

    // ── Search & Tools ───────────────────────────────────
    document.getElementById('orderSearch').addEventListener('input', () => renderSheet(_orders));

    document.getElementById('exportBtn').addEventListener('click', () => {
        if (_orders.length === 0) return;
        const csv = [
            ["Order ID", "Date", "Customer", "Phone", "Total", "Status"].join(","),
            ..._orders.map(o => [
                o.id, 
                new Date(o.createdAt).toISOString(), 
                o.customer?.name || 'Guest', 
                o.customer?.phone || '', 
                o.total, 
                o.status
            ].join(","))
        ].join("\n");
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `JustCook_Orders_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
    });

    // ── Database Seeder ──────────────────────────────────
    document.getElementById('seedDbBtn').addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = "Syncing...";
        try {
            await window.Database.seedInitialProducts();
            window.showToast("Cloud Database Synced Successfully!");
        } catch (e) {
            window.showToast("Sync Error: " + e.message, "err");
        }
        this.disabled = false;
        this.textContent = "Sync Cloud Products";
    });

    window.addEventListener('hashchange', () => { if (_unsub) _unsub(); });
})();

