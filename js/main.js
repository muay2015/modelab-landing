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
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.hidden = true;
      done.hidden = false;
    });
    document.querySelector('[data-form-reset]').addEventListener('click', function () {
      done.hidden = true;
      form.hidden = false;
    });
  }
})();
