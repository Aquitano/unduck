import { bangs } from "./bang";
import "./global.css";

type Bang = (typeof bangs)[number];

const searchIndex = {
    byTrigger: new Map<string, Bang>(),
    triggerList: [] as string[],
};

for (const bang of bangs) {
    searchIndex.byTrigger.set(bang.t, bang);
    searchIndex.triggerList.push(bang.t);
}

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="search-container">
    <div class="search-content">
      <h1>Search Bangs</h1>
      <input
        type="text"
        id="search"
        class="search-input"
        placeholder="Search by command, name, or domain..."
        autofocus
      />
      <div id="results" class="search-results"></div>
      <footer class="footer search-footer">
        <a href="/">back to home</a>
      </footer>
    </div>
  </div>
`;

const searchInput = document.getElementById("search") as HTMLInputElement;
const resultsDiv = document.getElementById("results")!;

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function renderResults(filtered: Bang[]) {
    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p class="no-results">No bangs found</p>';
        return;
    }

    const count = filtered.length > 100 ? `Showing first 100 of ${filtered.length}` : `${filtered.length} results`;
    const items = filtered.slice(0, 100);

    resultsDiv.innerHTML = `
    <p class="results-count">${count}</p>
    <div class="results-grid">
      ${items
            .map(
                (b) => `
        <div class="bang-card">
          <div class="bang-header">
            <code class="bang-trigger">!${escapeHtml(b.t)}</code>
            <span class="bang-name">${escapeHtml(b.s)}</span>
            <span class="bang-domain">${escapeHtml(b.d)}</span>
          </div>
          <div class="bang-url" title="${escapeHtml(b.u)}">${escapeHtml(b.u)}</div>
        </div>
      `
            )
            .join("")}
    </div>
  `;
}

function debounce(fn: (query: string) => void, delay: number): (query: string) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(query), delay);
    };
}

function filterBangs(query: string): Bang[] {
    if (!query) {
        return bangs.slice(0, 100);
    }

    const isBangSearch = query.startsWith("!");
    const cleanQuery = isBangSearch ? query.slice(1) : query;
    const lowerQuery = cleanQuery.toLowerCase();

    if (isBangSearch) {
        // For !command searches, use the index for exact match
        const exactMatch = searchIndex.byTrigger.get(cleanQuery);
        const partialMatches = bangs.filter(
            (b) =>
                b.t !== cleanQuery &&
                (b.t.includes(lowerQuery) ||
                    b.s.toLowerCase().includes(lowerQuery) ||
                    b.d.toLowerCase().includes(lowerQuery))
        );
        return exactMatch ? [exactMatch, ...partialMatches] : partialMatches;
    }

    return bangs.filter(
        (b) =>
            b.t.includes(lowerQuery) ||
            b.s.toLowerCase().includes(lowerQuery) ||
            b.d.toLowerCase().includes(lowerQuery) ||
            b.u.toLowerCase().includes(lowerQuery)
    );
}

renderResults(bangs.slice(0, 100));

const handleSearch = debounce((query: string) => {
    renderResults(filterBangs(query.trim()));
}, 100);

searchInput.addEventListener("input", (e) => {
    handleSearch((e.target as HTMLInputElement).value);
});
