import { $ } from "./shared/dom";
import { onLangChange, t, type Text } from "./shared/i18n";

interface PaperMeta {
  issue: number;
  title: string;
  authors: string;
  year: number;
  venue: string;
  change: Text;
}

/** Every paper folder carries a paper.json; adding a folder is enough to list it here. */
const metas = import.meta.glob<PaperMeta>("./{llm,agent}/*/paper.json", { eager: true, import: "default" });

const TRACKS = [
  { id: "llm", label: "LLM" },
  { id: "agent", label: "Agent" },
];

function render(): void {
  const host = $("#tracks");
  host.replaceChildren();

  for (const track of TRACKS) {
    const papers = Object.entries(metas)
      .filter(([path]) => path.startsWith(`./${track.id}/`))
      .sort(([, a], [, b]) => a.issue - b.issue);

    const section = document.createElement("section");
    section.className = "track";
    const heading = document.createElement("h2");
    heading.textContent = track.label;
    section.appendChild(heading);

    for (const [path, paper] of papers) {
      const link = document.createElement("a");
      link.className = "entry";
      link.href = path.replace("paper.json", "");

      const issue = document.createElement("span");
      issue.className = "issue";
      issue.textContent = String(paper.issue).padStart(2, "0");
      const title = document.createElement("h3");
      title.textContent = paper.title;
      const year = document.createElement("span");
      year.className = "year";
      year.textContent = String(paper.year);
      const change = document.createElement("p");
      change.className = "change";
      change.textContent = t(paper.change);

      link.append(issue, title, year, change);
      section.appendChild(link);
    }
    host.appendChild(section);
  }
}

onLangChange(render);
render();
