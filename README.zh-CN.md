# Frontier Research Storage

<p>
  <a href="./README.md"><img alt="English" src="https://img.shields.io/badge/English-e5e5e5?style=for-the-badge"></a>
  <a href="./README.zh-CN.md"><img alt="简体中文" src="https://img.shields.io/badge/%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-111111?style=for-the-badge"></a>
</p>

每篇论文一个可交互的小 demo。不讲一步步的实现，只展示这篇论文改变了什么。

## 论文

### LLM

| # | 论文 | 改了什么 |
|---|---|---|
| 01 | [Attention Is All You Need](./llm/01-attention-is-all-you-need/README.zh-CN.md)（2017） | 去掉循环和卷积，只用注意力。 |

### Agent

| # | 论文 | 改了什么 |
|---|---|---|
| 01 | [Vero: Can AI Agents Build Formally Verified Software Repositories?](./agent/01-vero/README.zh-CN.md)（2026） | 把验证代码生成的考题从单个函数扩大到整个仓库。 |

## 运行

```bash
npm install
npm run dev        # 打开首页，列出所有论文
npm run typecheck  # TypeScript 类型检查
```

每个页面右上角都有 **EN** 和 **中文** 两个按钮，选择会保存在浏览器里。

请通过 `npm run dev` 打开页面。直接双击 HTML 文件无法运行，因为 TypeScript 需要 Vite 编译。

## 目录

```
llm/     LLM 论文
agent/   Agent 论文
shared/  所有 demo 共用的样式、DOM 工具函数和语言切换
```

## 添加一篇论文

在 `llm/` 或 `agent/` 下新建 `NN-论文名/`，放这些文件：

| 文件 | 作用 |
|---|---|
| `paper.json` | 期号、标题、作者、年份、发表处，以及中英文的一句话改动。首页会自动列出这篇论文。 |
| `index.html` | 摘要、前后对比的 diff，每个改动一个小节。head 和顶栏从现有论文复制。 |
| `main.ts`、`style.css` | demo 的逻辑和样式。 |
| `README.md`、`README.zh-CN.md` | 两种语言的论文 README，顶部放两个按钮。 |

双语的写法：

- **HTML**：把两个版本写成相邻元素，`<p lang="en">…</p><p lang="zh">…</p>`，CSS 会隐藏当前未选中的语言。
- **TypeScript**：绘制时用 `tr("English", "中文")` 或 `t({ en, zh })`，并调用 `onLangChange(draw)`，这样切换语言时 demo 会重绘，状态不变。

每个可视化都要标明数字来源：来自论文、实时计算，还是手工设定的玩具示例。
