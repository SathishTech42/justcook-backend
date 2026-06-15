/**
 * Flavor Pop - Interactive Showcase Logic
 * Handles smooth transitions, theme class switches, text content updates,
 * and micro-animations for the interactive landing page.
 */

// Product Data Configuration
const productData = {
  chicken: {
    themeClass: 'theme-chicken',
    imageSrc: 'productimage/chicken.png',
    bgTextLeft: 'FLAVOR',
    bgTextRight: 'POP',
    textLeftTitle: 'Choose your flavor',
    textLeftSubtitle: 'crafted your way',
    textRightTitle: 'Enjoy the moment',
    textRightSubtitle: 'we handle the rest',
    imageAlt: 'Premium Fried Chicken'
  },
  panipuri: {
    themeClass: 'theme-panipuri',
    imageSrc: 'productimage/panipuri.png',
    bgTextLeft: 'SPICY',
    bgTextRight: 'BURST',
    textLeftTitle: 'Taste the crunch',
    textLeftSubtitle: 'burst of authentic spices',
    textRightTitle: 'Street food delight',
    textRightSubtitle: 'crafted fresh daily',
    imageAlt: 'Delicious Crispy Panipuri'
  },
  waffle: {
    themeClass: 'theme-waffle',
    imageSrc: 'productimage/waffle.png',
    bgTextLeft: 'SWEET',
    bgTextRight: 'CRISP',
    textLeftTitle: 'Warm & golden',
    textLeftSubtitle: 'drizzled with honey syrup',
    textRightTitle: 'Sweet indulgence',
    textRightSubtitle: 'baked to perfection',
    imageAlt: 'Premium Sweet Waffle'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const productPlate = document.getElementById('product-plate');
  const dockItems = document.querySelectorAll('.dock-item');
  
  // Dynamic Text Elements
  const bgTextLeftStroke = document.getElementById('bg-text-left-stroke');
  const bgTextRightStroke = document.getElementById('bg-text-right-stroke');
  const bgTextLeft = document.getElementById('bg-text-left');
  const bgTextRight = document.getElementById('bg-text-right');
  
  const textLeftTitle = document.getElementById('text-left-title');
  const textLeftSubtitle = document.getElementById('text-left-subtitle');
  const textRightTitle = document.getElementById('text-right-title');
  const textRightSubtitle = document.getElementById('text-right-subtitle');
  
  // Blocks for text fade-in refresh
  const leftBlock = document.querySelector('.flavor-selector-block');
  const rightBlock = document.querySelector('.moment-block');
  
  // Interactive Menu Toggle (Subtle micro-interaction placeholder)
  const menuBtn = document.getElementById('menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      // Small rotation & state change for burger bars
      const bars = menuBtn.querySelectorAll('.bar');
      menuBtn.classList.toggle('open');
      if (menuBtn.classList.contains('open')) {
        bars[0].style.width = '24px';
        bars[1].style.width = '24px';
        bars[0].style.transform = 'translateY(4px) rotate(45deg)';
        bars[1].style.transform = 'translateY(-4px) rotate(-45deg)';
      } else {
        bars[0].style.width = '24px';
        bars[1].style.width = '16px';
        bars[0].style.transform = 'none';
        bars[1].style.transform = 'none';
      }
    });
  }

  // Active state protection
  let isTransitioning = false;

  // Function to switch active product
  const switchProduct = (productId) => {
    if (isTransitioning) return;
    
    const data = productData[productId];
    if (!data) return;

    isTransitioning = true;

    // 1. Add fade/rotation exit class to the current plate
    productPlate.classList.add('plate-exit');

    // 2. Wait for exit animation midpoint to change content
    setTimeout(() => {
      // Switch body theme class
      body.className = '';
      body.classList.add(data.themeClass);

      // Swap plate image & attributes
      productPlate.src = data.imageSrc;
      productPlate.alt = data.imageAlt;

      // Swap background typography texts
      bgTextLeftStroke.textContent = data.bgTextLeft;
      bgTextRightStroke.textContent = data.bgTextRight;
      bgTextLeft.textContent = data.bgTextLeft;
      bgTextRight.textContent = data.bgTextRight;

      // Swap side panel descriptions
      textLeftTitle.textContent = data.textLeftTitle;
      textLeftSubtitle.textContent = data.textLeftSubtitle;
      textRightTitle.textContent = data.textRightTitle;
      textRightSubtitle.textContent = data.textRightSubtitle;

      // Reset text animation classes to trigger them again
      if (leftBlock) {
        leftBlock.classList.remove('animate-fade-in-left');
        void leftBlock.offsetWidth; // Force CSS reflow
        leftBlock.classList.add('animate-fade-in-left');
      }
      if (rightBlock) {
        rightBlock.classList.remove('animate-fade-in-right');
        void rightBlock.offsetWidth; // Force CSS reflow
        rightBlock.classList.add('animate-fade-in-right');
      }

      // Reset plate transitions: exit class out, enter class in
      productPlate.classList.remove('plate-exit');
      productPlate.classList.add('plate-enter');

      // Force reflow for entrance transition
      void productPlate.offsetWidth;

      // Remove entry class to slide/bounce plate back to standard scale(1)
      productPlate.classList.remove('plate-enter');
      
      // End transition lock
      setTimeout(() => {
        isTransitioning = false;
      }, 500);

    }, 400); // Wait for exit zoom/spin duration
  };

  // Event listener setup on dock items
  dockItems.forEach(item => {
    item.addEventListener('click', () => {
      if (item.classList.contains('active') || isTransitioning) return;
      
      // Update active nav class
      dockItems.forEach(d => d.classList.remove('active'));
      item.classList.add('active');

      const selectedProduct = item.getAttribute('data-product');
      switchProduct(selectedProduct);
    });
  });

  // Highlight navigation header link changes
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Parallax Scroll Effect for Hero Image
  // Floats the product image down and to the left into the signature collection section
  const heroCenterStage = document.querySelector('.hero-center-stage');
  const signatureText = document.querySelector('.signature-text-block');
  
  // Cache the positions to avoid expensive layout recalculations on every scroll
  let startY = 0;
  let textCenterY = 0;
  let maxTravelY = 0;
  let targetScrollY = 0;

  const calculatePositions = () => {
    if (!heroCenterStage || !signatureText) return;
    // Where the text block is on the page
    textCenterY = signatureText.getBoundingClientRect().top + window.scrollY + (signatureText.offsetHeight / 2);
    // Where the hero image starts on the page
    startY = heroCenterStage.parentElement.getBoundingClientRect().top + window.scrollY + heroCenterStage.offsetTop;
    // Total downward pixel travel required
    maxTravelY = textCenterY - startY;
    // We want the animation to finish exactly when the text block is in the middle of the viewport
    targetScrollY = textCenterY - window.innerHeight / 2;
  };

  // Calculate initially and on resize
  window.addEventListener('load', calculatePositions);
  window.addEventListener('resize', calculatePositions);
  calculatePositions(); // run once immediately

  window.addEventListener('scroll', () => {
    if (!heroCenterStage || targetScrollY <= 0) return;
    
    const scrollY = window.scrollY;
    
    // Calculate progress (0 to 1) based on scroll distance.
    let progress = Math.max(0, Math.min(scrollY / targetScrollY, 1));
    
    // Smooth easing function for the lateral move (easeInOutQuad)
    let easedProgress = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    // Move left by up to 20vw to land nicely between the center and the left edge
    const xOffsetVw = easedProgress * 20;
    
    // Move vertically by the exact pixel distance needed to align with the text
    const yTravelPx = easedProgress * maxTravelY;
    
    // Scale down slightly as it lands in the collection section
    const scale = 1 - (easedProgress * 0.15); // scales down to 0.85
    
    // Apply transform:
    // 1. Move left with xOffsetVw
    // 2. Move down by exactly yTravelPx
    // 3. Apply the dynamic scale
    heroCenterStage.style.transform = `translate(calc(-50% - ${xOffsetVw}vw), calc(-50% + ${yTravelPx}px)) scale(${scale})`;
  });

  // Intersection Observer for Scroll Animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  // Observe all animated elements
  document.querySelectorAll('.slide-up-anim, .slide-left-anim, .slide-right-anim').forEach(el => {
    observer.observe(el);
  });
});
