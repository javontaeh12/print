document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     SERVICES DATA (used by search + cards)
     ============================================================ */
  const servicesList = [
    'Business Cards', 'Flyers & Leaflets', 'Posters', 'Brochures',
    'Stickers & Labels', 'Banners & Signs', 'Custom Packaging',
    'Invitations', 'Embossing', 'Foil Stamping', 'Die Cutting',
    'Letterpress', 'Matte Laminate', 'Gloss Laminate', 'Soft Touch Finish',
    'Spot UV', 'Envelopes', 'Notepads', 'Postcards', 'Door Hangers',
    'Booklets', 'Calendars', 'Menus', 'Presentation Folders'
  ];

  /* ============================================================
     SEARCH MODULE
     ============================================================ */
  const SearchModule = (() => {
    function init(inputEl, resultsEl) {
      if (!inputEl || !resultsEl) return;

      inputEl.addEventListener('input', () => {
        const q = inputEl.value.trim().toLowerCase();
        if (q.length < 1) { resultsEl.classList.remove('active'); resultsEl.innerHTML = ''; return; }
        const matches = servicesList.filter(s => s.toLowerCase().includes(q));
        if (matches.length === 0) {
          resultsEl.innerHTML = '<div class="search-no-results">No services found</div>';
        } else {
          resultsEl.innerHTML = matches.map(s => {
            const idx = s.toLowerCase().indexOf(q);
            const highlighted = s.slice(0, idx) + '<mark>' + s.slice(idx, idx + q.length) + '</mark>' + s.slice(idx + q.length);
            return `<div class="search-result-item">${highlighted}</div>`;
          }).join('');
        }
        resultsEl.classList.add('active');
      });

      resultsEl.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (item) {
          inputEl.value = item.textContent;
          resultsEl.classList.remove('active');
        }
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper') && !e.target.closest('.mobile-search')) {
          resultsEl.classList.remove('active');
        }
      });
    }

    // Desktop
    init(document.getElementById('searchInput'), document.getElementById('searchResults'));
    // Mobile
    const mobileInput = document.querySelector('.mobile-search-input');
    const mobileResults = document.querySelector('.mobile-search-results');
    init(mobileInput, mobileResults);
  })();

  /* ============================================================
     NAV MODULE
     ============================================================ */
  const NavModule = (() => {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const header = document.getElementById('header');
    const megaToggle = document.querySelector('.mobile-mega-toggle');
    const megaContent = document.querySelector('.mobile-mega-content');

    // Hamburger toggle
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

    // Mobile mega menu toggle
    if (megaToggle) {
      megaToggle.addEventListener('click', () => {
        megaToggle.classList.toggle('open');
        megaContent.classList.toggle('open');
      });
    }

    // Header scroll shadow
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    });
  })();

  /* ============================================================
     SCROLL MODULE — IntersectionObserver for animations + nav
     ============================================================ */
  const ScrollModule = (() => {
    // Animate elements on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));

    // Active nav highlighting
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { threshold: 0.3, rootMargin: '-72px 0px 0px 0px' });

    sections.forEach(sec => navObserver.observe(sec));
  })();

  /* ============================================================
     SERVICE CARDS — click-through to booking
     ============================================================ */
  const ServiceCards = (() => {
    document.querySelectorAll('.order-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const service = btn.dataset.service;
        const select = document.getElementById('serviceTypeSelect');
        if (select) {
          select.value = service;
        }
        // Navigate to booking and go to step 2
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          BookingForm.goToStep(2);
        }, 600);
      });
    });
  })();

  /* ============================================================
     BOOKING FORM — multi-step wizard
     ============================================================ */
  const BookingForm = (() => {
    const form = document.getElementById('bookingForm');
    const steps = form.querySelectorAll('.form-step');
    const indicators = document.querySelectorAll('.step-indicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const modal = document.getElementById('confirmationModal');
    const modalClose = document.getElementById('modalCloseBtn');
    const qtySelect = form.querySelector('[name="quantity"]');
    const customQtyGroup = document.getElementById('customQtyGroup');
    let currentStep = 1;
    const totalSteps = steps.length;

    // Custom quantity toggle
    if (qtySelect) {
      qtySelect.addEventListener('change', () => {
        customQtyGroup.style.display = qtySelect.value === 'custom' ? '' : 'none';
      });
    }

    function goToStep(step) {
      if (step < 1 || step > totalSteps) return;
      // Mark completed steps
      for (let i = 1; i < step; i++) {
        indicators[i - 1].classList.remove('active');
        indicators[i - 1].classList.add('completed');
      }
      steps.forEach(s => s.classList.remove('active'));
      indicators.forEach((ind, i) => {
        if (i + 1 > step) { ind.classList.remove('active', 'completed'); }
      });

      steps[step - 1].classList.add('active');
      indicators[step - 1].classList.remove('completed');
      indicators[step - 1].classList.add('active');

      currentStep = step;
      prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
      nextBtn.textContent = currentStep === totalSteps ? 'Submit Order' : 'Next Step \u2192';
    }

    function validateStep(step) {
      const stepEl = steps[step - 1];
      const required = stepEl.querySelectorAll('[required]');
      let valid = true;
      required.forEach(field => {
        field.classList.remove('error');
        if (!field.value.trim()) {
          field.classList.add('error');
          valid = false;
        }
        if (field.type === 'email' && field.value.trim()) {
          const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRe.test(field.value.trim())) {
            field.classList.add('error');
            valid = false;
          }
        }
      });
      // Custom quantity validation
      if (step === 2 && qtySelect.value === 'custom') {
        const cq = form.querySelector('[name="customQuantity"]');
        cq.classList.remove('error');
        if (!cq.value || parseInt(cq.value) < 1) {
          cq.classList.add('error');
          valid = false;
        }
      }
      return valid;
    }

    nextBtn.addEventListener('click', () => {
      if (!validateStep(currentStep)) return;
      if (currentStep === totalSteps) {
        // Submit — show modal
        modal.classList.add('active');
        return;
      }
      goToStep(currentStep + 1);
    });

    prevBtn.addEventListener('click', () => {
      goToStep(currentStep - 1);
    });

    modalClose.addEventListener('click', () => {
      modal.classList.remove('active');
      form.reset();
      goToStep(1);
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) { modalClose.click(); }
    });

    // Clear errors on input
    form.addEventListener('input', (e) => {
      e.target.classList.remove('error');
    });

    return { goToStep };
  })();

  /* ============================================================
     DESIGNER TOOL — Canvas-based business card designer
     ============================================================ */
  const DesignerTool = (() => {
    const canvas = document.getElementById('designCanvas');
    const ctx = canvas.getContext('2d');

    // State
    let elements = { front: [], back: [] };
    let currentSide = 'front';
    let bgColors = { front: '#ffffff', back: '#ffffff' };
    let selectedIdx = -1;
    let dragging = false;
    let dragOffsetX = 0, dragOffsetY = 0;
    let history = [];
    let historyIdx = -1;

    // DOM refs
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const addTextBtn = document.getElementById('addTextBtn');
    const addImageBtn = document.getElementById('addImageBtn');
    const imageUploadInput = document.getElementById('imageUploadInput');
    const textInput = document.getElementById('textInput');
    const fontSelect = document.getElementById('fontSelect');
    const fontSizeInput = document.getElementById('fontSizeInput');
    const textColorInput = document.getElementById('textColorInput');
    const customBgColor = document.getElementById('customBgColor');
    const propEmpty = document.getElementById('propEmpty');
    const propControls = document.getElementById('propControls');
    const propContent = document.getElementById('propContent');
    const propFontSize = document.getElementById('propFontSize');
    const propColor = document.getElementById('propColor');
    const propFont = document.getElementById('propFont');
    const propDeleteBtn = document.getElementById('propDeleteBtn');

    function saveState() {
      history = history.slice(0, historyIdx + 1);
      history.push(JSON.stringify({ elements: JSON.parse(JSON.stringify(elements)), bgColors: { ...bgColors } }));
      historyIdx++;
      updateUndoRedo();
    }

    function restoreState(state) {
      const s = JSON.parse(state);
      // Deep copy elements, but preserve image objects
      const oldElements = elements;
      elements = { front: [], back: [] };
      ['front', 'back'].forEach(side => {
        s.elements[side].forEach(el => {
          if (el.type === 'image' && el.imgSrc) {
            const img = new Image();
            img.src = el.imgSrc;
            el.img = img;
          }
          elements[side].push(el);
        });
      });
      bgColors = s.bgColors;
      selectedIdx = -1;
      updateProps();
      render();
    }

    function updateUndoRedo() {
      undoBtn.disabled = historyIdx <= 0;
      redoBtn.disabled = historyIdx >= history.length - 1;
    }

    undoBtn.addEventListener('click', () => {
      if (historyIdx > 0) { historyIdx--; restoreState(history[historyIdx]); }
    });
    redoBtn.addEventListener('click', () => {
      if (historyIdx < history.length - 1) { historyIdx++; restoreState(history[historyIdx]); }
    });

    // Side toggle
    document.querySelectorAll('.side-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.side-toggle button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSide = btn.dataset.side;
        selectedIdx = -1;
        updateProps();
        render();
      });
    });

    // Background swatches
    document.querySelectorAll('#bgSwatches .swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('#bgSwatches .swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        bgColors[currentSide] = sw.dataset.color;
        customBgColor.value = sw.dataset.color;
        saveState();
        render();
      });
    });

    customBgColor.addEventListener('input', () => {
      bgColors[currentSide] = customBgColor.value;
      document.querySelectorAll('#bgSwatches .swatch').forEach(s => s.classList.remove('active'));
      saveState();
      render();
    });

    // Add Text
    addTextBtn.addEventListener('click', () => {
      const text = textInput.value.trim();
      if (!text) return;
      elements[currentSide].push({
        type: 'text',
        text,
        x: 100,
        y: 200,
        font: fontSelect.value,
        size: parseInt(fontSizeInput.value) || 24,
        color: textColorInput.value
      });
      textInput.value = '';
      saveState();
      render();
    });

    // Add Image
    addImageBtn.addEventListener('click', () => imageUploadInput.click());
    imageUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          const maxW = 200, maxH = 150;
          if (w > maxW) { h = h * (maxW / w); w = maxW; }
          if (h > maxH) { w = w * (maxH / h); h = maxH; }
          elements[currentSide].push({
            type: 'image',
            img,
            imgSrc: ev.target.result,
            x: 50,
            y: 50,
            w,
            h
          });
          saveState();
          render();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
      imageUploadInput.value = '';
    });

    // Templates
    document.querySelectorAll('.template-thumb').forEach(tmpl => {
      tmpl.addEventListener('click', () => {
        document.querySelectorAll('.template-thumb').forEach(t => t.classList.remove('active'));
        tmpl.classList.add('active');
        const name = tmpl.dataset.template;
        applyTemplate(name);
      });
    });

    function applyTemplate(name) {
      elements[currentSide] = [];
      if (name === 'minimal') {
        bgColors[currentSide] = '#ffffff';
        elements[currentSide].push({ type: 'text', text: 'Your Name', x: 200, y: 160, font: 'Inter', size: 32, color: '#0a1628' });
        elements[currentSide].push({ type: 'text', text: 'Job Title', x: 240, y: 210, font: 'Inter', size: 18, color: '#868e96' });
        elements[currentSide].push({ type: 'text', text: 'email@company.com', x: 210, y: 280, font: 'Inter', size: 14, color: '#adb5bd' });
        elements[currentSide].push({ type: 'text', text: '(555) 123-4567', x: 240, y: 310, font: 'Inter', size: 14, color: '#adb5bd' });
      } else if (name === 'bold') {
        bgColors[currentSide] = '#0a1628';
        elements[currentSide].push({ type: 'text', text: 'YOUR NAME', x: 160, y: 150, font: 'Inter', size: 36, color: '#00b4d8' });
        elements[currentSide].push({ type: 'text', text: 'CREATIVE DIRECTOR', x: 190, y: 200, font: 'Inter', size: 16, color: '#ffffff' });
        elements[currentSide].push({ type: 'text', text: 'www.yoursite.com', x: 220, y: 300, font: 'Inter', size: 14, color: '#90e0ef' });
      } else if (name === 'classic') {
        bgColors[currentSide] = '#2c3e50';
        elements[currentSide].push({ type: 'text', text: 'Your Name', x: 200, y: 150, font: 'Playfair Display', size: 34, color: '#ffffff' });
        elements[currentSide].push({ type: 'text', text: 'Senior Designer', x: 230, y: 200, font: 'Georgia', size: 16, color: '#ddd' });
        elements[currentSide].push({ type: 'text', text: 'hello@studio.com | (555) 987-6543', x: 130, y: 300, font: 'Georgia', size: 13, color: '#bbb' });
      }
      customBgColor.value = bgColors[currentSide];
      document.querySelectorAll('#bgSwatches .swatch').forEach(s => s.classList.remove('active'));
      saveState();
      render();
    }

    // Clear
    clearBtn.addEventListener('click', () => {
      elements[currentSide] = [];
      bgColors[currentSide] = '#ffffff';
      customBgColor.value = '#ffffff';
      document.querySelectorAll('#bgSwatches .swatch').forEach(s => s.classList.remove('active'));
      document.querySelector('#bgSwatches .swatch[data-color="#ffffff"]').classList.add('active');
      selectedIdx = -1;
      updateProps();
      saveState();
      render();
    });

    // Download
    downloadBtn.addEventListener('click', () => {
      const sel = selectedIdx;
      selectedIdx = -1;
      render();
      const link = document.createElement('a');
      link.download = `business-card-${currentSide}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      selectedIdx = sel;
      render();
    });

    // Render
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Background
      ctx.fillStyle = bgColors[currentSide];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Elements
      const els = elements[currentSide];
      els.forEach((el, i) => {
        if (el.type === 'text') {
          ctx.font = `${el.size}px ${el.font}`;
          ctx.fillStyle = el.color;
          ctx.textBaseline = 'top';
          ctx.fillText(el.text, el.x, el.y);
          // Compute bounds for selection
          const metrics = ctx.measureText(el.text);
          el._w = metrics.width;
          el._h = el.size * 1.2;
        } else if (el.type === 'image' && el.img) {
          try { ctx.drawImage(el.img, el.x, el.y, el.w, el.h); } catch (e) {}
          el._w = el.w;
          el._h = el.h;
        }
        // Selection outline
        if (i === selectedIdx) {
          ctx.save();
          ctx.strokeStyle = '#00b4d8';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          const pad = 4;
          ctx.strokeRect(el.x - pad, el.y - pad, (el._w || 100) + pad * 2, (el._h || 40) + pad * 2);
          ctx.setLineDash([]);
          // Corner handles
          const corners = [
            [el.x - pad, el.y - pad],
            [el.x + (el._w || 100) + pad, el.y - pad],
            [el.x - pad, el.y + (el._h || 40) + pad],
            [el.x + (el._w || 100) + pad, el.y + (el._h || 40) + pad]
          ];
          ctx.fillStyle = '#00b4d8';
          corners.forEach(([cx, cy]) => {
            ctx.fillRect(cx - 4, cy - 4, 8, 8);
          });
          ctx.restore();
        }
      });
    }

    // Hit test
    function hitTest(mx, my) {
      const els = elements[currentSide];
      for (let i = els.length - 1; i >= 0; i--) {
        const el = els[i];
        const w = el._w || el.w || 100;
        const h = el._h || el.h || 40;
        if (mx >= el.x && mx <= el.x + w && my >= el.y && my <= el.y + h) {
          return i;
        }
      }
      return -1;
    }

    function getCanvasCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    // Mouse / touch events
    function onPointerDown(e) {
      e.preventDefault();
      const { x, y } = getCanvasCoords(e);
      const idx = hitTest(x, y);
      selectedIdx = idx;
      updateProps();
      if (idx >= 0) {
        dragging = true;
        const el = elements[currentSide][idx];
        dragOffsetX = x - el.x;
        dragOffsetY = y - el.y;
        canvas.style.cursor = 'grabbing';
      }
      render();
    }

    function onPointerMove(e) {
      if (!dragging) return;
      e.preventDefault();
      const { x, y } = getCanvasCoords(e);
      const el = elements[currentSide][selectedIdx];
      if (el) {
        el.x = x - dragOffsetX;
        el.y = y - dragOffsetY;
        render();
      }
    }

    function onPointerUp() {
      if (dragging) {
        dragging = false;
        canvas.style.cursor = 'default';
        saveState();
      }
    }

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('mouseleave', onPointerUp);
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    canvas.addEventListener('touchmove', onPointerMove, { passive: false });
    canvas.addEventListener('touchend', onPointerUp);

    // Properties panel
    function updateProps() {
      if (selectedIdx < 0 || !elements[currentSide][selectedIdx]) {
        propEmpty.style.display = '';
        propControls.style.display = 'none';
        return;
      }
      propEmpty.style.display = 'none';
      propControls.style.display = '';
      const el = elements[currentSide][selectedIdx];
      if (el.type === 'text') {
        propContent.value = el.text;
        propContent.parentElement.style.display = '';
        propFontSize.value = el.size;
        propFontSize.parentElement.style.display = '';
        propColor.value = el.color;
        propColor.parentElement.style.display = '';
        propFont.value = el.font;
        propFont.parentElement.style.display = '';
      } else {
        propContent.parentElement.style.display = 'none';
        propFontSize.parentElement.style.display = 'none';
        propColor.parentElement.style.display = 'none';
        propFont.parentElement.style.display = 'none';
      }
    }

    propContent.addEventListener('input', () => {
      if (selectedIdx < 0) return;
      elements[currentSide][selectedIdx].text = propContent.value;
      render();
    });
    propContent.addEventListener('change', saveState);

    propFontSize.addEventListener('input', () => {
      if (selectedIdx < 0) return;
      elements[currentSide][selectedIdx].size = parseInt(propFontSize.value) || 16;
      render();
    });
    propFontSize.addEventListener('change', saveState);

    propColor.addEventListener('input', () => {
      if (selectedIdx < 0) return;
      elements[currentSide][selectedIdx].color = propColor.value;
      render();
    });
    propColor.addEventListener('change', saveState);

    propFont.addEventListener('change', () => {
      if (selectedIdx < 0) return;
      elements[currentSide][selectedIdx].font = propFont.value;
      saveState();
      render();
    });

    propDeleteBtn.addEventListener('click', () => {
      if (selectedIdx < 0) return;
      elements[currentSide].splice(selectedIdx, 1);
      selectedIdx = -1;
      updateProps();
      saveState();
      render();
    });

    // Initial render + state
    saveState();
    render();
  })();

  /* ============================================================
     FILE UPLOAD MODULE
     ============================================================ */
  const FileUpload = (() => {
    const zone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const previews = document.getElementById('uploadPreviews');
    const maxSize = 50 * 1024 * 1024; // 50 MB
    const allowedExts = ['pdf','ai','psd','eps','png','jpg','jpeg','svg','tiff','tif'];
    let files = [];

    const fileIcons = {
      pdf: '📄', ai: '🎨', psd: '🖼️', eps: '📐',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️',
      svg: '📊', tiff: '🖼️', tif: '🖼️'
    };

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function addFiles(fileList) {
      Array.from(fileList).forEach(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExts.includes(ext)) return;
        if (file.size > maxSize) return;
        if (files.find(f => f.name === file.name && f.size === file.size)) return;
        files.push(file);
      });
      renderPreviews();
    }

    function removeFile(idx) {
      files.splice(idx, 1);
      renderPreviews();
    }

    function renderPreviews() {
      previews.innerHTML = files.map((file, i) => {
        const ext = file.name.split('.').pop().toLowerCase();
        const icon = fileIcons[ext] || '📁';
        return `<div class="upload-card">
          <div class="upload-card-icon">${icon}</div>
          <div class="upload-card-info">
            <div class="name">${file.name}</div>
            <div class="size">${formatSize(file.size)}</div>
          </div>
          <button class="upload-card-remove" data-idx="${i}">&times;</button>
        </div>`;
      }).join('');
    }

    previews.addEventListener('click', (e) => {
      const btn = e.target.closest('.upload-card-remove');
      if (btn) removeFile(parseInt(btn.dataset.idx));
    });

    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
    zone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      addFiles(fileInput.files);
      fileInput.value = '';
    });

    // Drag and drop
    ['dragenter', 'dragover'].forEach(evt => {
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
      });
    });
    zone.addEventListener('drop', (e) => {
      addFiles(e.dataTransfer.files);
    });
  })();

});
