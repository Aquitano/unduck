import { bangs } from "./bang";
import "./global.css";

const bangMap = new Map(bangs.map((b) => [b.t, b]));

function noSearchDefaultPageRender() {
    const app = document.querySelector<HTMLDivElement>("#app")!;
    app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <div class="content-container">
        <h1>Und*ck</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container">
          <input
            type="text"
            class="url-input"
            value="https://unduck.link?q=%s"
            readonly
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
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
}

const LS_DEFAULT_BANG = "brave";
const defaultBang = bangMap.get(LS_DEFAULT_BANG);

function getBangredirectUrl() {
    const url = new URL(window.location.href);
    const query = url.searchParams.get("q")?.trim() ?? "";
    if (!query) {
        noSearchDefaultPageRender();
        return null;
    }

    const match = query.match(/!(\S+)/i);

    const bangCandidate = match?.[1]?.toLowerCase();
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
