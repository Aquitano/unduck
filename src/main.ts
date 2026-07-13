import { popularBangs } from "./popular-bangs";
import { POPULAR } from "./popular-list";
import "./global.css";

type Bang = {
    c?: string;
    d: string;
    r: number;
    s: string;
    sc?: string;
    t: string;
    u: string;
    usePlusEncoding?: boolean;
};

const LS_DEFAULT_BANG_KEY = "unduck_default_bang";
const FALLBACK_DEFAULT_BANG = "brave";

// Small map of the most common bangs, baked into this bundle so the common
// redirect resolves instantly without parsing the full ~2MB dataset.
const popularMap = new Map<string, Bang>(popularBangs.map((b) => [b.t, b]));

// The full dataset is loaded on demand (and cached locally by the service
// worker) only when a bang isn't in the popular set.
let fullMapPromise: Promise<Map<string, Bang>> | null = null;
function loadFullBangs(): Promise<Map<string, Bang>> {
    if (!fullMapPromise) {
        fullMapPromise = import("./bang").then(
            ({ bangs }) => new Map(bangs.map((b) => [b.t, b]))
        );
    }
    return fullMapPromise;
}

async function resolveBang(trigger: string): Promise<Bang | undefined> {
    const popular = popularMap.get(trigger);
    if (popular) return popular;
    const full = await loadFullBangs();
    return full.get(trigger);
}

const dropdownBangs = POPULAR.filter((b) => popularMap.has(b.t));

function getDefaultBangTrigger(): string {
    const stored = localStorage.getItem(LS_DEFAULT_BANG_KEY);
    // Defaults are only ever set from the popular set, so this stays on the
    // fast path (no full-dataset load needed to resolve the default).
    if (stored && popularMap.has(stored)) return stored;
    return FALLBACK_DEFAULT_BANG;
}

function setDefaultBangTrigger(trigger: string): void {
    if (popularMap.has(trigger)) {
        localStorage.setItem(LS_DEFAULT_BANG_KEY, trigger);
    }
}

function noSearchDefaultPageRender() {
    const app = document.querySelector<HTMLDivElement>("#app")!;
    const currentDefault = getDefaultBangTrigger();
    const currentBang = popularMap.get(currentDefault);

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
            ${dropdownBangs
            .map(
                (b) =>
                    `<option value="${b.t}" ${b.t === currentDefault ? "selected" : ""}>!${b.t} - ${b.name}</option>`
            )
            .join("")}
          </select>
          <p class="settings-current">
            Currently using <code>!${currentDefault}</code> - ${currentBang?.s ?? currentDefault}
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
        if (popularMap.has(selectedBang)) {
            setDefaultBangTrigger(selectedBang);
            noSearchDefaultPageRender();
        }
    });
}

async function getBangredirectUrl(): Promise<string | null> {
    const url = new URL(window.location.href);
    const query = url.searchParams.get("q")?.trim() ?? "";
    if (!query) {
        noSearchDefaultPageRender();
        return null;
    }

    const match = query.match(/!(\S+)/i);
    const bangCandidate = match?.[1]?.toLowerCase();
    const defaultBangTrigger = getDefaultBangTrigger();

    const selectedBang = bangCandidate
        ? (await resolveBang(bangCandidate)) ?? (await resolveBang(defaultBangTrigger))
        : await resolveBang(defaultBangTrigger);

    // Remove the first bang from the query
    const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

    // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
    if (cleanQuery === "")
        return selectedBang ? `https://${selectedBang.d}` : null;

    const encodedQuery = encodeURIComponent(cleanQuery)
        // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
        .replace(/%2F/g, "/");

    // Format of the url is:
    // https://www.google.com/search?q={{{s}}}
    const searchUrl = selectedBang?.u.replace(
        "{{{s}}}",
        selectedBang.usePlusEncoding ? encodedQuery.replace(/%20/g, "+") : encodedQuery,
    );
    if (!searchUrl) return null;

    return searchUrl;
}

async function doRedirect() {
    const searchUrl = await getBangredirectUrl();
    if (!searchUrl) return;
    window.location.replace(searchUrl);
}

doRedirect();
