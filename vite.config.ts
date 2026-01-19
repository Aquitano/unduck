import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        VitePWA({
            registerType: "autoUpdate",
            workbox: {
                globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/unduck\.link\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "unduck-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
                skipWaiting: true,
                clientsClaim: true,
            },
            manifest: {
                name: "Unduck",
                short_name: "Unduck",
                description: "Fast DuckDuckGo bang redirects",
                theme_color: "#131313",
                background_color: "#131313",
                display: "standalone",
                icons: [
                    {
                        src: "/search.svg",
                        sizes: "any",
                        type: "image/svg+xml",
                        purpose: "any maskable",
                    },
                ],
            },
        }),
    ],
    build: {
        rollupOptions: {
            input: {
                main: "index.html",
                search: "search.html",
            },
        },
        target: "esnext",
        minify: "esbuild",
    },
});
