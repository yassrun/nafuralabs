#!/usr/bin/env node
// Runs this product: node ops/run.mjs lab | local-staging | staging | prod   (--help for options).
import { run } from '../../nafura-platform/ops/product/run.mjs';

await run(new URL('..', import.meta.url), process.argv.slice(2));
