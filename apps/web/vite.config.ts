import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { execSync } from "node:child_process";
import pkg from "./package.json" with { type: "json" };

function gitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

/**
 * Numéro de PR du dernier merge sur main, déduit du message du dernier
 * commit de merge (format standard GitHub : « Merge pull request #71 »).
 * Permet d'afficher la version "V1.0.71" dans l'app.
 *
 * On peut aussi forcer la valeur via l'env var APP_PR_NUMBER (CI).
 */
function lastPrNumber(): string {
  if (process.env.APP_PR_NUMBER) return String(process.env.APP_PR_NUMBER);
  try {
    const subject = execSync(
      'git log --merges --grep="Merge pull request" -n 1 --pretty=format:%s',
      { stdio: ["ignore", "pipe", "ignore"] },
    )
      .toString()
      .trim();
    const m = subject.match(/#(\d+)/);
    if (m) return m[1];
  } catch {
    /* ignore */
  }
  return "0";
}

const PR_NUMBER = lastPrNumber();
const APP_VERSION = `1.0.${PR_NUMBER}`;
const APP_COMMIT = process.env.GITHUB_SHA?.slice(0, 7) || gitSha();
const APP_BUILD_AT = new Date().toISOString();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __APP_COMMIT__: JSON.stringify(APP_COMMIT),
    __APP_BUILD_AT__: JSON.stringify(APP_BUILD_AT),
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
