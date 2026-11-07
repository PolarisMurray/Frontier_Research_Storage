import { $, createTooltip, segmented } from "../../shared/dom";
import { onLangChange, t, tr, type Text } from "../../shared/i18n";
import { CONFIGS, INSTANCES, type Instance } from "./data";

type Metric = "coverage" | "full";
type Sort = "track" | "hard";
type CaseId = "none" | "piggybank" | "verdict" | "dedekind_reals" | "huffman" | "munkres";

const AGENTS = ["GPT-5.5 xhigh", "GPT-5.5 medium", "Claude Opus 4.8", "Claude Sonnet 5"];
const TOTAL_SPECS = INSTANCES.reduce((sum, row) => sum + row.total, 0);

const CASES: Record<Exclude<CaseId, "none">, Text> = {
  piggybank: {
    en: "All 8 configurations score the same 17/23, failing the same 6. Those 6 quantify over ChainState or ChainTrace and need induction over reachable states; the 17 that pass involve a single contract call. This is a wall, not a budget problem.",
    zh: "8 种配置结果完全相同：都是 17/23，失败的是同样 6 条。这 6 条都对 ChainState 或 ChainTrace 做全称量化，需要对可达状态归纳；通过的 17 条只涉及单次合约调用。这是一堵墙，不是预算不够。",
  },
  verdict: {
    en: "The closest failure of all: Opus 4.8 reaches 112/119 in cp. No configuration passes the last 7: 4 on certificate wildcard name matching and 3 on parsed certificate fields.",
    zh: "全场最接近解出的失败：Opus 4.8 的 cp 模式到了 112/119。剩下 7 条是所有配置都过不了的，4 条关于证书通配符名称匹配，3 条关于解析后的证书字段。",
  },
  dedekind_reals: {
    en: "82 specifications, and no configuration proves a single one.",
    zh: "82 条规约，任何配置都一条也没证出来。",
  },
  huffman: {
    en: "The largest gap for one agent: Opus 4.8 scores 116/127 in po and 0/127 in cp. It left 3 implementation slots empty, so the repository failed to build, was judged impl_broken, and lost every specification. Vero grades the repository, not single specifications.",
    zh: "同一个 agent 差距最大的例子：Opus 4.8 在 po 模式 116/127，cp 模式 0/127。它留了 3 个实现槽位没填，整个仓库编译失败，判为 impl_broken，所有规约作废。Vero 判的是仓库，不是单条规约。",
  },
  munkres: {
    en: "In po, every configuration stops at 12/19, missing 7 specifications on optimality and global bounds. In cp, 3 configurations switch to enumeration and reach 19/19. See section 04.",
    zh: "po 模式下所有配置都卡在 12/19，缺的 7 条都是最优性和全局界。cp 模式下有 3 种配置换成枚举实现，拿到 19/19。详见下面第 04 节。",
  },
};

function isSolved(row: Instance, column: number): boolean {
  return row.passed[column] === row.total;
}

function isWall(row: Instance): boolean {
  return row.passed.every((value) => value < row.total);
}

/** Orders rows from easy to hard: how many configurations solved it, then the mean pass rate. */
function ease(row: Instance): number {
  const solvedBy = row.passed.filter((value) => value === row.total).length;
  const mean = row.passed.reduce((sum, value) => sum + value, 0) / (row.passed.length * row.total);
  return solvedBy + mean;
}

export function initRuler(): void {
  let metric: Metric = "coverage";
  let sort: Sort = "track";
  let focus: CaseId = "none";

  const table = $<HTMLTableElement>("#ruler-table");
  const tip = createTooltip();

  function headerRows(): void {
    const agents = table.insertRow();
    agents.appendChild(document.createElement("th"));
    for (const agent of AGENTS) {
      const th = document.createElement("th");
      th.colSpan = 2;
      th.className = "agent";
      th.textContent = agent;
      agents.appendChild(th);
    }
    const modes = table.insertRow();
    modes.appendChild(document.createElement("th"));
    CONFIGS.forEach((config) => {
      const th = document.createElement("th");
      th.className = "mode";
      th.textContent = config.mode;
      modes.appendChild(th);
    });
  }

  function totalRow(): void {
    const row = table.insertRow();
    row.className = "total";
    const th = document.createElement("th");
    th.textContent = metric === "coverage" ? tr("Specs passed", "规约通过率") : tr("Solved / 43", "解出仓库数 / 43");
    row.appendChild(th);
    CONFIGS.forEach((_, column) => {
      const td = row.insertCell();
      if (metric === "coverage") {
        const passed = INSTANCES.reduce((sum, inst) => sum + inst.passed[column], 0);
        td.textContent = `${((passed / TOTAL_SPECS) * 100).toFixed(1)}%`;
      } else {
        td.textContent = String(INSTANCES.filter((inst) => isSolved(inst, column)).length);
      }
    });
  }

  function instanceRow(inst: Instance): void {
    const row = table.insertRow();
    const classes: string[] = [];
    if (isWall(inst)) classes.push("wall");
    if (focus === inst.name) classes.push("focus");
    if (focus !== "none" && focus !== inst.name) classes.push("dim");
    row.className = classes.join(" ");
    const th = document.createElement("th");
    th.className = "inst";
    th.textContent = inst.name;
    row.appendChild(th);

    inst.passed.forEach((passed, column) => {
      const td = row.insertCell();
      td.className = "cell";
      const fraction = passed / inst.total;
      const weight = metric === "coverage" ? fraction : isSolved(inst, column) ? 1 : 0;
      td.style.setProperty("--w", `${Math.round(weight * 100)}%`);
      const config = CONFIGS[column];
      const status = isSolved(inst, column) ? "full solve" : tr("not solved", "未解出");
      const summary = `${inst.name}, ${config.agent} ${config.mode}: ${passed}/${inst.total}, ${status}`;
      td.setAttribute("aria-label", summary);
      td.addEventListener("pointermove", (event) => {
        tip.show(
          `<b>${inst.name}</b><br>${config.agent} · ${config.mode}<br>${passed} / ${inst.total} ${tr("specifications", "条规约")}, ${status}`,
          event.clientX,
          event.clientY,
        );
      });
      td.addEventListener("pointerleave", () => tip.hide());
    });
  }

  function trackHeader(label: string): void {
    const row = table.insertRow();
    const th = document.createElement("th");
    th.colSpan = CONFIGS.length + 1;
    th.className = "track";
    th.textContent = label;
    row.appendChild(th);
  }

  function draw(): void {
    table.replaceChildren();
    headerRows();
    totalRow();
    if (sort === "track") {
      trackHeader(tr("Track 1 · 13 repositories, translated from Dafny / Verus / Coq projects", "Track 1 · 13 个，翻译自 Dafny / Verus / Coq 项目"));
      INSTANCES.filter((row) => row.track === 1).forEach(instanceRow);
      trackHeader(tr("Track 2 · 30 repositories, translated from Python libraries", "Track 2 · 30 个，翻译自 Python 库"));
      INSTANCES.filter((row) => row.track === 2).forEach(instanceRow);
    } else {
      [...INSTANCES].sort((a, b) => ease(b) - ease(a)).forEach(instanceRow);
    }

    const legend = $("#ruler-legend");
    const wall = tr("✕ no configuration solves this repository (10 in all)", "✕ 这个仓库没有任何配置能解出（共 10 个）");
    legend.innerHTML =
      metric === "coverage"
        ? `<span>${tr("Passed", "通过率")} 0%<i class="scale-ramp"></i>100%</span><span>${wall}</span>`
        : `<span><i style="background: var(--seq-hi)"></i>full solve</span><span><i style="background: var(--seq-lo); box-shadow: inset 0 0 0 1px var(--rule)"></i>${tr("not solved, however close", "未解出（不管差几条）")}</span><span>${wall}</span>`;

    $("#ruler-case-note").textContent =
      focus === "none"
        ? tr(
            "Under full solve, GPT-5.5 xhigh goes from 87.3% to 27 repositories, and GPT-5.5 medium from 65.0% to 2. High coverage doesn't guarantee a complete repository.",
            "把尺子切到 full solve 时，GPT-5.5 xhigh 从 87.3% 变成 27 个，GPT-5.5 medium 从 65.0% 变成 2 个。覆盖率高的配置并不一定能交付完整的仓库。",
          )
        : t(CASES[focus]);
  }

  segmented<Metric>(
    $("#ruler-metric"),
    [
      { value: "coverage", label: { en: "Spec coverage", zh: "规约通过率" } },
      { value: "full", label: { en: "Full solve (Vero)", zh: "full solve（Vero）" } },
    ],
    metric,
    (value) => {
      metric = value;
      draw();
    },
  );
  segmented<Sort>(
    $("#ruler-sort"),
    [
      { value: "track", label: { en: "By source", zh: "按来源" } },
      { value: "hard", label: { en: "Easy to hard", zh: "从易到难" } },
    ],
    sort,
    (value) => {
      sort = value;
      draw();
    },
  );
  segmented<CaseId>(
    $("#ruler-case"),
    [
      { value: "none", label: { en: "All", zh: "全部" } },
      { value: "piggybank", label: "piggybank" },
      { value: "verdict", label: "verdict" },
      { value: "dedekind_reals", label: "dedekind_reals" },
      { value: "huffman", label: "huffman" },
      { value: "munkres", label: "munkres" },
    ],
    focus,
    (value) => {
      focus = value;
      draw();
    },
  );

  onLangChange(draw);
  draw();
}
