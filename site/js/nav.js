/**
 * SRS Seva — Navigation Controller
 * Mobile menu toggle, active page highlighting
 */
(function () {
  'use strict';

  const hamburger   = document.getElementById('hamburger');
  const navOverlay  = document.getElementById('nav-overlay');
  const navMobile   = document.getElementById('nav-mobile');
  const navClose    = document.getElementById('nav-close');

  if (!hamburger || !navMobile) return;

  function openMenu() {
    hamburger.classList.add('is-open');
    navOverlay.classList.add('is-open');
    navMobile.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    hamburger.classList.remove('is-open');
    navOverlay.classList.remove('is-open');
    navMobile.classList.remove('is-open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', function () {
    if (navMobile.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (navOverlay) navOverlay.addEventListener('click', closeMenu);
  if (navClose) navClose.addEventListener('click', closeMenu);

  // Close on mobile link click
  navMobile.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navMobile.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // === Active Page Highlighting ===
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  function markActive(navContainer) {
    if (!navContainer) return;
    navContainer.querySelectorAll('a[href]').forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href) return;
      const linkPage = href.split('/').pop() || 'index.html';

      if (linkPage === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  markActive(document.querySelector('.nav-desktop'));
  markActive(document.querySelector('.nav-mobile-links'));
})();
