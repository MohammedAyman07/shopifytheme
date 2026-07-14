/* ============================================================
   DAILY SCROLL — THEME JAVASCRIPT
   Vanilla JS, No jQuery
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAnimations();
  initHeader();
  initMobileMenu();
  initQuantitySelectors();
  initCartDrawer();
  initQuickView();
  initPredictiveSearch();
});

/* ── INTERSECTION OBSERVER ANIMATIONS ─────────────────────── */
function initAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── HEADER & STICKY ──────────────────────────────────────── */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    // Transparent to solid transition
    if (currentScrollY > 50) {
      header.classList.remove('site-header--transparent');
      header.classList.add('site-header--scrolled');
    } else {
      // Check if it's supposed to be transparent initially (e.g. on homepage)
      if (document.body.classList.contains('template-index')) {
        header.classList.add('site-header--transparent');
        header.classList.remove('site-header--scrolled');
      }
    }

    lastScrollY = currentScrollY;
  }, { passive: true });
}

/* ── MOBILE MENU ──────────────────────────────────────────── */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const closeBtn = document.querySelector('.mobile-nav__close');
  const overlay = document.querySelector('.mobile-nav__overlay');

  if (!hamburger || !mobileNav) return;

  const toggleMenu = () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  };

  hamburger.addEventListener('click', toggleMenu);
  if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
  if (overlay) overlay.addEventListener('click', toggleMenu);

  // Submenus
  const toggleLinks = document.querySelectorAll('.mobile-nav__link-toggle');
  toggleLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('aria-controls');
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.toggle('open');
        const icon = link.querySelector('svg');
        if (icon) icon.style.transform = target.classList.contains('open') ? 'rotate(180deg)' : '';
      }
    });
  });
}

/* ── CART DRAWER ──────────────────────────────────────────── */
function initCartDrawer() {
  const cartIcon = document.querySelector('.header-cart-btn');
  const cartDrawer = document.querySelector('.cart-drawer');
  const cartClose = document.querySelector('.cart-drawer__close');
  const cartOverlay = document.querySelector('.cart-overlay');
  
  if (!cartDrawer) return;

  window.toggleCart = function(forceState) {
    const isOpen = typeof forceState === 'boolean' ? !forceState : cartDrawer.classList.contains('open');
    
    if (isOpen) {
      cartDrawer.classList.remove('open');
      if (cartOverlay) cartOverlay.classList.remove('open');
      document.body.style.overflow = '';
    } else {
      cartDrawer.classList.add('open');
      if (cartOverlay) cartOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      // If mobile menu is open, close it
      document.querySelector('.mobile-nav')?.classList.remove('open');
      document.querySelector('.hamburger')?.classList.remove('open');
    }
  };

  if (cartIcon) cartIcon.addEventListener('click', (e) => { e.preventDefault(); window.toggleCart(true); });
  if (cartOverlay) cartOverlay.addEventListener('click', () => window.toggleCart(false));

  // Use event delegation for close button so it works after cart HTML is re-rendered
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.cart-drawer__close')) {
      window.toggleCart(false);
    }
  });

  // Listen for Add To Cart forms globally via delegation
  document.body.addEventListener('submit', async (e) => {
    if (e.target.matches('form[action="/cart/add"]')) {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector('[type="submit"]');
      const originalText = btn.innerHTML;
      
      btn.innerHTML = '<span class="btn-loading"></span>';
      btn.disabled = true;

      try {
        const formData = new FormData(form);
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        if (res.ok) {
          updateCartDrawer();
          window.toggleCart(true);
          showToast('Added to cart successfully', 'success');
        } else {
          showToast('Error adding to cart', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error', 'error');
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }
  });
}

function updateCartDrawer() {
  fetch('/cart.js')
    .then(res => res.json())
    .then(cart => {
      const itemsContainer = document.querySelector('.cart-drawer__items');
      const countEl = document.querySelector('.cart-drawer__count');
      const footerEl = document.querySelector('.cart-drawer__footer');
      const emptyEl = document.querySelector('.cart-drawer .cart-empty-state');

      // Update item count in header
      if (countEl) {
        countEl.textContent = cart.item_count > 0 ? cart.item_count + ' item' + (cart.item_count !== 1 ? 's' : '') : '';
      }

      if (cart.item_count === 0) {
        // Show empty state
        if (itemsContainer) itemsContainer.innerHTML = '';
        if (footerEl) footerEl.style.display = 'none';
        // Ensure empty message is visible
        let emptyState = document.querySelector('.cart-drawer__empty');
        if (!emptyState) {
          emptyState = document.createElement('div');
          emptyState.className = 'cart-drawer__empty';
          emptyState.style.cssText = 'text-align:center;padding:4rem 2rem;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;';
          emptyState.innerHTML = `
            <div style="font-size:3rem;margin-bottom:1rem;color:var(--clr-muted-2);">🛒</div>
            <h3 style="font-size:var(--text-xl);font-weight:700;margin-bottom:0.5rem;">Your Cart is Empty</h3>
            <p style="color:var(--clr-muted);margin-bottom:2rem;">Looks like you haven't added anything yet.</p>
            <a href="/collections/all" class="btn btn-primary btn-lg" onclick="window.toggleCart(false);">Start Shopping</a>
          `;
          const cartDrawer = document.querySelector('.cart-drawer');
          if (cartDrawer && itemsContainer) {
            cartDrawer.insertBefore(emptyState, itemsContainer.nextSibling);
          }
        }
        emptyState.style.display = 'flex';
      } else {
        // Hide empty state if shown
        const emptyState = document.querySelector('.cart-drawer__empty');
        if (emptyState) emptyState.style.display = 'none';
        
        // Render items
        if (itemsContainer) {
          itemsContainer.innerHTML = cart.items.map((item, index) => {
            const lineIndex = index + 1;
            const imgSrc = item.image ? item.image.replace(/\.jpg/, '_200x200.jpg').replace(/\.png/, '_200x200.png').replace(/\.webp/, '_200x200.webp') : '';
            const price = (item.final_line_price / 100).toFixed(2);
            const currency = (window.theme && window.theme.currency) ? window.theme.currency : 'USD';
            const fmtPrice = (() => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(price)); } catch(e) { return '$' + price; } })();
            return `
              <div class="cart-item">
                <a href="${item.url}" class="cart-item__img-wrapper">
                  <img src="${item.image || ''}" alt="${item.title}" class="cart-item__img" style="width:100%;height:100%;object-fit:contain;">
                </a>
                <div class="cart-item__info">
                  <a href="${item.url}" class="cart-item__title">${item.product_title}</a>
                  ${item.variant_title && item.variant_title !== 'Default Title' ? `<div class="cart-item__variant">${item.variant_title}</div>` : ''}
                  <div class="cart-item__price-row">
                    <div class="cart-item__price">${fmtPrice}</div>
                    <div class="cart-item__qty qty-selector">
                      <button type="button" class="cart-item__qty-btn qty-minus" onclick="updateCartItem(${lineIndex}, ${item.quantity - 1})">−</button>
                      <div class="cart-item__qty-num">${item.quantity}</div>
                      <button type="button" class="cart-item__qty-btn qty-plus" onclick="updateCartItem(${lineIndex}, ${item.quantity + 1})">+</button>
                    </div>
                  </div>
                </div>
                <button class="cart-item__remove" aria-label="Remove item" onclick="updateCartItem(${lineIndex}, 0)">×</button>
              </div>
            `;
          }).join('');
        }

        // Update/show footer with subtotal
        if (footerEl) {
          footerEl.style.display = '';
          const subtotalEl = footerEl.querySelector('.cart-subtotal__amount');
          if (subtotalEl) {
            const total = (cart.total_price / 100).toFixed(2);
            const totCurrency = (window.theme && window.theme.currency) ? window.theme.currency : 'USD';
            try { subtotalEl.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: totCurrency }).format(parseFloat(total)); } catch(e) { subtotalEl.textContent = '$' + total; }
          }
        }
      }

      updateCartBubble();
    })
    .catch(err => console.error('Cart update error:', err));
}

function updateCartBubble() {
  fetch('/cart.js')
    .then(res => res.json())
    .then(data => {
      const bubbles = document.querySelectorAll('.cart-count');
      bubbles.forEach(bubble => {
        bubble.textContent = data.item_count;
        if (data.item_count > 0) {
          bubble.classList.add('visible');
        } else {
          bubble.classList.remove('visible');
        }
      });
    });
}

/* ── QUANTITY SELECTORS ───────────────────────────────────── */
function initQuantitySelectors() {
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.qty-btn')) {
      const btn = e.target.closest('.qty-btn');
      const container = btn.closest('.qty-selector');
      const input = container.querySelector('.qty-input');
      if (!input) return;

      const isPlus = btn.classList.contains('qty-plus');
      let val = parseInt(input.value) || 1;
      
      if (isPlus) {
        val++;
      } else {
        if (val > 1) val--;
      }
      
      input.value = val;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

/* ── TOAST NOTIFICATIONS ──────────────────────────────────── */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconHtml = '';
  if (type === 'success') {
    iconHtml = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>';
  } else if (type === 'error') {
    iconHtml = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>';
  } else {
    iconHtml = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  }

  toast.innerHTML = `
    <div class="toast__icon">${iconHtml}</div>
    <div class="toast__body">
      <div class="toast__title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
      <div class="toast__msg">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ── QUICK VIEW ───────────────────────────────────────────── */
function initQuickView() {
  document.body.addEventListener('click', async (e) => {
    if (e.target.matches('.product-card__quick-view')) {
      e.preventDefault();
      const url = e.target.dataset.url;
      if (!url) return;
      
      const modal = document.querySelector('.modal-overlay');
      if (modal) {
        const content = modal.querySelector('.modal__content-inner');
        content.innerHTML = '<div style="padding: 40px; text-align: center;">Loading...</div>';
        modal.classList.add('open');
        
        try {
          // Fetch product page without layout
          const res = await fetch(`${url}?view=quickview`);
          const html = await res.text();
          content.innerHTML = html;
        } catch(err) {
          content.innerHTML = '<div style="padding: 40px; text-align: center;">Failed to load.</div>';
        }
      }
    }
  });

  const modalClose = document.querySelector('.modal__close');
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      document.querySelector('.modal-overlay')?.classList.remove('open');
    });
  }
}

/* ── PREDICTIVE SEARCH ────────────────────────────────────── */
function initPredictiveSearch() {
  const searchBtn = document.querySelector('.header-search-btn');
  const searchOverlay = document.querySelector('.search-overlay');
  const searchClose = document.querySelector('.search-overlay__close');
  
  if (!searchOverlay) return;

  const toggleSearch = (force) => {
    const isOpen = typeof force === 'boolean' ? force : !searchOverlay.classList.contains('open');
    if (isOpen) {
      searchOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => document.querySelector('.search-overlay__input')?.focus(), 100);
    } else {
      searchOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  if (searchBtn) searchBtn.addEventListener('click', (e) => { e.preventDefault(); toggleSearch(true); });
  if (searchClose) searchClose.addEventListener('click', () => toggleSearch(false));
}

/* ── QUICK ADD TO CART ────────────────────────────────────── */
window.quickAdd = async function(variantId, btnElement) {
  if (btnElement) {
    btnElement.dataset.originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<span class="btn-loading" style="border-color: #fff; border-bottom-color: transparent;"></span>';
    btnElement.disabled = true;
  }

  try {
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' 
      },
      body: JSON.stringify({
        items: [{
          id: parseInt(variantId),
          quantity: 1
        }]
      })
    });
    
    if (res.ok) {
      if (typeof updateCartDrawer === 'function') updateCartDrawer();
      if (typeof window.toggleCart === 'function') window.toggleCart(true);
      if (typeof showToast === 'function') showToast('Added to cart successfully', 'success');
    } else {
      if (typeof showToast === 'function') showToast('Error adding to cart', 'error');
    }
  } catch (err) {
    console.error(err);
    if (typeof showToast === 'function') showToast('Network error', 'error');
  } finally {
    if (btnElement) {
      btnElement.innerHTML = btnElement.dataset.originalText;
      btnElement.disabled = false;
    }
  }
};
