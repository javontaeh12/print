/* ========================================
   PrintCraft Studio — homepage.js
   Dynamic data loading for the homepage
   Loads products, services, section ordering, analytics from Supabase
   ======================================== */

(function () {
  const SUPABASE_URL = 'https://bfdpgapvrnlegizpjflf.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZHBnYXB2cm5sZWdpenBqZmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjU5NzEsImV4cCI6MjA4NTgwMTk3MX0.zwZwS8zryRpuVYzzCkeujoI3fNcylvctd_v--_3ZAcU';

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Section Ordering & Visibility ---------- */
  async function applySections() {
    try {
      const { data: sections, error } = await sb
        .from('page_sections')
        .select('*')
        .order('display_order', { ascending: true });

      if (error || !sections || sections.length === 0) return;

      const mainContent = document.querySelector('body');
      const footer = document.querySelector('.footer');

      // Collect all section elements
      const sectionEls = {};
      document.querySelectorAll('[data-section]').forEach(el => {
        sectionEls[el.dataset.section] = el;
      });

      // Map section keys to page URLs for nav link hiding
      const sectionPageMap = {
        about: 'about.html',
        clients: 'clients.html',
        contact: 'contact.html',
      };

      // Hide disabled sections and their nav links
      sections.forEach(sec => {
        const el = sectionEls[sec.key];
        if (el && !sec.is_enabled) {
          el.style.display = 'none';
        }
        // Hide nav links for disabled page-based sections
        if (!sec.is_enabled && sectionPageMap[sec.key]) {
          const pageUrl = sectionPageMap[sec.key];
          document.querySelectorAll(`a[href="${pageUrl}"], a[href="/${pageUrl}"]`).forEach(link => {
            const li = link.closest('li');
            if (li) li.style.display = 'none';
            else link.style.display = 'none';
          });
        }
      });

      // Reorder enabled sections (only homepage sections with data-section)
      const enabledSections = sections.filter(s => s.is_enabled && sectionEls[s.key]);
      enabledSections.forEach(sec => {
        const el = sectionEls[sec.key];
        if (el && footer) {
          mainContent.insertBefore(el, footer);
        }
      });
    } catch (err) {
      console.error('Error loading sections:', err);
    }
  }

  /* ---------- Dynamic Products ---------- */
  async function loadProducts() {
    try {
      const { data: products, error } = await sb
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !products || products.length === 0) return;

      const grid = document.getElementById('productsGrid');
      if (!grid) return;

      grid.innerHTML = products.map(p => `
        <div class="service-card animate-in visible" data-service="${escapeHtml(p.name.toLowerCase().replace(/\s+/g, '-'))}">
          ${p.image_url
            ? `<div class="service-img"><img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy"></div>`
            : `<div class="service-icon">&#128230;</div>`
          }
          <h3>${escapeHtml(p.name)}</h3>
          <p class="service-desc">${escapeHtml(p.description || '')}</p>
          <span class="item-category-badge">${escapeHtml(p.category || '')}</span>
          <button class="btn btn-primary btn-sm order-btn" data-service="${escapeHtml(p.name.toLowerCase().replace(/\s+/g, '-'))}">Order Now</button>
        </div>
      `).join('');

      // Show the products section
      const productsSection = document.getElementById('products');
      if (productsSection) productsSection.style.display = '';

      // Re-attach order button listeners
      grid.querySelectorAll('.order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const bookingSection = document.getElementById('booking');
          if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });
    } catch (err) {
      console.error('Error loading products:', err);
    }
  }

  /* ---------- Dynamic Services ---------- */
  async function loadServices() {
    try {
      const { data: services, error } = await sb
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !services || services.length === 0) return;

      const grid = document.querySelector('.services-grid');
      if (!grid) return;

      grid.innerHTML = services.map(s => `
        <div class="service-card animate-in visible" data-service="${escapeHtml(s.name.toLowerCase().replace(/\s+/g, '-'))}">
          ${s.image_url
            ? `<div class="service-img"><img src="${escapeHtml(s.image_url)}" alt="${escapeHtml(s.name)}" loading="lazy"></div>`
            : `<div class="service-icon">${s.icon || '&#127912;'}</div>`
          }
          <h3>${escapeHtml(s.name)}</h3>
          <p class="service-desc">${escapeHtml(s.description || '')}</p>
          <button class="btn btn-primary btn-sm order-btn" data-service="${escapeHtml(s.name.toLowerCase().replace(/\s+/g, '-'))}">Order Now</button>
        </div>
      `).join('');

      // Update booking form service dropdown with DB services
      updateBookingDropdown(services);

      // Re-attach order button listeners
      grid.querySelectorAll('.order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const bookingSection = document.getElementById('booking');
          if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });
    } catch (err) {
      console.error('Error loading services:', err);
    }
  }

  /* ---------- Update Booking Form Service Dropdown ---------- */
  function updateBookingDropdown(services) {
    const select = document.getElementById('serviceTypeSelect');
    if (!select || !services || services.length === 0) return;

    // Keep the placeholder option, replace the rest
    select.innerHTML = '<option value="">Choose a service...</option>';
    services.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.name.toLowerCase().replace(/\s+/g, '-');
      opt.textContent = s.name;
      select.appendChild(opt);
    });
  }

  /* ---------- Dynamic Pricing on Service Cards ---------- */
  async function loadPricing() {
    try {
      const { data: pricing, error } = await sb
        .from('pricing')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error || !pricing || pricing.length === 0) return;

      // Update service cards with pricing info if available
      pricing.forEach(p => {
        const cards = document.querySelectorAll('.service-card');
        cards.forEach(card => {
          const cardName = card.querySelector('h3');
          if (cardName && cardName.textContent.toLowerCase() === p.name.toLowerCase()) {
            let priceEl = card.querySelector('.service-price');
            if (!priceEl) {
              priceEl = document.createElement('div');
              priceEl.className = 'service-price';
              const btn = card.querySelector('.order-btn');
              if (btn) card.insertBefore(priceEl, btn);
            }
            if (p.pricing_type === 'fixed' && p.price) {
              priceEl.textContent = `Starting at $${parseFloat(p.price).toFixed(2)}`;
            } else {
              priceEl.textContent = 'Request a Quote';
            }
          }
        });
      });
    } catch (err) {
      console.error('Error loading pricing:', err);
    }
  }

  /* ---------- Footer Contact ---------- */
  async function loadFooterContact() {
    try {
      const { data, error } = await sb
        .from('site_content')
        .select('*')
        .eq('key', 'contact')
        .single();

      if (error || !data || !data.value) return;

      const c = data.value;
      const setFooter = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) el.textContent = val;
      };

      setFooter('footer-address', c.address);
      setFooter('footer-phone', c.phone);
      setFooter('footer-email', c.email);
      setFooter('footer-hours', c.hours);
    } catch (err) {
      // Keep defaults
    }
  }

  /* ---------- Google Analytics ---------- */
  async function loadAnalytics() {
    try {
      const { data, error } = await sb
        .from('site_content')
        .select('*')
        .eq('key', 'analytics')
        .single();

      if (error || !data || !data.value || !data.value.measurementId) return;

      const id = data.value.measurementId;

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', id);
    } catch (err) {
      // Analytics is optional
    }
  }

  /* ---------- Add footer ID for dynamic contact update ---------- */
  function addFooterIds() {
    const footerCols = document.querySelectorAll('.footer-col');
    const lastCol = footerCols[footerCols.length - 1];
    if (!lastCol) return;

    const items = lastCol.querySelectorAll('.contact-item');
    const ids = ['footer-address', 'footer-phone', 'footer-email', 'footer-hours'];
    items.forEach((item, i) => {
      if (ids[i]) {
        const span = item.querySelector('span:last-child') || item;
        if (!span.id) span.id = ids[i];
      }
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', async () => {
    addFooterIds();
    await Promise.all([
      applySections(),
      loadProducts(),
      loadServices(),
      loadPricing(),
      loadFooterContact(),
      loadAnalytics(),
    ]);
  });
})();
