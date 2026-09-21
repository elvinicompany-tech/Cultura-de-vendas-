/**
 * FAP01 — Seção de Depoimentos e Resultados Reais
 * Carrega depoimentos.json (200+ prints), implementa filtros por nicho/resultado,
 * paginação/carregar mais e lightbox com navegação por teclado e swipe.
 */

(function () {
  'use strict';

  var DATA_URL = '/assets/depoimentos.json';
  var PAGE_SIZE = 12;

  var allItems = [];
  var filteredItems = [];
  var currentCategory = 'todos';
  var displayedCount = 0;
  var currentLightboxIndex = -1;

  var container = document.getElementById('depo-grid');
  var filtersContainer = document.getElementById('depo-filters');
  var countEl = document.getElementById('depo-shown-count');
  var totalEl = document.getElementById('depo-total-count');
  var loadMoreBtn = document.getElementById('depo-load-btn');
  var loadMoreWrap = document.getElementById('depo-load-more');

  var lightbox = document.getElementById('depo-lightbox');
  var lightboxImg = document.getElementById('depo-lightbox-img');
  var lightboxCaption = document.getElementById('depo-lightbox-caption');
  var lightboxClose = document.getElementById('depo-lightbox-close');
  var lightboxPrev = document.getElementById('depo-lightbox-prev');
  var lightboxNext = document.getElementById('depo-lightbox-next');

  if (!container) return;

  // Carrega JSON
  fetch(DATA_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      allItems = Array.isArray(data) ? data : (data.items || []);
      if (totalEl) totalEl.textContent = allItems.length;
      setupFilters();
      applyFilter('todos');
    })
    .catch(function (err) {
      console.warn('[depoimentos] Falha ao carregar dados:', err);
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.6); padding: 40px 0;">Veja centenas de depoimentos em nosso Instagram oficial <a href="https://instagram.com/fullsalessystem" target="_blank" rel="noopener" style="color: var(--red); text-decoration: underline;">@fullsalessystem</a></p>';
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    });

  // Configura chips de filtro baseado nas tags encontradas
  function setupFilters() {
    if (!filtersContainer) return;

    var counts = { todos: allItems.length };
    allItems.forEach(function (item) {
      var cat = item.category || item.tag || 'outros';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    var chips = filtersContainer.querySelectorAll('.depo-chip');
    chips.forEach(function (chip) {
      var cat = chip.getAttribute('data-cat') || 'todos';
      var count = counts[cat] || 0;
      var countSpan = chip.querySelector('.depo-chip-count');
      if (countSpan) countSpan.textContent = '(' + count + ')';

      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        applyFilter(cat);
      });
    });
  }

  function applyFilter(cat) {
    currentCategory = cat;
    if (cat === 'todos') {
      filteredItems = allItems.slice();
    } else {
      filteredItems = allItems.filter(function (it) {
        return (it.category === cat) || (it.tag === cat) ||
               (Array.isArray(it.tags) && it.tags.indexOf(cat) !== -1);
      });
    }

    container.innerHTML = '';
    displayedCount = 0;
    renderNextPage();
  }

  function renderNextPage() {
    var start = displayedCount;
    var end = Math.min(start + PAGE_SIZE, filteredItems.length);
    var fragment = document.createDocumentFragment();

    for (var i = start; i < end; i++) {
      fragment.appendChild(createCard(filteredItems[i], i));
    }
    container.appendChild(fragment);
    displayedCount = end;

    if (countEl) countEl.textContent = displayedCount;
    if (totalEl) totalEl.textContent = filteredItems.length;

    if (loadMoreWrap) {
      loadMoreWrap.style.display = (displayedCount >= filteredItems.length) ? 'none' : 'block';
    }
  }

  function createCard(item, index) {
    var card = document.createElement('div');
    card.className = 'depo-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', (item.title || item.client || 'Depoimento') + ' - clique para ampliar');

    var tagLabel = item.tagLabel || item.tag || item.category || 'Resultado';
    var imgSrc = item.thumb || item.image || item.src;
    var fullSrc = item.full || item.image || item.src || imgSrc;

    card.innerHTML =
      '<div class="depo-card-img-wrap">' +
        '<img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(item.title || 'Depoimento de cliente FSS') + '" loading="lazy">' +
        '<span class="depo-card-badge">' + escapeHtml(tagLabel) + '</span>' +
        '<span class="depo-card-zoom-icon" aria-hidden="true">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>' +
        '</span>' +
      '</div>' +
      '<div class="depo-card-body">' +
        '<p class="depo-card-highlight">' + escapeHtml(item.title || item.result || 'Resultado validado') + '</p>' +
        '<p class="depo-card-caption">' + escapeHtml(item.subtitle || item.client || item.caption || '') + '</p>' +
      '</div>';

    function openThis() {
      openLightbox(index);
    }
    card.addEventListener('click', openThis);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openThis();
      }
    });

    return card;
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', renderNextPage);
  }

  // Lightbox
  function openLightbox(index) {
    if (!lightbox || index < 0 || index >= filteredItems.length) return;
    currentLightboxIndex = index;
    var item = filteredItems[index];
    var fullSrc = item.full || item.image || item.src || item.thumb;

    lightboxImg.src = fullSrc;
    lightboxImg.alt = item.title || 'Depoimento';
    if (lightboxCaption) {
      var cap = (item.title || '') + (item.subtitle ? ' — ' + item.subtitle : '');
      lightboxCaption.textContent = cap;
    }
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    currentLightboxIndex = -1;
  }

  function stepLightbox(delta) {
    if (currentLightboxIndex < 0) return;
    var next = currentLightboxIndex + delta;
    if (next < 0) next = filteredItems.length - 1;
    if (next >= filteredItems.length) next = 0;
    openLightbox(next);
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', function (e) { e.stopPropagation(); stepLightbox(-1); });
  if (lightboxNext) lightboxNext.addEventListener('click', function (e) { e.stopPropagation(); stepLightbox(1); });

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.classList.contains('depo-lightbox-inner')) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') stepLightbox(-1);
    else if (e.key === 'ArrowRight') stepLightbox(1);
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
