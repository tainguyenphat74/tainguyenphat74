// The portrait leans toward whichever corner the pointer is over, and a highlight
// tracks the cursor across the print. Everything below is enhancement only — with
// JS off, the photo still shows, just without the tilt.
const print = document.getElementById('print');
const stage = print.parentElement;

const RESTING = 'rotate(-2.2deg)';
const MAX_TILT = 13; // degrees
const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

function tiltToPointer(event) {
  if (calm.matches) return;

  const box = print.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width;   // 0 → 1, left to right
  const y = (event.clientY - box.top) / box.height;   // 0 → 1, top to bottom

  const rotateY = (x - 0.5) * 2 * MAX_TILT;   // pointing right pushes the right edge back
  const rotateX = (0.5 - y) * 2 * MAX_TILT;   // pointing up lifts the top edge forward

  print.style.transform =
    `rotate(0deg) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.035)`;
  print.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
  print.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
}

stage.addEventListener('pointerenter', () => {
  if (calm.matches) return;
  print.classList.add('tracking');
});

stage.addEventListener('pointermove', tiltToPointer);

stage.addEventListener('pointerleave', () => {
  print.classList.remove('tracking');
  print.style.transform = RESTING;
});
