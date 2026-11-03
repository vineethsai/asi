/**
 * Canvas animation CSS (§7.5, §8.5), rendered once by FlowCanvas as
 * `<style>{CANVAS_CSS}</style>`. Everything is scoped under `.tm-canvas` and
 * switched off under prefers-reduced-motion.
 */
export const CANVAS_CSS = `
.tm-canvas .tm-pop {
  animation: tm-pop 280ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  transform-origin: center;
}
@keyframes tm-pop {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.tm-canvas .tm-pulse {
  animation: tm-pulse 900ms ease-out 2 both;
}
@keyframes tm-pulse {
  0% { box-shadow: 0 0 0 0 var(--tm-pulse-color, hsl(var(--security-high) / 0.55)); }
  50% { box-shadow: 0 0 0 8px var(--tm-pulse-color, hsl(var(--security-high) / 0.55)); }
  100% { box-shadow: 0 0 0 0 var(--tm-pulse-color, hsl(var(--security-high) / 0.55)); }
}
.tm-canvas .tm-flow {
  stroke-dasharray: 2 10;
  animation: tm-dash 1.5s linear infinite;
}
@keyframes tm-dash {
  to { stroke-dashoffset: -24; }
}
.tm-canvas .tm-ghost {
  opacity: 0.3;
  transition: opacity 200ms ease;
}
.tm-canvas .tm-edge-path {
  transition: stroke-width 300ms ease, stroke 300ms ease, opacity 200ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .tm-canvas .tm-pop,
  .tm-canvas .tm-pulse,
  .tm-canvas .tm-flow {
    animation: none !important;
  }
  .tm-canvas .tm-edge-path,
  .tm-canvas .tm-ghost {
    transition: none !important;
  }
}
`;
