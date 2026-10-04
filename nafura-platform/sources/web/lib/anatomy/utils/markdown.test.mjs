import assert from 'node:assert/strict';
import test from 'node:test';

import { renderMarkdown } from './markdown.ts';

test('markdown renders lists and links, and strips scripts and event handlers', () => {
  const html = renderMarkdown('# Titre\n\n- un\n\n[Plans](https://example.com)\n\n<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">');
  assert.match(html, /<h1>Titre<\/h1>/);
  assert.match(html, /<li>un<\/li>/);
  assert.match(html, /<a [^>]*rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /onerror/i);
});
