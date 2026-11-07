import { $, runSteps, segmented, svg } from "../../shared/dom";
import { onLangChange, tr } from "../../shared/i18n";

/** The first sentence of the paper's abstract. */
const WORDS =
  "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder".split(
    " ",
  );

const WIDTH = 640;
const NODE_Y = 74;
const K = 3;
const R = 5;

function compact(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

const hops = (count: number): string => tr(`${count} ${count === 1 ? "hop" : "hops"}`, `${count} 跳`);

export function initFlow(): void {
  let n = 12;
  let d = 512;
  let target = n - 1;
  /** Index of the word the RNN has reached. At rest the run is complete. */
  let t = n - 1;
  let cancel = (): void => {};

  const rnn = $<SVGSVGElement>("#flow-rnn");
  const sa = $<SVGSVGElement>("#flow-sa");
  const x = (i: number): number => 22 + (i * (WIDTH - 44)) / (n - 1);

  function drawNodes(host: SVGSVGElement, lit: (i: number) => boolean): void {
    const size = Math.min(18, (WIDTH - 44) / (n - 1) - 6);
    for (let i = 0; i < n; i += 1) {
      const classes = ["node"];
      if (lit(i)) classes.push("lit");
      if (i === target) classes.push("target");
      svg("rect", { x: x(i) - size / 2, y: NODE_Y - size / 2, width: size, height: size, rx: 3, class: classes.join(" ") }, host);
      const label = svg(
        "text",
        { x: x(i) + 3, y: NODE_Y + 20, "text-anchor": "end", transform: `rotate(-40 ${x(i) + 3} ${NODE_Y + 20})` },
        host,
        WORDS[i],
      );
      if (i === target) label.classList.add("target");
      const hit = svg("rect", { x: x(i) - 14, y: NODE_Y - 16, width: 28, height: 90, class: "hit" }, host);
      hit.addEventListener("click", () => {
        target = i;
        draw();
      });
    }
  }

  function draw(): void {
    rnn.replaceChildren();
    sa.replaceChildren();

    for (let i = 0; i < n - 1; i += 1) {
      const classes = ["link"];
      if (i < t) classes.push("lit");
      if (i < target && i < t) classes.push("path");
      svg("line", { x1: x(i), y1: NODE_Y, x2: x(i + 1), y2: NODE_Y, class: classes.join(" ") }, rnn);
    }
    drawNodes(rnn, (i) => i <= t);

    if (t >= 0) {
      for (let i = 0; i < n; i += 1) {
        for (let j = i + 1; j < n; j += 1) {
          const lift = Math.min(120, 0.34 * (x(j) - x(i)) + 10);
          svg("path", { d: `M ${x(i)} ${NODE_Y} Q ${(x(i) + x(j)) / 2} ${NODE_Y - lift} ${x(j)} ${NODE_Y}`, class: "arc" }, sa);
        }
      }
      if (target > 0) {
        const lift = Math.min(120, 0.34 * x(target) + 10);
        svg("path", { d: `M ${x(0)} ${NODE_Y} Q ${(x(0) + x(target)) / 2} ${NODE_Y - lift} ${x(target)} ${NODE_Y}`, class: "link path" }, sa);
      }
    }
    drawNodes(sa, () => t >= 0);

    $("#flow-n-value").textContent = String(n);
    $("#flow-rnn-steps").textContent = `${Math.min(t + 1, n)} / ${n}`;
    $("#flow-sa-steps").textContent = t >= 0 ? "1 / 1" : "0 / 1";
    $("#flow-rnn-path").textContent = hops(target);
    $("#flow-sa-path").textContent = hops(target > 0 ? 1 : 0);
    drawTable();
  }

  function drawTable(): void {
    const rows = [
      { name: "Self-Attention", formula: "O(n²·d)", cost: n * n * d, seq: "O(1)", seqVal: 1, path: "O(1)", pathVal: 1 },
      { name: "Recurrent", formula: "O(n·d²)", cost: n * d * d, seq: "O(n)", seqVal: n, path: "O(n)", pathVal: n },
      { name: "Convolutional", formula: "O(k·n·d²)", cost: K * n * d * d, seq: "O(1)", seqVal: 1, path: "O(log_k n)", pathVal: Math.ceil(Math.log(n) / Math.log(K)) },
      { name: tr("Self-Attention (restricted)", "Self-Attention（受限）"), formula: "O(r·n·d)", cost: R * n * d, seq: "O(1)", seqVal: 1, path: "O(n/r)", pathVal: Math.ceil(n / R) },
    ];
    const value = tr("Value", "代入值");
    const head = `<tr><th>${tr("Layer", "层类型")}</th><th>${tr("Per layer", "每层复杂度")}</th><th>${value}</th><th>${tr("Sequential", "顺序操作数")}</th><th>${value}</th><th>${tr("Max path", "最长路径")}</th><th>${value}</th></tr>`;
    const body = rows
      .map(
        (row) =>
          `<tr><td>${row.name}</td><td class="mono">${row.formula}</td><td class="mono">${compact(row.cost)}</td><td class="mono">${row.seq}</td><td class="mono">${row.seqVal}</td><td class="mono">${row.path}</td><td class="mono">${row.pathVal}</td></tr>`,
      )
      .join("");
    $("#flow-table").innerHTML = `<thead>${head}</thead><tbody>${body}</tbody>`;
  }

  function play(): void {
    cancel();
    cancel = runSteps(n, 200, (i) => {
      t = i;
      draw();
    });
  }

  $("#flow-play").addEventListener("click", play);
  $<HTMLInputElement>("#flow-n").addEventListener("input", (event) => {
    cancel();
    n = Number((event.target as HTMLInputElement).value);
    target = n - 1;
    t = n - 1;
    draw();
  });
  segmented(
    $("#flow-d"),
    [16, 64, 512].map((value) => ({ value, label: String(value) })),
    d,
    (value) => {
      d = value;
      draw();
    },
  );

  onLangChange(draw);
  draw();
}
