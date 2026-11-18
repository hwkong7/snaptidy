import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";

/**
 * Content-Security-Policy 를 index.html 에 넣는다.
 * 개발 모드에서는 React Fast Refresh 의 인라인 스크립트와 HMR 웹소켓을 허용한다.
 */
function contentSecurityPolicy(): Plugin {
  let isDev = false;
  return {
    name: "snaptidy-csp",
    configResolved(config) {
      isDev = config.command === "serve";
    },
    transformIndexHtml() {
      const policy = [
        "default-src 'self'",
        isDev ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
        "img-src 'self' data: blob: snaptidy:",
        isDev ? "connect-src 'self' ws://localhost:*" : "connect-src 'self'",
      ].join("; ");
      return [
        {
          tag: "meta",
          attrs: { "http-equiv": "Content-Security-Policy", content: policy },
          injectTo: "head-prepend",
        },
      ];
    },
  };
}

export default defineConfig({
  main: {
    build: {
      rollupOptions: { input: { index: resolve(__dirname, "electron/main/index.ts") } },
    },
  },
  preload: {
    build: {
      rollupOptions: { input: { index: resolve(__dirname, "electron/preload/index.ts") } },
    },
  },
  renderer: {
    root: ".",
    base: "./",
    build: {
      minify: true,
      rollupOptions: { input: { index: resolve(__dirname, "index.html") } },
    },
    resolve: {
      alias: { "@": resolve(__dirname, "src") },
    },
    plugins: [react(), tailwindcss(), contentSecurityPolicy()],
  },
});
