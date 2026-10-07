/* Ideal House — site interactions (no dependencies) */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shadow + mobile action bar on scroll */
  var header = document.querySelector('.header');
  var bar = document.querySelector('.actionbar');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (bar) bar.classList.toggle('is-visible', y > 420);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* Mobile menu */
  var menu = document.getElementById('mnav');
  var openBtn = document.querySelector('[data-menu-open]');
  var lastFocus = null;
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    if (openBtn) openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      lastFocus = document.activeElement;
      var c = menu.querySelector('[data-menu-close]');
      if (c) setTimeout(function () { c.focus(); }, 50);
    } else if (lastFocus) {
      lastFocus.focus();
    }
  }
  if (openBtn) openBtn.addEventListener('click', function () { setMenu(true); });
  document.querySelectorAll('[data-menu-close]').forEach(function (b) {
    b.addEventListener('click', function () { setMenu(false); });
  });
  if (menu) menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu && menu.classList.contains('is-open')) setMenu(false);
  });

  /* Reveal on scroll */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Count-up stats (final values are already in the HTML) */
  var nums = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduce && nums.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target.querySelector('b');
        var end = parseInt(en.target.getAttribute('data-count'), 10);
        var t0 = null, dur = 1400;
        function step(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { cio.observe(n); });
  }

  /* Portfolio filter */
  var filters = document.querySelectorAll('[data-filter]');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      document.querySelectorAll('[data-cat]').forEach(function (t) {
        t.hidden = !(f === 'alle' || t.getAttribute('data-cat') === f);
      });
    });
  });

  /* Carousel arrows */
  document.querySelectorAll('[data-car]').forEach(function (nav) {
    var track = document.getElementById(nav.getAttribute('data-car'));
    if (!track) return;
    nav.querySelectorAll('[data-dir]').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = b.getAttribute('data-dir') === 'next' ? 1 : -1;
        track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  });

  /* Lightbox */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = lb.querySelector('.lb__img');
    var lbTitle = lb.querySelector('.lb__cap strong');
    var lbText = lb.querySelector('.lb__cap span');
    var lbCount = lb.querySelector('.lb__count');
    var items = [], idx = 0, opener = null, touchX = null;

    function visibleItems(group) {
      return Array.prototype.filter.call(
        document.querySelectorAll('[data-lightbox="' + group + '"]'),
        function (a) { return !a.hidden; }
      );
    }
    function show(i) {
      idx = (i + items.length) % items.length;
      var a = items[idx];
      lbImg.src = a.getAttribute('href');
      lbImg.alt = a.querySelector('img') ? a.querySelector('img').alt : '';
      lbTitle.textContent = a.getAttribute('data-title') || '';
      lbText.textContent = a.getAttribute('data-sub') || '';
      lbCount.textContent = (idx + 1) + ' / ' + items.length;
    }
    function open(a) {
      items = visibleItems(a.getAttribute('data-lightbox'));
      opener = a;
      show(items.indexOf(a));
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb__close').focus();
    }
    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lbImg.removeAttribute('src');
      if (opener) opener.focus();
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-lightbox]');
      if (!a || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      open(a);
    });
    lb.querySelector('.lb__close').addEventListener('click', close);
    lb.querySelector('.lb__prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb__next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  doc.classList.add('ready');
})();
