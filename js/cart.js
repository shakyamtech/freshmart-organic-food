/**
 * Freshmart - Dynamic Guest Cart System
 * Supports localStorage persistence, dynamic badge count, mini-cart dropdown,
 * cart page management, and checkout validation.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'freshmart_cart';

  // --- Cart Data Helpers ---
  function getCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
      renderAll();
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }

  function generateId(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item-' + Date.now();
  }

  function getCartCount() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
  }

  function getCartTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 0)), 0);
  }

  function addToCart(product) {
    if (!product || !product.name) return;
    const cart = getCart();
    const id = product.id || generateId(product.name);
    const existingIndex = cart.findIndex((item) => item.id === id);

    const qtyToAdd = parseInt(product.quantity, 10) || 1;

    if (existingIndex > -1) {
      cart[existingIndex].quantity = (parseInt(cart[existingIndex].quantity, 10) || 0) + qtyToAdd;
    } else {
      cart.push({
        id: id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        image: product.image || 'img/product/1.jpg',
        quantity: qtyToAdd,
        url: product.url || 'product-detail-left-sidebar.html'
      });
    }

    saveCart(cart);
    showToast(`✓ Added to cart: <strong>${escapeHtml(product.name)}</strong> (${qtyToAdd})`);
  }

  function removeFromCart(id) {
    let cart = getCart();
    const itemToRemove = cart.find(i => i.id === id);
    cart = cart.filter((item) => item.id !== id);
    saveCart(cart);
    if (itemToRemove) {
      showToast(`Removed <strong>${escapeHtml(itemToRemove.name)}</strong> from cart`);
    }
  }

  function updateQuantity(id, quantity) {
    const cart = getCart();
    const item = cart.find((i) => i.id === id);
    if (item) {
      const q = parseInt(quantity, 10);
      if (q > 0) {
        item.quantity = q;
        saveCart(cart);
      } else {
        removeFromCart(id);
      }
    }
  }

  function clearCart() {
    saveCart([]);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function (m) {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return m;
      }
    });
  }

  // --- UI Toast Notification ---
  function showToast(message) {
    let toastContainer = document.getElementById('freshmart-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'freshmart-toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: #78b144;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      opacity: 0;
      transform: translateY(15px);
      transition: all 0.3s ease;
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 20);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- Header Mini-Cart & Badge Renderer ---
  function renderHeaderCart() {
    const cart = getCart();
    const count = getCartCount();
    const total = getCartTotal();

    // 1. Update Cart Badge Count
    const badges = document.querySelectorAll('.block-cart .cart-count');
    badges.forEach((badge) => {
      badge.textContent = count;
      // Optional subtle animation effect
      badge.classList.remove('badge-pop');
      void badge.offsetWidth;
      badge.classList.add('badge-pop');
    });

    // 2. Update Dropdown Content
    const cartDropdowns = document.querySelectorAll('.block-cart .dropdown-content .cart-content');
    cartDropdowns.forEach((container) => {
      if (cart.length === 0) {
        container.innerHTML = `
          <table>
            <tbody>
              <tr>
                <td colspan="3" style="text-align: center; padding: 25px 15px; color: #777;">
                  <i class="fa fa-shopping-basket" style="font-size: 28px; display: block; margin-bottom: 8px; color: #ccc;"></i>
                  <div style="font-weight: 600; font-size: 14px; color: #555;">Your cart is empty</div>
                  <div style="font-size: 12px; margin-top: 4px; color: #999;">Add organic products to start shopping</div>
                </td>
              </tr>
              <tr class="total">
                <td>Total:</td>
                <td colspan="2">Rs. 0.00</td>
              </tr>
              <tr>
                <td colspan="3">
                  <div class="cart-button">
                    <a class="btn btn-primary" href="product-grid-left-sidebar.html" style="width: 100%;">Browse Products</a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        `;
      } else {
        let rowsHtml = '';
        cart.forEach((item) => {
          rowsHtml += `
            <tr data-cart-id="${escapeHtml(item.id)}">
              <td class="product-image">
                <a href="${escapeHtml(item.url)}">
                  <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
                </a>
              </td>
              <td>
                <div class="product-name">
                  <a href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a>
                </div>
                <div>	
                  ${item.quantity} x <span class="product-price">Rs. ${parseFloat(item.price).toFixed(2)}</span>
                </div>
              </td>
              <td class="action">
                <a class="remove remove-cart-item-btn" href="#" data-id="${escapeHtml(item.id)}" title="Remove item">
                  <i class="fa fa-trash-o" aria-hidden="true"></i>
                </a>
              </td>
            </tr>
          `;
        });

        rowsHtml += `
          <tr class="total">
            <td>Total:</td>
            <td colspan="2">Rs. ${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3">
              <div class="cart-button">
                <a class="btn btn-primary" href="product-cart.html" title="View Cart">View Cart</a>
                <a class="btn btn-primary" href="product-checkout.html" title="Checkout">Checkout</a>
              </div>
            </td>
          </tr>
        `;

        container.innerHTML = `
          <table>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        `;
      }
    });
  }

  // --- Cart Page Renderer (product-cart.html) ---
  function renderCartPage() {
    const cartTable = document.querySelector('.product-cart table');
    if (!cartTable) return;

    const cart = getCart();
    const tbody = cartTable.querySelector('tbody');
    const tfoot = cartTable.querySelector('tfoot');
    const checkoutBtn = document.querySelector('.checkout-btn');

    if (!tbody) return;

    if (cart.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px 20px;">
            <i class="fa fa-shopping-basket" style="font-size: 40px; color: #ccc; margin-bottom: 12px;"></i>
            <h3 style="margin-top: 10px; margin-bottom: 8px;">Your Shopping Cart is Empty</h3>
            <p style="color: #777; margin-bottom: 20px;">Looks like you haven't added any organic items yet.</p>
            <a href="product-grid-left-sidebar.html" class="btn btn-primary">Start Shopping</a>
          </td>
        </tr>
      `;
      if (tfoot) tfoot.style.display = 'none';
      if (checkoutBtn) checkoutBtn.style.display = 'none';
      return;
    }

    if (tfoot) tfoot.style.display = '';
    if (checkoutBtn) checkoutBtn.style.display = '';

    let rowsHtml = '';
    let subtotal = 0;

    cart.forEach((item) => {
      const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1);
      subtotal += itemTotal;

      rowsHtml += `
        <tr data-cart-id="${escapeHtml(item.id)}">
          <td class="product-remove">
            <a title="Remove this item" class="remove page-remove-item" href="#" data-id="${escapeHtml(item.id)}">
              <i class="fa fa-times"></i>
            </a>
          </td>
          <td>
            <a href="${escapeHtml(item.url)}">
              <img width="80" alt="${escapeHtml(item.name)}" class="img-responsive" src="${escapeHtml(item.image)}">
            </a>
          </td>
          <td>
            <a href="${escapeHtml(item.url)}" class="product-name">${escapeHtml(item.name)}</a>
          </td>
          <td class="text-center">
            Rs. ${parseFloat(item.price).toFixed(2)}
          </td>
          <td>
            <div class="product-quantity">
              <div class="qty">
                <div class="input-group">
                  <input type="text" name="cart_page_qty" value="${item.quantity}" data-id="${escapeHtml(item.id)}" data-min="1" style="width: 50px; text-align: center;">
                  <span class="adjust-qty">
                    <span class="adjust-btn plus page-qty-plus" data-id="${escapeHtml(item.id)}">+</span>
                    <span class="adjust-btn minus page-qty-minus" data-id="${escapeHtml(item.id)}">-</span>
                  </span>
                </div>
              </div>
            </div>
          </td>
          <td class="text-center">
            Rs. ${itemTotal.toFixed(2)}
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;

    // Update Footers
    const shipping = subtotal > 1000 ? 0 : 50; // free shipping over Rs. 1000
    const finalTotal = subtotal + shipping;

    if (tfoot) {
      tfoot.innerHTML = `
        <tr class="cart-total">
          <td rowspan="3" colspan="3"></td>
          <td colspan="2" class="text-right">Total products:</td>
          <td colspan="1" class="text-center">Rs. ${subtotal.toFixed(2)}</td>
        </tr>
        <tr class="cart-total">
          <td colspan="2" class="text-right">Shipping:</td>
          <td colspan="1" class="text-center">${shipping === 0 ? 'FREE' : 'Rs. ' + shipping.toFixed(2)}</td>
        </tr>
        <tr class="cart-total">
          <td colspan="2" class="total text-right"><strong>Total:</strong></td>
          <td colspan="1" class="total text-center"><strong>Rs. ${finalTotal.toFixed(2)}</strong></td>
        </tr>
      `;
    }
  }

  // --- Checkout Page Renderer (product-checkout.html) ---
  function renderCheckoutPage() {
    const orderReviewTable = document.querySelector('.order-review table');
    if (!orderReviewTable) return;

    const cart = getCart();
    const tbody = orderReviewTable.querySelector('tbody');
    const cartSubtotalEl = document.querySelector('.cart-total tr:nth-child(1) td.total');
    const shippingEl = document.querySelector('.cart-total tr:nth-child(2) td');
    const orderTotalEl = document.querySelector('.cart-total tr:nth-child(3) td.total');

    if (!tbody) return;

    if (cart.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 25px; color: #777;">
            Your cart is empty. <a href="product-grid-left-sidebar.html">Browse products</a> to checkout.
          </td>
        </tr>
      `;
      if (cartSubtotalEl) cartSubtotalEl.textContent = 'Rs. 0.00';
      if (orderTotalEl) orderTotalEl.textContent = 'Rs. 0.00';
      return;
    }

    let rowsHtml = '';
    let subtotal = 0;

    cart.forEach((item) => {
      const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1);
      subtotal += itemTotal;

      rowsHtml += `
        <tr>
          <td>
            <a href="${escapeHtml(item.url)}">
              <img width="60" alt="${escapeHtml(item.name)}" class="img-responsive" src="${escapeHtml(item.image)}">
            </a>
          </td>
          <td>
            <a href="${escapeHtml(item.url)}" class="product-name">${escapeHtml(item.name)}</a>
          </td>
          <td class="text-center">
            Rs. ${parseFloat(item.price).toFixed(2)}
          </td>
          <td class="text-center">
            ${item.quantity}
          </td>
          <td class="text-center">
            Rs. ${itemTotal.toFixed(2)}
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;

    const shipping = subtotal > 1000 ? 0 : 50;
    const finalTotal = subtotal + shipping;

    if (cartSubtotalEl) cartSubtotalEl.textContent = `Rs. ${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free Shipping' : `Rs. ${shipping.toFixed(2)}`;
    if (orderTotalEl) orderTotalEl.textContent = `Rs. ${finalTotal.toFixed(2)}`;
  }

  function renderAll() {
    renderHeaderCart();
    renderCartPage();
    renderCheckoutPage();
  }

  // --- Helper: Extract Product Info from clicked element context ---
  function extractProductInfo($btn) {
    // 1. Check if on Single Product Detail page
    const $detailContainer = $btn.closest('.product-detail, #center-column');
    if ($detailContainer.length) {
      const name = $detailContainer.find('.product-title').first().text().trim() ||
                   $detailContainer.find('h2.title, h1.title, .product-item .product-title').first().text().trim();
      const priceText = $detailContainer.find('.sale-price, .product-price').first().text();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      const image = $detailContainer.find('.main-image img, .product-image img').first().attr('src') || 'img/product/1.jpg';
      const qty = parseInt($detailContainer.find('input[name="qty"]').val(), 10) || 1;

      return {
        id: generateId(name),
        name: name,
        price: price,
        image: image,
        quantity: qty,
        url: window.location.pathname.split('/').pop() || 'product-detail-left-sidebar.html'
      };
    }

    // 2. Check if in product card / carousel / list / grid item
    const $item = $btn.closest('.product-item, .item, .deal-item, tr');
    if ($item.length) {
      const name = $item.find('.product-title a, .product-name a, .product-title, .product-name, h3, h4').first().text().trim();
      const priceText = $item.find('.sale-price, .product-price, .price').first().text();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      const image = $item.find('.product-image img, img').first().attr('src') || 'img/product/1.jpg';
      const url = $item.find('.product-title a, .product-name a, .product-image a, a').first().attr('href') || 'product-detail-left-sidebar.html';
      const qtyInput = $item.find('input[name="qty"]');
      const qty = qtyInput.length ? (parseInt(qtyInput.val(), 10) || 1) : 1;

      if (name) {
        return {
          id: generateId(name),
          name: name,
          price: price,
          image: image,
          quantity: qty,
          url: url
        };
      }
    }

    return null;
  }

  // --- Attach Global Event Handlers ---
  function initEvents() {
    if (typeof jQuery === 'undefined') {
      setTimeout(initEvents, 100);
      return;
    }

    const $ = jQuery;

    // 1. Add to Cart Click
    $(document).on('click', '.add-to-cart', function (e) {
      e.preventDefault();
      const prod = extractProductInfo($(this));
      if (prod && prod.name) {
        addToCart(prod);
      } else {
        showToast('✓ Added item to cart');
      }
    });

    // 2. Remove Item from Mini-Cart Dropdown
    $(document).on('click', '.remove-cart-item-btn', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const id = $(this).data('id');
      if (id) {
        removeFromCart(id);
      }
    });

    // 3. Remove Item from Cart Page
    $(document).on('click', '.page-remove-item', function (e) {
      e.preventDefault();
      const id = $(this).data('id');
      if (id) {
        removeFromCart(id);
      }
    });

    // 4. Cart Page Quantity Increment / Decrement
    $(document).on('click', '.page-qty-plus', function (e) {
      e.preventDefault();
      const id = $(this).data('id');
      const $input = $(`input[name="cart_page_qty"][data-id="${id}"]`);
      const current = parseInt($input.val(), 10) || 1;
      updateQuantity(id, current + 1);
    });

    $(document).on('click', '.page-qty-minus', function (e) {
      e.preventDefault();
      const id = $(this).data('id');
      const $input = $(`input[name="cart_page_qty"][data-id="${id}"]`);
      const current = parseInt($input.val(), 10) || 1;
      if (current > 1) {
        updateQuantity(id, current - 1);
      } else {
        removeFromCart(id);
      }
    });

    $(document).on('change', 'input[name="cart_page_qty"]', function () {
      const id = $(this).data('id');
      const val = parseInt($(this).val(), 10);
      if (id) {
        if (val > 0) {
          updateQuantity(id, val);
        } else {
          removeFromCart(id);
        }
      }
    });

    // 5. Product Detail Page Quantity Adjuster (+/- buttons)
    $(document).on('click', '.adjust-btn.plus:not(.page-qty-plus)', function (e) {
      e.preventDefault();
      const $input = $(this).closest('.qty').find('input[name="qty"]');
      const val = parseInt($input.val(), 10) || 1;
      $input.val(val + 1);
    });

    $(document).on('click', '.adjust-btn.minus:not(.page-qty-minus)', function (e) {
      e.preventDefault();
      const $input = $(this).closest('.qty').find('input[name="qty"]');
      const val = parseInt($input.val(), 10) || 1;
      if (val > 1) {
        $input.val(val - 1);
      }
    });

    // 6. Checkout Auth Guard
    $(document).on('click', 'input[name="proceed"], .place-order-btn', function (e) {
      // Check if cart is empty
      const cart = getCart();
      if (cart.length === 0) {
        e.preventDefault();
        alert('Your cart is empty. Please add products before placing an order.');
        return false;
      }

      // Check if user is logged in via Firebase Auth / Local storage auth state
      const isAuthLoggedIn = sessionStorage.getItem('freshmart_user') || localStorage.getItem('freshmart_user');
      if (!isAuthLoggedIn) {
        // If not logged in, prompt user
        const proceedGuestOrLogin = confirm(
          'You are not logged in. To ensure your order is tracked and saved to your account, please log in.\n\nClick "OK" to Log In, or "Cancel" to stay on this page.'
        );
        if (proceedGuestOrLogin) {
          e.preventDefault();
          window.location.href = 'user-login.html?redirect=product-checkout.html';
          return false;
        }
      }
    });
  }

  // --- Initial Mount ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initEvents();
      renderAll();
    });
  } else {
    initEvents();
    renderAll();
  }

  // Expose API on window for external integrations
  window.FreshmartCart = {
    getCart,
    saveCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotal,
    renderAll
  };
})();
