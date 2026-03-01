/* Al‑Yuma Ventures Investment Limited — Premium Enterprise V4/V5
   Minimal JS, no console errors, CMS-driven content (Decap CMS + JSON in /content)
*/
(function(){
  'use strict';

  const $ = (sel, root=document)=>root.querySelector(sel);
  const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));

  const state = {
    settings: null,
    ticker: null,
    services: [],
    projects: [],
    branches: [],
    testimonials: [],
    certifications: [],
    investor: null,
    tender: null,
    clients: []
  };

  function safeText(v, fallback=''){
    return (typeof v === 'string' && v.trim()) ? v : fallback;
  }

  async function loadJSON(path, fallback){
    try{
      const res = await fetch(path, {cache:'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      return await res.json();
    }catch(e){
      return fallback;
    }
  }

  function applyTheme(theme){
    const t = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('ay_theme', t);
    const icon = $('#themeIcon');
    if(icon){
      icon.className = t === 'dark' ? 'bi bi-moon-stars-fill' : 'bi bi-brightness-high-fill';
    }
  }

  function initThemeToggle(defaultTheme){
    const stored = localStorage.getItem('ay_theme');
    applyTheme(stored || defaultTheme || 'light');
    const btn = $('#themeToggle');
    if(btn){
      btn.addEventListener('click', ()=>{
        const cur = document.documentElement.getAttribute('data-theme');
        applyTheme(cur === 'dark' ? 'light' : 'dark');
      });
    }
  }

  function showPreloader(settings){
    const enabled = !!(settings && settings.preloader && settings.preloader.enabled);
    const pre = $('#preloader');
    if(!pre){
      return;
    }
    if(!enabled){
      pre.remove();
      return;
    }
    const logo = $('#preloaderLogo');
    if(logo && settings.brand && settings.brand.logo){
      logo.src = settings.brand.logo;
      logo.alt = safeText(settings.brand.name, 'Company Logo');
      logo.loading = 'eager';
    }
    // fade out after 1.5s
    window.setTimeout(()=>{
      pre.style.transition = 'opacity .35s ease';
      pre.style.opacity = '0';
      window.setTimeout(()=>pre.remove(), 380);
    }, 1500);
  }

  function setMetaFromSettings(settings){
    const title = safeText(settings?.seo?.title, document.title);
    const desc = safeText(settings?.seo?.description, '');
    if(title) document.title = title;
    const md = $('meta[name="description"]');
    if(md && desc) md.setAttribute('content', desc);

    // theme color for PWA/Chrome
    const tc = $('meta[name="theme-color"]');
    if(tc) tc.setAttribute('content', settings?.brand?.themeColor || '#0b1e3d');

    // JSON-LD Organization schema
    const org = {
      "@context":"https://schema.org",
      "@type":"Organization",
      "name": safeText(settings?.brand?.name, "Al‑Yuma Ventures Investment Limited"),
      "url": safeText(settings?.brand?.siteUrl, window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/')),
      "logo": safeText(settings?.brand?.logo, ""),
      "address":{
        "@type":"PostalAddress",
        "addressLocality":"Kano",
        "addressCountry":"NG"
      },
      "email": safeText(settings?.contact?.email, ""),
      "telephone": safeText(settings?.contact?.phone, ""),
      "sameAs": (settings?.social && Array.isArray(settings.social.links)) ? settings.social.links.filter(Boolean) : []
    };
    const ld = $('#orgSchema');
    if(ld) ld.textContent = JSON.stringify(org);
  }

  function setHero(settings){
    const hero = $('.hero');
    if(!hero) return;
    const bg = safeText(settings?.hero?.background, '');
    if(bg) hero.style.backgroundImage = `url('${bg}')`;
    const h = $('#heroHeadline');
    const s = $('#heroSubheadline');
    const badge = $('#heroBadge');
    if(h) h.textContent = safeText(settings?.hero?.headline, h.textContent);
    if(s) s.textContent = safeText(settings?.hero?.subheadline, s.textContent);
    if(badge) badge.textContent = safeText(settings?.hero?.badge, badge.textContent);
    const wa = $('#whatsAppLink');
    if(wa && settings?.contact?.whatsapp){
      const num = String(settings.contact.whatsapp).replace(/\s+/g,'');
      wa.href = `https://wa.me/${num}`;
    }
    const corpEmailEls = $$('.corpEmail');
    corpEmailEls.forEach(el=>{
      const em = safeText(settings?.contact?.email,'');
      if(em){
        if(el.tagName.toLowerCase()==='input') el.value = em;
        else el.textContent = em;
      }
    });
  }

  function renderTicker(ticker){
    const wrap = $('#tickerTrack');
    if(!wrap || !ticker) return;
    const items = (ticker.items || []).filter(Boolean);
    if(!items.length) return;
    const text = items.join(' • ');
    // duplicate content for seamless marquee
    wrap.innerHTML = `<span class="mx-3">${escapeHtml(text)}</span><span class="mx-3">${escapeHtml(text)}</span>`;
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, m=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'
    }[m]));
  }

  
  function unwrapList(data, key){
    if(Array.isArray(data)) return data;
    if(data && typeof data === 'object' && Array.isArray(data[key])) return data[key];
    return [];
  }

  function renderCards(list, targetId, cardFn){
    const target = document.getElementById(targetId);
    if(!target) return;
    target.innerHTML = '';
    (list || []).forEach((item, idx)=>{
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4 wow fadeInUp';
      col.setAttribute('data-wow-delay', `${Math.min(idx*0.05, .35)}s`);
      col.innerHTML = cardFn(item);
      target.appendChild(col);
    });
  }

  function renderServices(services){
    renderCards(services, 'servicesGrid', (s)=>`
      <div class="card h-100 p-4">
        <div class="d-flex align-items-start gap-3">
          <div class="rounded-circle d-flex align-items-center justify-content-center" style="width:44px;height:44px;background:rgba(212,175,55,.14);border:1px solid rgba(212,175,55,.28)">
            <i class="${escapeHtml(s.icon || 'bi bi-shield-check')} text-gold fs-5"></i>
          </div>
          <div>
            <h5 class="mb-2">${escapeHtml(s.title || 'Service')}</h5>
            <p class="mb-0 small-muted">${escapeHtml(s.summary || '')}</p>
          </div>
        </div>
      </div>
    `);
  }

  function renderBranches(branches){
    renderCards(branches, 'branchesGrid', (b)=>`
      <div class="card h-100 p-4">
        <h5 class="mb-1">${escapeHtml(b.name || 'Branch')}</h5>
        <div class="small-muted mb-2">${escapeHtml(b.address || 'Kano, Nigeria')}</div>
        <div class="d-flex flex-wrap gap-2">
          ${b.phone ? `<span class="badge rounded-pill text-bg-light"><i class="bi bi-telephone me-1"></i>${escapeHtml(b.phone)}</span>`:''}
          ${b.email ? `<span class="badge rounded-pill text-bg-light"><i class="bi bi-envelope me-1"></i>${escapeHtml(b.email)}</span>`:''}
        </div>
      </div>
    `);
  }

  function renderTestimonials(testimonials){
    const target = $('#testimonialsWrap');
    if(!target) return;
    target.innerHTML = '';
    (testimonials || []).forEach((t, idx)=>{
      const item = document.createElement('div');
      item.className = 'col-12 col-lg-4 wow fadeInUp';
      item.setAttribute('data-wow-delay', `${Math.min(idx*0.06,.36)}s`);
      item.innerHTML = `
        <div class="card h-100 p-4">
          <div class="d-flex gap-3 align-items-start">
            <div class="rounded-circle overflow-hidden" style="width:48px;height:48px;border:1px solid rgba(0,0,0,.08)">
              <img src="${escapeHtml(t.photo || 'assets/img/avatar.svg')}" alt="${escapeHtml(t.name || 'Testimonial')}" style="width:100%;height:100%;object-fit:cover" loading="lazy">
            </div>
            <div>
              <div class="fw-bold">${escapeHtml(t.name || 'Client')}</div>
              <div class="small-muted">${escapeHtml(t.role || '')}</div>
            </div>
          </div>
          <div class="mt-3">
            <i class="bi bi-quote text-gold"></i>
            <div class="mt-2">${escapeHtml(t.quote || '')}</div>
          </div>
        </div>
      `;
      target.appendChild(item);
    });
  }

  function renderClients(clients){
    const target = $('#clientsRow');
    if(!target) return;
    target.innerHTML = '';
    (clients || []).forEach((c)=>{
      const col = document.createElement('div');
      col.className = 'col-6 col-md-4 col-lg-2';
      col.innerHTML = `
        <div class="card p-3 text-center h-100">
          <img src="${escapeHtml(c.logo || 'assets/img/logo-mark.svg')}" alt="${escapeHtml(c.name || 'Client')}" class="img-fluid" style="max-height:42px;object-fit:contain" loading="lazy">
        </div>
      `;
      target.appendChild(col);
    });
  }

  function animateCounters(){
    const els = $$('.counter[data-target]');
    if(!els.length) return;

    const animateOne = (el)=>{
      const target = Number(el.getAttribute('data-target') || 0);
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1100;
      const start = performance.now();
      const from = 0;

      const step = (t)=>{
        const p = Math.min((t - start) / duration, 1);
        const val = Math.floor(from + (target - from) * (p*p*(3-2*p))); // smoothstep
        el.textContent = val.toLocaleString() + suffix;
        if(p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          animateOne(e.target);
          io.unobserve(e.target);
        }
      });
    }, {threshold:0.35});

    els.forEach(el=>io.observe(el));
  }

  function renderCompanyProfile(settings){
    const cp = settings?.companyProfile;
    const root = $('#companyProfile');
    if(!root || !cp) return;
    $('#regInfo') && ( $('#regInfo').textContent = safeText(cp.registrationInfo,'') );
    $('#yearsOp') && ( $('#yearsOp').textContent = safeText(cp.yearsOfOperation,'') );
    $('#sectors') && ( $('#sectors').textContent = safeText((cp.operationalSectors||[]).join(', '),'') );
    $('#objectives') && ( $('#objectives').textContent = safeText(cp.objectives,'') );
    $('#compliance') && ( $('#compliance').textContent = safeText(cp.complianceStandards,'') );
  }

  function renderCapacity(settings){
    const cap = settings?.capacity;
    if(!cap) return;
    const map = [
      ['fleet', cap.fleetSize],
      ['delivered', cap.projectsDelivered],
      ['partners', cap.partnerships],
      ['coverage', cap.geographicCoverage],
      ['certs', cap.certifications]
    ];
    map.forEach(([id,val])=>{
      const el = document.getElementById(id);
      if(el && typeof val !== 'undefined' && val !== null) el.textContent = String(val);
    });
  }

  function renderCertifications(certs){
    const target = $('#certGrid');
    if(!target) return;
    target.innerHTML = '';
    (certs||[]).forEach((c, idx)=>{
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4 wow fadeInUp';
      col.setAttribute('data-wow-delay', `${Math.min(idx*0.05,.35)}s`);
      col.innerHTML = `
        <div class="card p-4 h-100">
          <div class="d-flex align-items-start gap-3">
            <div class="rounded-circle d-flex align-items-center justify-content-center" style="width:46px;height:46px;background:rgba(212,175,55,.14);border:1px solid rgba(212,175,55,.28)">
              <i class="bi bi-patch-check-fill text-gold fs-5"></i>
            </div>
            <div>
              <h6 class="mb-1">${escapeHtml(c.title || 'Certification')}</h6>
              <div class="small-muted mb-2">${escapeHtml(c.issuer || '')}</div>
              ${c.file ? `<a class="btn btn-sm btn-outline-gold" href="${escapeHtml(c.file)}" target="_blank" rel="noopener"><i class="bi bi-download me-1"></i>View</a>`:''}
            </div>
          </div>
        </div>
      `;
      target.appendChild(col);
    });
  }

  function renderInvestor(investor){
    if(!investor) return;
    const set = (id, val)=>{
      const el = document.getElementById(id);
      if(el) el.textContent = safeText(val,'');
    };
    set('invExpansion', investor.marketExpansionPlan);
    set('invPartners', investor.strategicPartnerships);
    set('invFocus', (investor.investmentFocusAreas||[]).join(', '));
    set('invObjectives', investor.longTermObjectives);

    const fh = investor.financialHighlights || {};
    set('revGrowth', fh.revenueGrowth);
    set('opExpansion', fh.operationalExpansion);
    set('marketPen', fh.marketPenetration);
    set('outlook', fh.investmentOutlook);
  }

  function renderTender(tender, settings){
    if(!tender) return;
    const el = (id)=>document.getElementById(id);
    if(el('tenderIntro')) el('tenderIntro').textContent = safeText(tender.intro,'');
    if(el('capabilityBtn') && tender.capabilityStatement){
      el('capabilityBtn').setAttribute('href', tender.capabilityStatement);
    }
    const emailInput = el('rfpEmail');
    if(emailInput){
      emailInput.value = safeText(settings?.contact?.email, '');
    }
    const form = el('rfpForm');
    if(form){
      form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        if(!window.Swal){
          alert('Submitted.');
          form.reset();
          return;
        }
        await Swal.fire({
          icon: 'success',
          title: 'Request received',
          text: 'Thank you. Our team will review your submission and respond via the corporate email provided.',
          confirmButtonText: 'Done'
        });
        form.reset();
        // keep email filled
        if(emailInput) emailInput.value = safeText(settings?.contact?.email, '');
      });
    }
  }

  // Gallery: Isotope + Masonry + GLightbox
  async function initGallery(projects){
    const grid = $('#galleryGrid');
    if(!grid || !Array.isArray(projects)) return;

    grid.innerHTML = '';
    projects.forEach((p, idx)=>{
      (p.images||[]).slice(0, 12).forEach((img, j)=>{
        const cat = (p.category || 'All').toLowerCase().replace(/\s+/g,'-');
        const item = document.createElement('div');
        item.className = `col-12 col-sm-6 col-lg-4 gallery-sizer gallery-item-wrap ${cat} wow fadeInUp`;
        item.setAttribute('data-wow-delay', `${Math.min((idx*0.04 + j*0.03), .35)}s`);
        item.innerHTML = `
          <div class="gallery-item">
            <a href="${escapeHtml(img.url)}" class="glightbox" data-gallery="projects" data-title="${escapeHtml(img.caption || p.title || '')}">
              <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt || p.title || 'Project image')}" loading="lazy">
              <div class="gallery-overlay">
                <div>
                  <h6 class="mb-1">${escapeHtml(p.title || 'Project')}</h6>
                  <div class="small" style="color:#e5e7eb">${escapeHtml(p.category || '')}</div>
                </div>
              </div>
            </a>
          </div>
        `;
        grid.appendChild(item);
      });
    });

    // Filters
    const filterWrap = $('#galleryFilters');
    if(filterWrap){
      const categories = new Set(['*']);
      projects.forEach(p=>{
        const c = (p.category || '').trim();
        if(c) categories.add('.' + c.toLowerCase().replace(/\s+/g,'-'));
      });
      filterWrap.innerHTML = '';
      Array.from(categories).forEach((c, i)=>{
        const label = c==='*' ? 'All' : c.replace('.','').replace(/-/g,' ').replace(/\b\w/g, s=>s.toUpperCase());
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm ' + (i===0 ? 'btn-gold' : 'btn-outline-gold');
        btn.type = 'button';
        btn.setAttribute('data-filter', c);
        btn.textContent = label;
        filterWrap.appendChild(btn);
      });
    }

    // Initialize GLightbox
    if(window.GLightbox){
      window.GLightbox({selector: '.glightbox'});
    }

    // Isotope layout after images load
    if(window.Isotope && window.imagesLoaded){
      window.imagesLoaded(grid, function(){
        const iso = new window.Isotope(grid, {
          itemSelector: '.gallery-item-wrap',
          percentPosition: true,
          masonry: { columnWidth: '.gallery-item-wrap' }
        });
        if(filterWrap){
          filterWrap.addEventListener('click', (e)=>{
            const b = e.target.closest('button[data-filter]');
            if(!b) return;
            $$('#galleryFilters button').forEach(x=>{
              x.classList.remove('btn-gold');
              x.classList.add('btn-outline-gold');
            });
            b.classList.add('btn-gold');
            b.classList.remove('btn-outline-gold');
            iso.arrange({ filter: b.getAttribute('data-filter') });
          });
        }
      });
    }
  }

  function initWOW(){
    if(window.WOW){
      new WOW({ mobile: false }).init();
    }
  }

  function registerSW(){
    if(!('serviceWorker' in navigator)) return;
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('/sw.js').catch(()=>{ /* silent */ });
    });
  }

  function initLightbox(){
    // placeholder for pages that may include glightbox links
    if(window.GLightbox){
      window.GLightbox({selector: '.glightbox'});
    }
  }

  function initAnalyticsPlaceholders(settings){
    // Placeholders only - do not load third-party scripts by default.
    // Put your GA / Pixel code inside content/settings.json (analytics placeholders) after deployment.
    const ga = safeText(settings?.analytics?.googleAnalyticsId,'');
    const pixel = safeText(settings?.analytics?.facebookPixelId,'');
    const el = $('#analyticsNote');
    if(el && (ga || pixel)){
      el.textContent = `Analytics placeholders detected: GA(${ga || '—'}), Pixel(${pixel || '—'})`;
    }
  }

  async function boot(){
    state.settings = await loadJSON('/content/settings.json', null);
    state.ticker = await loadJSON('/content/ticker.json', {items:[]});

    // Apply settings (theme, meta, hero, preloader)
    setMetaFromSettings(state.settings || {});
    initThemeToggle(state.settings?.theme?.default || 'light');
    showPreloader(state.settings || {});
    setHero(state.settings || {});
    renderTicker(state.ticker || {items:[]});
    renderCompanyProfile(state.settings || {});
    renderCapacity(state.settings || {});
    initAnalyticsPlaceholders(state.settings || {});

    // Register PWA service worker
    registerSW();

    // Page-specific
    const page = document.body.getAttribute('data-page') || 'index';

    if(page === 'index' || page === 'services'){
      const srvRaw = await loadJSON('/content/services.json', {services:[]});
      state.services = unwrapList(srvRaw,'services');
      renderServices(state.services);
    }
    if(page === 'projects'){
      const prjRaw = await loadJSON('/content/projects.json', {projects:[]});
      state.projects = unwrapList(prjRaw,'projects');
      await initGallery(state.projects);
    }
    if(page === 'branches'){
      const brRaw = await loadJSON('/content/branches.json', {branches:[]});
      state.branches = unwrapList(brRaw,'branches');
      renderBranches(state.branches);
    }
    if(page === 'index'){
      const tsRaw = await loadJSON('/content/testimonials.json', {testimonials:[]});
      const clRaw = await loadJSON('/content/clients.json', {clients:[]});
      state.testimonials = unwrapList(tsRaw,'testimonials');
      state.clients = unwrapList(clRaw,'clients');
      renderTestimonials(state.testimonials);
      renderClients(state.clients);
      animateCounters();
    }
    if(page === 'about'){
      const ctRaw = await loadJSON('/content/certifications.json', {certifications:[]});
      state.certifications = unwrapList(ctRaw,'certifications');
      renderCertifications(state.certifications);
    }
    if(page === 'investor'){
      state.investor = await loadJSON('/content/investor.json', null);
      renderInvestor(state.investor);
    }
    if(page === 'tender'){
      state.tender = await loadJSON('/content/tender.json', null);
      renderTender(state.tender, state.settings);
    }

    // init visual libs
    initWOW();
    initLightbox();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
