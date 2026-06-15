document.addEventListener('DOMContentLoaded', () => {
    // Basic SPA Router
    const views = {
        'home': [
            document.querySelector('main.hero-section:not(#view-contact)'),
            document.getElementById('signature-collection'),
            document.getElementById('revolution'),
            document.querySelector('.product-dock')
        ].filter(Boolean),
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
        const elements = views[viewId];
        if (elements) {
            elements.forEach(el => {
                if (el) {
                    el.style.display = '';
                }
            });
        }
        
        // Update nav active state
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.getElementById('nav-link-' + viewId);
        if (activeLink) activeLink.classList.add('active');
        
        // Trigger page-specific init if available
        if (viewId === 'products' && window.initShopPage) {
            window.initShopPage();
        } else if (viewId === 'cart' && window.initCartPage) {
            window.initCartPage();
        } else if (viewId === 'checkout' && window.initCheckoutPage) {
            window.initCheckoutPage();
        } else if (viewId === 'admin' && window.initAdminPage) {
            window.initAdminPage();
        }

        window.scrollTo(0, 0);
    }

    function handleHashChange() {
        const hash = window.location.hash || '#/home';
        let viewId = 'home';
        
        if (hash.startsWith('#/product/') && !hash.startsWith('#/products')) {
            viewId = 'product-details';
            const productId = hash.replace('#/product/', '');
            if (window.renderProductDetails) {
                window.renderProductDetails(productId);
            }
        } else if (hash.startsWith('#/products')) viewId = 'products';
        else if (hash.startsWith('#/cart')) viewId = 'cart';
        else if (hash.startsWith('#/checkout')) viewId = 'checkout';
        else if (hash.startsWith('#/admin')) viewId = 'admin';
        else if (hash.startsWith('#/contact')) viewId = 'contact';
        else if (hash.startsWith('#/home') || hash === '#/') viewId = 'home';
        
        showView(viewId);
    }

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial route check
    handleHashChange();
});
