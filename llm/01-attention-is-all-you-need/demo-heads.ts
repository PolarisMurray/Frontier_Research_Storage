import { $, createTooltip, segmented } from "../../shared/dom";
import { onLangChange, t, tr, type Text } from "../../shared/i18n";
import { attentionWeights } from "./math";

type HeadId = "coref" | "syntax" | "near" | "single";
type Ending = "tired" | "wide";
type Pos = "det" | "noun" | "verb" | "conj" | "pron" | "adv" | "adj";

const WORDS: { text: string; pos: Pos }[] = [
  { text: "The", pos: "det" },
  { text: "animal", pos: "noun" },
  { text: "didn't", pos: "verb" },
  { text: "cross", pos: "verb" },
  { text: "the", pos: "det" },
  { text: "street", pos: "noun" },
  { text: "because", pos: "conj" },
  { text: "it", pos: "pron" },
  { text: "was", pos: "verb" },
  { text: "too", pos: "adv" },
  { text: "", pos: "adj" },
];
const ANIMAL = 1;
const STREET = 5;
const IT = 7;
const END = 10;

/*
  Hand-written Q and K vectors. Real heads learn their projections; these are written by
  hand so each head has one obvious job. Only the softmax(QKᵀ/√d_k) step is the paper's.
*/

/** Dimensions: [animate thing, place, anything else]. */
function corefHead(ending: Ending): { Q: number[][]; K: number[][] } {
  const seek = ending === "tired" ? [6, 0, -1] : [0, 6, -1];
  const K = WORDS.map((_, i) => (i === ANIMAL ? [1, 0, 0] : i === STREET ? [0, 1, 0] : [0, 0, 1]));
  const Q = WORDS.map((_, i) => (i === IT || i === END ? seek : [0, 0, 0]));
  return { Q, K };
}

/** Dimensions: [noun-like, verb-like, function word, modifier]. */
function syntaxHead(): { Q: number[][]; K: number[][] } {
  const keyOf: Record<Pos, number[]> = {
    det: [0, 0, 1, 0],
    noun: [1, 0, 0, 0],
    verb: [0, 1, 0, 0],
    conj: [0, 0, 1, 0],
    pron: [1, 0, 0, 0],
    adv: [0, 0, 0, 1],
    adj: [0, 0, 0, 1],
  };
  const wants: Record<Pos, number[]> = {
    det: [5, 0, 0, 0],
    noun: [0, 5, 0, 0],
    verb: [5, 0, 0, 0],
    conj: [0, 5, 0, 0],
    pron: [0, 5, 0, 0],
    adv: [0, 0, 0, 5],
    adj: [0, 5, 0, 0],
  };
  return { Q: WORDS.map((w) => wants[w.pos]), K: WORDS.map((w) => keyOf[w.pos]) };
}

/** Dimensions: sin/cos of the position at three frequencies, so dot products peak at nearby words. */
function nearHead(): { Q: number[][]; K: number[][] } {
  const FREQS = [Math.PI / 5, Math.PI / 10, Math.PI / 20];
  const K = WORDS.map((_, i) => FREQS.flatMap((w) => [Math.cos(i * w), Math.sin(i * w)]));
  return { Q: K.map((k) => k.map((v) => v * 4)), K };
}

function weightsFor(head: HeadId, ending: Ending, masked: boolean): number[][] {
  if (head === "coref") {
    const { Q, K } = corefHead(ending);
    return attentionWeights(Q, K, masked);
  }
  if (head === "syntax") {
    const { Q, K } = syntaxHead();
    return attentionWeights(Q, K, masked);
  }
  if (head === "near") {
    const { Q, K } = nearHead();
    return attentionWeights(Q, K, masked);
  }
  const parts = [corefHead(ending), syntaxHead(), nearHead()];
  const Q = WORDS.map((_, i) => parts.flatMap((part) => part.Q[i]));
  const K = WORDS.map((_, i) => parts.flatMap((part) => part.K[i]));
  return attentionWeights(Q, K, masked);
}

const HEAD_NOTES: Record<HeadId, Text> = {
  coref: {
    en: "Suppose this head learned coreference. Only “it” and the final adjective have a clear query; other words spread evenly. Change the last word and the target of “it” follows.",
    zh: "假设这个头学会了找指代：只有 it 和句尾形容词有明确的查询，其他词平均分配。换掉句尾的词，it 的目标就跟着变。",
  },
  syntax: {
    en: "Suppose this head learned part-of-speech pairing: verbs look for nouns and nouns look for verbs.",
    zh: "假设这个头学会了看词性搭配：动词找名词，名词找动词。",
  },
  near: {
    en: "Suppose this head learned to look at neighbors, using position information rather than meaning.",
    zh: "假设这个头学会了看相邻位置，靠的是位置信息，和词义无关。",
  },
  single: {
    en: "The three heads' vectors joined and computed once. All the relations share one distribution and each is diluted, which is the single-head problem the paper describes.",
    zh: "把三个头的向量拼起来只算一次：所有关系混在同一个分布里，每一种都被冲淡了。这就是论文说的单头的问题。",
  },
};

export function initHeads(): void {
  let head: HeadId = "coref";
  let ending: Ending = "tired";
  let masked = false;
  let query = IT;

  const sentence = $("#heads-sentence");
  const matrix = $<HTMLTableElement>("#heads-matrix");
  const tip = createTooltip();

  function pick(i: number): void {
    query = i;
    draw();
  }

  function draw(): void {
    const weights = weightsFor(head, ending, masked);
    const text = (i: number): string => (i === END ? ending : WORDS[i].text);

    sentence.replaceChildren();
    weights[query].forEach((w, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "word";
      if (i === query) button.classList.add("query");
      if (w > 0.55) button.classList.add("dark");
      button.style.setProperty("--w", `${Math.round(w * 100)}%`);
      const label = document.createElement("span");
      label.textContent = text(i);
      const pct = document.createElement("small");
      pct.textContent = masked && i > query ? tr("masked", "掩码") : `${Math.round(w * 100)}%`;
      button.append(label, pct);
      button.addEventListener("click", () => pick(i));
      sentence.appendChild(button);
    });

    matrix.replaceChildren();
    const header = matrix.insertRow();
    header.appendChild(document.createElement("th"));
    WORDS.forEach((_, j) => {
      const th = document.createElement("th");
      th.className = "col";
      const span = document.createElement("span");
      span.textContent = text(j);
      th.appendChild(span);
      header.appendChild(th);
    });
    weights.forEach((row, i) => {
      const rowNode = matrix.insertRow();
      if (i === query) rowNode.className = "on";
      const th = document.createElement("th");
      th.className = i === query ? "row on" : "row";
      th.textContent = text(i);
      th.addEventListener("click", () => pick(i));
      rowNode.appendChild(th);
      row.forEach((w, j) => {
        const td = rowNode.insertCell();
        const isMasked = masked && j > i;
        if (isMasked) td.className = "masked";
        else td.style.setProperty("--w", `${Math.round(w * 100)}%`);
        td.addEventListener("click", () => pick(i));
        td.addEventListener("pointermove", (event) => {
          const value = isMasked ? tr("hidden by the mask", "被掩码挡住") : `${(w * 100).toFixed(1)}%`;
          tip.show(`<b>${text(i)}</b> → ${text(j)}: ${value}`, event.clientX, event.clientY);
        });
        td.addEventListener("pointerleave", () => tip.hide());
      });
    });

    $("#heads-note").textContent = t(HEAD_NOTES[head]);
  }

  segmented<HeadId>(
    $("#heads-head"),
    [
      { value: "coref", label: { en: "1 Coreference", zh: "头 1 指代" } },
      { value: "syntax", label: { en: "2 Syntax", zh: "头 2 语法" } },
      { value: "near", label: { en: "3 Proximity", zh: "头 3 邻近" } },
      { value: "single", label: { en: "Single head (all joined)", zh: "单头（全部拼一起）" } },
    ],
    head,
    (value) => {
      head = value;
      draw();
    },
  );
  segmented<Ending>(
    $("#heads-end"),
    [
      { value: "tired", label: "tired" },
      { value: "wide", label: "wide" },
    ],
    ending,
    (value) => {
      ending = value;
      draw();
    },
  );
  $<HTMLInputElement>("#heads-mask").addEventListener("change", (event) => {
    masked = (event.target as HTMLInputElement).checked;
    draw();
  });

  onLangChange(draw);
  draw();
}
