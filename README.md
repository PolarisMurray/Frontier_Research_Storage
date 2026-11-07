# Frontier Research Storage

<p>
  <a href="./README.md"><img alt="English" src="https://img.shields.io/badge/English-111111?style=for-the-badge"></a>
  <a href="./README.zh-CN.md"><img alt="简体中文" src="https://img.shields.io/badge/%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-e5e5e5?style=for-the-badge"></a>
</p>

One small interactive demo per paper. Each demo skips the step-by-step implementation and shows what the paper changed.

## Papers

### LLM

| # | Paper | What it changed |
|---|---|---|
| 01 | [Attention Is All You Need](./llm/01-attention-is-all-you-need/README.md) (2017) | Drops recurrence and convolution and uses only attention. |

### Agent

| # | Paper | What it changed |
|---|---|---|
| 01 | [Vero: Can AI Agents Build Formally Verified Software Repositories?](./agent/01-vero/README.md) (2026) | Moves verified code generation from single functions to whole repositories. |

## Run

```bash
npm install
npm run dev        # opens the home page, which lists every paper
npm run typecheck  # checks the TypeScript
```

Every page has **EN** and **中文** buttons in the top right. Your choice is saved in the browser.

Open the pages through `npm run dev`. Opening the HTML files directly won't work because Vite compiles the TypeScript.

## Layout

```
llm/     LLM papers
agent/   agent papers
shared/  styles, DOM helpers and language switching used by every demo
```

## Add a paper

Create `NN-paper-name/` under `llm/` or `agent/` with these files:

| File | Purpose |
|---|---|
| `paper.json` | Number, title, authors, year, venue, and a one-line change in both languages. The home page lists the paper automatically. |
| `index.html` | The abstract, a before/after diff, and one section per change. Copy the head and top bar from an existing paper. |
| `main.ts`, `style.css` | Demo logic and styles. |
| `README.md`, `README.zh-CN.md` | The paper's README in each language, with the two buttons at the top. |

To support both languages:

- **In HTML**, write both versions as sibling elements: `<p lang="en">…</p><p lang="zh">…</p>`. CSS hides the inactive one.
- **In TypeScript**, use `tr("English", "中文")` or `t({ en, zh })` at draw time, and call `onLangChange(draw)` so the demo redraws while keeping its state.

Label where each visual's numbers come from: the paper, a live calculation, or a hand-made toy example.
