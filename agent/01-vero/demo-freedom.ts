import { $, createTooltip, runSteps, segmented, svg } from "../../shared/dom";
import { onLangChange, t, tr, type Text } from "../../shared/i18n";
import { INSTANCES } from "./data";

/** Same shape as the paper's permsAuxImpl / insertEverywhereImpl. */
function insertEverywhere(x: number, list: number[]): number[][] {
  return Array.from({ length: list.length + 1 }, (_, i) => [...list.slice(0, i), x, ...list.slice(i)]);
}
function permutations(list: number[]): number[][] {
  if (list.length === 0) return [[]];
  const [head, ...rest] = list;
  return permutations(rest).flatMap((p) => insertEverywhere(head, p));
}

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
}

const SIZE = 4;

export function initMunkres(): void {
  const perms = permutations([0, 1, 2, 3]);
  let seed = 3;
  let matrix = makeMatrix(seed);
  let cancel = (): void => {};

  function makeMatrix(s: number): number[][] {
    // A small LCG is enough for picking example costs from 1 to 9.
    let state = s * 2654435761;
    return Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return 1 + Math.floor((state / 4294967296) * 9);
      }),
    );
  }

  const cost = (perm: number[]): number => perm.reduce((sum, column, row) => sum + matrix[row][column], 0);

  /** bestPermFrom: keep the first permutation with the lowest cost among perms[0..upTo]. */
  function bestUpTo(upTo: number): number[] {
    let best = perms[0];
    for (let i = 1; i <= upTo; i += 1) if (cost(perms[i]) < cost(best)) best = perms[i];
    return best;
  }

  function show(index: number, highlightBest: boolean): void {
    const best = bestUpTo(index);
    const shown = highlightBest ? best : perms[index];
    const table = $<HTMLTableElement>("#munkres-matrix");
    table.replaceChildren();
    matrix.forEach((row, r) => {
      const tr = table.insertRow();
      row.forEach((value, c) => {
        const td = tr.insertCell();
        td.textContent = String(value);
        if (shown[r] === c) td.className = "now";
      });
    });
    $("#munkres-count").textContent = `${index + 1} / ${perms.length}`;
    $("#munkres-now").textContent = String(cost(shown));
    $("#munkres-best").textContent = String(cost(best));
  }

  function rest(): void {
    show(perms.length - 1, true);
  }

  $("#munkres-play").addEventListener("click", () => {
    cancel();
    cancel = runSteps(perms.length, 180, (i) => {
      if (i === perms.length - 1) rest();
      else show(i, false);
    });
  });
  $("#munkres-new").addEventListener("click", () => {
    cancel();
    seed += 1;
    matrix = makeMatrix(seed);
    rest();
  });

  function drawCompare(): void {
    $("#munkres-compare").innerHTML = `
      <thead><tr><th></th><th>${tr("Reference", "参考实现")}</th><th>${tr("Agent", "agent 提交")}</th></tr></thead>
      <tbody>
        <tr><td>${tr("Algorithm", "算法")}</td><td>${tr("Hungarian", "匈牙利算法")}</td><td>${tr("Enumerate permutations", "枚举所有排列")}</td></tr>
        <tr><td>${tr("Lines", "代码量")}</td><td class="mono">409</td><td class="mono">164</td></tr>
        <tr><td>${tr("Structure", "结构")}</td><td>${tr("6 states, 38 helpers", "六状态机，38 个辅助定义")}</td><td>${tr("Induction on candidates", "对候选列表归纳")}</td></tr>
        <tr><td>${tr("Passed", "通过规约")}</td><td class="mono">12/19 (po)</td><td class="mono">19/19 (cp)</td></tr>
      </tbody>`;
  }
  onLangChange(drawCompare);
  drawCompare();

  const input = $<HTMLInputElement>("#munkres-n");
  function drawGrowth(): void {
    const n = Number(input.value);
    $("#munkres-n-value").textContent = String(n);
    $("#munkres-fact").textContent = factorial(n).toLocaleString("en-US");
    $("#munkres-cube").textContent = (n ** 3).toLocaleString("en-US");
  }
  input.addEventListener("input", drawGrowth);

  drawGrowth();
  rest();
}

const AGENTS = [
  { name: "GPT-5.5 xhigh", cp: 0, po: 1 },
  { name: "GPT-5.5 medium", cp: 2, po: 3 },
  { name: "Claude Opus 4.8", cp: 4, po: 5 },
  { name: "Claude Sonnet 5", cp: 6, po: 7 },
];

const AGENT_NOTES: Record<string, Text> = {
  "GPT-5.5 xhigh": {
    en: "Freedom clearly helps only the strongest agent: 8 repositories solved only in cp, and 6 only in po.",
    zh: "实现自由只对最强的 agent 明显有利：仅在 cp 解出的有 8 个仓库，仅在 po 解出的有 6 个。",
  },
  "GPT-5.5 medium": {
    en: "A net gain in specifications but fewer complete repositories: 2 solved only in cp, and 6 only in po.",
    zh: "规约数净增加，但完整解出的仓库反而少：仅 cp 解出 2 个，仅 po 解出 6 个。",
  },
  "Claude Opus 4.8": {
    en: "The largest loss. The extra implementation work delayed its proofs, and its 8 zero scores come from unfinished slots rather than failed proofs.",
    zh: "最大的负向。多出来的实现义务拖慢了它产出证明的时间，它的 8 个 0 分结果都是什么都没填完，并不是证明失败。",
  },
  "Claude Sonnet 5": {
    en: "About even: 1 repository solved only in cp, and 1 only in po.",
    zh: "两边差不多：仅 cp 和仅 po 解出的都是 1 个。",
  },
};

const W = 900;
const H = 380;
const M = { left: 42, right: 12, top: 56, bottom: 56 };
const MID = (H + M.top - M.bottom) / 2;
const LABELS_PER_SIDE = 3;

export function initDelta(): void {
  const chart = $<SVGSVGElement>("#delta-chart");
  const tip = createTooltip();
  const maxAbs = Math.max(
    ...AGENTS.flatMap((agent) => INSTANCES.map((inst) => Math.abs(inst.passed[agent.cp] - inst.passed[agent.po]))),
  );
  const y = (delta: number): number => MID - (delta / maxAbs) * (MID - M.top);

  let agent = AGENTS[0];

  function draw(): void {
    chart.replaceChildren();
    for (const tick of [-100, -50, 50, 100]) {
      svg("line", { x1: M.left, x2: W - M.right, y1: y(tick), y2: y(tick), class: "grid" }, chart);
      svg("text", { x: M.left - 6, y: y(tick) + 4, "text-anchor": "end", class: "tick" }, chart, tick > 0 ? `+${tick}` : String(tick));
    }
    svg("text", { x: M.left - 6, y: MID + 4, "text-anchor": "end", class: "tick" }, chart, "0");

    const rows = INSTANCES.map((inst) => ({ inst, delta: inst.passed[agent.cp] - inst.passed[agent.po] })).sort(
      (a, b) => b.delta - a.delta,
    );
    const slot = (W - M.left - M.right) / rows.length;
    const barWidth = Math.max(4, slot - 4);

    rows.forEach(({ inst, delta }, i) => {
      const x = M.left + i * slot + (slot - barWidth) / 2;
      const top = delta >= 0 ? y(delta) : MID;
      const height = Math.max(delta === 0 ? 0 : 2, Math.abs(y(delta) - MID));
      svg("rect", { x, y: top, width: barWidth, height, rx: 2, fill: delta >= 0 ? "var(--pos)" : "var(--neg)" }, chart);

      const hit = svg("rect", { x: M.left + i * slot, y: M.top, width: slot, height: H - M.top - M.bottom, fill: "transparent" }, chart);
      hit.addEventListener("pointermove", (event) => {
        const sign = delta > 0 ? "+" : "";
        tip.show(
          `<b>${inst.name}</b><br>cp ${inst.passed[agent.cp]} / po ${inst.passed[agent.po]} (${tr("of", "共")} ${inst.total})<br>${tr("Difference", "差值")} ${sign}${delta}`,
          event.clientX,
          event.clientY,
        );
      });
      hit.addEventListener("pointerleave", () => tip.hide());
    });

    // Direct labels only for the extremes, slanted so that neighbouring bars can each keep theirs.
    const label = (index: number, name: string, delta: number): void => {
      const x = M.left + index * slot + slot / 2;
      const labelY = delta > 0 ? y(delta) - 5 : y(delta) + 5;
      svg(
        "text",
        { x, y: labelY, "text-anchor": delta > 0 ? "start" : "end", transform: `rotate(-40 ${x} ${labelY})` },
        chart,
        name,
      );
    };
    rows.forEach(({ inst, delta }, i) => {
      const isTop = i < LABELS_PER_SIDE && delta > 0;
      const isBottom = i >= rows.length - LABELS_PER_SIDE && delta < 0;
      if (isTop || isBottom) label(i, inst.name, delta);
    });

    const net = rows.reduce((sum, row) => sum + row.delta, 0);
    $("#delta-total").textContent = `${net > 0 ? "+" : ""}${net}`;
    $("#delta-note").textContent = t(AGENT_NOTES[agent.name]);
  }

  segmented(
    $("#delta-agent"),
    AGENTS.map((agent) => ({ value: agent, label: agent.name })),
    agent,
    (value) => {
      agent = value;
      draw();
    },
  );
  onLangChange(draw);
  draw();
}
