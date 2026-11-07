import { $, segmented } from "../../shared/dom";
import { onLangChange, t, type Text } from "../../shared/i18n";

type Mode = "function" | "proof" | "code";
type Kind = "frozen" | "comment" | "impl" | "proof";

/** Figure 2 of the paper. Only the long comment above `canonical` is shortened. */
const BANK: [Kind, string][] = [
  ["comment", "-- API signatures"],
  ["frozen", "abbrev CreateAccountSig := AccountId -> Ledger -> Ledger"],
  ["frozen", "abbrev AccountExistsSig := AccountId -> Ledger -> Bool"],
  ["frozen", "abbrev GetBalanceSig := AccountId -> Ledger -> Option Balance"],
  ["frozen", ""],
  ["comment", "-- Interface structure: one field per API signature"],
  ["frozen", "structure RepoImpl where"],
  ["frozen", "  createAccount : CreateAccountSig"],
  ["frozen", "  accountExists : AccountExistsSig"],
  ["frozen", "  getBalance : GetBalanceSig"],
  ["frozen", ""],
  ["comment", "-- Canonical implementation"],
  ["frozen", "def canonical : RepoImpl := {"],
  ["impl", "  createAccount := Bank.createAccount,"],
  ["impl", "  accountExists := Bank.accountExists,"],
  ["impl", "  getBalance := Bank.getBalance,"],
  ["frozen", "}"],
  ["frozen", ""],
  ["comment", "-- Specification: a predicate over implementations"],
  ["frozen", "def spec_create_zero_balance (impl : RepoImpl) : Prop :="],
  ["frozen", "  ∀ (id : AccountId) (ledger : Ledger),"],
  ["frozen", "    impl.accountExists id ledger = false ->"],
  ["frozen", "    impl.getBalance id (impl.createAccount id ledger) = some 0"],
  ["frozen", ""],
  ["comment", "-- Theorem: Proof obligation on the canonical implementation"],
  ["proof", "theorem proof_create_zero_balance : spec_create_zero_balance canonical := by sorry"],
];

/** Our own illustration of a standalone task. It does not come from any particular benchmark. */
const SINGLE: [Kind, string | Text][] = [
  ["comment", { en: "-- A standalone task: one function, one specification, no other files", zh: "-- 一道独立的题：一个函数，一条规约，没有其他文件" }],
  ["impl", "def maxOfTwo (a b : Nat) : Nat := sorry"],
  ["frozen", ""],
  ["frozen", "theorem maxOfTwo_spec (a b : Nat) :"],
  ["frozen", "    maxOfTwo a b ≥ a ∧ maxOfTwo a b ≥ b ∧"],
  ["frozen", "    (maxOfTwo a b = a ∨ maxOfTwo a b = b) :="],
  ["proof", "  by sorry"],
];

const VIEWS: Record<
  Mode,
  { code: [Kind, string | Text][]; editable: Kind[]; src: Text; srcClass: string; stats: [string, Text][]; note: Text }
> = {
  function: {
    code: SINGLE,
    editable: ["impl", "proof"],
    src: { en: "Illustrative code, not from any particular benchmark", zh: "示意代码，并非出自某个 benchmark" },
    srcClass: "toy",
    stats: [
      ["1", { en: "function", zh: "个函数" }],
      ["0", { en: "cross-file dependencies", zh: "跨文件依赖" }],
    ],
    note: {
      en: "miniCodeProps, FVAPPS, VERINA, CLEVER, DafnyBench and VerusBench work this way, with tasks from sets like HumanEval, MBPP and APPS. They can't test cross-module dependencies or long-range reasoning.",
      zh: "miniCodeProps、FVAPPS、VERINA、CLEVER、DafnyBench、VerusBench 等都属于这一类，题目来自 HumanEval、MBPP、APPS 这样的算法题集。它们无法考察跨模块依赖和长程推理。",
    },
  },
  proof: {
    code: BANK,
    editable: ["proof"],
    src: { en: "Paper, Figure 2", zh: "论文 Figure 2" },
    srcClass: "paper",
    stats: [
      ["755", { en: "RVBench proof tasks", zh: "RVBench 证明任务" }],
      ["849", { en: "VeruSAGE-Bench", zh: "VeruSAGE-Bench" }],
      ["500", { en: "VeriSoftBench", zh: "VeriSoftBench" }],
    ],
    note: {
      en: "Earlier repository-level benchmarks work this way: canonical points at the reference implementation and the agent only writes proofs. Vero keeps this as proof-only mode, but it can't show how implementation choices affect proof difficulty.",
      zh: "此前的仓库级 benchmark 都是这样：实现给定，canonical 指向参考实现，agent 只写证明。Vero 也保留了这个模式（proof-only），但这种考法看不到实现选择对证明难度的影响。",
    },
  },
  code: {
    code: BANK,
    editable: ["impl", "proof"],
    src: { en: "Paper, Figure 2", zh: "论文 Figure 2" },
    srcClass: "paper",
    stats: [
      ["43", { en: "repositories", zh: "个仓库" }],
      ["743", { en: "APIs", zh: "个 API" }],
      ["2,705", { en: "specifications", zh: "条规约" }],
    ],
    note: {
      en: "The reference is hidden. The agent writes every API body, then proves they satisfy all the specifications. One implementation change can invalidate proofs in other modules. Repositories average 62.9 specifications, with at most 203.",
      zh: "参考实现被藏起来，agent 自己写每个 API 的函数体，再证明它们满足全部规约。一次实现改动可能让别的模块里的证明失效。平均每个仓库 62.9 条规约，最多 203 条。",
    },
  },
};

export function initTask(): void {
  let current: Mode = "code";

  function draw(): void {
    const view = VIEWS[current];
    $("#task-code").replaceChildren(
      ...view.code.map(([kind, text]) => {
        const line = document.createElement("span");
        line.className = "ln";
        if (kind === "comment") line.classList.add("comment");
        if (view.editable.includes(kind)) line.classList.add("edit");
        line.textContent = t(text) || " ";
        return line;
      }),
    );
    const src = $("#task-src");
    src.textContent = t(view.src);
    src.className = `src ${view.srcClass}`;
    $("#task-stats").replaceChildren(
      ...view.stats.map(([value, label]) => {
        const stat = document.createElement("div");
        stat.className = "stat";
        const b = document.createElement("b");
        b.textContent = value;
        const span = document.createElement("span");
        span.textContent = t(label);
        stat.append(b, span);
        return stat;
      }),
    );
    $("#task-note").textContent = t(view.note);
  }

  segmented<Mode>(
    $("#task-mode"),
    [
      { value: "function", label: { en: "Before: single function", zh: "之前：单个函数" } },
      { value: "proof", label: { en: "Before: repository, proofs only", zh: "之前：仓库级，只补证明" } },
      { value: "code", label: { en: "Vero: repository, code + proofs", zh: "Vero：仓库级，实现 + 证明" } },
    ],
    current,
    (value) => {
      current = value;
      draw();
    },
  );
  onLangChange(draw);
  draw();
}
