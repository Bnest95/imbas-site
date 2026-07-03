import * as esbuild from 'esbuild';
import fs from 'fs';
import { buildOptions, outFile } from './workbench-build-config.mjs';

await esbuild.build(buildOptions({ outfile: outFile }));

const bytes = fs.statSync(outFile).size;
console.log(`Built ${outFile} (${bytes} bytes)`);
