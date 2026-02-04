/* ========================================
   PrintCraft Studio — pages.js
   Shared JS for About, Clients, Contact pages
   Loads data from Supabase and renders on page
   ======================================== */

const SUPABASE_URL = 'https://bfdpgapvrnlegizpjflf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZHBnYXB2cm5sZWdpenBqZmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjU5NzEsImV4cCI6MjA4NTgwMTk3MX0.zwZwS8zryRpuVYzzCkeujoI3fNcylvctd_v--_3ZAcU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- Hamburger Menu (shared across pages) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile nav on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Detect current page and load appropriate data
  const path = window.location.pathname;
  if (path.includes('about')) {
    loadAboutPage();
  } else if (path.includes('clients')) {
    loadClientsPage();
  } else if (path.includes('contact')) {
    loadContactPage();
  }

  // Load footer contact info on all pages
  loadFooterContact();

  // Load Google Analytics on all pages
  loadAnalytics();
});

/* ---------- About Page ---------- */
async function loadAboutPage() {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'about')
      .single();

    if (error || !data || !data.value) return;

    const about = data.value;

    // Our Story
    if (about.content) {
      setContentBlock('about-story-body', about.content);
    }
    if (about.image) {
      setContentImage('about-story-image', about.image);
    }

    // Our Mission
    if (about.mission) {
      setContentBlock('about-mission-body', about.mission);
    }

    // Heading / Subheading
    if (about.heading) {
      const heroH1 = document.querySelector('.page-hero h1');
      if (heroH1) heroH1.textContent = about.heading;
    }
    if (about.subheading) {
      const heroP = document.querySelector('.page-hero p');
      if (heroP) heroP.textContent = about.subheading;
    }

    // Year founded
    if (about.year) {
      const yearEl = document.getElementById('about-year');
      if (yearEl) yearEl.textContent = about.year;
    }
  } catch (err) {
    console.error('Error loading about page:', err);
  }
}

function setContentBlock(id, content) {
  const el = document.getElementById(id);
  if (el && content) {
    el.innerHTML = content.split('\n').map(p => p.trim() ? `<p>${escapeHtml(p)}</p>` : '').join('');
  }
}

function setContentImage(id, url) {
  const el = document.getElementById(id);
  if (el && url) {
    el.innerHTML = `<img src="${escapeHtml(url)}" alt="" loading="lazy">`;
  }
}

/* ---------- Clients Page ---------- */
async function loadClientsPage() {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    const grid = document.getElementById('clients-grid');
    if (!grid) return;

    if (!clients || clients.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span>&#127970;</span>
          <p>Our client showcase is coming soon.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = clients.map(client => `
      <div class="client-card">
        ${client.logo_url
          ? `<img src="${escapeHtml(client.logo_url)}" alt="${escapeHtml(client.name)}" loading="lazy">`
          : `<div class="client-logo-placeholder">${escapeHtml(client.name.charAt(0))}</div>`
        }
        <h3>${escapeHtml(client.name)}</h3>
        ${client.website ? `<a href="${escapeHtml(client.website)}" target="_blank" rel="noopener noreferrer" class="client-website-link">${escapeHtml(client.website.replace(/^https?:\/\//, ''))}</a>` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading clients:', err);
    const grid = document.getElementById('clients-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          <span>&#9888;</span>
          <p>Unable to load clients. Please try again later.</p>
        </div>
      `;
    }
  }
}

/* ---------- Contact Page ---------- */
async function loadContactPage() {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'contact')
      .single();

    if (error || !data || !data.value) return;

    const c = data.value;

    if (c.address) setText('contact-address', c.address);
    if (c.phone) setText('contact-phone', c.phone);
    if (c.email) setText('contact-email', c.email);
    if (c.hours) setText('contact-hours', c.hours);

    if (c.mapUrl) {
      const mapContainer = document.getElementById('map-container');
      if (mapContainer) {
        mapContainer.innerHTML = `<iframe src="${escapeHtml(c.mapUrl)}" width="100%" height="100%" style="border:0;border-radius:12px" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
      }
    }

    // Social links
    const socialContainer = document.getElementById('social-links');
    if (socialContainer) {
      const socials = [];
      if (c.facebook) socials.push({ platform: 'Facebook', url: c.facebook, icon: 'f' });
      if (c.instagram) socials.push({ platform: 'Instagram', url: c.instagram, icon: 'ig' });
      if (c.twitter) socials.push({ platform: 'Twitter', url: c.twitter, icon: 'X' });
      if (c.linkedin) socials.push({ platform: 'LinkedIn', url: c.linkedin, icon: 'in' });

      if (socials.length > 0) {
        socialContainer.innerHTML = socials.map(s => `
          <a href="${escapeHtml(s.url)}" class="social-link" target="_blank" rel="noopener noreferrer" title="${escapeHtml(s.platform)}">
            ${escapeHtml(s.icon)}
          </a>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading contact page:', err);
  }

  // Contact form submission
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', handleContactSubmit);
  }
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('.contact-submit');
  const originalText = btn.textContent;

  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
    form.reset();
  } catch (err) {
    showToast('Failed to send message. Please try again.', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

/* ---------- Footer Contact (shared) ---------- */
async function loadFooterContact() {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'contact')
      .single();

    if (error || !data || !data.value) return;

    const c = data.value;
    if (c.address) setAllText('footer-address', c.address);
    if (c.phone) setAllText('footer-phone', c.phone);
    if (c.email) setAllText('footer-email', c.email);
    if (c.hours) setAllText('footer-hours', c.hours);
  } catch (err) {
    // Silently fail — keep default footer content
  }
}

/* ---------- Google Analytics ---------- */
async function loadAnalytics() {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'analytics')
      .single();

    if (error || !data || !data.value || !data.value.measurementId) return;

    const id = data.value.measurementId;

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', id);
  } catch (err) {
    // Silently fail — analytics is optional
  }
}

/* ---------- Helpers ---------- */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

function setAllText(id, text) {
  const els = document.querySelectorAll(`#${id}`);
  els.forEach(el => { if (text) el.textContent = text; });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
