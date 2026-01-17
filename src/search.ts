import { bangs } from "./bang";
import "./global.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div style="display: flex; flex-direction: column; align-items: center; padding: 2rem;">
    <div style="max-width: 900px; width: 100%;">
      <h1>Search Bangs</h1>
      <input
        type="text"
        id="search"
        placeholder="Search by command, name, or domain..."
        style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
        autofocus
      />
      <div id="results" style="margin-top: 1rem;"></div>
      <footer class="footer" style="margin-top: 2rem;">
        <a href="/">back to home</a>
      </footer>
    </div>
  </div>
`;

const searchInput = document.getElementById("search") as HTMLInputElement;
const resultsDiv = document.getElementById("results")!;

function renderResults(filtered: typeof bangs) {
    if (filtered.length === 0) {
        resultsDiv.innerHTML = "<p>No bangs found</p>";
        return;
    }

    const count = filtered.length > 100 ? `Showing first 100 of ${filtered.length}` : `${filtered.length} results`;
    const items = filtered.slice(0, 100);

    resultsDiv.innerHTML = `
    <p style="margin-bottom: 0.5rem; color: #666;">${count}</p>
    <div style="display: grid; gap: 0.5rem;">
      ${items
            .map(
                (b) => `
        <div style="padding: 0.75rem; border: 1px solid #eee; border-radius: 4px;">
          <div style="display: flex; gap: 1rem; align-items: baseline;">
            <code style="font-weight: bold; color: #0066cc;">!${b.t}</code>
            <span>${b.s}</span>
            <span style="color: #666; font-size: 0.875rem;">${b.d}</span>
          </div>
          <div style="font-size: 0.875rem; color: #666; margin-top: 0.25rem;">${b.u}</div>
        </div>
      `
            )
            .join("")}
    </div>
  `;
}

renderResults(bangs.slice(0, 100));

searchInput.addEventListener("input", (e) => {
    const query = (e.target as HTMLInputElement).value.toLowerCase().trim();

    if (!query) {
        renderResults(bangs.slice(0, 100));
        return;
    }

    const isBangSearch = query.startsWith("!");
    const cleanQuery = isBangSearch ? query.slice(1) : query;

    if (isBangSearch) {
        // For !command searches, show exact match first, then partial matches
        const exactMatch = bangs.find((b) => b.t === cleanQuery);
        const partialMatches = bangs.filter(
            (b) => b.t !== cleanQuery && (b.t.includes(cleanQuery) || b.s.toLowerCase().includes(cleanQuery) || b.d.toLowerCase().includes(cleanQuery))
        );

        const filtered = exactMatch ? [exactMatch, ...partialMatches] : partialMatches;
        renderResults(filtered);
    } else {
        // For text searches, filter normally
        const filtered = bangs.filter(
            (b) =>
                b.t.toLowerCase().includes(cleanQuery) ||
                b.s.toLowerCase().includes(cleanQuery) ||
                b.d.toLowerCase().includes(cleanQuery) ||
                b.u.toLowerCase().includes(cleanQuery)
        );

        renderResults(filtered);
    }
});
