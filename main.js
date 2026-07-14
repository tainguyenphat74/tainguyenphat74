// Marking the root as .js is what hides the scroll-reveal sections in the first
// place — without it they stay visible, so a JS failure can never blank the page.
document.documentElement.classList.add('js');

const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('stuck', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const revealed = document.querySelectorAll('.rise');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('on');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealed.forEach((el) => io.observe(el));
} else {
  revealed.forEach((el) => el.classList.add('on'));
}
