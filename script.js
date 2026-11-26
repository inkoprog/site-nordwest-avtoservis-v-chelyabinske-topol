(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* тема */
  var themeBtn = document.getElementById('themeToggle');
  var savedTheme = null;
  try {
    savedTheme = localStorage.getItem('nw-theme');
  } catch (e) {
    savedTheme = null;
  }
  var startTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeBtn) {
      themeBtn.textContent = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
      themeBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }

  applyTheme(startTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem('nw-theme', next);
      } catch (e) {
        /* хранилище недоступно */
      }
    });
  }

  /* шапка */
  var header = document.getElementById('top');
  if (header && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none;';
    document.body.insertBefore(sentinel, document.body.firstChild);
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* меню */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  function setMenu(open) {
    if (!burger || !nav) return;
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024) setMenu(false);
    });
  }

  /* вкладки цен */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var active = t === tab;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.setAttribute('tabindex', active ? '0' : '-1');
      if (panel) {
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      }
    });
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      selectTab(tab, false);
    });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        selectTab(next, true);
      }
    });
  });

  /* слайдер отзывов */
  var track = document.getElementById('sliderTrack');
  var prev = document.getElementById('prevReview');
  var next = document.getElementById('nextReview');

  function slideBy(dir) {
    if (!track) return;
    var card = track.querySelector('.quote');
    var step = card ? card.getBoundingClientRect().width + 16 : 300;
    track.scrollBy({ left: dir * step, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  if (prev) prev.addEventListener('click', function () { slideBy(-1); });
  if (next) next.addEventListener('click', function () { slideBy(1); });
  if (track) {
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); slideBy(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); slideBy(-1); }
    });
  }

  /* галерея */
  var box = document.getElementById('lightbox');
  var boxImg = document.getElementById('lightboxImg');
  var boxClose = document.getElementById('lightboxClose');

  Array.prototype.forEach.call(document.querySelectorAll('[data-full]'), function (btn) {
    btn.addEventListener('click', function () {
      var img = btn.querySelector('img');
      if (!img || !box || !boxImg) return;
      boxImg.src = img.currentSrc || img.src;
      boxImg.alt = img.alt;
      if (typeof box.showModal === 'function') {
        box.showModal();
      } else {
        box.setAttribute('open', '');
      }
    });
  });

  if (box && boxClose) {
    boxClose.addEventListener('click', function () {
      if (typeof box.close === 'function') box.close();
      else box.removeAttribute('open');
    });
    box.addEventListener('click', function (e) {
      if (e.target === box && typeof box.close === 'function') box.close();
    });
  }

  /* фото: если файл не загрузился, остаётся нейтральная подложка */
  Array.prototype.forEach.call(document.querySelectorAll('.media img'), function (img) {
    img.addEventListener('error', function () {
      img.style.visibility = 'hidden';
    });
  });

  /* форма */
  var form = document.getElementById('leadForm');

  function setError(fieldId, errId, message) {
    var input = document.getElementById(fieldId);
    var err = document.getElementById(errId);
    if (!input || !err) return;
    err.textContent = message;
    input.parentElement.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();
      var message = form.elements.message.value.trim();
      var digits = phone.replace(/\D/g, '');
      var ok = true;

      setError('fName', 'errName', name ? '' : 'Укажите, как к вам обращаться');
      if (!name) ok = false;

      var phoneOk = digits.length >= 10 && digits.length <= 12;
      setError('fPhone', 'errPhone', phoneOk ? '' : 'Введите телефон полностью, например +7 900 000-00-00');
      if (!phoneOk) ok = false;

      if (!ok) {
        var firstBad = form.querySelector('.has-error input');
        if (firstBad) firstBad.focus();
        return;
      }

      var subject = 'Заявка с сайта NordWest';
      var body = 'Имя: ' + name + '\nТелефон: ' + phone + '\nСообщение: ' + (message || 'не указано');
      var okMsg = document.getElementById('formOk');
      if (okMsg) okMsg.hidden = false;
      window.location.href = 'mailto:yumadilovsr@yandex.ru?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });

    ['fName', 'fPhone'].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('input', function () {
        setError(id, id === 'fName' ? 'errName' : 'errPhone', '');
      });
    });
  }

  /* появление блоков */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-in');
    });
  }

  /* счётчики */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));

  function format(value, decimals) {
    return value.toFixed(decimals).replace('.', ',');
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var duration = 1200;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased, decimals);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = format(target, decimals);
    }

    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window && !reduceMotion) {
    var co = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            co.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      co.observe(el);
    });
  }
})();
