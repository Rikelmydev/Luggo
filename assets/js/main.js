/* Luggo. Interações do site (sem build, funciona via file://). */
(function () {
  'use strict';

  /* E-mail que recebe o formulário de patrocínio. Deixe vazio para o modo demonstração. */
  var TEAM_EMAIL = '';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motionOK = function () { return hasGsap && !reduceMQ.matches; };
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var dateFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Range fill ---------- */
  function paintRange(input) {
    var min = +input.min || 0, max = +input.max || 100;
    input.style.setProperty('--fill', ((+input.value - min) / (max - min)) * 100 + '%');
  }
  $$('input[type="range"]').forEach(function (r) {
    paintRange(r);
    r.addEventListener('input', function () { paintRange(r); });
  });

  /* ---------- Nav ---------- */
  var nav = $('[data-nav]');
  var hero = $('#inicio');
  var sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:90px;pointer-events:none;';
  hero.prepend(sentinel);
  new IntersectionObserver(function (entries) {
    nav.classList.toggle('is-solid', !entries[0].isIntersecting);
  }).observe(sentinel);

  var navLinks = $$('.nav__links a');
  var watched = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  function navObserverCb(entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      navLinks.forEach(function (a) {
        if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }
  var navObserver = new IntersectionObserver(navObserverCb, { rootMargin: '-45% 0px -50% 0px' });
  watched.forEach(function (s) { navObserver.observe(s); });

  /* mobile menu */
  var menuBtn = $('[data-menu-toggle]');
  var menu = $('[data-menu]');
  var behindMenu = [$('main'), $('.footer'), $('.skip-link')];
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    nav.classList.toggle('is-open', open);
    $('use', menuBtn).setAttribute('href', open ? '#i-x' : '#i-list');
    $('.sr-only', menuBtn).textContent = open ? 'Fechar menu' : 'Abrir menu';
    document.documentElement.style.overflow = open ? 'hidden' : '';
    behindMenu.forEach(function (el) { if (el) el.inert = open; });
    if (open) $('a', menu).focus();
  }
  /* voltou para o desktop com o menu aberto: fecha */
  window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) {
    if (e.matches && !menu.hidden) setMenu(false);
  });
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
  });

  /* ---------- 1. Hero: a mala chega, a alça sobe, a etiqueta balança ---------- */
  var stage = $('.hero__stage');
  var suitcase = $('[data-suitcase]');
  var handle = $('[data-suitcase-handle]');
  var tag = $('[data-bagtag]');
  var shadow = $('.suitcase__shadow');

  if (motionOK()) {
    var lines = $$('.hero__title .line > span');
    var fades = $$('[data-hero-fade]');
    gsap.set(lines, { yPercent: 110 });
    gsap.set(fades, { opacity: 0, y: 18 });
    gsap.set(suitcase, { x: function () { return window.innerWidth - stage.getBoundingClientRect().left + 60; }, rotate: 0, transformOrigin: '50% 96%' });
    gsap.set(handle, { yPercent: 25 });
    gsap.set(tag, { scale: 0, rotate: 50 });

    var intro = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 });
    intro
      .to(lines, { yPercent: 0, duration: 1, stagger: 0.12, ease: 'power4.out' }, 0)
      .to(fades, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, 0.5)
      .to(suitcase, { x: 0, duration: 1.25, ease: 'power3.out' }, 0.1)
      .to(suitcase, { rotate: -3, duration: 0.45, ease: 'sine.out' }, 0.1)
      .to(suitcase, { rotate: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' }, 1.05)
      .to(handle, { yPercent: 0, duration: 0.8, ease: 'back.out(1.8)' }, 1.25)
      .to(tag, { scale: 1, duration: 0.4, ease: 'back.out(2.2)' }, 1.55)
      .to(tag, { rotate: 8, duration: 2.6, ease: 'elastic.out(1.1, 0.22)' }, 1.55);

    /* aba em segundo plano não desenha frames: nunca deixa o hero vazio */
    setTimeout(function () { if (intro.progress() < 0.05) intro.progress(1); }, 2500);

    var lastX = null;
    tag.addEventListener('pointermove', function (e) { lastX = e.movementX; });
    tag.addEventListener('pointerenter', function (e) {
      var dir = (e.movementX || lastX || 1) > 0 ? 1 : -1;
      gsap.fromTo(tag, { rotate: 8 + dir * 22 }, { rotate: 8, duration: 2, ease: 'elastic.out(1, 0.25)', overwrite: true });
    });
  }

  /* ---------- 2. Ano da mala ---------- */
  var cal = $('[data-calendar]');
  var monthsRow = $('[data-months]');
  var tripsIn = $('#trips');
  var daysIn = $('#tripdays');
  var flap = $('[data-flap]');
  var idleSentence = $('[data-idle-sentence]');
  var idleLive = $('[data-idle-live]');
  var OFFSET = 4;
  var cells = [];
  var frag = document.createDocumentFragment();
  for (var p = 0; p < OFFSET; p++) { var pad = document.createElement('i'); pad.className = 'pad'; frag.appendChild(pad); }
  for (var d = 0; d < 365; d++) { var c = document.createElement('i'); cells.push(c); frag.appendChild(c); }
  cal.appendChild(frag);
  [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334].forEach(function (start, i) {
    var s = document.createElement('span');
    s.textContent = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][i];
    s.style.gridColumn = (Math.floor((start + OFFSET) / 7) + 1) + ' / span 4';
    monthsRow.appendChild(s);
  });

  var flapDigits = [];
  function setFlap(value) {
    var str = String(value);
    while (flapDigits.length < str.length) {
      var el = document.createElement('span'); el.className = 'flap__d'; el.textContent = '0';
      flap.appendChild(el); flapDigits.push(el);
    }
    while (flapDigits.length > str.length) flap.removeChild(flapDigits.pop());
    str.split('').forEach(function (ch, i) {
      var el = flapDigits[i];
      if (el.textContent === ch) return;
      if (!motionOK() || !el.animate) { el.textContent = ch; return; }
      el.getAnimations().forEach(function (a) { a.cancel(); });
      var out = el.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], { duration: 90 + i * 30, easing: 'ease-in' });
      out.onfinish = function () {
        el.textContent = ch;
        el.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], { duration: 150, easing: 'cubic-bezier(.16,1,.3,1)' });
      };
    });
  }

  var idleStarted = false;
  var liveTimer;
  function updateIdle(animate) {
    var trips = +tripsIn.value, len = +daysIn.value;
    $('[data-out="trips"]').textContent = trips;
    $('[data-out="tripdays"]').textContent = len;
    var on = new Array(365).fill(false);
    var spacing = 365 / trips;
    for (var t = 0; t < trips; t++) {
      var start = Math.round(spacing * t + spacing / 2 - len / 2);
      start = Math.max(0, Math.min(365 - len, start));
      for (var k = start; k < start + len; k++) on[k] = true;
    }
    var newly = [];
    var used = 0;
    cells.forEach(function (cell, i) {
      if (on[i]) used++;
      if (on[i] && !cell.classList.contains('on')) newly.push(cell);
      cell.classList.toggle('on', on[i]);
    });
    var idle = 365 - used;
    var pct = Math.round((idle / 365) * 100);
    setFlap(idle);
    idleSentence.textContent = 'Ela trabalha ' + used + ' dias e fica guardada ' + pct + '% do ano. Com a Luggo, você paga só pelos ' + used + '.';
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () { idleLive.textContent = idle + ' dias parada por ano.'; }, 600);
    if (animate && motionOK() && newly.length) {
      gsap.fromTo(newly, { scale: 0.2 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', stagger: animate === 'intro' ? 0.018 : 0.004 });
    }
  }
  tripsIn.addEventListener('input', function () { idleStarted = true; updateIdle(true); });
  daysIn.addEventListener('input', function () { idleStarted = true; updateIdle(true); });

  if (motionOK()) {
    setFlap(365);
    idleSentence.textContent = 'Um ano inteiro, esperando a próxima viagem.';
    ScrollTrigger.create({
      trigger: '#dilema', start: 'top 55%', once: true,
      onEnter: function () { if (!idleStarted) { idleStarted = true; updateIdle('intro'); } }
    });
  } else {
    updateIdle(false);
  }

  /* ---------- 3. Para quem ---------- */
  var whoBtns = $$('.who__pill');
  whoBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      whoBtns.forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        $('#' + b.getAttribute('aria-controls')).hidden = true;
      });
      if (!open) {
        btn.setAttribute('aria-expanded', 'true');
        var panel = $('#' + btn.getAttribute('aria-controls'));
        panel.hidden = false;
        if (motionOK()) gsap.fromTo(panel, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
      }
    });
  });

  /* ---------- 4. Antes e depois ---------- */
  if (motionOK()) {
    var afters = $$('.shift__after'), arrows = $$('.shift__arrow');
    gsap.set(afters, { opacity: 0, x: -28 });
    gsap.set(arrows, { scale: 0 });
    ScrollTrigger.create({
      trigger: '#o-que-muda', start: 'top 45%', once: true,
      onEnter: function () {
        gsap.timeline()
          .to(arrows, { scale: 1, duration: 0.45, ease: 'back.out(2.5)', stagger: 0.14 })
          .to(afters, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', stagger: 0.14 }, 0.12);
      }
    });
  }

  /* ---------- 5. Como funciona: rota fixada no scroll ---------- */
  var howSection = $('[data-how]');
  var route = $('[data-route]');
  var progressPath = $('[data-route-progress]');
  var rider = $('[data-route-rider]');
  var steps = $$('.route__step');
  var howNum = $('[data-how-num]'), howTitle = $('[data-how-title]'), howText = $('[data-how-text]');
  var howST = null;
  var activeStep = -1;
  var pathLen = progressPath.getTotalLength();

  function setStep(i, animate) {
    if (i === activeStep) return;
    activeStep = i;
    steps.forEach(function (s, k) {
      s.classList.toggle('is-active', k === i);
      s.classList.toggle('is-done', k < i);
    });
    var li = steps[i];
    var label = $('.route__label', li).textContent.replace(/^\d+\s*/, '');
    var fill = function () {
      howNum.textContent = i + 1;
      howTitle.textContent = label;
      howText.textContent = $('.route__text', li).textContent;
    };
    if (animate && motionOK()) {
      gsap.to('[data-how-detail] > *', {
        opacity: 0, y: -8, duration: 0.15, ease: 'power1.in', overwrite: true,
        onComplete: function () { fill(); gsap.fromTo('[data-how-detail] > *', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out', stagger: 0.04 }); }
      });
    } else fill();
  }

  function renderRoute(p) {
    progressPath.style.strokeDashoffset = String(pathLen * (1 - p));
    var pt = progressPath.getPointAtLength(pathLen * p);
    var w = route.clientWidth, h = route.clientHeight;
    rider.style.transform = 'translate(' + (pt.x / 1200 * w) + 'px,' + (pt.y / 330 * h) + 'px) translate(-50%, -92%)';
    setStep(Math.min(steps.length - 1, Math.round(p * (steps.length - 1))), true);
  }

  steps.forEach(function (li, i) {
    $('.route__node', li).addEventListener('click', function () {
      if (howST) {
        var y = howST.start + (howST.end - howST.start) * (i / (steps.length - 1));
        window.scrollTo({ top: y, behavior: reduceMQ.matches ? 'auto' : 'smooth' });
      } else setStep(i, true);
    });
  });

  if (hasGsap) {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
      progressPath.style.strokeDasharray = String(pathLen);
      renderRoute(0);
      howST = ScrollTrigger.create({
        trigger: howSection, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 2.4); },
        pin: true, scrub: 0.5, anticipatePin: 1,
        onUpdate: function (self) { renderRoute(self.progress); },
        onRefresh: function (self) { renderRoute(self.progress); }
      });
      return function () {
        howST = null;
        progressPath.style.strokeDasharray = '';
        progressPath.style.strokeDashoffset = '';
      };
    });
    mm.add('(min-width: 900px) and (prefers-reduced-motion: reduce)', function () {
      var pt = progressPath.getPointAtLength(pathLen);
      rider.style.transform = 'translate(' + (pt.x / 1200 * route.clientWidth) + 'px,' + (pt.y / 330 * route.clientHeight) + 'px) translate(-50%, -92%)';
      setStep(0, false);
    });
  } else {
    setStep(0, false);
  }

  /* ---------- 6. Simulador ---------- */
  var sim = $('[data-sim]');
  var ticket = $('[data-ticket]');
  var stamp = $('[data-stamp]');
  var reserveBtn = $('[data-reserve]');
  var reserveStatus = $('[data-reserve-status]');
  var SIZE_NAMES = { P: 'De bordo', M: 'Média', G: 'Grande' };
  var FREIGHT = 19.9;
  var t = function (k) { return $('[data-t="' + k + '"]', ticket); };
  var barcode = $('[data-barcode]');

  function clampInput(input) {
    var v = Math.round(+input.value);
    if (!isFinite(v)) v = +input.min;
    input.value = Math.max(+input.min, Math.min(+input.max, v));
  }

  function drawBarcode(code) {
    barcode.textContent = '';
    var seed = 0;
    for (var i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) >>> 0;
    for (var b = 0; b < 20; b++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      var bar = document.createElement('i');
      if (seed % 3 === 0) bar.className = 'w';
      barcode.appendChild(bar);
    }
  }

  function updateSim() {
    clampInput($('#days')); clampInput($('#qty'));
    var sizeIn = $('input[name="size"]:checked', sim);
    var size = sizeIn.value, price = +sizeIn.dataset.price;
    var days = +$('#days').value, qty = +$('#qty').value;
    var home = $('input[name="delivery"]:checked', sim).value === 'casa';
    var start = new Date(); start.setDate(start.getDate() + 1);
    var end = new Date(start); end.setDate(end.getDate() + days);
    var rent = price * days * qty;
    var freight = home ? FREIGHT : 0;
    var code = 'LGG-' + size + String(days).padStart(2, '0') + (qty > 1 ? 'x' + qty : '');

    t('size').textContent = SIZE_NAMES[size];
    t('qty').textContent = qty === 1 ? '1 mala' : qty + ' malas';
    t('start').textContent = dateFmt.format(start);
    t('end').textContent = dateFmt.format(end);
    t('delivery').textContent = home ? 'Entrega e coleta em casa' : 'Retirada e devolução na loja';
    t('rentLabel').textContent = 'Aluguel (' + (qty > 1 ? qty + ' malas × ' : '') + days + (days === 1 ? ' dia' : ' dias') + ' × ' + brl.format(price) + ')';
    t('rent').textContent = brl.format(rent);
    t('freight').textContent = home ? brl.format(freight) : 'Grátis';
    t('total').textContent = brl.format(rent + freight);
    t('code').textContent = code;
    t('days').textContent = days;
    drawBarcode(code);

    if (ticket.classList.contains('is-reserved')) {
      ticket.classList.remove('is-reserved');
      reserveStatus.textContent = '';
      reserveBtn.textContent = 'Reservar esta mala';
    }
  }

  sim.addEventListener('change', updateSim);
  sim.addEventListener('input', function (e) { if (e.target.type === 'number') updateSim(); });
  $$('[data-step]', sim).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = $('input', btn.parentElement);
      input.value = +input.value + +btn.dataset.step;
      updateSim();
    });
  });
  sim.addEventListener('submit', function (e) { e.preventDefault(); });

  reserveBtn.addEventListener('click', function () {
    ticket.classList.add('is-reserved');
    reserveBtn.textContent = 'Reserva simulada';
    reserveStatus.textContent = 'Pronto. No app de verdade, este é o momento de pagar o período e o frete.';
    if (motionOK()) gsap.fromTo(stamp, { scale: 2.2, opacity: 0, rotate: -24 }, { scale: 1, opacity: 1, rotate: -11, duration: 0.5, ease: 'back.out(2)' });
  });
  updateSim();

  /* ---------- Tabs genéricas (ARIA) ---------- */
  function initTabs(list, onSelect) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (tb) {
        var on = tb === tab;
        tb.setAttribute('aria-selected', String(on));
        tb.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      onSelect(tab, tabs.indexOf(tab));
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') n = tabs[0];
        else if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); e.stopPropagation(); select(n, true); }
      });
    });
  }

  /* ---------- 7. Matrizes de posicionamento ---------- */
  var MATRICES = [
    {
      axes: { top: 'Alta conveniência', bottom: 'Baixa conveniência', left: 'Baixo preço', right: 'Alto preço' },
      corners: { tr: 'Concierge premium', bl: 'Mala usada ou emprestada' },
      luggo: [-3.3, 3.9], other: { label: 'Mala nova premium', at: [3.6, -3.5] },
      text: 'Comprar uma mala nova premium é caro e pouco prático. A Luggo entrega a mala certa por um preço de uso.',
      desc: 'Matriz preço por conveniência: a Luggo aparece com baixo preço e alta conveniência; a mala nova premium aparece com alto preço e baixa conveniência.'
    },
    {
      axes: { top: 'Alta flexibilidade', bottom: 'Baixa flexibilidade', left: 'Baixo custo', right: 'Alto custo' },
      corners: { tr: 'Várias malas próprias', bl: 'Mala usada ou emprestada' },
      luggo: [-2.9, 4.3], other: { label: 'Mala própria parada', at: [4.0, -4.3] },
      text: 'Ter a própria mala custa caro e ela passa a maior parte do tempo parada. O aluguel sob demanda dá flexibilidade com custo baixo.',
      desc: 'Matriz compra por aluguel: a Luggo aparece com baixo custo e alta flexibilidade; a mala própria parada aparece com alto custo e baixa flexibilidade.'
    },
    {
      axes: { top: 'Alta praticidade', bottom: 'Baixa praticidade', left: 'Pouco espaço ocupado', right: 'Muito espaço ocupado' },
      corners: { tr: 'Guarda-volumes e self storage', bl: 'Viajar sem mala adequada' },
      luggo: [-3.6, 3.5], other: { label: 'Comprar e guardar em casa', at: [3.2, -3.9] },
      text: 'Comprar e guardar ocupa espaço e dá trabalho. Com a Luggo, a mala chega quando você precisa e vai embora depois.',
      desc: 'Matriz espaço ocupado por praticidade: a Luggo aparece com pouco espaço ocupado e alta praticidade; comprar e guardar em casa aparece com muito espaço e baixa praticidade.'
    }
  ];
  var mFig = $('[data-matrix-figure]');
  var mText = $('[data-matrix-text]');
  var dotL = $('[data-dot="luggo"]', mFig), dotO = $('[data-dot="other"]', mFig);
  var toSvg = function (v) { return { x: 280 + v[0] * 46, y: 255 - v[1] * 44 }; };
  function placeDot(g, v, animate) {
    var pt = toSvg(v);
    if (hasGsap && animate && motionOK()) gsap.to(g, { attr: { transform: 'translate(' + pt.x + ' ' + pt.y + ')' }, duration: 0.8, ease: 'power3.inOut' });
    else g.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')');
  }
  function showMatrix(i, animate) {
    var m = MATRICES[i];
    var swap = function () {
      Object.keys(m.axes).forEach(function (k) { $('[data-ax="' + k + '"]', mFig).textContent = m.axes[k]; });
      Object.keys(m.corners).forEach(function (k) { $('[data-corner="' + k + '"]', mFig).textContent = m.corners[k]; });
      $('[data-dot-label]', dotO).textContent = m.other.label;
      $('[data-matrix-desc]', mFig).textContent = m.desc;
      mText.textContent = m.text;
    };
    if (animate && motionOK()) {
      var fadeEls = $$('.matrix__axis-label, .matrix__corner, [data-dot-label]', mFig).concat(mText);
      gsap.to(fadeEls, { opacity: 0, duration: 0.2, onComplete: function () { swap(); gsap.to(fadeEls, { opacity: 1, duration: 0.35 }); } });
    } else swap();
    placeDot(dotL, m.luggo, animate);
    placeDot(dotO, m.other.at, animate);
  }
  initTabs($('[data-matrix-tabs]'), function (tab, i) {
    mFig.setAttribute('aria-labelledby', tab.id);
    showMatrix(i, true);
  });
  showMatrix(0, false);

  /* ---------- 8. Plano: abas + VPD ---------- */
  initTabs($('[data-plan-tabs]'), function (tab) {
    $$('.plan__panel').forEach(function (p) { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
    var panel = $('#' + tab.getAttribute('aria-controls'));
    if (motionOK()) gsap.fromTo(panel, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
    if (hasGsap) ScrollTrigger.refresh();
  });

  var VPD = {
    pains: {
      customer: 'Dores do cliente', luggo: 'Como a Luggo alivia',
      c: ['Alto custo de compra de uma mala', 'Pouco espaço em casa', 'Baixa frequência de uso', 'Dificuldade para armazenar', 'Transporte até a loja'],
      l: ['Paga só pelo período de uso', 'Devolve depois da viagem e não guarda nada', 'Não precisa comprar', 'Diferentes tamanhos disponíveis', 'Entrega e coleta em casa']
    },
    gains: {
      customer: 'Ganhos que o cliente quer', luggo: 'Como a Luggo cria ganhos',
      c: ['Economia', 'Praticidade', 'Mais espaço em casa', 'Flexibilidade para cada viagem'],
      l: ['Acesso sem precisar ter a mala', 'Escolha da mala conforme a viagem', 'Experiência digital simples', 'Conveniência de entrega e retirada']
    },
    jobs: {
      customer: 'Tarefas do cliente', luggo: 'Produtos e serviços da Luggo',
      c: ['Viajar de vez em quando', 'Transportar seus pertences', 'Ter uma mala adequada para cada viagem', 'Evitar acumular objetos'],
      l: ['Aluguel de malas por período', 'Reserva pelo app ou site', 'Retirada em loja ou ponto físico', 'Entrega no endereço do cliente']
    }
  };
  var vpdBtns = $$('[data-pair]');
  function showPair(key) {
    var d = VPD[key];
    vpdBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.pair === key)); });
    $$('.vpd__region').forEach(function (g) { g.classList.toggle('is-on', g.dataset.region === key); });
    $('[data-vpd-h="customer"]').textContent = d.customer;
    $('[data-vpd-h="luggo"]').textContent = d.luggo;
    var fillList = function (el, items) {
      el.textContent = '';
      items.forEach(function (txt) { var li = document.createElement('li'); li.textContent = txt; el.appendChild(li); });
    };
    fillList($('[data-vpd-list="customer"]'), d.c);
    fillList($('[data-vpd-list="luggo"]'), d.l);
    if (motionOK()) gsap.fromTo('[data-vpd-lists] li', { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out' });
  }
  vpdBtns.forEach(function (b) { b.addEventListener('click', function () { showPair(b.dataset.pair); }); });
  $$('.vpd__region').forEach(function (g) { g.addEventListener('click', function () { showPair(g.dataset.region); }); });
  showPair('pains');

  /* ---------- 9. A conta de uma mala ---------- */
  var pbCost = $('#pb-cost'), pbRent = $('#pb-rent');
  var pbTokens = $('[data-pb-tokens]');
  var pbResult = $('[data-pb-result]');
  for (var tk = 0; tk < 12; tk++) pbTokens.appendChild(document.createElement('i'));
  function updatePayback() {
    var cost = +pbCost.value, rent = +pbRent.value;
    $('[data-out="pb-cost"]').textContent = brl.format(cost).replace(',00', '');
    $('[data-out="pb-rent"]').textContent = brl.format(rent).replace(',00', '');
    var n = Math.ceil(cost / rent);
    $$('i', pbTokens).forEach(function (tok, i) {
      tok.className = i < n ? 'cost' : 'margin';
    });
    pbResult.textContent = n <= 1
      ? 'A mala se paga já no 1º aluguel. Do 2º em diante, é margem.'
      : 'A mala se paga no ' + n + 'º aluguel. Do ' + (n + 1) + 'º em diante, é margem.';
  }
  pbCost.addEventListener('input', updatePayback);
  pbRent.addEventListener('input', updatePayback);
  updatePayback();

  /* ---------- 10. Linha do metrô ---------- */
  if (motionOK()) {
    var metroLine = $('[data-metro-line]');
    gsap.fromTo(metroLine, { attr: { x2: 0 } }, {
      attr: { x2: 250 }, ease: 'none',
      scrollTrigger: { trigger: '[data-metro]', start: 'top 80%', end: 'top 40%', scrub: 0.6 }
    });
    gsap.from('.metro__dot', {
      scale: 0.4, opacity: 0, duration: 0.5, ease: 'back.out(2.4)', stagger: 0.1,
      scrollTrigger: { trigger: '[data-metro]', start: 'top 80%', once: true }
    });
  }

  /* ---------- 12. Manifesto palavra por palavra ---------- */
  var words = $('[data-words]');
  if (motionOK() && words) {
    var text = words.textContent.trim();
    words.setAttribute('aria-label', text);
    words.textContent = '';
    text.split(' ').forEach(function (w, i, arr) {
      var s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = w;
      words.appendChild(s);
      if (i < arr.length - 1) words.appendChild(document.createTextNode(' '));
    });
    gsap.fromTo($$('.w', words), { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.25,
      scrollTrigger: { trigger: '#manifesto', start: 'top 70%', end: 'center 50%', scrub: true }
    });
    gsap.from('.manifesto__art', {
      x: 80, ease: 'none',
      scrollTrigger: { trigger: '#manifesto', start: 'top bottom', end: 'center center', scrub: true }
    });
  }

  /* ---------- 13. Formulário de patrocínio ---------- */
  var form = $('[data-sponsor]');
  var passBody = $('[data-pass-body]');
  var passDone = $('[data-pass-done]');
  function setError(name, msg) {
    var p = $('[data-error-for="' + name + '"]', form);
    p.textContent = msg || '';
    var input = form.elements[name];
    if (input && input.setAttribute && !input.length) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var support = $$('input[name="support"]:checked', form).map(function (c) { return c.value; });
    var firstBad = null;
    setError('name', ''); setError('email', ''); setError('support', '');
    if (!name) { setError('name', 'Digite seu nome.'); firstBad = firstBad || form.elements.name; }
    if (!email) { setError('email', 'Digite seu e-mail.'); firstBad = firstBad || form.elements.email; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('email', 'Esse e-mail parece incompleto. Confira o @ e o domínio.'); firstBad = firstBad || form.elements.email; }
    if (!support.length) { setError('support', 'Escolha pelo menos uma forma de apoio.'); firstBad = firstBad || $('input[name="support"]', form); }
    if (firstBad) { firstBad.focus(); return; }

    var entry = { name: name, company: form.elements.company.value.trim(), email: email, support: support, message: form.elements.message.value.trim(), at: new Date().toISOString() };
    try {
      var saved = JSON.parse(localStorage.getItem('luggo-interesse') || '[]');
      saved.push(entry);
      localStorage.setItem('luggo-interesse', JSON.stringify(saved));
    } catch (err) { /* armazenamento indisponível: segue sem salvar */ }

    var first = name.split(' ')[0];
    if (TEAM_EMAIL) {
      var body = 'Nome: ' + entry.name + '\nEmpresa: ' + (entry.company || '-') + '\nE-mail: ' + entry.email + '\nComo quer apoiar: ' + support.join(', ') + '\n\n' + entry.message;
      window.location.href = 'mailto:' + TEAM_EMAIL + '?subject=' + encodeURIComponent('Quero apoiar a Luggo') + '&body=' + encodeURIComponent(body);
      $('[data-done-title]').textContent = 'Falta só enviar, ' + first + '.';
      $('[data-done-text]').textContent = 'Abrimos o seu e-mail com a mensagem pronta para a equipe da Luggo.';
    } else {
      $('[data-done-title]').textContent = 'Obrigado, ' + first + '.';
      $('[data-done-text]').textContent = 'Seu interesse em apoiar (' + support.join(', ').toLowerCase() + ') ficou registrado nesta demonstração do MVP. Na versão publicada, ele chega direto para a equipe.';
    }
    passBody.hidden = true;
    passDone.hidden = false;
    passDone.focus();
    if (motionOK()) gsap.fromTo(passDone, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
  });
  ['name', 'email'].forEach(function (n) {
    form.elements[n].addEventListener('input', function () { if (form.elements[n].getAttribute('aria-invalid') === 'true') setError(n, ''); });
  });
  $$('input[name="support"]', form).forEach(function (c) { c.addEventListener('change', function () { setError('support', ''); }); });
  $('[data-pass-reset]').addEventListener('click', function () {
    form.reset();
    passDone.hidden = true;
    passBody.hidden = false;
    form.elements.name.focus();
  });

  /* ---------- Modo apresentação ---------- */
  var slides = $$('[data-slide]');
  var hud = $('[data-hud]');
  var presenting = false;

  function buildStops() {
    var vh = window.innerHeight;
    var list = [];
    slides.forEach(function (s, si) {
      var name = s.dataset.slide;
      if (s === howSection && howST) {
        for (var i = 0; i < steps.length; i++) list.push({ y: Math.round(howST.start + (howST.end - howST.start) * (i / (steps.length - 1))), slide: si, name: name });
        return;
      }
      var top = Math.round(s.getBoundingClientRect().top + window.scrollY);
      list.push({ y: top, slide: si, name: name });
      var extra = s.offsetHeight - vh;
      for (var k = 1; extra > vh * 0.2 && k * vh * 0.8 < extra + vh * 0.2; k++) {
        list.push({ y: top + Math.min(extra, Math.round(k * vh * 0.8)), slide: si, name: name });
      }
    });
    return list;
  }
  function currentStop(list) {
    var y = window.scrollY + 4, idx = 0;
    list.forEach(function (s, i) { if (s.y <= y) idx = i; });
    return idx;
  }
  function updateHud() {
    if (!presenting) return;
    var list = buildStops();
    var s = list[currentStop(list)];
    $('[data-hud-count]').textContent = (s.slide + 1) + ' / ' + slides.length;
    $('[data-hud-name]').textContent = s.name;
  }
  function go(delta) {
    var list = buildStops();
    var i = currentStop(list);
    var target;
    if (delta === 'home') target = list[0];
    else if (delta === 'end') target = list[list.length - 1];
    else {
      var cur = list[i];
      if (delta < 0 && window.scrollY > cur.y + 8) target = cur;
      else target = list[Math.max(0, Math.min(list.length - 1, i + delta))];
    }
    window.scrollTo({ top: target.y, behavior: reduceMQ.matches ? 'auto' : 'smooth' });
  }
  function setPresenting(on) {
    presenting = on;
    document.body.classList.toggle('is-presenting', on);
    hud.hidden = !on;
    if (on) {
      updateHud();
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function () {});
      }
    } else if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }
  $$('[data-present-toggle]').forEach(function (b) { b.addEventListener('click', function () { setPresenting(!presenting); }); });
  $('[data-hud-prev]').addEventListener('click', function () { go(-1); });
  $('[data-hud-next]').addEventListener('click', function () { go(1); });
  var hudTick;
  window.addEventListener('scroll', function () {
    if (!presenting) return;
    clearTimeout(hudTick);
    hudTick = setTimeout(updateHud, 120);
  }, { passive: true });

  document.addEventListener('keydown', function (e) {
    var el = document.activeElement;
    var typing = el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); setPresenting(!presenting); return; }
    if (!presenting) return;
    if (el && el.getAttribute && el.getAttribute('role') === 'tab' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
    var map = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ' ': 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1, Home: 'home', End: 'end' };
    if (e.key === 'Escape') { setPresenting(false); return; }
    if (e.key in map) {
      if (e.key === ' ' && el && el.tagName === 'BUTTON') return;
      e.preventDefault();
      go(map[e.key]);
    }
  });

  /* fontes e imagens mudam alturas: recalcula os gatilhos */
  if (hasGsap) {
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
