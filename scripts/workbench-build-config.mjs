// Single source of truth for the Workbench esbuild config, shared by the builder
// (build-workbench.mjs) and the staleness checker (check-workbench-bundle.mjs) so
// the two can never drift. Do not change these options without rebuilding the
// committed bundle in the same pass.

import path from "path";
import { fileURLToPath } from "url";

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const entryPoint = path.join(root, "workbench-app.jsx");
export const outFile = path.join(root, "workbench.bundle.js");

export function buildOptions(overrides = {}) {
  return {
    entryPoints: [entryPoint],
    bundle: true,
    format: "iife",
    platform: "browser",
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    target: ["es2018"],
    minify: true,
    legalComments: "none",
    banner: {
      js: "/* Imbas Workbench — precompiled; requires global React + ReactDOM */",
    },
    ...overrides,
  };
}
