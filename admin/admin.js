// ========================================
// PrintCraft Studio — Admin Portal JS
// ========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------- Config ----------
// Replace these once the Supabase project is created
const SUPABASE_URL = 'https://bfdpgapvrnlegizpjflf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZHBnYXB2cm5sZWdpenBqZmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjU5NzEsImV4cCI6MjA4NTgwMTk3MX0.zwZwS8zryRpuVYzzCkeujoI3fNcylvctd_v--_3ZAcU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- Auth Guard ----------
// Wait for Supabase to process OAuth callback tokens in URL hash
// This is critical: after Google OAuth redirect, tokens are in the URL fragment
// and need to be exchanged for a session before we can check auth state
const { data: { session: initialSession }, error: authError } = await supabase.auth.getSession();

// If no session yet, listen for the auth state change from the OAuth callback
let session = initialSession;
if (!session && window.location.hash) {
  // OAuth callback — wait for Supabase to process the hash tokens
  session = await new Promise((resolve) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === 'SIGNED_IN' && sess) {
        subscription.unsubscribe();
        resolve(sess);
      }
    });
    // Timeout after 5 seconds — if no auth event fires, redirect to login
    setTimeout(() => {
      subscription.unsubscribe();
      resolve(null);
    }, 5000);
  });
}

if (!session) {
  window.location.href = '/admin/login.html';
  throw new Error('Not authenticated');
}

// Check if user is authorized admin
const { data: admin } = await supabase
  .from('admin_users')
  .select('id')
  .eq('email', session.user.email)
  .single();

if (!admin) {
  await supabase.auth.signOut();
  window.location.href = '/admin/login.html';
  throw new Error('Not authorized');
}

// Clean up the URL hash after successful auth
if (window.location.hash) {
  history.replaceState(null, '', window.location.pathname);
}

// Set admin info in sidebar
const user = session.user;
document.getElementById('adminName').textContent = user.user_metadata?.full_name || user.email;
const avatar = document.getElementById('adminAvatar');
if (user.user_metadata?.avatar_url) {
  avatar.src = user.user_metadata.avatar_url;
  avatar.alt = user.user_metadata.full_name || 'Admin';
} else {
  avatar.style.display = 'none';
}

// ---------- Logout ----------
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = '/admin/login.html';
});

// ---------- Sidebar Navigation ----------
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('pageTitle');

function switchTab(tabName) {
  navItems.forEach(item => item.classList.remove('active'));
  tabContents.forEach(tab => tab.classList.remove('active'));

  const activeNav = document.querySelector(`[data-tab="${tabName}"]`);
  const activeTab = document.getElementById(`tab-${tabName}`);

  if (activeNav) activeNav.classList.add('active');
  if (activeTab) activeTab.classList.add('active');

  pageTitle.textContent = activeNav?.querySelector('span')?.textContent || 'Dashboard';
}

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(item.dataset.tab);
  });
});

// Quick actions
document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.goto));
});

// Mobile menu
const sidebar = document.getElementById('sidebar');
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Close sidebar on tab switch (mobile)
navItems.forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 768) sidebar.classList.remove('open');
  });
});

// ---------- Toast Notifications ----------
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3500);
}

// ---------- Modal Helpers ----------
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

// ---------- Products CRUD ----------
let products = [];

async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) { showToast('Failed to load products', 'error'); return; }
  products = data || [];
  renderProducts();
  updateCategoryFilters('product', products);
  document.getElementById('statProducts').textContent = products.length;
}

function renderProducts(filter = '', category = '') {
  const grid = document.getElementById('productsGrid');
  let filtered = products;

  if (category) filtered = filtered.filter(p => p.category === category);
  if (filter) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>No products found.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="item-card">
      ${p.image_url ? `<div class="item-card-img"><img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}"></div>` : ''}
      <div class="item-card-body">
        <div class="item-card-category">${escapeHtml(p.category || 'Uncategorized')}</div>
        <div class="item-card-title">${escapeHtml(p.name)}</div>
        <div class="item-card-desc">${escapeHtml(p.description || '')}</div>
        <div class="item-card-footer">
          <span class="item-card-status ${p.is_active ? 'active' : 'inactive'}">${p.is_active ? 'Active' : 'Inactive'}</span>
          <div class="item-card-actions">
            <button class="btn-icon" onclick="editProduct('${p.id}')" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon delete" onclick="deleteProduct('${p.id}')" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Product image upload zone
const productImageZone = document.getElementById('productImageZone');
const productImageFileInput = document.getElementById('productImageFile');

productImageZone.addEventListener('click', () => productImageFileInput.click());
productImageZone.addEventListener('dragover', (e) => { e.preventDefault(); productImageZone.style.borderColor = '#00b4d8'; });
productImageZone.addEventListener('dragleave', () => { productImageZone.style.borderColor = ''; });
productImageZone.addEventListener('drop', (e) => {
  e.preventDefault();
  productImageZone.style.borderColor = '';
  if (e.dataTransfer.files.length) handleProductImageFile(e.dataTransfer.files[0]);
});

productImageFileInput.addEventListener('change', () => {
  if (productImageFileInput.files.length) handleProductImageFile(productImageFileInput.files[0]);
});

async function handleProductImageFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file', 'error');
    return;
  }
  const fileName = `products/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) { showToast('Upload failed: ' + error.message, 'error'); return; }
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
  const url = urlData.publicUrl;
  document.getElementById('productImage').value = url;
  document.getElementById('productImageImg').src = url;
  document.getElementById('productImagePreview').style.display = 'flex';
  productImageZone.style.display = 'none';
  showToast('Image uploaded', 'success');
}

document.getElementById('removeProductImageBtn').addEventListener('click', () => {
  document.getElementById('productImage').value = '';
  document.getElementById('productImagePreview').style.display = 'none';
  productImageZone.style.display = '';
});

document.getElementById('addProductBtn').addEventListener('click', () => {
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productImage').value = '';
  document.getElementById('productImagePreview').style.display = 'none';
  productImageZone.style.display = '';
  document.getElementById('productModalTitle').textContent = 'Add Product';
  document.getElementById('productActive').checked = true;
  openModal('productModal');
});

window.editProduct = function(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('productId').value = p.id;
  document.getElementById('productName').value = p.name;
  document.getElementById('productCategory').value = p.category || '';
  document.getElementById('productCategoryCustom').value = '';
  document.getElementById('productDescription').value = p.description || '';
  document.getElementById('productImage').value = p.image_url || '';
  document.getElementById('productOrder').value = p.display_order || 0;
  document.getElementById('productActive').checked = p.is_active;
  document.getElementById('productModalTitle').textContent = 'Edit Product';

  if (p.image_url) {
    document.getElementById('productImageImg').src = p.image_url;
    document.getElementById('productImagePreview').style.display = 'flex';
    productImageZone.style.display = 'none';
  } else {
    document.getElementById('productImagePreview').style.display = 'none';
    productImageZone.style.display = '';
  }

  openModal('productModal');
};

window.deleteProduct = async function(id) {
  if (!confirm('Delete this product?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) { showToast('Failed to delete product', 'error'); return; }
  showToast('Product deleted', 'success');
  loadProducts();
};

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const category = document.getElementById('productCategoryCustom').value || document.getElementById('productCategory').value;

  const payload = {
    name: document.getElementById('productName').value,
    category,
    description: document.getElementById('productDescription').value,
    image_url: document.getElementById('productImage').value || null,
    display_order: parseInt(document.getElementById('productOrder').value) || 0,
    is_active: document.getElementById('productActive').checked,
  };

  let error;
  if (id) {
    ({ error } = await supabase.from('products').update(payload).eq('id', id));
  } else {
    ({ error } = await supabase.from('products').insert(payload));
  }

  if (error) { showToast('Failed to save product: ' + error.message, 'error'); return; }
  showToast(id ? 'Product updated' : 'Product added', 'success');
  closeModal('productModal');
  loadProducts();
});

document.getElementById('productSearch').addEventListener('input', (e) => {
  renderProducts(e.target.value, document.getElementById('productCategoryFilter').value);
});

document.getElementById('productCategoryFilter').addEventListener('change', (e) => {
  renderProducts(document.getElementById('productSearch').value, e.target.value);
});

// ---------- Services CRUD ----------
let services = [];

async function loadServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) { showToast('Failed to load services', 'error'); return; }
  services = data || [];
  renderServices();
  updateCategoryFilters('service', services);
  document.getElementById('statServices').textContent = services.length;
}

function renderServices(filter = '', category = '') {
  const grid = document.getElementById('servicesGrid');
  let filtered = services;

  if (category) filtered = filtered.filter(s => s.category === category);
  if (filter) filtered = filtered.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>No services found.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(s => `
    <div class="item-card">
      ${s.image_url ? `<div class="item-card-img"><img src="${escapeHtml(s.image_url)}" alt="${escapeHtml(s.name)}"></div>` : ''}
      <div class="item-card-body">
        <div class="item-card-category">${escapeHtml(s.category || 'Uncategorized')}</div>
        <div class="item-card-title">${s.icon ? escapeHtml(s.icon) + ' ' : ''}${escapeHtml(s.name)}</div>
        <div class="item-card-desc">${escapeHtml(s.description || '')}</div>
        <div class="item-card-footer">
          <span class="item-card-status ${s.is_active ? 'active' : 'inactive'}">${s.is_active ? 'Active' : 'Inactive'}</span>
          <div class="item-card-actions">
            <button class="btn-icon" onclick="editService('${s.id}')" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon delete" onclick="deleteService('${s.id}')" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Service image upload zone
const serviceImageZone = document.getElementById('serviceImageZone');
const serviceImageFileInput = document.getElementById('serviceImageFile');

serviceImageZone.addEventListener('click', () => serviceImageFileInput.click());
serviceImageZone.addEventListener('dragover', (e) => { e.preventDefault(); serviceImageZone.style.borderColor = '#00b4d8'; });
serviceImageZone.addEventListener('dragleave', () => { serviceImageZone.style.borderColor = ''; });
serviceImageZone.addEventListener('drop', (e) => {
  e.preventDefault();
  serviceImageZone.style.borderColor = '';
  if (e.dataTransfer.files.length) handleServiceImageFile(e.dataTransfer.files[0]);
});

serviceImageFileInput.addEventListener('change', () => {
  if (serviceImageFileInput.files.length) handleServiceImageFile(serviceImageFileInput.files[0]);
});

async function handleServiceImageFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file', 'error');
    return;
  }
  const fileName = `services/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) { showToast('Upload failed: ' + error.message, 'error'); return; }
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
  const url = urlData.publicUrl;
  document.getElementById('serviceImageUrl').value = url;
  document.getElementById('serviceImageImg').src = url;
  document.getElementById('serviceImagePreview').style.display = 'flex';
  serviceImageZone.style.display = 'none';
  showToast('Image uploaded', 'success');
}

document.getElementById('removeServiceImageBtn').addEventListener('click', () => {
  document.getElementById('serviceImageUrl').value = '';
  document.getElementById('serviceImagePreview').style.display = 'none';
  serviceImageZone.style.display = '';
});

document.getElementById('addServiceBtn').addEventListener('click', () => {
  document.getElementById('serviceForm').reset();
  document.getElementById('serviceId').value = '';
  document.getElementById('serviceImageUrl').value = '';
  document.getElementById('serviceImagePreview').style.display = 'none';
  serviceImageZone.style.display = '';
  document.getElementById('serviceModalTitle').textContent = 'Add Service';
  document.getElementById('serviceActive').checked = true;
  openModal('serviceModal');
});

window.editService = function(id) {
  const s = services.find(x => x.id === id);
  if (!s) return;
  document.getElementById('serviceId').value = s.id;
  document.getElementById('serviceName').value = s.name;
  document.getElementById('serviceCategory').value = s.category || '';
  document.getElementById('serviceCategoryCustom').value = '';
  document.getElementById('serviceDescription').value = s.description || '';
  document.getElementById('serviceImageUrl').value = s.image_url || '';
  document.getElementById('serviceIcon').value = s.icon || '';
  document.getElementById('serviceOrder').value = s.display_order || 0;
  document.getElementById('serviceActive').checked = s.is_active;
  document.getElementById('serviceModalTitle').textContent = 'Edit Service';

  if (s.image_url) {
    document.getElementById('serviceImageImg').src = s.image_url;
    document.getElementById('serviceImagePreview').style.display = 'flex';
    serviceImageZone.style.display = 'none';
  } else {
    document.getElementById('serviceImagePreview').style.display = 'none';
    serviceImageZone.style.display = '';
  }

  openModal('serviceModal');
};

window.deleteService = async function(id) {
  if (!confirm('Delete this service?')) return;
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) { showToast('Failed to delete service', 'error'); return; }
  showToast('Service deleted', 'success');
  loadServices();
};

document.getElementById('serviceForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('serviceId').value;
  const category = document.getElementById('serviceCategoryCustom').value || document.getElementById('serviceCategory').value;

  const payload = {
    name: document.getElementById('serviceName').value,
    category,
    description: document.getElementById('serviceDescription').value,
    image_url: document.getElementById('serviceImageUrl').value || null,
    icon: document.getElementById('serviceIcon').value || null,
    display_order: parseInt(document.getElementById('serviceOrder').value) || 0,
    is_active: document.getElementById('serviceActive').checked,
  };

  let error;
  if (id) {
    ({ error } = await supabase.from('services').update(payload).eq('id', id));
  } else {
    ({ error } = await supabase.from('services').insert(payload));
  }

  if (error) { showToast('Failed to save service: ' + error.message, 'error'); return; }
  showToast(id ? 'Service updated' : 'Service added', 'success');
  closeModal('serviceModal');
  loadServices();
});

document.getElementById('serviceSearch').addEventListener('input', (e) => {
  renderServices(e.target.value, document.getElementById('serviceCategoryFilter').value);
});

document.getElementById('serviceCategoryFilter').addEventListener('change', (e) => {
  renderServices(document.getElementById('serviceSearch').value, e.target.value);
});

// ---------- Pricing CRUD ----------
let pricing = [];

async function loadPricing() {
  const { data, error } = await supabase
    .from('pricing')
    .select('*')
    .order('category', { ascending: true });

  if (error) { showToast('Failed to load pricing', 'error'); return; }
  pricing = data || [];
  renderPricing();
}

function renderPricing(filter = '', type = '') {
  const tbody = document.getElementById('pricingTableBody');
  let filtered = pricing;

  if (type) filtered = filtered.filter(p => p.pricing_type === type);
  if (filter) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><div class="empty-state"><p>No pricing entries found.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>${escapeHtml(p.category || '-')}</td>
      <td><span class="price-badge ${p.pricing_type}">${p.pricing_type === 'fixed' ? 'Fixed' : 'Quote'}</span></td>
      <td>${p.pricing_type === 'fixed' ? '$' + (p.price || 0).toFixed(2) : 'Request Quote'}</td>
      <td>${escapeHtml(p.unit || '-')}</td>
      <td>
        <div class="item-card-actions">
          <button class="btn-icon" onclick="editPricing('${p.id}')" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon delete" onclick="deletePricing('${p.id}')" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Toggle fixed price fields
document.getElementById('pricingType').addEventListener('change', (e) => {
  document.getElementById('fixedPriceFields').style.display = e.target.value === 'fixed' ? 'block' : 'none';
});

document.getElementById('addPricingBtn').addEventListener('click', () => {
  document.getElementById('pricingForm').reset();
  document.getElementById('pricingId').value = '';
  document.getElementById('pricingModalTitle').textContent = 'Add Price Entry';
  document.getElementById('pricingActive').checked = true;
  document.getElementById('fixedPriceFields').style.display = 'block';
  openModal('pricingModal');
});

window.editPricing = function(id) {
  const p = pricing.find(x => x.id === id);
  if (!p) return;
  document.getElementById('pricingId').value = p.id;
  document.getElementById('pricingName').value = p.name;
  document.getElementById('pricingCategory').value = p.category || '';
  document.getElementById('pricingType').value = p.pricing_type;
  document.getElementById('pricingAmount').value = p.price || '';
  document.getElementById('pricingUnit').value = p.unit || '';
  document.getElementById('pricingDescription').value = p.description || '';
  document.getElementById('pricingActive').checked = p.is_active;
  document.getElementById('fixedPriceFields').style.display = p.pricing_type === 'fixed' ? 'block' : 'none';
  document.getElementById('pricingModalTitle').textContent = 'Edit Price Entry';
  openModal('pricingModal');
};

window.deletePricing = async function(id) {
  if (!confirm('Delete this pricing entry?')) return;
  const { error } = await supabase.from('pricing').delete().eq('id', id);
  if (error) { showToast('Failed to delete pricing', 'error'); return; }
  showToast('Pricing deleted', 'success');
  loadPricing();
};

document.getElementById('pricingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('pricingId').value;

  const payload = {
    name: document.getElementById('pricingName').value,
    category: document.getElementById('pricingCategory').value || null,
    pricing_type: document.getElementById('pricingType').value,
    price: document.getElementById('pricingType').value === 'fixed'
      ? parseFloat(document.getElementById('pricingAmount').value) || 0
      : null,
    unit: document.getElementById('pricingUnit').value || null,
    description: document.getElementById('pricingDescription').value || null,
    is_active: document.getElementById('pricingActive').checked,
  };

  let error;
  if (id) {
    ({ error } = await supabase.from('pricing').update(payload).eq('id', id));
  } else {
    ({ error } = await supabase.from('pricing').insert(payload));
  }

  if (error) { showToast('Failed to save pricing: ' + error.message, 'error'); return; }
  showToast(id ? 'Pricing updated' : 'Pricing added', 'success');
  closeModal('pricingModal');
  loadPricing();
});

document.getElementById('pricingSearch').addEventListener('input', (e) => {
  renderPricing(e.target.value, document.getElementById('pricingTypeFilter').value);
});

document.getElementById('pricingTypeFilter').addEventListener('change', (e) => {
  renderPricing(document.getElementById('pricingSearch').value, e.target.value);
});

// ---------- Sections Manager ----------
const DEFAULT_SECTIONS = [
  { key: 'hero', name: 'Hero Banner', enabled: true, order: 0 },
  { key: 'services', name: 'Popular Services', enabled: true, order: 1 },
  { key: 'designer', name: 'Business Card Designer', enabled: true, order: 2 },
  { key: 'about', name: 'About Us', enabled: true, order: 3 },
  { key: 'clients', name: 'Our Clients', enabled: true, order: 4 },
  { key: 'booking', name: 'Booking Form', enabled: true, order: 5 },
  { key: 'upload', name: 'File Upload', enabled: true, order: 6 },
  { key: 'contact', name: 'Contact Us', enabled: true, order: 7 },
];

let sections = [];

async function loadSections() {
  const { data, error } = await supabase
    .from('page_sections')
    .select('*')
    .order('display_order', { ascending: true });

  if (error || !data || data.length === 0) {
    // Initialize with defaults
    sections = DEFAULT_SECTIONS.map((s, i) => ({
      ...s,
      display_order: i,
      is_enabled: s.enabled,
    }));
  } else {
    sections = data;
  }

  renderSections();
  document.getElementById('statSections').textContent = sections.filter(s => s.is_enabled).length;
}

function renderSections() {
  const list = document.getElementById('sectionsList');
  list.innerHTML = sections.map((s, i) => `
    <div class="section-item" draggable="true" data-index="${i}" data-key="${s.key}">
      <div class="section-drag-handle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>
      </div>
      <div class="section-info">
        <div class="section-name">${escapeHtml(s.name)}</div>
        <div class="section-key">${escapeHtml(s.key)}</div>
      </div>
      <label class="section-toggle">
        <input type="checkbox" ${s.is_enabled ? 'checked' : ''} data-key="${s.key}">
        <span class="toggle-slider"></span>
      </label>
    </div>
  `).join('');

  // Drag and drop
  initDragAndDrop();

  // Toggle handlers
  list.querySelectorAll('.section-toggle input').forEach(input => {
    input.addEventListener('change', (e) => {
      const key = e.target.dataset.key;
      const section = sections.find(s => s.key === key);
      if (section) section.is_enabled = e.target.checked;
      document.getElementById('statSections').textContent = sections.filter(s => s.is_enabled).length;
    });
  });
}

function initDragAndDrop() {
  const list = document.getElementById('sectionsList');
  let dragItem = null;

  list.querySelectorAll('.section-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      dragItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      dragItem = null;

      // Update order based on DOM
      const items = list.querySelectorAll('.section-item');
      items.forEach((el, i) => {
        const key = el.dataset.key;
        const section = sections.find(s => s.key === key);
        if (section) section.display_order = i;
      });

      sections.sort((a, b) => a.display_order - b.display_order);
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        list.appendChild(dragItem);
      } else {
        list.insertBefore(dragItem, afterElement);
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.section-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

document.getElementById('saveSectionsBtn').addEventListener('click', async () => {
  // Upsert all sections
  const payload = sections.map((s, i) => ({
    key: s.key,
    name: s.name,
    is_enabled: s.is_enabled,
    display_order: i,
  }));

  const { error } = await supabase
    .from('page_sections')
    .upsert(payload, { onConflict: 'key' });

  if (error) { showToast('Failed to save sections: ' + error.message, 'error'); return; }
  showToast('Section order saved', 'success');
});

// ---------- About Us ----------
// About image upload zone
const aboutImageZone = document.getElementById('aboutImageZone');
const aboutImageFileInput = document.getElementById('aboutImageFile');

aboutImageZone.addEventListener('click', () => aboutImageFileInput.click());
aboutImageZone.addEventListener('dragover', (e) => { e.preventDefault(); aboutImageZone.style.borderColor = '#00b4d8'; });
aboutImageZone.addEventListener('dragleave', () => { aboutImageZone.style.borderColor = ''; });
aboutImageZone.addEventListener('drop', (e) => {
  e.preventDefault();
  aboutImageZone.style.borderColor = '';
  if (e.dataTransfer.files.length) handleAboutImageFile(e.dataTransfer.files[0]);
});

aboutImageFileInput.addEventListener('change', () => {
  if (aboutImageFileInput.files.length) handleAboutImageFile(aboutImageFileInput.files[0]);
});

async function handleAboutImageFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file', 'error');
    return;
  }
  const fileName = `about/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) { showToast('Upload failed: ' + error.message, 'error'); return; }
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
  const url = urlData.publicUrl;
  document.getElementById('aboutImage').value = url;
  document.getElementById('aboutImageImg').src = url;
  document.getElementById('aboutImagePreview').style.display = 'flex';
  aboutImageZone.style.display = 'none';
  showToast('Image uploaded', 'success');
}

document.getElementById('removeAboutImageBtn').addEventListener('click', () => {
  document.getElementById('aboutImage').value = '';
  document.getElementById('aboutImagePreview').style.display = 'none';
  aboutImageZone.style.display = '';
});

async function loadAbout() {
  const { data } = await supabase
    .from('site_content')
    .select('*')
    .eq('key', 'about')
    .single();

  if (data?.value) {
    const about = data.value;
    document.getElementById('aboutHeading').value = about.heading || '';
    document.getElementById('aboutSubheading').value = about.subheading || '';
    document.getElementById('aboutContent').value = about.content || '';
    document.getElementById('aboutMission').value = about.mission || '';
    document.getElementById('aboutImage').value = about.image || '';
    document.getElementById('aboutYear').value = about.year || '';

    if (about.image) {
      document.getElementById('aboutImageImg').src = about.image;
      document.getElementById('aboutImagePreview').style.display = 'flex';
      aboutImageZone.style.display = 'none';
    } else {
      document.getElementById('aboutImagePreview').style.display = 'none';
      aboutImageZone.style.display = '';
    }
  }
}

document.getElementById('saveAboutBtn').addEventListener('click', async () => {
  const value = {
    heading: document.getElementById('aboutHeading').value,
    subheading: document.getElementById('aboutSubheading').value,
    content: document.getElementById('aboutContent').value,
    mission: document.getElementById('aboutMission').value,
    image: document.getElementById('aboutImage').value,
    year: document.getElementById('aboutYear').value,
  };

  const { error } = await supabase
    .from('site_content')
    .upsert({ key: 'about', value }, { onConflict: 'key' });

  if (error) { showToast('Failed to save About Us: ' + error.message, 'error'); return; }
  showToast('About Us saved', 'success');
});

// ---------- Clients CRUD ----------
let clients = [];

async function loadClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) { showToast('Failed to load clients', 'error'); return; }
  clients = data || [];
  renderClients();
  document.getElementById('statClients').textContent = clients.length;
}

function renderClients() {
  const grid = document.getElementById('clientsGrid');

  if (clients.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>No clients yet. Add your first client.</p></div>`;
    return;
  }

  grid.innerHTML = clients.map(c => `
    <div class="client-card">
      ${c.logo_url ? `<img class="client-logo" src="${escapeHtml(c.logo_url)}" alt="${escapeHtml(c.name)}">` : `<div class="client-logo" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;color:#adb5bd;">${escapeHtml(c.name.charAt(0))}</div>`}
      <div class="client-name">${escapeHtml(c.name)}</div>
      ${c.website ? `<a class="client-website" href="${escapeHtml(c.website)}" target="_blank">${escapeHtml(c.website.replace(/^https?:\/\//, ''))}</a>` : ''}
      <div class="client-actions">
        <button class="btn-icon" onclick="editClient('${c.id}')" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon delete" onclick="deleteClient('${c.id}')" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Client logo upload zone
const logoZone = document.getElementById('clientLogoZone');
const logoFileInput = document.getElementById('clientLogoFile');

logoZone.addEventListener('click', () => logoFileInput.click());
logoZone.addEventListener('dragover', (e) => { e.preventDefault(); logoZone.style.borderColor = '#00b4d8'; });
logoZone.addEventListener('dragleave', () => { logoZone.style.borderColor = ''; });
logoZone.addEventListener('drop', (e) => {
  e.preventDefault();
  logoZone.style.borderColor = '';
  if (e.dataTransfer.files.length) handleLogoFile(e.dataTransfer.files[0]);
});

logoFileInput.addEventListener('change', () => {
  if (logoFileInput.files.length) handleLogoFile(logoFileInput.files[0]);
});

async function handleLogoFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file', 'error');
    return;
  }

  // Upload to Supabase storage
  const fileName = `logos/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    showToast('Upload failed: ' + error.message, 'error');
    return;
  }

  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
  const url = urlData.publicUrl;

  document.getElementById('clientLogoUrl').value = url;
  document.getElementById('clientLogoImg').src = url;
  document.getElementById('clientLogoPreview').style.display = 'flex';
  logoZone.style.display = 'none';
}

document.getElementById('removeLogoBtn').addEventListener('click', () => {
  document.getElementById('clientLogoUrl').value = '';
  document.getElementById('clientLogoPreview').style.display = 'none';
  logoZone.style.display = '';
});

document.getElementById('addClientBtn').addEventListener('click', () => {
  document.getElementById('clientForm').reset();
  document.getElementById('clientId').value = '';
  document.getElementById('clientLogoUrl').value = '';
  document.getElementById('clientLogoPreview').style.display = 'none';
  logoZone.style.display = '';
  document.getElementById('clientModalTitle').textContent = 'Add Client';
  document.getElementById('clientActive').checked = true;
  openModal('clientModal');
});

window.editClient = function(id) {
  const c = clients.find(x => x.id === id);
  if (!c) return;
  document.getElementById('clientId').value = c.id;
  document.getElementById('clientName').value = c.name;
  document.getElementById('clientLogoUrl').value = c.logo_url || '';
  document.getElementById('clientWebsite').value = c.website || '';
  document.getElementById('clientOrder').value = c.display_order || 0;
  document.getElementById('clientActive').checked = c.is_active;
  document.getElementById('clientModalTitle').textContent = 'Edit Client';

  if (c.logo_url) {
    document.getElementById('clientLogoImg').src = c.logo_url;
    document.getElementById('clientLogoPreview').style.display = 'flex';
    logoZone.style.display = 'none';
  } else {
    document.getElementById('clientLogoPreview').style.display = 'none';
    logoZone.style.display = '';
  }

  openModal('clientModal');
};

window.deleteClient = async function(id) {
  if (!confirm('Delete this client?')) return;
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) { showToast('Failed to delete client', 'error'); return; }
  showToast('Client deleted', 'success');
  loadClients();
};

document.getElementById('clientForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('clientId').value;

  const payload = {
    name: document.getElementById('clientName').value,
    logo_url: document.getElementById('clientLogoUrl').value || null,
    website: document.getElementById('clientWebsite').value || null,
    display_order: parseInt(document.getElementById('clientOrder').value) || 0,
    is_active: document.getElementById('clientActive').checked,
  };

  let error;
  if (id) {
    ({ error } = await supabase.from('clients').update(payload).eq('id', id));
  } else {
    ({ error } = await supabase.from('clients').insert(payload));
  }

  if (error) { showToast('Failed to save client: ' + error.message, 'error'); return; }
  showToast(id ? 'Client updated' : 'Client added', 'success');
  closeModal('clientModal');
  loadClients();
});

// ---------- Contact ----------
async function loadContact() {
  const { data } = await supabase
    .from('site_content')
    .select('*')
    .eq('key', 'contact')
    .single();

  if (data?.value) {
    const c = data.value;
    document.getElementById('contactEmail').value = c.email || '';
    document.getElementById('contactPhone').value = c.phone || '';
    document.getElementById('contactAddress').value = c.address || '';
    document.getElementById('contactHours').value = c.hours || '';
    document.getElementById('contactMapUrl').value = c.mapUrl || '';
    document.getElementById('contactFacebook').value = c.facebook || '';
    document.getElementById('contactInstagram').value = c.instagram || '';
    document.getElementById('contactTwitter').value = c.twitter || '';
    document.getElementById('contactLinkedin').value = c.linkedin || '';
  }
}

document.getElementById('saveContactBtn').addEventListener('click', async () => {
  const value = {
    email: document.getElementById('contactEmail').value,
    phone: document.getElementById('contactPhone').value,
    address: document.getElementById('contactAddress').value,
    hours: document.getElementById('contactHours').value,
    mapUrl: document.getElementById('contactMapUrl').value,
    facebook: document.getElementById('contactFacebook').value,
    instagram: document.getElementById('contactInstagram').value,
    twitter: document.getElementById('contactTwitter').value,
    linkedin: document.getElementById('contactLinkedin').value,
  };

  const { error } = await supabase
    .from('site_content')
    .upsert({ key: 'contact', value }, { onConflict: 'key' });

  if (error) { showToast('Failed to save Contact: ' + error.message, 'error'); return; }
  showToast('Contact info saved', 'success');
});

// ---------- Analytics ----------
async function loadAnalytics() {
  const { data } = await supabase
    .from('site_content')
    .select('*')
    .eq('key', 'analytics')
    .single();

  if (data?.value?.measurementId) {
    document.getElementById('analyticsId').value = data.value.measurementId;
  }
}

document.getElementById('saveAnalyticsBtn').addEventListener('click', async () => {
  const measurementId = document.getElementById('analyticsId').value.trim();

  if (!measurementId) {
    showToast('Please enter a Measurement ID', 'error');
    return;
  }

  const { error } = await supabase
    .from('site_content')
    .upsert({ key: 'analytics', value: { measurementId } }, { onConflict: 'key' });

  if (error) { showToast('Failed to save Analytics ID: ' + error.message, 'error'); return; }
  showToast('Analytics ID saved. It will appear on the front-end.', 'success');
});

// ---------- Category Filter Helpers ----------
function updateCategoryFilters(type, items) {
  const selectId = type === 'product' ? 'productCategoryFilter' : 'serviceCategoryFilter';
  const select = document.getElementById(selectId);
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  // Keep "All Categories" option
  select.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

// ---------- Utilities ----------
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Initialize ----------
async function init() {
  await Promise.all([
    loadProducts(),
    loadServices(),
    loadPricing(),
    loadSections(),
    loadAbout(),
    loadClients(),
    loadContact(),
    loadAnalytics(),
  ]);
}

init();
