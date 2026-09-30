// Keep the renderer quiet behind dialogs and when reduced-motion users are idle.
export function shouldRender({modal,changed,reduced,elapsed}) {
  return !modal && elapsed >= 1 / 30 && (changed || !reduced);
}
