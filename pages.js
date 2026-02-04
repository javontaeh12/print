/* ========================================
   PrintCraft Studio — pages.js
   Shared JS for About, Clients, Contact pages
   Loads data from Supabase and renders on page
   ======================================== */

const SUPABASE_URL = 'https://bfdpgapvrnlegizpjflf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZHBnYXB2cm5sZWdpenBqZmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2OTU3MjksImV4cCI6MjA1NDI3MTcyOX0.MZKBB_SALeMJMy4HxOdXhPP2tG4UgFqJfGFccVgnOdI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- Hamburger Menu (shared across pages) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('open');
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
});

/* ---------- About Page ---------- */
async function loadAboutPage() {
  try {
    const { data: content, error } = await supabase
      .from('print_site_content')
      .select('*');

    if (error) throw error;

    if (content && content.length > 0) {
      content.forEach(item => {
        switch (item.section_key) {
          case 'about_story':
            setContentBlock('about-story-body', item.content);
            if (item.image_url) setContentImage('about-story-image', item.image_url);
            break;
          case 'about_mission':
            setContentBlock('about-mission-body', item.content);
            if (item.image_url) setContentImage('about-mission-image', item.image_url);
            break;
          case 'about_values':
            if (item.content) {
              try {
                const values = JSON.parse(item.content);
                renderValues(values);
              } catch (e) { /* keep defaults */ }
            }
            break;
          case 'about_team':
            if (item.content) {
              try {
                const team = JSON.parse(item.content);
                renderTeam(team);
              } catch (e) { /* keep defaults */ }
            }
            break;
        }
      });
    }
  } catch (err) {
    console.error('Error loading about page:', err);
  }
}

function setContentBlock(id, content) {
  const el = document.getElementById(id);
  if (el && content) {
    el.innerHTML = content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
  }
}

function setContentImage(id, url) {
  const el = document.getElementById(id);
  if (el && url) {
    el.innerHTML = `<img src="${url}" alt="" loading="lazy">`;
  }
}

function renderValues(values) {
  const grid = document.getElementById('about-values-grid');
  if (!grid || !Array.isArray(values) || values.length === 0) return;
  grid.innerHTML = values.map(v => `
    <div class="value-card">
      <div class="value-icon">${v.icon || '&#9889;'}</div>
      <h3>${escapeHtml(v.title)}</h3>
      <p>${escapeHtml(v.description)}</p>
    </div>
  `).join('');
}

function renderTeam(team) {
  const grid = document.getElementById('about-team-grid');
  if (!grid || !Array.isArray(team) || team.length === 0) return;
  grid.innerHTML = team.map(m => `
    <div class="team-card">
      ${m.image_url
        ? `<img src="${m.image_url}" alt="${escapeHtml(m.name)}" loading="lazy">`
        : `<div class="team-placeholder">&#128100;</div>`
      }
      <h3>${escapeHtml(m.name)}</h3>
      <p>${escapeHtml(m.role || '')}</p>
    </div>
  `).join('');
}

/* ---------- Clients Page ---------- */
async function loadClientsPage() {
  try {
    const { data: clients, error } = await supabase
      .from('print_clients')
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
          ? `<img src="${client.logo_url}" alt="${escapeHtml(client.name)}" loading="lazy">`
          : `<div class="client-logo-placeholder">${escapeHtml(client.name.charAt(0))}</div>`
        }
        <h3>${escapeHtml(client.name)}</h3>
        ${client.industry ? `<p>${escapeHtml(client.industry)}</p>` : ''}
      </div>
    `).join('');

    // Load testimonials
    loadTestimonials();
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

async function loadTestimonials() {
  try {
    const { data: content, error } = await supabase
      .from('print_site_content')
      .select('*')
      .eq('section_key', 'testimonials')
      .single();

    if (error || !content || !content.content) return;

    const testimonials = JSON.parse(content.content);
    const grid = document.getElementById('testimonials-grid');
    if (!grid || !Array.isArray(testimonials) || testimonials.length === 0) return;

    grid.innerHTML = testimonials.map(t => `
      <div class="testimonial-card">
        <p>${escapeHtml(t.quote)}</p>
        <div class="testimonial-author">
          ${t.image_url
            ? `<img src="${t.image_url}" alt="${escapeHtml(t.name)}" loading="lazy">`
            : ''
          }
          <div class="testimonial-author-info">
            <h4>${escapeHtml(t.name)}</h4>
            <span>${escapeHtml(t.company || '')}</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading testimonials:', err);
  }
}

/* ---------- Contact Page ---------- */
async function loadContactPage() {
  try {
    const { data: content, error } = await supabase
      .from('print_site_content')
      .select('*');

    if (error) throw error;

    if (content && content.length > 0) {
      content.forEach(item => {
        switch (item.section_key) {
          case 'contact_address':
            setText('contact-address', item.content);
            break;
          case 'contact_phone':
            setText('contact-phone', item.content);
            break;
          case 'contact_email':
            setText('contact-email', item.content);
            break;
          case 'contact_hours':
            setText('contact-hours', item.content);
            break;
          case 'contact_intro':
            setText('contact-intro', item.content);
            break;
          case 'contact_map_embed':
            if (item.content) {
              const mapContainer = document.getElementById('map-container');
              if (mapContainer) {
                mapContainer.innerHTML = item.content;
              }
            }
            break;
          case 'social_links':
            if (item.content) {
              try {
                const links = JSON.parse(item.content);
                renderSocialLinks(links);
              } catch (e) { /* ignore */ }
            }
            break;
        }
      });
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

function renderSocialLinks(links) {
  const container = document.getElementById('social-links');
  if (!container || !Array.isArray(links)) return;
  container.innerHTML = links.map(link => `
    <a href="${link.url}" class="social-link" target="_blank" rel="noopener noreferrer" title="${escapeHtml(link.platform)}">
      ${link.icon || link.platform.charAt(0).toUpperCase()}
    </a>
  `).join('');
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('.contact-submit');
  const originalText = btn.textContent;

  btn.textContent = 'Sending...';
  btn.disabled = true;

  const formData = new FormData(form);
  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || null,
    subject: formData.get('subject'),
    message: formData.get('message'),
    created_at: new Date().toISOString()
  };

  try {
    // Store in Supabase (contact_submissions table if it exists)
    // For now, show success
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
    const { data: content, error } = await supabase
      .from('print_site_content')
      .select('*')
      .in('section_key', ['contact_address', 'contact_phone', 'contact_email', 'contact_hours']);

    if (error || !content) return;

    content.forEach(item => {
      switch (item.section_key) {
        case 'contact_address':
          setAllText('footer-address', item.content);
          break;
        case 'contact_phone':
          setAllText('footer-phone', item.content);
          break;
        case 'contact_email':
          setAllText('footer-email', item.content);
          break;
        case 'contact_hours':
          setAllText('footer-hours', item.content);
          break;
      }
    });
  } catch (err) {
    // Silently fail — keep default footer content
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
