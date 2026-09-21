/**
 * FAP01 v2 — scripts complementares
 * - Click-to-play video poster (YouTube iframe on demand)
 * - Scroll spy pra navbar sticky
 * - IntersectionObserver pra Bottom Bar (surge só após passar da Hero)
 * - Exit intent popup com tracking de trigger único
 */

(function () {
  'use strict';

  // ── Click-to-play Video ──
  var poster = document.getElementById('v2-video-poster');
  var videoContainer = document.getElementById('v2-hero-video');

  if (poster && videoContainer) {
    poster.addEventListener('click', function () {
      var ytId = poster.getAttribute('data-youtube-id') || 'n0P0vUu_h0k';
      var iframe = document.createElement('iframe');
      iframe.setAttribute('src', 'https://www.youtube.com/embed/' + ytId + '?autoplay=1&rel=0&modestbranding=1');
      iframe.setAttribute('title', 'Vídeo de Apresentação — Full Sales System');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.aspectRatio = '16/9';
      iframe.style.display = 'block';

      videoContainer.innerHTML = '';
      videoContainer.appendChild(iframe);
    });
  }

  // ── Navbar scroll spy ──
  var navbar = document.querySelector('.v2-navbar');
  if (navbar) {
    var onScroll = function () {
      if (window.scrollY > 40) {
        navbar.classList.add('is-scrolled');
      } else {
        navbar.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Bottom bar: ativa classe no body quando passa do Hero ──
  var painSection = document.getElementById('dores') || document.querySelector('.pain-section');
  if (painSection && 'IntersectionObserver' in window) {
    var barObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // Se a seção de dor já cruzou o topo ou está visível, mostra a barra
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          document.body.classList.add('v2-show-bar');
        } else {
          document.body.classList.remove('v2-show-bar');
        }
      });
    }, { rootMargin: '0px 0px -100px 0px', threshold: 0 });

    barObserver.observe(painSection);

    // Fallback pra scroll puro se o observer falhar
    window.addEventListener('scroll', function () {
      var top = painSection.getBoundingClientRect().top;
      if (top < window.innerHeight) {
        document.body.classList.add('v2-show-bar');
      }
    }, { passive: true });
  } else {
    // Se não há IntersectionObserver, mostra sempre
    document.body.classList.add('v2-show-bar');
  }

  // ── Exit Intent Popup (desktop mouseout + mobile back/inactivity) ──
  var exitOverlay = document.getElementById('exit-popup-overlay');
  var exitClose = document.getElementById('exit-popup-close');
  var exitCta = document.getElementById('exit-popup-cta');
  var exitShown = false;

  // Respeita session storage pra não irritar o usuário
  try {
    if (sessionStorage.getItem('fss_exit_shown') === '1') {
      exitShown = true;
    }
  } catch (e) {}

  function showExitPopup() {
    if (exitShown || !exitOverlay) return;
    exitShown = true;
    try { sessionStorage.setItem('fss_exit_shown', '1'); } catch (e) {}
    exitOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function hideExitPopup() {
    if (!exitOverlay) return;
    exitOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (exitOverlay) {
    // Desktop: intenção de saída quando cursor sobe pro topo da página
    document.addEventListener('mouseleave', function (e) {
      if (e.clientY <= 10 && !exitShown) {
        showExitPopup();
      }
    });

    if (exitClose) {
      exitClose.addEventListener('click', hideExitPopup);
    }

    exitOverlay.addEventListener('click', function (e) {
      if (e.target === exitOverlay) hideExitPopup();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && exitOverlay.classList.contains('active')) {
        hideExitPopup();
      }
    });

    if (exitCta) {
      exitCta.addEventListener('click', function () {
        hideExitPopup();
        // Dispara o modal principal de diagnóstico
        if (typeof window.openModal === 'function') {
          window.openModal();
        } else {
          var modal = document.getElementById('modal');
          if (modal) modal.classList.add('open');
        }
      });
    }
  }

  // ── Smooth scroll para âncoras internas ──
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      var targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
