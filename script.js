function ctaClick() {
  window.open(
    'https://wa.me/5588999112573?text=' + encodeURIComponent('Oi! Quero saber mais sobre o Vectari e como ele pode organizar minha empresa.'),
    '_blank'
  );
}

document.addEventListener('DOMContentLoaded', function () {
  function check() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll('[data-reveal]:not(.in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh - 60 && r.bottom > 0) el.classList.add('in');
    });
  }
  requestAnimationFrame(check);
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
});
