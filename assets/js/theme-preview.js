/* ==========================================================================
   TEMPORARY — client color-preview tool.
   --------------------------------------------------------------------------
   Builds a floating swatch picker so the doctor can try alternate palettes
   across the whole site (persisted across pages via sessionStorage) before
   one is finalized. See the removal note at the top of theme-preview.css —
   deleting both files and their tags in <head>/before </body> removes this
   feature completely.
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'sdcc-theme-preview';

  var THEMES = [
    { id: 'green',  label: 'Green (current)',   swatch: '#1a5c4a' },
    { id: 'maroon', label: 'Heritage Maroon',    swatch: '#7A3428' },
    { id: 'teal',   label: 'Coastal Teal',       swatch: '#0F6B72' },
    { id: 'red',    label: 'Signature Red',      swatch: '#B01E24' }
  ];

  function apply(id) {
    if (id && id !== 'green') {
      document.documentElement.setAttribute('data-color-theme', id);
    } else {
      document.documentElement.removeAttribute('data-color-theme');
    }
  }

  var saved = null;
  try { saved = sessionStorage.getItem(STORAGE_KEY); } catch (err) {}
  if (saved) apply(saved);

  function build() {
    var current = saved || 'green';

    var fab = document.createElement('div');
    fab.className = 'theme-fab';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-fab-btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Preview colour options');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.2-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-4.4-4.5-8-10-8Z"/></svg>';

    var panel = document.createElement('div');
    panel.className = 'theme-fab-panel';

    var title = document.createElement('p');
    title.className = 'theme-fab-title';
    title.textContent = 'Colour preview';
    panel.appendChild(title);

    var hint = document.createElement('p');
    hint.className = 'theme-fab-hint';
    hint.textContent = 'Internal review only — applies across the whole site while you browse.';
    panel.appendChild(hint);

    var list = document.createElement('ul');
    list.className = 'theme-fab-list';

    THEMES.forEach(function (theme) {
      var li = document.createElement('li');
      var option = document.createElement('button');
      option.type = 'button';
      option.className = 'theme-fab-option' + (theme.id === current ? ' is-active' : '');
      option.dataset.themeId = theme.id;

      var swatch = document.createElement('span');
      swatch.className = 'theme-fab-swatch';
      swatch.style.background = theme.swatch;
      option.appendChild(swatch);

      var label = document.createElement('span');
      label.textContent = theme.label;
      option.appendChild(label);

      var check = document.createElement('svg');
      check.setAttribute('viewBox', '0 0 24 24');
      check.setAttribute('fill', 'none');
      check.setAttribute('stroke', 'currentColor');
      check.setAttribute('stroke-width', '2.5');
      check.setAttribute('stroke-linecap', 'round');
      check.setAttribute('stroke-linejoin', 'round');
      check.setAttribute('aria-hidden', 'true');
      check.classList.add('theme-fab-check');
      check.innerHTML = '<path d="m5 12 5 5 9-9"/>';
      option.appendChild(check);

      option.addEventListener('click', function () {
        apply(theme.id);
        try { sessionStorage.setItem(STORAGE_KEY, theme.id); } catch (err) {}
        list.querySelectorAll('.theme-fab-option').forEach(function (el) {
          el.classList.toggle('is-active', el === option);
        });
      });

      li.appendChild(option);
      list.appendChild(li);
    });

    panel.appendChild(list);
    fab.appendChild(btn);
    fab.appendChild(panel);
    document.body.appendChild(fab);

    var closeOnOutside = function (e) {
      if (!fab.contains(e.target)) close();
    };
    var closeOnEscape = function (e) {
      if (e.key === 'Escape') { close(); btn.focus(); }
    };

    function open() {
      fab.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', closeOnOutside);
      document.addEventListener('keydown', closeOnEscape);
    }
    function close() {
      fab.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (fab.classList.contains('is-open')) close(); else open();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
