/** Small DOM helpers shared by every paper demo. */

import { onLangChange, t, type Text } from "./i18n";

export function $<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`Missing element: ${selector}`);
  return found;
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SVG_NS = "http://www.w3.org/2000/svg";

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  parent?: Element,
  text?: string,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  parent?.appendChild(node);
  return node;
}

export interface SegOption<V> {
  value: V;
  label: string | Text;
}

/** A row of mutually exclusive buttons. Calls `onChange` only when the user picks a new value. */
export function segmented<V>(
  host: HTMLElement,
  options: SegOption<V>[],
  initial: V,
  onChange: (value: V) => void,
): void {
  host.classList.add("seg");
  const buttons = options.map((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "seg-btn";
    button.textContent = t(option.label);
    button.setAttribute("aria-pressed", String(option.value === initial));
    button.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      onChange(option.value);
    });
    host.appendChild(button);
    return button;
  });
  onLangChange(() => {
    buttons.forEach((button, i) => {
      button.textContent = t(options[i].label);
    });
  });
}

/** One floating tooltip per page, placed next to the pointer and kept inside the window. */
export function createTooltip(): { show(html: string, x: number, y: number): void; hide(): void } {
  const tip = document.createElement("div");
  tip.className = "tooltip";
  tip.hidden = true;
  document.body.appendChild(tip);
  return {
    show(html, x, y) {
      tip.innerHTML = html;
      tip.hidden = false;
      const box = tip.getBoundingClientRect();
      const left = Math.max(8, Math.min(x + 14, window.innerWidth - box.width - 8));
      const top = y + 14 + box.height > window.innerHeight ? y - box.height - 10 : y + 14;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    },
    hide() {
      tip.hidden = true;
    },
  };
}

/** Calls `step(i)` for i = 0..count-1 on a timer. Returns a cancel function. Skips to the end under reduced motion. */
export function runSteps(count: number, delayMs: number, step: (i: number) => void): () => void {
  if (prefersReducedMotion()) {
    step(count - 1);
    return () => {};
  }
  let i = 0;
  step(i);
  const timer = window.setInterval(() => {
    i += 1;
    if (i >= count) {
      window.clearInterval(timer);
      return;
    }
    step(i);
  }, delayMs);
  return () => window.clearInterval(timer);
}
