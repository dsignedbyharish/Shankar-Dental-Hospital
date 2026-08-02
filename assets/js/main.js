/* ==========================================================================
   Shanker Dental & Craniofacial Centre — Site scripts
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggle.focus();
      }
    });
  }

  /* ---------- Accordions ---------- */
  document.querySelectorAll('.acc-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var body = head.nextElementSibling;
      var open = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (body) body.classList.toggle('open', !open);
    });
  });

  /* ---------- Consent gate ----------
     Mirrors the disclaimer the original site showed before any clinical
     imagery. Consent is remembered for the browsing session only.        */
  if (document.body.classList.contains('needs-consent')) {
    var stored = null;
    try { stored = sessionStorage.getItem('sdcc-consent'); } catch (err) {}

    if (stored === 'yes') {
      document.body.classList.remove('needs-consent');
    } else {
      var box = document.getElementById('consent-check');
      var btn = document.getElementById('consent-agree');
      if (box && btn) {
        box.addEventListener('change', function () { btn.disabled = !box.checked; });
        btn.addEventListener('click', function () {
          try { sessionStorage.setItem('sdcc-consent', 'yes'); } catch (err) {}
          document.body.classList.remove('needs-consent');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }
  }

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lb-cap');
    var items = [];
    var idx = 0;

    var collect = function () {
      items = Array.prototype.slice.call(
        document.querySelectorAll('[data-lb]')
      );
    };

    var show = function (i) {
      if (!items.length) return;
      idx = (i + items.length) % items.length;
      var el = items[idx];
      var src = el.getAttribute('data-lb') || el.getAttribute('src');
      var cap = el.getAttribute('data-cap') || el.getAttribute('alt') || '';
      lbImg.setAttribute('src', src);
      lbImg.setAttribute('alt', cap);
      lbCap.textContent = cap;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    var close = function () {
      lb.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.setAttribute('src', '');
    };

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-lb]');
      if (!trigger) return;
      e.preventDefault();
      collect();
      show(items.indexOf(trigger));
    });

    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------- Back to top ---------- */
  var top = document.querySelector('.to-top');
  if (top) {
    var onScroll = function () {
      top.classList.toggle('show', window.scrollY > 480);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Current year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
