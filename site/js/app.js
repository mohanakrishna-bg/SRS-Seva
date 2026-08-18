/**
 * SRS Seva — App Interactions
 * Seva filter, smooth scroll, form validation, scroll animations, calendar widget
 */
(function () {
  'use strict';

  // ===========================
  // 1. Scroll Fade-in Animation
  // ===========================
  var fadeElements = document.querySelectorAll('.fade-in-up');
  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeElements.forEach(function (el) { observer.observe(el); });
  }

  // ===========================
  // 2. Seva Filter
  // ===========================
  var sevaFilter = document.getElementById('seva-filter');
  var sevaGrid = document.getElementById('seva-grid');

  if (sevaFilter && sevaGrid) {
    var sevaCards = sevaGrid.querySelectorAll('.seva-card');

    sevaFilter.addEventListener('input', function () {
      var query = this.value.toLowerCase().trim();

      sevaCards.forEach(function (card) {
        var text = card.textContent.toLowerCase();
        if (!query || text.indexOf(query) !== -1) {
          card.style.display = '';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(8px)';
          setTimeout(function () {
            if (card.style.opacity === '0') card.style.display = 'none';
          }, 200);
        }
      });
    });
  }

  // ===========================
  // 3. Contact Form Validation
  // ===========================
  var contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var isValid = true;
      var fields = [
        { id: 'contact-name', message: 'ಹೆಸರು ಅಗತ್ಯ / Name is required' },
        { id: 'contact-phone', message: 'ಫೋನ್ ಸಂಖ್ಯೆ ಅಗತ್ಯ / Phone is required' },
        { id: 'contact-message', message: 'ಸಂದೇಶ ಅಗತ್ಯ / Message is required' },
      ];

      // Clear previous errors
      contactForm.querySelectorAll('.form-error').forEach(function (el) { el.remove(); });

      fields.forEach(function (field) {
        var input = document.getElementById(field.id);
        if (!input) return;
        var value = input.value.trim();

        if (!value) {
          isValid = false;
          input.style.borderColor = 'var(--color-error)';
          var errorEl = document.createElement('div');
          errorEl.className = 'form-error';
          errorEl.textContent = field.message;
          input.parentNode.appendChild(errorEl);
        } else {
          input.style.borderColor = '';
        }
      });

      // Phone format check
      var phoneInput = document.getElementById('contact-phone');
      if (phoneInput && phoneInput.value.trim()) {
        var phone = phoneInput.value.replace(/[\s\-\(\)]/g, '');
        if (phone.length < 10 || !/^\+?\d{10,13}$/.test(phone)) {
          isValid = false;
          phoneInput.style.borderColor = 'var(--color-error)';
          var phoneError = document.createElement('div');
          phoneError.className = 'form-error';
          phoneError.textContent = 'ದಯವಿಟ್ಟು ಸರಿಯಾದ ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ / Please enter a valid phone number';
          phoneInput.parentNode.appendChild(phoneError);
        }
      }

      if (isValid) {
        // Show success message (no backend yet)
        var successMsg = document.createElement('div');
        successMsg.className = 'card';
        successMsg.style.cssText = 'text-align:center; padding:var(--space-2xl); background:rgba(46,125,79,0.08); border-color:var(--color-success); margin-top:var(--space-lg);';
        successMsg.innerHTML = '<p style="color:var(--color-success); font-weight:700; font-size:var(--text-lg); margin-bottom:var(--space-sm);">🙏 ' +
          '<span lang="kn">ಧನ್ಯವಾದಗಳು!</span><span lang="en">Thank you!</span></p>' +
          '<p><span lang="kn">ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ನಾವು ಶೀಘ್ರದಲ್ಲೇ ಸಂಪರ್ಕಿಸುತ್ತೇವೆ.</span>' +
          '<span lang="en">Your message has been received. We will contact you soon.</span></p>';

        contactForm.style.display = 'none';
        contactForm.parentNode.appendChild(successMsg);
      }
    });

    // Clear error on input
    contactForm.querySelectorAll('input, textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        this.style.borderColor = '';
        var err = this.parentNode.querySelector('.form-error');
        if (err) err.remove();
      });
    });
  }

  // ===========================
  // 4. Accordion Toggle
  // ===========================
  document.querySelectorAll('.accordion-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var item = this.closest('.accordion-item');
      var body = item.querySelector('.accordion-body');
      var inner = item.querySelector('.accordion-body-inner');

      if (item.classList.contains('is-open')) {
        item.classList.remove('is-open');
        body.style.maxHeight = '0';
      } else {
        // Close others in same container
        var parent = item.parentNode;
        parent.querySelectorAll('.accordion-item.is-open').forEach(function (openItem) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.accordion-body').style.maxHeight = '0';
        });
        item.classList.add('is-open');
        body.style.maxHeight = inner.scrollHeight + 'px';
      }
    });
  });

  // ===========================
  // 5. Simple Calendar Widget
  // ===========================
  var calendarEl = document.getElementById('calendar-widget');

  if (calendarEl) {
    var calendarState = {
      currentDate: new Date(),
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    };

    var kannadaMonths = [
      'ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್',
      'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್'
    ];

    var englishMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    var kannadaDays = ['ಭಾ', 'ಸೋ', 'ಮಂ', 'ಬು', 'ಗು', 'ಶು', 'ಶ'];
    var englishDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Sample events (placeholder)
    var sampleEvents = {
      15: true, 23: true, 1: true, 8: true
    };

    function renderCalendar() {
      var firstDay = new Date(calendarState.year, calendarState.month, 1).getDay();
      var daysInMonth = new Date(calendarState.year, calendarState.month + 1, 0).getDate();
      var daysInPrevMonth = new Date(calendarState.year, calendarState.month, 0).getDate();
      var today = new Date();
      var isCurrentMonth = today.getMonth() === calendarState.month && today.getFullYear() === calendarState.year;
      var isEn = document.documentElement.getAttribute('data-lang') === 'en';
      var months = isEn ? englishMonths : kannadaMonths;
      var days = isEn ? englishDays : kannadaDays;

      var html = '<div class="calendar-header">' +
        '<button class="cal-prev" aria-label="Previous month">◂</button>' +
        '<h3><span lang="kn">' + kannadaMonths[calendarState.month] + '</span><span lang="en">' + englishMonths[calendarState.month] + '</span> ' + calendarState.year + '</h3>' +
        '<button class="cal-next" aria-label="Next month">▸</button>' +
        '</div>';

      html += '<div class="calendar-grid">';

      // Day labels
      for (var d = 0; d < 7; d++) {
        html += '<div class="calendar-day-label"><span lang="kn">' + kannadaDays[d] + '</span><span lang="en">' + englishDays[d] + '</span></div>';
      }

      // Previous month trailing days
      for (var p = firstDay - 1; p >= 0; p--) {
        html += '<div class="calendar-day other-month">' + (daysInPrevMonth - p) + '</div>';
      }

      // Current month days
      for (var i = 1; i <= daysInMonth; i++) {
        var classes = 'calendar-day';
        if (isCurrentMonth && i === today.getDate()) classes += ' today';
        if (sampleEvents[i]) classes += ' has-event';
        html += '<div class="' + classes + '">' + i + '</div>';
      }

      // Next month leading days
      var totalCells = firstDay + daysInMonth;
      var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
      for (var n = 1; n <= remaining; n++) {
        html += '<div class="calendar-day other-month">' + n + '</div>';
      }

      html += '</div>';

      calendarEl.innerHTML = html;

      // Bind nav
      calendarEl.querySelector('.cal-prev').addEventListener('click', function () {
        calendarState.month--;
        if (calendarState.month < 0) { calendarState.month = 11; calendarState.year--; }
        renderCalendar();
      });

      calendarEl.querySelector('.cal-next').addEventListener('click', function () {
        calendarState.month++;
        if (calendarState.month > 11) { calendarState.month = 0; calendarState.year++; }
        renderCalendar();
      });
    }

    renderCalendar();

    // Re-render on language change to swap month/day labels
    var langObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'data-lang') renderCalendar();
      });
    });
    langObserver.observe(document.documentElement, { attributes: true });
  }
})();
