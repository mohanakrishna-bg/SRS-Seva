/**
 * SRS Seva — Bilingual Toggle (Kannada ↔ English)
 * Uses data-lang attribute on <html> to swap inline bilingual content.
 *
 * Content pattern in HTML:
 *   <span lang="kn">ಕನ್ನಡ ಪಠ್ಯ</span>
 *   <span lang="en">English text</span>
 *
 * CSS in base.css handles visibility based on html[data-lang].
 * Default is Kannada (no data-lang attribute = Kannada shown).
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'seva_site_lang';
  var langBtn = document.getElementById('lang-toggle');

  function getPreferred() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'kn') return stored;
    return 'kn'; // Default to Kannada
  }

  function applyLang(lang) {
    if (lang === 'en') {
      document.documentElement.setAttribute('data-lang', 'en');
    } else {
      document.documentElement.removeAttribute('data-lang');
    }
    localStorage.setItem(STORAGE_KEY, lang);
    updateButton(lang);
  }

  function updateButton(lang) {
    if (!langBtn) return;
    if (lang === 'en') {
      langBtn.textContent = 'ಕನ್ನಡ';
      langBtn.setAttribute('aria-label', 'Switch to Kannada');
      langBtn.setAttribute('title', 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ');
    } else {
      langBtn.textContent = 'EN';
      langBtn.setAttribute('aria-label', 'Switch to English');
      langBtn.setAttribute('title', 'Switch to English');
    }
  }

  // Apply on load
  var currentLang = getPreferred();
  applyLang(currentLang);

  // Toggle on click
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-lang');
      applyLang(current === 'en' ? 'kn' : 'en');
    });
  }
})();
