import { bangs } from "./bang";
import "./global.css";

type Bang = (typeof bangs)[number];

const LS_DEFAULT_BANG_KEY = "unduck_default_bang";
const FALLBACK_DEFAULT_BANG = "brave";

const bangMap = new Map<string, Bang>(bangs.map((b) => [b.t, b]));

const popularBangs = [
    { t: "g", name: "Google" },
    { t: "ddg", name: "DuckDuckGo" },
    { t: "b", name: "Bing" },
    { t: "brave", name: "Brave" },
    { t: "sp", name: "Startpage" },
    { t: "yt", name: "YouTube" },
    { t: "gh", name: "GitHub" },
    { t: "w", name: "Wikipedia" },
    { t: "t3", name: "T3 Chat" },
    { t: "ppx", name: "Perplexity" },
    { t: "cg", name: "ChatGPT" },
].filter((b) => bangMap.has(b.t));

function getDefaultBangTrigger(): string {
    const stored = localStorage.getItem(LS_DEFAULT_BANG_KEY);
    if (stored && bangMap.has(stored)) {
        return stored;
    }
    return FALLBACK_DEFAULT_BANG;
}

function setDefaultBangTrigger(trigger: string): void {
    if (bangMap.has(trigger)) {
        localStorage.setItem(LS_DEFAULT_BANG_KEY, trigger);
    }
}

function noSearchDefaultPageRender() {
    const app = document.querySelector<HTMLDivElement>("#app")!;
    const currentDefault = getDefaultBangTrigger();
    const currentBang = bangMap.get(currentDefault);

    app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <div class="content-container">
        <h1>Und*ck</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container">
          <input
            type="text"
            class="url-input"
            value="https://search.thomasbreindl.me/?q=%s"
            readonly
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>

        <div class="settings-section">
          <label for="default-bang-select" class="settings-label">Default search engine:</label>
          <select class="settings-select" id="default-bang-select">
            ${popularBangs
            .map(
                (b) =>
                    `<option value="${b.t}" ${b.t === currentDefault ? "selected" : ""}>!${b.t} - ${b.name}</option>`
            )
            .join("")}
          </select>
          <p class="settings-current">
            Currently using <code>!${currentDefault}</code> - ${currentBang?.s ?? "Unknown"}
          </p>
        </div>
      </div>
      <footer class="footer">
        <a href="/search.html">search bangs</a>
      </footer>
    </div>
  `;

    const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
    const copyIcon = copyButton.querySelector("img")!;
    const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;

    copyButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(urlInput.value);
            copyIcon.src = "/clipboard-check.svg";

            setTimeout(() => {
                copyIcon.src = "/clipboard.svg";
            }, 2000);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
            alert("Failed to copy to clipboard. Please copy manually.");
        }
    });

    // Auto-save on change
    const defaultBangSelect = document.getElementById("default-bang-select") as HTMLSelectElement;
    defaultBangSelect.addEventListener("change", () => {
        const selectedBang = defaultBangSelect.value;
        if (bangMap.has(selectedBang)) {
            setDefaultBangTrigger(selectedBang);
            noSearchDefaultPageRender();
        }
    });
}

function getBangredirectUrl() {
    const url = new URL(window.location.href);
    const query = url.searchParams.get("q")?.trim() ?? "";
    if (!query) {
        noSearchDefaultPageRender();
        return null;
    }

    const match = query.match(/!(\S+)/i);

    const bangCandidate = match?.[1]?.toLowerCase();
    const defaultBangTrigger = getDefaultBangTrigger();
    const defaultBang = bangMap.get(defaultBangTrigger);
    const selectedBang = bangCandidate ? bangMap.get(bangCandidate) ?? defaultBang : defaultBang;

    // Remove the first bang from the query
    const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

    // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
    if (cleanQuery === "")
        return selectedBang ? `https://${selectedBang.d}` : null;

    // Format of the url is:
    // https://www.google.com/search?q={{{s}}}
    const searchUrl = selectedBang?.u.replace(
        "{{{s}}}",
        // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
        encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
    );
    if (!searchUrl) return null;

    return searchUrl;
}

function doRedirect() {
    const searchUrl = getBangredirectUrl();
    if (!searchUrl) return;
    window.location.replace(searchUrl);
}

doRedirect();
