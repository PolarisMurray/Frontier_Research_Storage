import { $, segmented } from "../../shared/dom";
import { onLangChange, t, tr, type Text } from "../../shared/i18n";

const PADDING = 0x3d;

const SPEC_BEFORE = `def spec_char_to_bits_padding (impl : RepoImpl) : Prop :=
  impl.verdict.charToBits 0x3D = some none

def spec_char_to_bits_reject (impl : RepoImpl) : Prop :=
  ∀ (c : UInt8),
    (c < 0x2B ∨ (c > 0x2B ∧ c < 0x2F) ∨
     (c > 0x39 ∧ c < 0x41) ∨ (c > 0x5A ∧ c < 0x61) ∨ c > 0x7A) →
    impl.verdict.charToBits c = none`;

const SPEC_AFTER = SPEC_BEFORE.replace("(c > 0x39 ∧ c < 0x41)", "(c > 0x39 ∧ c < 0x41 ∧ c ≠ 0x3D)");

/** The hypothesis of spec_char_to_bits_reject, before and after the repair. */
function rejects(c: number, fixed: boolean): boolean {
  return (
    c < 0x2b ||
    (c > 0x2b && c < 0x2f) ||
    (c > 0x39 && c < 0x41 && (!fixed || c !== PADDING)) ||
    (c > 0x5a && c < 0x61) ||
    c > 0x7a
  );
}

const hex = (c: number): string => `0x${c.toString(16).toUpperCase().padStart(2, "0")}`;
const glyph = (c: number): string =>
  c >= 0x21 && c < 0x7f ? `'${String.fromCharCode(c)}'` : tr("control character or space", "控制字符或空格");

/** Table 6 of the paper. */
const DEFECTS: { label: Text; cases: number; note: string }[] = [
  { label: { en: "Wrong definition or translation", zh: "定义或语义翻译错误" }, cases: 18, note: "huffman 16" },
  { label: { en: "Missing domain or operating condition", zh: "缺少定义域或操作条件" }, cases: 17, note: "verified_bitmasks 7" },
  { label: { en: "Reference implementation mismatch", zh: "参考实现不符" }, cases: 2, note: "flocq 2" },
  { label: { en: "Specifications in direct conflict", zh: "规约之间直接冲突" }, cases: 1, note: "verdict 1" },
];

export function initAudit(): void {
  let fixed = false;
  let selected = PADDING;

  function describe(c: number): string {
    if (c === PADDING) {
      return fixed
        ? tr(
            `${hex(c)} '=': reject now excludes it, leaving only padding's requirement of some none. Both specifications can hold.`,
            `${hex(c)} '='：reject 已排除它，只剩 padding 要求 some none。两条规约可以同时满足。`,
          )
        : tr(
            `${hex(c)} '=': padding requires charToBits = some none, and reject requires charToBits = none. No implementation can do both.`,
            `${hex(c)} '='：padding 要求 charToBits = some none，reject 要求 charToBits = none。没有实现能同时满足。`,
          );
    }
    return rejects(c, fixed)
      ? tr(`${hex(c)} ${glyph(c)}: reject requires charToBits = none.`, `${hex(c)} ${glyph(c)}：reject 要求 charToBits = none。`)
      : tr(
          `${hex(c)} ${glyph(c)}: neither specification constrains it (a valid Base64 character).`,
          `${hex(c)} ${glyph(c)}：这两条规约都没有约束它（Base64 的合法字符）。`,
        );
  }

  function draw(): void {
    $("#audit-code").replaceChildren(
      ...(fixed ? SPEC_AFTER : SPEC_BEFORE).split("\n").map((text) => {
        const line = document.createElement("span");
        line.className = "ln";
        if (text.includes("0x39")) line.classList.add("edit");
        line.textContent = text || " ";
        return line;
      }),
    );

    const host = $("#audit-bytes");
    host.replaceChildren();
    for (let c = 0; c < 128; c += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "byte";
      if (c === PADDING) button.classList.add(fixed ? "fixed" : "conflict");
      else if (rejects(c, fixed)) button.classList.add("reject");
      button.textContent = c.toString(16).toUpperCase().padStart(2, "0");
      const select = (): void => {
        selected = c;
        $("#audit-readout").textContent = describe(selected);
      };
      button.addEventListener("pointerenter", select);
      button.addEventListener("focus", select);
      button.addEventListener("click", select);
      host.appendChild(button);
    }
    $("#audit-readout").textContent = describe(selected);
  }

  segmented(
    $("#audit-version"),
    [
      { value: false, label: { en: "Before the fix", zh: "修复前" } },
      { value: true, label: { en: "After the fix", zh: "修复后" } },
    ],
    fixed,
    (value) => {
      fixed = value;
      selected = PADDING;
      draw();
    },
  );

  const max = Math.max(...DEFECTS.map((defect) => defect.cases));
  function drawDefects(): void {
    $("#audit-defects").replaceChildren(
      ...DEFECTS.map((defect) => {
        const row = document.createElement("div");
        row.className = "defect";
        const label = document.createElement("span");
        label.textContent = t(defect.label);
        const track = document.createElement("div");
        track.className = "track-bar";
        track.title = `${tr("Largest source", "最多的来源")}: ${defect.note}`;
        const bar = document.createElement("div");
        bar.className = "fill";
        bar.style.width = `${(defect.cases / max) * 100}%`;
        track.appendChild(bar);
        const count = document.createElement("span");
        count.className = "count";
        count.textContent = String(defect.cases);
        row.append(label, track, count);
        return row;
      }),
    );
  }

  onLangChange(() => {
    draw();
    drawDefects();
  });
  drawDefects();
  draw();
}
