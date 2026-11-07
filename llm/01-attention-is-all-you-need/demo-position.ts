import { $, segmented } from "../../shared/dom";
import { onLangChange, tr } from "../../shared/i18n";
import { attentionWeights, gaussian, positionalEncoding, seededRandom } from "./math";

const D = 16;
/** Scales the inputs so the softmax stays readable with no learned projections in front of it. */
const INPUT_SCALE = 0.8;
const WORDS = ["dog", "bites", "man"];
const BASE_ORDER = [0, 1, 2];
const ORDERS = [
  [2, 1, 0],
  [1, 0, 2],
  [0, 2, 1],
  [1, 2, 0],
  [2, 0, 1],
];

const random = seededRandom(42);
const EMBEDDINGS = WORDS.map(() => {
  const raw = Array.from({ length: D }, () => gaussian(random));
  const norm = Math.hypot(...raw);
  // Same length as a positional encoding, so neither one drowns out the other.
  return raw.map((v) => (v / norm) * Math.sqrt(D / 2));
});

/** One self-attention layer with Q = K = V = X. Returns the output vector for each word id. */
function outputsByWord(order: number[], usePe: boolean): Map<number, number[]> {
  const X = order.map((word, pos) => {
    const pe = positionalEncoding(pos, D);
    return EMBEDDINGS[word].map((v, i) => INPUT_SCALE * (v + (usePe ? pe[i] : 0)));
  });
  const weights = attentionWeights(X, X);
  const outputs = new Map<number, number[]>();
  order.forEach((word, i) => {
    outputs.set(word, Array.from({ length: D }, (_, dim) => weights[i].reduce((sum, w, j) => sum + w * X[j][dim], 0)));
  });
  return outputs;
}

/** Diverging fill for one vector component: positive is blue, negative is red, zero is the surface. */
function fill(value: number): string {
  const strength = Math.min(100, Math.round((Math.abs(value) / 2.5) * 100));
  const hue = value >= 0 ? "var(--pos)" : "var(--neg)";
  return `color-mix(in oklab, ${hue} ${strength}%, var(--surface))`;
}

function strip(vector: number[]): HTMLElement {
  const host = document.createElement("div");
  host.className = "strip";
  for (const value of vector) {
    const cell = document.createElement("i");
    cell.style.background = fill(value);
    cell.title = value.toFixed(3);
    host.appendChild(cell);
  }
  return host;
}

export function initPosition(): void {
  let order = ORDERS[0];
  let usePe = false;
  const label = (o: number[]): string => o.map((w) => WORDS[w]).join(" ");

  function draw(): void {
    const left = outputsByWord(BASE_ORDER, usePe);
    const right = outputsByWord(order, usePe);
    const table = $<HTMLTableElement>("#pos-table");
    table.replaceChildren();

    const header = table.insertRow();
    for (const title of [tr("Word", "词"), `${tr("Left", "左")}: ${label(BASE_ORDER)}`, `${tr("Right", "右")}: ${label(order)}`, "‖Δ‖"]) {
      const th = document.createElement("th");
      th.textContent = title;
      header.appendChild(th);
    }

    let largest = 0;
    WORDS.forEach((word, id) => {
      const a = left.get(id)!;
      const b = right.get(id)!;
      const delta = Math.hypot(...a.map((v, i) => v - b[i]));
      largest = Math.max(largest, delta);
      const row = table.insertRow();
      row.insertCell().textContent = word;
      row.insertCell().appendChild(strip(a));
      row.insertCell().appendChild(strip(b));
      const cell = row.insertCell();
      cell.className = "delta";
      cell.textContent = delta.toFixed(3);
    });

    $("#pos-verdict").textContent = usePe
      ? tr(
          "With positional encoding, the same word produces different output in a different order, so the model can see order.",
          "有了位置编码，同一个词在不同语序下的输出不一样了：模型能看到顺序。",
        )
      : largest < 1e-9
        ? tr(
            "‖Δ‖ = 0: reordering the words leaves each word's output unchanged, so the model can't tell the difference.",
            "‖Δ‖ = 0：只是换了语序，每个词的输出和之前完全相同，模型看不出区别。",
          )
        : "";
  }

  segmented(
    $("#pos-order"),
    ORDERS.map((value) => ({ value, label: label(value) })),
    order,
    (value) => {
      order = value;
      draw();
    },
  );
  $<HTMLInputElement>("#pos-pe").addEventListener("change", (event) => {
    usePe = (event.target as HTMLInputElement).checked;
    draw();
  });

  onLangChange(draw);
  drawEncodingMap();
  draw();
}

function drawEncodingMap(): void {
  const canvas = $<HTMLCanvasElement>("#pos-canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  const positions = 50;
  const dims = 128;
  const encodings = Array.from({ length: positions }, (_, pos) => positionalEncoding(pos, dims));
  const styles = getComputedStyle(document.documentElement);
  const surface = styles.getPropertyValue("--surface").trim();
  const pos = styles.getPropertyValue("--pos").trim();
  const neg = styles.getPropertyValue("--neg").trim();
  const cellW = canvas.width / dims;
  const cellH = canvas.height / positions;

  for (let p = 0; p < positions; p += 1) {
    for (let d = 0; d < dims; d += 1) {
      const value = encodings[p][d];
      context.fillStyle = surface;
      context.fillRect(d * cellW, p * cellH, cellW + 0.5, cellH + 0.5);
      context.globalAlpha = Math.abs(value);
      context.fillStyle = value >= 0 ? pos : neg;
      context.fillRect(d * cellW, p * cellH, cellW + 0.5, cellH + 0.5);
      context.globalAlpha = 1;
    }
  }

  const readout = $("#pos-readout");
  const rest = (): void => {
    readout.textContent = tr(
      "Each row is one position's encoding and each column is one dimension. Frequency falls from left to right, so every position gets its own stripes. Hover to read a value.",
      "每一行是一个位置的编码，每一列是一个维度。从左到右频率降低，所以每个位置都有不同的条纹。把鼠标移到图上可以查看具体数值。",
    );
  };
  onLangChange(rest);
  rest();
  canvas.addEventListener("pointermove", (event) => {
    const box = canvas.getBoundingClientRect();
    const d = Math.min(dims - 1, Math.floor(((event.clientX - box.left) / box.width) * dims));
    const p = Math.min(positions - 1, Math.floor(((event.clientY - box.top) / box.height) * positions));
    readout.textContent = tr(
      `PE(pos = ${p}, dim ${d}) = ${encodings[p][d].toFixed(3)} (d_model = ${dims} here so it's easier to see; the paper uses 512)`,
      `PE(pos = ${p}, 维度 ${d}) = ${encodings[p][d].toFixed(3)}（这里 d_model 取 ${dims}，只为了画得清楚；论文用 512）`,
    );
  });
  canvas.addEventListener("pointerleave", rest);
}
