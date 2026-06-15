document.addEventListener('DOMContentLoaded', () => {
    // Basic SPA Router
    const views = {
        'home': document.querySelector('main.hero-section') ? [
            document.querySelector('main.hero-section'),
            document.getElementById('signature-collection'),
            document.getElementById('revolution'),
            document.querySelector('.product-dock')
        ] : [],
        'products': [document.getElementById('view-products')],
        'cart': [document.getElementById('view-cart')],
        'checkout': [document.getElementById('view-checkout')],
        'admin': [document.getElementById('view-admin')],
        'product-details': [document.getElementById('view-product-details')],
        'contact': [document.getElementById('view-contact')]
    };

    function hideAllViews() {
        Object.values(views).forEach(elements => {
            elements.forEach(el => {
                if (el) el.style.display = 'none';
            });
        });
    }

    function showView(viewId) {
        hideAllViews();
        if (views[viewId]) {
            views[viewId].forEach(el => {
                if (el) {
                    el.style.display = ''; // Reset to default display (e.g. block or flex)
                }
            });
        }
        
        // Ensure nav links are updated
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.getElementById(`nav-link-${viewId}`);
        if (activeLink) activeLink.classList.add('active');
        
        window.scrollTo(0, 0);
    }

    function handleHashChange() {
        const hash = window.location.hash || '#/home';
        let viewId = 'home';
        
        if (hash.startsWith('#/products')) viewId = 'products';
        else if (hash.startsWith('#/product/')) {
            viewId = 'product-details';
            const productId = hash.replace('#/product/', '');
            if (window.renderProductDetails) {
                window.renderProductDetails(productId);
            }
        }
        else if (hash.startsWith('#/contact') || hash === '#contact') viewId = 'contact';
        else if (hash.startsWith('#/cart')) viewId = 'cart';
        else if (hash.startsWith('#/checkout')) viewId = 'checkout';
        else if (hash.startsWith('#/admin')) viewId = 'admin';
        else if (hash.startsWith('#/home') || hash === '#home') viewId = 'home';
        else if (hash === '#panipuri' || hash === '#waffle' || hash === '#chicken') {
            viewId = 'home';
            const product = hash.slice(1);
            if (window.switchHomeProduct) {
                setTimeout(() => window.switchHomeProduct(product), 50);
            }
        }

        showView(viewId);

        if (viewId === 'cart' && window.renderCart) window.renderCart();
        if (viewId === 'admin' && window.renderAdminInventory) window.renderAdminInventory();
    }

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial route check
    handleHashChange();
});
