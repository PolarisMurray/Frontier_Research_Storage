/**
 * Two languages, no reload.
 *
 * Static HTML carries both versions as sibling elements (`lang="en"` and `lang="zh"`), and base.css
 * hides whichever doesn't match <html lang>. Text built in TypeScript goes through `t` / `tr` at draw
 * time, and each demo redraws itself through `onLangChange`, so switching keeps the demo's state.
 */

export type Lang = "en" | "zh";

export interface Text {
  en: string;
  zh: string;
}

const root = document.documentElement;
const listeners: Array<() => void> = [];

export const currentLang = (): Lang => (root.lang === "zh" ? "zh" : "en");

/** Resolves stored text. Plain strings are language-neutral, such as code or model names. */
export const t = (text: string | Text): string => (typeof text === "string" ? text : text[currentLang()]);

/** Inline form of `t`, for text that is only used in one place. */
export const tr = (en: string, zh: string): string => (currentLang() === "zh" ? zh : en);

export function onLangChange(listener: () => void): void {
  listeners.push(listener);
}

/** Attributes can't be hidden with CSS, so they carry both versions as `data-aria-en` / `data-aria-zh`. */
function syncStatic(): void {
  const lang = currentLang();
  document.querySelectorAll<HTMLElement>(`[data-aria-${lang}]`).forEach((node) => {
    node.setAttribute("aria-label", node.getAttribute(`data-aria-${lang}`) ?? "");
  });
  document.querySelectorAll<HTMLButtonElement>("[data-set-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.setLang === lang));
  });
}

function setLang(next: Lang): void {
  if (next === currentLang()) return;
  root.lang = next;
  try {
    localStorage.setItem("lang", next);
  } catch {
    // Without storage the choice just doesn't survive a reload.
  }
  syncStatic();
  listeners.forEach((listener) => listener());
}

document.querySelectorAll<HTMLButtonElement>("[data-set-lang]").forEach((button) => {
  button.addEventListener("click", () => setLang(button.dataset.setLang === "zh" ? "zh" : "en"));
});
syncStatic();
