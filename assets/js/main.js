/* «Высота 3.05», демо v2. Всё движение повторяет приёмы Zero Block: появление, пошаговая анимация
   («блок на экране», «при скролле», «наведение», «цикл»), параллакс от прокрутки и от мыши, фиксация, тултип. */
(function () {
  var d = document, w = window, root = d.documentElement;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s) { return d.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(d.querySelectorAll(s)); }
  function px(v) { return v.toFixed(1) + 'px'; }

  /* бургер */
  var burger = $('.burger'), menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
    w.matchMedia('(min-width: 980px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* счётчик 0 → значение (в Тильде: 10 строк кода в блоке T123) */
  function fmt(v, dec) { return v.toFixed(dec).replace('.', ','); }
  function count(el, to, dec, dur) {
    if (reduce) { el.textContent = fmt(to, dec); return; }
    var t0 = performance.now();
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)), dec);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* появление при прокрутке: каскад 90 мс, не длиннее 600 мс */
  $$('[data-stagger]').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.classList.add('reveal'); c.style.setProperty('--i', Math.min(i, 6)); });
  });
  var items = $$('.reveal, [data-count]');
  function show(el) { el.classList.add('is-in'); if (el.dataset.count) count(el, +el.dataset.count, 0, 1200); }
  if (reduce || !('IntersectionObserver' in w)) items.forEach(show);
  else {
    $$('[data-count]').forEach(function (el) { el.textContent = '0'; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); show(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* первый экран: шаги «блок на экране» + счётчик высоты кольца */
  var hero = $('.hero');
  if (hero) requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      hero.classList.add('is-ready');
      var h = hero.querySelector('[data-height]');
      if (h && !reduce) { h.textContent = '0,00'; setTimeout(function () { count(h, 3.05, 2, 1200); }, 200); }
    });
  });

  /* параллакс от мыши в первом экране */
  var movers = $$('[data-mouse]');
  if (hero && fine && !reduce) {
    hero.addEventListener('mousemove', function (e) {
      var x = e.clientX / w.innerWidth - 0.5, y = e.clientY / w.innerHeight - 0.5;
      movers.forEach(function (el) { var k = +el.dataset.mouse; el.style.transform = 'translate3d(' + px(x * k) + ',' + px(y * k) + ',0)'; });
    });
    hero.addEventListener('mouseleave', function () { movers.forEach(function (el) { el.style.transform = ''; }); });
  }

  /* тултип у отметки 3,05: на телефоне открывается касанием */
  $$('.scale__value').forEach(function (b) {
    b.addEventListener('click', function () { b.parentNode.classList.toggle('is-open'); });
  });

  /* всё, что зависит от прокрутки: шапка, параллакс, бегущий текст, мяч по шагам */
  var header = $('.header'), solid = header && header.classList.contains('header--solid');
  var par = $$('[data-speed]'), runs = $$('[data-scroll-x]');
  var track = $('.track'), line = $('.track__line'), ball = $('.track__ball'), steps = $$('.step'), y0 = 0, len = 0, centers = [];
  function layout() {
    if (!track) return;
    var t = track.getBoundingClientRect().top;
    centers = steps.map(function (s) { var r = s.querySelector('.step__num').getBoundingClientRect(); return r.top + r.height / 2 - t; });
    y0 = centers[0]; len = centers[centers.length - 1] - y0;
    line.style.top = px(y0); line.style.bottom = 'auto'; line.style.height = px(len);
  }
  function frame() {
    var vh = w.innerHeight;
    if (header) header.classList.toggle('is-scrolled', solid || w.scrollY > 24);
    if (reduce) return;
    par.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      el.style.transform = 'translate3d(0,' + px((r.top + r.height / 2 - vh / 2) * el.dataset.speed) + ',0)';
    });
    runs.forEach(function (el) {
      el.style.transform = 'translate3d(' + px(el.parentNode.getBoundingClientRect().top * el.dataset.scrollX) + ',0,0)';
    });
    if (track && len) {
      var t = track.getBoundingClientRect().top, aim = vh * 0.6, p = Math.min(1, Math.max(0, (aim - t - y0) / len));
      ball.style.transform = 'translate3d(0,' + px(p * len) + ',0) rotate(' + (p * 540).toFixed(0) + 'deg)';
      steps.forEach(function (s, i) { s.classList.toggle('is-on', t + centers[i] <= aim + 1); });
    }
  }
  var queued = false;
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; frame(); }); } }
  if (reduce) steps.forEach(function (s) { s.classList.add('is-on'); });
  layout(); frame();
  w.addEventListener('scroll', onScroll, { passive: true });
  w.addEventListener('resize', function () { layout(); onScroll(); });
  w.addEventListener('load', function () { layout(); onScroll(); });

  /* «Как это собрано на Тильде»: подписи к экранам для показа клиентке */
  var zb = $('.zb-toggle');
  if (zb) zb.addEventListener('click', function () {
    var on = root.classList.toggle('show-zb');
    zb.setAttribute('aria-pressed', on);
    zb.lastChild.textContent = on ? 'Скрыть подсказки' : 'Как это собрано на Тильде';
  });

  /* галерея новости: фото на весь экран, закрытие кликом или Esc */
  var gal = $('.gallery');
  if (gal && w.HTMLDialogElement) {
    var box = d.createElement('dialog');
    box.className = 'lightbox';
    box.innerHTML = '<img alt=""><button type="button" aria-label="Закрыть">×</button>';
    d.body.appendChild(box);
    var big = box.querySelector('img');
    gal.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      big.src = a.href; big.alt = a.querySelector('img').alt;
      box.showModal();
    });
    box.addEventListener('click', function () { box.close(); });
  }

  /* форма: «школа / родитель», проверка, демо-ответ */
  var form = $('#lead-form');
  if (!form) return;
  var done = $('#form-done'), label = form.querySelector('[data-label]'), comment = $('#f-comment');
  var MODES = {
    school: ['Обсудить секцию', 'Например: школа № 1234, интересует секция для 5-7 классов'],
    parent: ['Записаться на пробную', 'Например: сыну 9 лет, учится в 3 классе']
  };
  function setMode(m) {
    var r = form.querySelector('input[name="who"][value="' + m + '"]');
    if (r) r.checked = true;
    label.textContent = MODES[m][0];
    comment.placeholder = MODES[m][1];
  }
  form.addEventListener('change', function (e) { if (e.target.name === 'who') setMode(e.target.value); });
  $$('[data-mode]').forEach(function (a) { a.addEventListener('click', function () { setMode(a.dataset.mode); }); });
  var RULES = {
    'f-name': function (el) { return el.value.trim().length >= 2 ? '' : 'Напишите, как к вам обращаться'; },
    'f-phone': function (el) { var n = el.value.replace(/\D/g, '').length; return n >= 10 && n <= 12 ? '' : 'Нужен номер телефона, например +7 900 000-00-00'; },
    'f-consent': function (el) { return el.checked ? '' : 'Без согласия мы не сможем принять заявку'; }
  };
  function check(id) {
    var el = d.getElementById(id), msg = RULES[id](el);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    d.getElementById(id + '-err').textContent = msg;
    return !msg;
  }
  Object.keys(RULES).forEach(function (id) {
    var el = d.getElementById(id);
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () { if (el.getAttribute('aria-invalid') === 'true') check(id); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = Object.keys(RULES).filter(function (id) { return !check(id); });
    if (bad.length) { d.getElementById(bad[0]).focus(); return; }
    form.hidden = true; done.hidden = false; done.focus();
  });
  done.querySelector('[data-reset]').addEventListener('click', function () {
    form.reset();
    Object.keys(RULES).forEach(function (id) { d.getElementById(id).removeAttribute('aria-invalid'); });
    setMode('school');
    done.hidden = true; form.hidden = false;
    d.getElementById('f-name').focus();
  });
})();
