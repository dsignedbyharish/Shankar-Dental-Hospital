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

  /* Assigned by the reveal section below. Anything that makes hidden content
     displayable must call this, or elements that were `display: none` when the
     observer was built stay masked forever — they never intersected, so the
     observer never fired for them. The consent gate is exactly that case. */
  var revealRefresh = function () {};

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
     Nav dropdowns ("Treatment Options", "More")
     ----------------------------------------------------------------------
     Desktop only — on mobile every toggle is hidden and each panel is
     unwrapped into the drawer's normal flow by CSS, so none of this runs
     against it. Two independent dropdowns share the header, so opening one
     closes the other rather than letting both sit open at once.
     ====================================================================== */
  var moreWraps = Array.prototype.slice.call(document.querySelectorAll('.nav-more'));
  if (moreWraps.length) {
    var dropdowns = moreWraps.map(function (wrap) {
      return { wrap: wrap, toggle: wrap.querySelector('.nav-more-toggle'), panel: wrap.querySelector('.nav-more-panel') };
    });

    var closeDropdown = function (d) {
      d.panel.classList.remove('open');
      d.toggle.setAttribute('aria-expanded', 'false');
    };
    var closeAllDropdowns = function (except) {
      dropdowns.forEach(function (d) { if (d !== except) closeDropdown(d); });
    };
    var openDropdown = function (d) {
      closeAllDropdowns(d);
      d.panel.classList.add('open');
      d.toggle.setAttribute('aria-expanded', 'true');
    };

    dropdowns.forEach(function (d) {
      d.toggle.addEventListener('click', function () {
        if (d.panel.classList.contains('open')) closeDropdown(d);
        else openDropdown(d);
      });
    });

    /* Click anywhere outside every dropdown closes whichever is open. */
    document.addEventListener('click', function (e) {
      dropdowns.forEach(function (d) {
        if (!d.wrap.contains(e.target)) closeDropdown(d);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var open = dropdowns.find(function (d) { return d.panel.classList.contains('open'); });
      if (!open) return;
      closeDropdown(open);
      open.toggle.focus();
    });

    /* A panel left open while resizing past the breakpoint would sit under
       the mobile drawer's own layout with stale inline state. */
    window.addEventListener('resize', function () {
      if (window.innerWidth <= 1060) closeAllDropdowns();
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
          /* The clinical figures were display:none until this instant, so the
             observer never saw them. Without this they stay masked and the
             page reads as empty — the whole point of passing the gate. */
          revealRefresh();
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
     Before / after comparison sliders
     ----------------------------------------------------------------------
     The range input is the single source of truth, so dragging, arrow keys
     and assistive tech all drive the same value.
     ====================================================================== */
  document.querySelectorAll('.compare').forEach(function (cmp) {
    var range = cmp.querySelector('.compare-range');
    if (!range) return;

    var apply = function () {
      cmp.style.setProperty('--pos', range.value + '%');
      range.setAttribute('aria-valuetext', range.value + '% of the after image shown');
    };
    range.addEventListener('input', apply);
    apply();

    /* Dragging anywhere on the frame feels more natural than only on the
       handle; pointer events cover mouse, pen and touch in one path. */
    var dragging = false;
    var setFromX = function (clientX) {
      var r = cmp.getBoundingClientRect();
      var pct = ((clientX - r.left) / r.width) * 100;
      range.value = Math.max(0, Math.min(100, pct));
      apply();
    };
    cmp.addEventListener('pointerdown', function (e) {
      if (e.target === range) return;         /* let the input handle itself */
      dragging = true;
      cmp.setPointerCapture(e.pointerId);
      setFromX(e.clientX);
    });
    cmp.addEventListener('pointermove', function (e) { if (dragging) setFromX(e.clientX); });
    cmp.addEventListener('pointerup', function () { dragging = false; });
    cmp.addEventListener('pointercancel', function () { dragging = false; });
  });

  /* ======================================================================
     Parallax + scroll progress
     ----------------------------------------------------------------------
     One rAF loop drives every effect. Layout is read in a single batch and
     only transforms are written, so there is no per-scroll reflow.
     ====================================================================== */
  var parallaxItems = Array.prototype.slice.call(document.querySelectorAll('.parallax'));
  var progressBar = document.querySelector('.scroll-progress');

  if ((parallaxItems.length || progressBar) && !reduceMotion.matches) {
    var pTicking = false;

    var updateScrollFx = function () {
      var vh = window.innerHeight;

      parallaxItems.forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.bottom < -200 || box.top > vh + 200) return;
        var depth = parseFloat(el.getAttribute('data-depth')) || 0.14;
        /* -1 at the top of the viewport, +1 at the bottom. */
        var mid = (box.top + box.height / 2 - vh / 2) / (vh / 2);
        el.style.setProperty('--py', (mid * depth * 100).toFixed(2) + 'px');
      });

      if (progressBar) {
        var max = document.documentElement.scrollHeight - vh;
        progressBar.style.setProperty('--progress', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
      }
      pTicking = false;
    };

    var onScrollFx = function () {
      if (pTicking) return;
      pTicking = true;
      window.requestAnimationFrame(updateScrollFx);
    };

    window.addEventListener('scroll', onScrollFx, { passive: true });
    window.addEventListener('resize', onScrollFx, { passive: true });
    updateScrollFx();
  }

  /* ======================================================================
     Reveal on scroll (+ staggered children, + heading wipes)
     ====================================================================== */
  /* `.lit` is an in-view flag with no styles of its own — it lets an element
     react to entering the viewport without the opacity fade `.reveal` implies.
     The hero rule and the portrait mask use it. */
  var reveals = document.querySelectorAll('.reveal, .stagger, .rise, .lit, .unmask, .figure');

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

    /* Re-scan after content that was `display: none` becomes displayable.
       An element with no box never intersects, so the observer will not fire
       for it later — re-observing is what actually restarts it. Anything
       already on screen is revealed outright rather than waiting for a scroll
       the visitor may never make. */
    revealRefresh = function () {
      window.requestAnimationFrame(function () {
        reveals.forEach(function (el) {
          if (el.classList.contains('in')) return;
          var box = el.getBoundingClientRect();
          if (box.top < window.innerHeight && box.bottom > 0) {
            el.classList.add('in');
            io.unobserve(el);
          } else {
            io.unobserve(el);
            io.observe(el);
          }
        });
      });
    };

    /* Anything already on screen at load is revealed on the next frame rather
       than waiting for a scroll. Without this an above-the-fold heading inside
       a `.rise` clip stays invisible if the observer never fires — and the
       hero h1 is the worst possible thing to lose. */
    window.requestAnimationFrame(function () {
      reveals.forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) {
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    });

    /* Last-resort guard: if anything is still hidden after load (observer
       never fired, layout shifted), show it rather than leave a blank page. */
    window.addEventListener('load', function () {
      setTimeout(function () {
        reveals.forEach(function (el) {
          var box = el.getBoundingClientRect();
          if (box.top < window.innerHeight && box.bottom > 0) el.classList.add('in');
        });
      }, 400);
    });
  }

  /* If the user turns reduced-motion on mid-session, drop the animations. */
  var onMotionChange = function () {
    if (!reduceMotion.matches) return;
    document.querySelectorAll('.reveal, .stagger, .rise, .lit, .unmask, .figure').forEach(function (el) {
      el.classList.add('in');
    });
    document.querySelectorAll('.parallax').forEach(function (el) {
      el.style.removeProperty('--py');
    });
  };
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionChange);
  else if (reduceMotion.addListener) reduceMotion.addListener(onMotionChange);

  /* ======================================================================
     Header state
     ----------------------------------------------------------------------
     The header carries no rule while the page is at rest and gains one once
     there is content behind it. Purely presentational — without scripts the
     header simply stays in its resting state, which is a valid design.
     ====================================================================== */
  var header = document.querySelector('.site-header');
  if (header) {
    var hTicking = false;
    var syncHeader = function () {
      if (hTicking) return;
      hTicking = true;
      window.requestAnimationFrame(function () {
        header.classList.toggle('is-stuck', window.scrollY > 12);
        hTicking = false;
      });
    };
    window.addEventListener('scroll', syncHeader, { passive: true });
    syncHeader();
  }

  /* ======================================================================
     Stat count-up
     ----------------------------------------------------------------------
     Counts only the numeric part, so "7,500" animates and "NABH" is left
     alone. The final text is already in the HTML — this replaces it during
     the animation and restores it exactly, so a failure mid-flight cannot
     leave a wrong number on screen.
     ====================================================================== */
  var stats = document.querySelectorAll('.stat-num');
  if (stats.length && !reduceMotion.matches && 'IntersectionObserver' in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        countIO.unobserve(el);

        var final = el.textContent;
        var match = final.match(/^([^\d]*)([\d,]+)(.*)$/);
        if (!match) return;                       /* e.g. "NABH" — leave it */
        var prefix = match[1];
        var suffix = match[3];
        var target = parseInt(match[2].replace(/,/g, ''), 10);
        if (!isFinite(target) || target <= 0) return;

        var started = null;
        var DURATION = 1100;
        var step = function (now) {
          if (started === null) started = now;
          var t = Math.min((now - started) / DURATION, 1);
          /* ease-out cubic, so it settles rather than stopping dead */
          var eased = 1 - Math.pow(1 - t, 3);
          if (t < 1) {
            el.textContent = prefix + Math.round(target * eased).toLocaleString('en-IN') + suffix;
            window.requestAnimationFrame(step);
          } else {
            el.textContent = final;               /* restore verbatim */
          }
        };
        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    stats.forEach(function (el) { countIO.observe(el); });
  }

  /* ======================================================================
     Current year
     ====================================================================== */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
