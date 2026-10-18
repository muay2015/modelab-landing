(function () {
  'use strict';

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* Hero slider */
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = hero.querySelectorAll('.hero__slide');
    var copies = hero.querySelectorAll('.hero__copy');
    var dots = hero.querySelectorAll('.hero__dot');
    var figs = hero.querySelectorAll('.hero__fig');
    var num = hero.querySelector('[data-hero-num]');
    var caption = hero.querySelector('[data-hero-caption]');
    var cta = hero.querySelector('[data-hero-cta]');
    var current = 0;
    var timer = null;

    var show = function (i) {
      current = i;
      var copy = copies[i];
      for (var k = 0; k < slides.length; k++) {
        var on = k === i;
        slides[k].classList.toggle('is-on', on);
        copies[k].classList.toggle('is-on', on);
        copies[k].setAttribute('aria-hidden', on ? 'false' : 'true');
        dots[k].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      for (var f = 0; f < figs.length; f++) {
        figs[f].hidden = figs[f].getAttribute('data-fig') !== copy.getAttribute('data-fig');
      }
      num.textContent = '0' + (i + 1);
      caption.textContent = copy.getAttribute('data-caption');
      cta.textContent = copy.getAttribute('data-cta');
    };

    var start = function () {
      if (timer) { clearInterval(timer); }
      if (reduceMotion) { return; }
      timer = setInterval(function () { show((current + 1) % slides.length); }, 7000);
    };

    Array.prototype.forEach.call(dots, function (dot, i) {
      dot.addEventListener('click', function () { show(i); start(); });
    });

    if (reduceMotion) { hero.classList.add('is-paused'); }
    start();
  }

  /* Scroll reveal */
  if (!reduceMotion && typeof window.IntersectionObserver === 'function') {
    document.body.classList.add('js-motion');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) { io.observe(el); });
  }

  /* Contact form */
  var form = document.querySelector('[data-contact-form]');
  var done = document.querySelector('[data-form-done]');
  if (form && done) {
    Array.prototype.forEach.call(form.querySelectorAll('[data-chip]'), function (chip) {
      chip.addEventListener('click', function () {
        chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      });
    });
    var msg = form.querySelector('[data-form-msg]');
    var submit = form.querySelector('[data-form-submit]');
    var agree = form.elements.agree;
    var fallback = ' 급하시면 <a href="tel:01066920262">010-6692-0262</a>로 전화 주세요.';

    var showMsg = function (html) {
      msg.innerHTML = html;
      msg.hidden = false;
    };
    var markInvalid = function (el, bad) {
      if (el.type === 'checkbox') { el.closest('.agree').classList.toggle('is-invalid', bad); }
      else { el.setAttribute('aria-invalid', bad ? 'true' : 'false'); }
    };

    Array.prototype.forEach.call(form.querySelectorAll('.input, [name="agree"]'), function (el) {
      el.addEventListener('input', function () { markInvalid(el, false); });
      el.addEventListener('change', function () { markInvalid(el, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.hidden = true;

      var f = form.elements;
      var problems = [];
      var first = null;
      var check = function (el, bad, text) {
        markInvalid(el, bad);
        if (bad) { problems.push(text); first = first || el; }
      };
      check(f.name, !f.name.value.trim(), '담당자명을 입력해 주세요.');
      check(f.phone, !/\d{2,}.*\d{3,}/.test(f.phone.value), '연락받으실 전화번호를 입력해 주세요.');
      check(f.email, !!f.email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim()), '이메일 주소 형식을 확인해 주세요.');
      check(agree, !agree.checked, '개인정보 수집·이용에 동의해 주세요.');
      if (problems.length) {
        showMsg(problems.join('<br>'));
        first.focus();
        return;
      }

      var services = Array.prototype.filter.call(form.querySelectorAll('[data-chip]'), function (c) {
        return c.getAttribute('aria-pressed') === 'true';
      }).map(function (c) { return c.getAttribute('data-chip'); });

      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = '보내는 중…';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          services: services,
          company: f.company.value,
          name: f.name.value,
          phone: f.phone.value,
          email: f.email.value,
          message: f.message.value,
          agree: agree.checked,
          website: f.website.value
        })
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok || !body.ok) { throw new Error(body.error || res.status); }
        });
      }).then(function () {
        form.reset();
        form.hidden = true;
        done.hidden = false;
      }).catch(function () {
        showMsg('전송 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.' + fallback);
      }).then(function () {
        submit.disabled = false;
        submit.textContent = label;
      });
    });
    document.querySelector('[data-form-reset]').addEventListener('click', function () {
      done.hidden = true;
      form.hidden = false;
    });
  }
})();
