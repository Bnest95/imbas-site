import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'workbench.bundle.js');

await esbuild.build({
  entryPoints: [path.join(root, 'workbench-app.jsx')],
  outfile: outFile,
  bundle: true,
  format: 'iife',
  platform: 'browser',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  target: ['es2018'],
  minify: true,
  legalComments: 'none',
  banner: {
    js: '/* Imbas Workbench — precompiled; requires global React + ReactDOM */',
  },
});

const bytes = fs.statSync(outFile).size;
console.log(`Built ${outFile} (${bytes} bytes)`);
