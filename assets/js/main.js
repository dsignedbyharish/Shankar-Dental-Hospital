/* ==========================================================================
   Shanker Dental & Craniofacial Centre — Site scripts
   ==========================================================================
   Progressive enhancement only: every feature here degrades to plain,
   usable HTML when scripts do not run.
   ========================================================================== */
(function () {
  'use strict';

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
                  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Keep Tab inside `container` while it is open. */
  function trapFocus(container, event) {
    var items = Array.prototype.filter.call(
      container.querySelectorAll(FOCUSABLE),
      function (el) { return el.offsetParent !== null || el === document.activeElement; }
    );
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ======================================================================
     Mobile navigation drawer
     ====================================================================== */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    var scrim = document.createElement('button');
    scrim.className = 'nav-scrim';
    scrim.setAttribute('tabindex', '-1');
    scrim.setAttribute('aria-label', 'Close menu');
    document.body.appendChild(scrim);

    var openNav = function () {
      nav.classList.add('open');
      scrim.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      var firstLink = nav.querySelector(FOCUSABLE);
      if (firstLink) firstLink.focus();
    };

    var closeNav = function (returnFocus) {
      nav.classList.remove('open');
      scrim.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', function () {
      if (nav.classList.contains('open')) closeNav(true);
      else openNav();
    });

    scrim.addEventListener('click', function () { closeNav(true); });

    /* Following a link closes the drawer; focus goes with the navigation. */
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (!nav.classList.contains('open')) return;
      if (e.key === 'Escape') closeNav(true);
      if (e.key === 'Tab') trapFocus(nav, e);
    });

    /* Resizing past the breakpoint must not leave a hidden drawer holding
       the scroll lock. */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1060 && nav.classList.contains('open')) closeNav(false);
    });
  }

  /* ======================================================================
     Accordions
     ====================================================================== */
  document.querySelectorAll('.acc-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var body = head.nextElementSibling;
      var open = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (body) body.classList.toggle('open', !open);
    });
  });

  /* ======================================================================
     Consent gate
     ----------------------------------------------------------------------
     Mirrors the disclaimer the original site showed before any clinical
     imagery. Consent is remembered for the browsing session only.
     ====================================================================== */
  if (document.body.classList.contains('needs-consent')) {
    var stored = null;
    try { stored = sessionStorage.getItem('sdcc-consent'); } catch (err) {}

    if (stored === 'yes') {
      document.body.classList.remove('needs-consent');
    } else {
      var box = document.getElementById('consent-check');
      var agree = document.getElementById('consent-agree');
      if (box && agree) {
        var sync = function () {
          agree.disabled = !box.checked;
          agree.setAttribute('aria-disabled', box.checked ? 'false' : 'true');
        };
        sync();
        box.addEventListener('change', sync);

        agree.addEventListener('click', function () {
          try { sessionStorage.setItem('sdcc-consent', 'yes'); } catch (err) {}
          document.body.classList.remove('needs-consent');
          /* Move focus to the now-revealed content so keyboard and screen
             reader users land where the new content starts. */
          var main = document.getElementById('main');
          if (main) {
            main.setAttribute('tabindex', '-1');
            main.focus({ preventScroll: true });
          }
          window.scrollTo({
            top: 0,
            behavior: reduceMotion.matches ? 'auto' : 'smooth'
          });
        });
      }
    }
  }

  /* ======================================================================
     Lightbox
     ====================================================================== */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lb-cap-text');
    var lbCount = lb.querySelector('.lb-count');
    var items = [];
    var idx = 0;
    var lastFocused = null;

    var collect = function () {
      items = Array.prototype.slice.call(document.querySelectorAll('[data-lb]'));
    };

    var show = function (i) {
      if (!items.length) return;
      idx = (i + items.length) % items.length;
      var el = items[idx];
      var src = el.getAttribute('data-lb');
      var cap = el.getAttribute('data-cap') || '';
      lbImg.setAttribute('src', src);
      lbImg.setAttribute('alt', cap);
      if (lbCap) lbCap.textContent = cap;
      if (lbCount) lbCount.textContent = 'Image ' + (idx + 1) + ' of ' + items.length;
      lb.setAttribute('aria-label', cap || 'Image viewer');
    };

    var open = function (i) {
      lastFocused = document.activeElement;
      show(i);
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
      var close = lb.querySelector('.lb-close');
      if (close) close.focus();
    };

    var close = function () {
      lb.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.setAttribute('src', '');
      /* Return focus to whatever opened the viewer. */
      if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
      lastFocused = null;
    };

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-lb]');
      if (!trigger) return;
      e.preventDefault();
      collect();
      open(items.indexOf(trigger));
    });

    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowLeft') { show(idx - 1); return; }
      if (e.key === 'ArrowRight') { show(idx + 1); return; }
      if (e.key === 'Tab') trapFocus(lb, e);
    });
  }

  /* ======================================================================
     Back to top
     ====================================================================== */
  var top = document.querySelector('.to-top');
  if (top) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      /* Read layout inside rAF so the scroll handler never forces a sync
         reflow on every event. */
      window.requestAnimationFrame(function () {
        top.classList.toggle('show', window.scrollY > 480);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      /* Send focus back to the top of the document, not just the viewport. */
      var skip = document.querySelector('.skip');
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  /* ======================================================================
     Reveal on scroll (+ staggered children)
     ====================================================================== */
  var reveals = document.querySelectorAll('.reveal, .stagger');

  if (!reveals.length) {
    /* nothing to do */
  } else if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* If the user turns reduced-motion on mid-session, drop the animations. */
  var onMotionChange = function () {
    if (!reduceMotion.matches) return;
    document.querySelectorAll('.reveal, .stagger').forEach(function (el) {
      el.classList.add('in');
    });
  };
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionChange);
  else if (reduceMotion.addListener) reduceMotion.addListener(onMotionChange);

  /* ======================================================================
     Current year
     ====================================================================== */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
