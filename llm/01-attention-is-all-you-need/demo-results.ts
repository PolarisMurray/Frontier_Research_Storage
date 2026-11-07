import { $, createTooltip, svg } from "../../shared/dom";
import { onLangChange, tr } from "../../shared/i18n";

type Kind = "single" | "ensemble" | "transformer";

/** Table 2 of the paper, EN-DE columns. ByteNet has no cost figure, so it stays out of the plot. */
const MODELS: { name: string; bleu: number; flops: number; kind: Kind; anchor: "start" | "end" }[] = [
  { name: "GNMT + RL", bleu: 24.6, flops: 2.3e19, kind: "single", anchor: "start" },
  { name: "ConvS2S", bleu: 25.16, flops: 9.6e18, kind: "single", anchor: "end" },
  { name: "MoE", bleu: 26.03, flops: 2.0e19, kind: "single", anchor: "end" },
  { name: "GNMT + RL Ensemble", bleu: 26.3, flops: 1.8e20, kind: "ensemble", anchor: "start" },
  { name: "ConvS2S Ensemble", bleu: 26.36, flops: 7.7e19, kind: "ensemble", anchor: "end" },
  { name: "Transformer (base)", bleu: 27.3, flops: 3.3e18, kind: "transformer", anchor: "start" },
  { name: "Transformer (big)", bleu: 28.4, flops: 2.3e19, kind: "transformer", anchor: "start" },
];

const W = 720;
const H = 340;
const M = { left: 52, right: 20, top: 16, bottom: 48 };
const X_MIN = 18;
const X_MAX = 21;
const Y_MIN = 24;
const Y_MAX = 29;

const x = (flops: number): number => M.left + ((Math.log10(flops) - X_MIN) / (X_MAX - X_MIN)) * (W - M.left - M.right);
const y = (bleu: number): number => M.top + ((Y_MAX - bleu) / (Y_MAX - Y_MIN)) * (H - M.top - M.bottom);

function formatFlops(flops: number): string {
  const exponent = Math.floor(Math.log10(flops));
  return `${(flops / 10 ** exponent).toFixed(1)}·10^${exponent}`;
}

export function initResults(): void {
  const chart = $<SVGSVGElement>("#results-chart");
  const tip = createTooltip();

  function draw(): void {
    chart.replaceChildren();
    for (let bleu = Y_MIN; bleu <= Y_MAX; bleu += 1) {
      svg("line", { x1: M.left, x2: W - M.right, y1: y(bleu), y2: y(bleu), class: "grid" }, chart);
      svg("text", { x: M.left - 8, y: y(bleu) + 4, "text-anchor": "end", class: "tick" }, chart, String(bleu));
    }
    for (const exponent of [18, 19, 20, 21]) {
      svg("line", { x1: x(10 ** exponent), x2: x(10 ** exponent), y1: M.top, y2: H - M.bottom, class: "grid" }, chart);
      svg("text", { x: x(10 ** exponent), y: H - M.bottom + 18, "text-anchor": "middle", class: "tick" }, chart, `10^${exponent}`);
    }
    svg(
      "text",
      { x: (M.left + W - M.right) / 2, y: H - 8, "text-anchor": "middle" },
      chart,
      tr("Training cost in FLOPs (log scale, lower is cheaper)", "训练成本 FLOPs（对数轴，越靠左越省）"),
    );
    svg(
      "text",
      { x: 14, y: (M.top + H - M.bottom) / 2, "text-anchor": "middle", transform: `rotate(-90 14 ${(M.top + H - M.bottom) / 2})` },
      chart,
      tr("BLEU (higher is better)", "BLEU（越高越好）"),
    );

    for (const model of MODELS) {
      const cx = x(model.flops);
      const cy = y(model.bleu);
      const isTransformer = model.kind === "transformer";
      svg(
        "circle",
        {
          cx,
          cy,
          r: isTransformer ? 7 : 5,
          fill: model.kind === "ensemble" ? "var(--surface)" : isTransformer ? "var(--accent)" : "var(--ink-3)",
          stroke: isTransformer ? "var(--accent)" : "var(--ink-3)",
          "stroke-width": 2,
        },
        chart,
      );
      const offset = model.anchor === "start" ? 13 : -13;
      const label = svg("text", { x: cx + offset, y: cy + 4, "text-anchor": model.anchor }, chart, model.name);
      if (isTransformer) label.setAttribute("style", "font-weight:600;fill:var(--ink)");

      const hit = svg("circle", { cx, cy, r: 18, fill: "transparent" }, chart);
      hit.addEventListener("pointermove", (event) => {
        tip.show(`<b>${model.name}</b><br>BLEU ${model.bleu}<br>${formatFlops(model.flops)} FLOPs`, event.clientX, event.clientY);
      });
      hit.addEventListener("pointerleave", () => tip.hide());
    }

    const rows = MODELS.map((m) => `<tr><td>${m.name}</td><td class="mono">${m.bleu}</td><td class="mono">${formatFlops(m.flops)}</td></tr>`).join("");
    $("#results-table").innerHTML = `<thead><tr><th>${tr("Model", "模型")}</th><th>BLEU (EN-DE)</th><th>${tr("Training cost (FLOPs)", "训练成本 (FLOPs)")}</th></tr></thead><tbody>${rows}</tbody>`;
  }

  onLangChange(draw);
  draw();
}
