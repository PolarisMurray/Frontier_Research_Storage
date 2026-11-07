import { $ } from "../../shared/dom";
import { onLangChange, tr } from "../../shared/i18n";
import { dot, gaussian, seededRandom, softmax } from "./math";

const DIMS = [1, 4, 16, 64, 256, 1024];
const KEYS = 8;
const VARIANCE_SAMPLES = 1500;

const randomVector = (random: () => number, d: number): number[] =>
  Array.from({ length: d }, () => gaussian(random));

export function initScale(): void {
  let seed = 7;
  const input = $<HTMLInputElement>("#scale-d");

  function renderPanel(id: string, weights: number[]): void {
    $(`#scale-${id}`).replaceChildren(
      ...weights.map((w) => {
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = `${Math.max(w * 100, 0.5)}%`;
        bar.title = `${(w * 100).toFixed(2)}%`;
        return bar;
      }),
    );
    const max = Math.max(...weights);
    const grad = Math.max(...weights.map((w) => w * (1 - w)));
    $(`#scale-${id}-max`).textContent = `${(max * 100).toFixed(1)}%`;
    $(`#scale-${id}-grad`).textContent = grad < 0.0001 ? grad.toExponential(1) : grad.toFixed(3);
  }

  function draw(): void {
    const d = DIMS[Number(input.value)];
    const random = seededRandom(seed * 1000 + d);
    const q = randomVector(random, d);
    const scores = Array.from({ length: KEYS }, () => dot(q, randomVector(random, d)));

    renderPanel("raw", softmax(scores));
    renderPanel("scaled", softmax(scores.map((s) => s / Math.sqrt(d))));

    let total = 0;
    let totalSquared = 0;
    for (let i = 0; i < VARIANCE_SAMPLES; i += 1) {
      const sample = dot(randomVector(random, d), randomVector(random, d));
      total += sample;
      totalSquared += sample * sample;
    }
    const mean = total / VARIANCE_SAMPLES;
    const variance = totalSquared / VARIANCE_SAMPLES - mean * mean;

    $("#scale-d-value").textContent = String(d);
    $("#scale-variance").textContent = tr(
      `Measured over ${VARIANCE_SAMPLES} samples: Var(q·k) ≈ ${variance.toFixed(1)}. The paper's footnote predicts d_k = ${d}. Dividing by √d_k brings the variance back to 1.`,
      `实测 ${VARIANCE_SAMPLES} 次：Var(q·k) ≈ ${variance.toFixed(1)}，论文脚注的预测是 d_k = ${d}。除以 √d_k 之后，方差回到 1。`,
    );
  }

  input.addEventListener("input", draw);
  $("#scale-resample").addEventListener("click", () => {
    seed += 1;
    draw();
  });
  onLangChange(draw);
  draw();
}
