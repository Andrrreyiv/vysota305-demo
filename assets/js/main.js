/* «Высота 3.05», демо: появление при прокрутке, счётчики, шкала в hero, шапка, бургер, форма. Без библиотек. */
(function () {
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* шапка: прозрачная над hero, тёмная после прокрутки */
  var header = d.querySelector('.header');
  var solid = header && header.classList.contains('header--solid');
  function onScroll() { header.classList.toggle('is-scrolled', solid || window.scrollY > 24); }
  if (header) { onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); }

  /* бургер */
  var burger = d.querySelector('.burger'), menu = d.getElementById('menu');
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
    window.matchMedia('(min-width: 980px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* счётчик: 0 → значение, плавное замедление к концу */
  function fmt(v, dec) { return v.toFixed(dec).replace('.', ','); }
  function count(el, to, dec, dur) {
    if (reduce) { el.textContent = fmt(to, dec); return; }
    var t0 = performance.now();
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e, dec);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* каскад: детям [data-stagger] шаг 90 мс, не длиннее 600 мс в сумме */
  d.querySelectorAll('[data-stagger]').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) {
      c.classList.add('reveal');
      c.style.setProperty('--i', Math.min(i, 6));
    });
  });

  /* появление при прокрутке + запуск счётчиков */
  var items = d.querySelectorAll('.reveal, [data-count]');
  function show(el) {
    el.classList.add('is-in');
    if (el.dataset.count) count(el, +el.dataset.count, 0, 1200);
  }
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(show);
  } else {
    d.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = '0'; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        show(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* hero: шкала растёт, отметка поднимается, счётчик бежит 0 → 3,05 */
  var hero = d.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hero.classList.add('is-ready');
        var h = hero.querySelector('[data-height]');
        if (h) {
          if (reduce) return;
          h.textContent = '0,00';
          setTimeout(function () { count(h, 3.05, 2, 1200); }, 200);
        }
      });
    });
  }

  /* галерея новости: фото на весь экран, закрытие кликом или Esc */
  var gal = d.querySelector('.gallery');
  if (gal && window.HTMLDialogElement) {
    var box = d.createElement('dialog');
    box.className = 'lightbox';
    box.innerHTML = '<img alt=""><button type="button" aria-label="Закрыть">×</button>';
    d.body.appendChild(box);
    var big = box.querySelector('img');
    gal.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      big.src = a.href;
      big.alt = a.querySelector('img').alt;
      box.showModal();
    });
    box.addEventListener('click', function () { box.close(); });
  }

  /* форма: переключатель «школа / родитель», проверка, демо-ответ */
  var form = d.getElementById('lead-form');
  if (!form) return;
  var done = d.getElementById('form-done');
  var label = form.querySelector('[data-label]');
  var comment = d.getElementById('f-comment');
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
  d.querySelectorAll('[data-mode]').forEach(function (a) {
    a.addEventListener('click', function () { setMode(a.dataset.mode); });
  });

  var RULES = {
    'f-name': function (el) { return el.value.trim().length >= 2 ? '' : 'Напишите, как к вам обращаться'; },
    'f-phone': function (el) {
      var n = el.value.replace(/\D/g, '').length;
      return n >= 10 && n <= 12 ? '' : 'Нужен номер телефона, например +7 900 000-00-00';
    },
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
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () {
      if (el.getAttribute('aria-invalid') === 'true') check(id);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = Object.keys(RULES).filter(function (id) { return !check(id); });
    if (bad.length) { d.getElementById(bad[0]).focus(); return; }
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
  done.querySelector('[data-reset]').addEventListener('click', function () {
    form.reset();
    Object.keys(RULES).forEach(function (id) { d.getElementById(id).removeAttribute('aria-invalid'); });
    setMode('school');
    done.hidden = true;
    form.hidden = false;
    d.getElementById('f-name').focus();
  });
})();
