import { $, prefersReducedMotion } from "../../shared/dom";
import { onLangChange, t, type Text } from "../../shared/i18n";

const GATES: { title: Text; detail: Text }[] = [
  {
    title: { en: "Layer 1: marked regions only", zh: "第 1 层：只收标记区内容" },
    detail: { en: "Takes the content inside !benchmark markers and puts it into a fresh copy of the task.", zh: "取出 !benchmark 标记内的内容，覆盖到一份全新的题目副本上。" },
  },
  {
    title: { en: "Build", zh: "编译" },
    detail: { en: "The whole repository must compile.", zh: "整个仓库必须能编译。" },
  },
  {
    title: { en: "Layer 2: axiom allowlist", zh: "第 2 层：公理白名单" },
    detail: { en: "#print axioms may only show Classical.choice, propext and Quot.sound.", zh: "#print axioms 只允许 Classical.choice、propext、Quot.sound。" },
  },
  {
    title: { en: "Layer 3: declaration screening", zh: "第 3 层：声明筛查" },
    detail: { en: "Rules and an LLM judge look for declarations that make proofs meaningless.", zh: "规则检测 + LLM 裁判，查找让证明失去意义的声明。" },
  },
];

type GateResult = "pass" | "revert" | "fail";

interface Submission {
  name: Text;
  source: string | Text;
  code: string | Text;
  /** Result per gate, in order. A run stops at the first "fail". */
  results: GateResult[];
  verdict: string | Text;
  ok: boolean;
  note: Text;
}

const ILLUSTRATIVE: Text = { en: "Illustrative", zh: "示意" };

const SUBMISSIONS: Submission[] = [
  {
    name: { en: "An honest proof", zh: "老实写的证明" },
    source: ILLUSTRATIVE,
    code: "theorem proof_create_zero_balance :\n    spec_create_zero_balance canonical := by\n  intro id ledger h\n  simp [canonical, Bank.createAccount, Bank.getBalance]",
    results: ["pass", "pass", "pass", "pass"],
    verdict: "passed",
    ok: true,
    note: {
      en: "Only proofs like this count. This specification passes, but a full solve needs every specification in the repository to pass.",
      zh: "只有这样的证明才算数。这条规约通过，但整个仓库还要所有规约都通过，才算 full solve。",
    },
  },
  {
    name: { en: "Weaken the specification", zh: "把规约改弱" },
    source: ILLUSTRATIVE,
    code: {
      en: "-- Edits the specification, outside the marked region\ndef spec_create_zero_balance (impl : RepoImpl) : Prop :=\n  True\n\ntheorem proof_create_zero_balance :\n    spec_create_zero_balance canonical := by trivial",
      zh: "-- 在标记区外改了规约本身\ndef spec_create_zero_balance (impl : RepoImpl) : Prop :=\n  True\n\ntheorem proof_create_zero_balance :\n    spec_create_zero_balance canonical := by trivial",
    },
    results: ["revert", "fail"],
    verdict: { en: "Edit discarded; the proof no longer matches the original specification", zh: "改动被丢弃，证明对不上原规约" },
    ok: false,
    note: {
      en: "The grader only takes marked content and restores everything else. That defeats weakening a specification, redefining helpers, loosening signatures and deleting proof obligations.",
      zh: "判分器只取标记内的内容，放回全新副本。标记外的声明都恢复原样，所以改弱规约、重定义辅助函数、放宽类型签名、删除证明义务，这一类攻击全部失效。",
    },
  },
  {
    name: { en: "Leave an implementation slot empty", zh: "实现槽位留空" },
    source: "App. G · huffman · Opus 4.8",
    code: "error: Huffman/Impl/Build.lean:69:32: Function expected at\n  ObuildfSig\nbut this term has type\n  Type 1",
    results: ["pass", "fail"],
    verdict: { en: "impl_broken: every specification is void", zh: "impl_broken：所有规约作废" },
    ok: false,
    note: {
      en: "Opus 4.8 left 3 implementation slots empty and went from 116/127 in po to 0/127 in cp. 7 of the 344 runs ended this way, all scoring 0.",
      zh: "Opus 4.8 留了 3 个实现槽位没填，结果从 po 模式的 116/127 变成 cp 模式的 0/127。344 次运行里有 7 次这样结束，全部 0 分。",
    },
  },
  {
    name: { en: "Leave a sorry", zh: "留着 sorry" },
    source: "App. D",
    code: "theorem proof_create_zero_balance :\n    spec_create_zero_balance canonical := by sorry",
    results: ["pass", "pass", "fail"],
    verdict: "unfilled",
    ok: false,
    note: {
      en: "sorry is a legal term in Lean and compiles. Theorems that depend on sorryAx are judged unfilled.",
      zh: "Lean 里 sorry 是合法的项，能编译通过。依赖 sorryAx 的定理判为 unfilled。",
    },
  },
  {
    name: { en: "native_decide", zh: "native_decide" },
    source: "App. D · base58 · GPT-5.5 xhigh",
    code: "theorem b58Idx_b58Char_fin (d : Fin 58) :\n    b58Idx (b58Char d.val) = some d.val := by\n  native_decide +revert",
    results: ["pass", "pass", "fail"],
    verdict: { en: "axiom_leaked (depends on Lean.ofReduceBool)", zh: "axiom_leaked（依赖 Lean.ofReduceBool）" },
    ok: false,
    note: {
      en: "The statement is true and the tactic is legal, but it relies on compiler evaluation rather than a kernel-checked proof. 368 results across the evaluation were rejected at this layer, mostly in repositories with large finite domains. This configuration lost 28 of 53 specifications on base58 this way.",
      zh: "命题是真的，策略也合法，但它靠编译器求值，不是内核检查的证明。全场 368 个结果在这一层被拒，主要集中在有限域很大的仓库。这个配置在 base58 上 53 条规约有 28 条因此失败。",
    },
  },
  {
    name: { en: "Hollow typeclass", zh: "空壳 typeclass" },
    source: "App. D",
    code: "instance : LE Float := ⟨fun _ _ => True⟩",
    results: ["pass", "pass", "pass", "fail"],
    verdict: { en: "cheat (flagged by rules, decided by the LLM judge)", zh: "cheat（规则标记，LLM 裁判判定）" },
    ok: false,
    note: {
      en: "Every ≤ comparison becomes True, so any specification written with ≤ can be decided directly. It compiles and adds no new axioms, so the first two layers can't see it.",
      zh: "所有 ≤ 比较都变成 True，任何用 ≤ 写的规约都能直接 decide。它能编译，也不引入新公理，前两层都看不出来。",
    },
  },
  {
    name: { en: "Priority override", zh: "优先级覆盖" },
    source: "App. D",
    code: "instance (priority := 2000) : LT Float := ⟨fun _ _ => True⟩",
    results: ["pass", "pass", "pass", "fail"],
    verdict: { en: "cheat (two signals fire, no LLM needed)", zh: "cheat（两个信号同时触发，不用问 LLM）" },
    ok: false,
    note: {
      en: "Standard library instances sit at about priority 1000. Declaring 2000 replaces Float's real ordering, which also affects specifications the agent never touched.",
      zh: "标准库实例的优先级大约是 1000。声明 2000 就能替换掉 Float 真正的序，连 agent 没碰过的规约也一起受影响。",
    },
  },
  {
    name: { en: "Proved function differs from the one that runs", zh: "证明目标和运行代码分家" },
    source: "App. D · dijkstar",
    code: "noncomputable def findPathCost : FindPathCostSig :=\n  fun g s t => if h : exists c, isMinWalkCost g s t c\n    then h.choose else 0\n@[implemented_by realBellmanFord]\ndef findPathCost' := findPathCost",
    results: ["pass", "pass", "pass", "fail"],
    verdict: { en: "impl_oracle: the whole run is void", zh: "impl_oracle：整次运行作废" },
    ok: false,
    note: {
      en: "The most hidden kind. The proved function is simply the specification's answer, while a different algorithm actually runs. On 20,440 generated graphs this submission never differed from the reference, so differential testing can't catch it. The grader therefore bans @[implemented_by] in implementation files.",
      zh: "最隐蔽的一种。被证明的函数直接就是规约的答案，真正运行的是另一个算法。这份提交在 20,440 张生成的图上和参考实现没有任何输出差异，差分测试完全发现不了。所以判分器直接禁止在实现文件里用 @[implemented_by]。",
    },
  },
];

export function initGrader(): void {
  const list = $("#grader-list");
  const gates = $("#grader-gates");
  let timer = 0;
  let current = 4;

  const gateNodes = GATES.map(() => {
    const li = document.createElement("li");
    li.className = "gate";
    li.innerHTML = '<span class="icon"></span><span></span><small></small>';
    gates.appendChild(li);
    return li;
  });

  const ICON: Record<GateResult, string> = { pass: "✓", revert: "↺", fail: "✕" };

  function setGate(i: number, result: GateResult | null): void {
    gateNodes[i].className = `gate${result ? ` ${result}` : ""}`;
    gateNodes[i].children[0].textContent = result ? ICON[result] : "·";
  }

  function run(sub: Submission, animate: boolean): void {
    window.clearTimeout(timer);
    GATES.forEach((_, i) => setGate(i, null));
    $("#grader-code").replaceChildren(
      ...t(sub.code)
        .split("\n")
        .map((text) => {
          const line = document.createElement("span");
          line.className = "ln";
          line.textContent = text || " ";
          return line;
        }),
    );
    const verdict = $("#grader-verdict");
    verdict.textContent = "";
    verdict.className = "grader-verdict";
    $("#grader-note").textContent = "";

    const finish = (): void => {
      verdict.textContent = `${sub.ok ? "✓" : "✕"} ${t(sub.verdict)}`;
      verdict.classList.add(sub.ok ? "ok" : "bad");
      $("#grader-note").textContent = t(sub.note);
    };

    if (!animate || prefersReducedMotion()) {
      sub.results.forEach((result, i) => setGate(i, result));
      finish();
      return;
    }
    let i = 0;
    const tick = (): void => {
      if (i >= sub.results.length) {
        finish();
        return;
      }
      setGate(i, sub.results[i]);
      i += 1;
      timer = window.setTimeout(tick, 380);
    };
    timer = window.setTimeout(tick, 200);
  }

  const buttons = SUBMISSIONS.map((sub, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sub";
    button.setAttribute("aria-pressed", String(index === current));
    button.append(document.createElement("span"), document.createElement("small"));
    button.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      current = index;
      run(sub, true);
    });
    list.appendChild(button);
    return button;
  });

  function labels(): void {
    gateNodes.forEach((node, i) => {
      node.children[1].textContent = t(GATES[i].title);
      node.children[2].textContent = t(GATES[i].detail);
    });
    buttons.forEach((button, i) => {
      button.children[0].textContent = t(SUBMISSIONS[i].name);
      button.children[1].textContent = t(SUBMISSIONS[i].source);
    });
  }

  onLangChange(() => {
    labels();
    run(SUBMISSIONS[current], false);
  });
  labels();
  run(SUBMISSIONS[current], false);
}
