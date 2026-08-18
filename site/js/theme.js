/**
 * SRS Seva — Theme Switcher
 * Light/Dark mode with localStorage persistence
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'seva_site_theme';
  var themeBtn = document.getElementById('theme-toggle');

  function getPreferred() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    // Respect OS preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(STORAGE_KEY, theme);
    updateButton(theme);
  }

  function updateButton(theme) {
    if (!themeBtn) return;
    if (theme === 'dark') {
      themeBtn.innerHTML = '☀️';
      themeBtn.setAttribute('aria-label', 'Switch to light mode');
      themeBtn.setAttribute('title', 'ಬೆಳಕು ನೋಟ');
    } else {
      themeBtn.innerHTML = '🌙';
      themeBtn.setAttribute('aria-label', 'Switch to dark mode');
      themeBtn.setAttribute('title', 'ಕತ್ತಲೆ ನೋಟ');
    }
  }

  // Apply on load (before paint)
  var currentTheme = getPreferred();
  applyTheme(currentTheme);

  // Toggle on click
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  // Listen for OS preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
})();
