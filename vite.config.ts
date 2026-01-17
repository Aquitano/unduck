import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        VitePWA({
            registerType: "autoUpdate",
        }),
    ],
    build: {
        rollupOptions: {
            input: {
                main: "index.html",
                search: "search.html",
            },
        },
    },
});
