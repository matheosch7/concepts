/* ReallyBeyond v4 motion. Progressive: the page is complete without this file.
   Everything below the nav handler runs only when html.motion is set (prefers-reduced-motion: no-preference). */
(function () {
  var d = document, html = d.documentElement, top = d.querySelector('.top');

  var onScroll = function () { top.classList.toggle('scrolled', scrollY > 4); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var mb = d.querySelector('.menu-btn');
  if (mb) new MutationObserver(function () { top.classList.toggle('menu', mb.getAttribute('aria-expanded') === 'true'); })
    .observe(mb, { attributes: true, attributeFilter: ['aria-expanded'] });

  if (!html.classList.contains('motion') || !('IntersectionObserver' in window)) return;

  var EASE = 'cubic-bezier(.23,1,.32,1)';
  var vh = innerHeight;
  var below = function (el) { var r = el.getBoundingClientRect(); return r.height > 0 && r.top > vh * 0.92; };
  var once = function (el, fn, opts) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, opts || { threshold: 0.25 });
    io.observe(el);
  };
  // visibility flag for live (looping) behaviours, so nothing runs off-screen
  var watch = function (el) {
    var st = { on: false };
    new IntersectionObserver(function (es) { st.on = es[0].isIntersecting; }).observe(el);
    return st;
  };

  /* 1. hero / cover headline: assign each word its line index, then start the load sequence */
  var setLines = function () {
    d.querySelectorAll('.lines').forEach(function (h) {
      var y = null, l = -1;
      h.querySelectorAll('.w').forEach(function (w) {
        if (y === null || Math.abs(w.offsetTop - y) > 4) { y = w.offsetTop; l++; }
        w.style.setProperty('--l', l);
      });
    });
  };
  var go = function () { if (readyAt) return; if (!html.classList.contains('ready')) { setLines(); html.classList.add('ready'); } readyAt = performance.now(); };
  var readyAt = 0;
  if (d.fonts && d.fonts.status !== 'loaded') { d.fonts.ready.then(go); setTimeout(go, 500); } else go();
  var afterReady = function (ms, fn) {
    var wait = function () { if (!readyAt) return setTimeout(wait, 50); setTimeout(fn, Math.max(0, readyAt + ms - performance.now())); };
    wait();
  };

  /* 2. section heads: one 12px fade-up, only for heads that start below the fold */
  d.querySelectorAll('.work-h .wh-l, .sec .head, .head-st, .head8, .rh, .g-cap, .next .nh, .vcap, .contact .l > h2').forEach(function (el) {
    if (!below(el)) return;
    el.classList.add('rv');
    once(el, function () { el.classList.add('in'); }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  });

  /* 3. count-up for KPI figures in report cards (once, 800ms, ease-out) */
  var parse = function (el) {
    var n = el.firstChild;
    if (!n || n.nodeType !== 3 || /[:–]/.test(n.data)) return null;
    var m = n.data.match(/^(\D*)([\d,]*\.?\d+)(.*)$/);
    if (!m) return null;
    var v = parseFloat(m[2].replace(/,/g, ''));
    if (!v) return null;
    return { node: n, pre: m[1], post: m[3], v: v, dec: (m[2].split('.')[1] || '').length, comma: m[2].indexOf(',') > -1 };
  };
  var fmt = function (c, x) {
    var s = x.toFixed(c.dec);
    if (c.comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return c.pre + s + c.post;
  };
  var count = function (c) {
    var t0 = performance.now();
    var step = function (now) {
      var t = Math.min(1, (now - t0) / 800), e = 1 - Math.pow(1 - t, 4);
      c.node.data = fmt(c, c.v * e);
      if (t < 1) requestAnimationFrame(step); else c.node.data = fmt(c, c.v);
    };
    requestAnimationFrame(step);
  };
  var counters = function (scope) {
    var out = [];
    scope.querySelectorAll('.rp-g dd, .kpi b, .mkp b').forEach(function (el) { var c = parse(el); if (c) { c.node.data = fmt(c, 0); out.push(c); } });
    return out;
  };
  d.querySelectorAll('.stage .report').forEach(function (r) {
    var cs = counters(r);
    afterReady(760, function () { cs.forEach(count); });
  });
  d.querySelectorAll('.kpi, .mkp').forEach(function (k) {
    if (k.closest('.stage') || !below(k)) return;
    var cs = counters(k);
    k.classList.add('dw');
    once(k, function () { k.classList.add('drawn'); cs.forEach(count); }, { threshold: 0.5 });
  });

  /* 4. charts draw in once from their baseline */
  d.querySelectorAll('.chart, .gantt').forEach(function (c) {
    if (!below(c)) return;
    c.classList.add('dw');
    once(c, function () { c.classList.add('drawn'); }, { threshold: 0.35 });
  });

  /* 5. live: the top release goes from Staging to Live, and the audit trail records it */
  var flips = d.querySelectorAll('[data-live=flip]');
  if (flips.length) {
    var stage = d.querySelector('.stage'), sv = watch(stage);
    var flip = function () {
      if (!sv.on || d.hidden) return setTimeout(flip, 1000);
      flips.forEach(function (p) {
        p.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.9)' }], { duration: 140, easing: 'ease-out' }).onfinish = function () {
          p.classList.remove('go'); p.classList.add('ok'); p.textContent = 'Live';
          p.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 320, easing: EASE });
        };
      });
      setTimeout(trail, 650);
    };
    var trail = function () {
      var ol = d.querySelector('[data-live=trail]');
      if (!ol || !ol.offsetParent) return;
      var li = d.createElement('li');
      li.innerHTML = '<span class="tm">14:20</span><span class="av a2">NR</span><span><b>6.42.0</b> live; 0 errors so far</span>';
      ol.insertBefore(li, ol.firstChild);
      var h = li.offsetHeight, last = ol.lastElementChild, lh = last.offsetHeight;
      li.style.overflow = last.style.overflow = 'hidden';
      li.animate([{ height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 }, { height: h + 'px', opacity: 0, offset: 0.4 }, { height: h + 'px', opacity: 1 }], { duration: 700, easing: EASE })
        .onfinish = function () { li.style.overflow = ''; };
      last.animate([{ height: lh + 'px', opacity: 1 }, { height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 }], { duration: 500, easing: EASE, fill: 'forwards' })
        .onfinish = function () { last.remove(); };
    };
    afterReady(4200, flip);
  }

  /* 6. live: "Updated N s ago" ticks; every 30 s the board refreshes and vehicles in transit advance */
  d.querySelectorAll('.pane-h .sub').forEach(function (s) {
    var m = s.textContent.match(/^Updated (\d+) s ago$/);
    if (!m) return;
    var n = +m[1], win = s.closest('.win') || s, v = watch(win);
    setInterval(function () {
      if (!v.on || d.hidden) return;
      n = (n + 1) % 30;
      s.textContent = n ? 'Updated ' + n + ' s ago' : 'Updated just now';
      if (!n) win.querySelectorAll('.bar-s i').forEach(function (b) {
        var w = parseFloat(b.style.width); if (w && w < 98) b.style.width = (w + 1) + '%';
      });
    }, 1000);
  });

  /* 7. live: one vehicle drives slowly along its route on each map */
  d.querySelectorAll('svg').forEach(function (svg) {
    var veh = svg.querySelector('.veh'), rt = svg.querySelector('.rt');
    if (!veh || !rt || !rt.getTotalLength) return;
    var len = rt.getTotalLength(), cx = +veh.getAttribute('cx'), cy = +veh.getAttribute('cy'), t0 = 0, best = 1e9;
    for (var i = 0; i <= 300; i++) {
      var p = rt.getPointAtLength(len * i / 300), dd = (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy);
      if (dd < best) { best = dd; t0 = len * i / 300; }
    }
    var speed = svg.viewBox.baseVal.width / 150, t = t0, last = 0, v = watch(svg), resetting = false;
    var frame = function (now) {
      var dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
      if (v.on && !d.hidden && !resetting) {
        t += speed * dt;
        if (t >= len - 4) {
          resetting = true; veh.style.opacity = 0;
          setTimeout(function () { t = t0; veh.removeAttribute('transform'); veh.style.opacity = ''; resetting = false; }, 600);
        } else {
          var p = rt.getPointAtLength(t);
          veh.setAttribute('transform', 'translate(' + (p.x - cx).toFixed(2) + ' ' + (p.y - cy).toFixed(2) + ')');
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
})();
