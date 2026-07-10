#!/usr/bin/env node
/**
 * ERP scope UI homogenization codemod (WP2–WP6).
 * Run from web/: node tools/homog-erp-scope.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');

const SCOPES = [
  'app/applications/erp/pages/inventory',
  'app/applications/erp/pages/achats',
  'app/applications/erp/pages/administration',
  'app/applications/erp/pages/ventes',
  'app/applications/erp/pages/approbations',
  'app/applications/erp/onboarding',
  'app/applications/erp/shell',
  'app/applications/erp/etudes',
  'app/applications/erp/ventes',
  'app/applications/erp/inventory',
  'app/applications/erp/chantiers',
];

const SKIP_FILES = new Set([
  'app/applications/erp/pages/chantiers/chantiers-listing/chantiers-listing.page.ts',
  'app/applications/erp/pages/chantiers/chantier-detail/chantier-detail.page.ts',
]);

const HEX_MAP = new Map(
  Object.entries({
    '#2563eb': 'var(--nf-color-primary-600)',
    '#1d4ed8': 'var(--nf-color-primary-700)',
    '#3b82f6': 'var(--nf-color-primary-500)',
    '#1b3fae': 'var(--nf-color-primary-500)',
    '#163491': 'var(--nf-color-primary-600)',
    '#122a75': 'var(--nf-color-primary-700)',
    '#1e40af': 'var(--nf-color-primary-800)',
    '#1e3a8a': 'var(--nf-color-primary-900)',
    '#93c5fd': 'var(--nf-color-primary-300)',
    '#dbeafe': 'var(--nf-color-primary-100)',
    '#eff6ff': 'var(--nf-color-primary-50)',
    '#eef1fb': 'var(--nf-color-primary-50)',
    '#e0e7ff': 'var(--nf-color-primary-100)',
    '#c7d2fe': 'var(--nf-color-primary-200)',
    '#4338ca': 'var(--nf-color-primary-700)',
    '#3730a3': 'var(--nf-color-primary-800)',
    '#0f172a': 'var(--nf-text-primary)',
    '#1e293b': 'var(--nf-text-primary)',
    '#334155': 'var(--nf-text-primary)',
    '#111827': 'var(--nf-text-primary)',
    '#16324f': 'var(--nf-text-primary)',
    '#475569': 'var(--nf-color-text-secondary)',
    '#64748b': 'var(--nf-color-text-secondary)',
    '#52657a': 'var(--nf-color-text-secondary)',
    '#6b7280': 'var(--nf-text-muted)',
    '#94a3b8': 'var(--nf-color-text-muted)',
    '#cbd5e1': 'var(--nf-color-border)',
    '#e2e8f0': 'var(--nf-color-border)',
    '#e5e7eb': 'var(--nf-border-default)',
    '#d1d5db': 'var(--nf-border-default)',
    '#f1f5f9': 'var(--nf-color-bg-muted)',
    '#f8fafc': 'var(--nf-color-bg-subtle)',
    '#f7fbff': 'var(--nf-color-bg-subtle)',
    '#eef4f7': 'var(--nf-color-bg-muted)',
    '#ffffff': 'var(--nf-color-surface)',
    '#fff': 'var(--nf-color-surface)',
    '#16a34a': 'var(--nf-color-success-600)',
    '#15803d': 'var(--nf-color-success-700)',
    '#166534': 'var(--nf-color-success-700)',
    '#dc2626': 'var(--nf-color-danger-600)',
    '#b91c1c': 'var(--nf-color-danger-700)',
    '#991b1b': 'var(--nf-color-danger-700)',
    '#f59e0b': 'var(--nf-color-warning-500)',
    '#d97706': 'var(--nf-color-warning-600)',
    '#92400e': 'var(--nf-color-warning-700)',
    '#fef9c3': 'var(--nf-color-warning-100)',
    '#fee2e2': 'var(--nf-color-danger-100)',
    '#dcfce7': 'var(--nf-color-success-100)',
    '#bbf7d0': 'var(--nf-color-success-200)',
    '#86efac': 'var(--nf-color-success-300)',
    '#fca5a5': 'var(--nf-color-danger-300)',
    '#ecfeff': 'var(--nf-color-info-50, var(--nf-color-primary-50))',
    '#0e7490': 'var(--nf-color-info-700, var(--nf-color-primary-700))',
    '#0d9488': 'var(--nf-color-teal-600, var(--nf-color-success-600))',
    '#047857': 'var(--nf-color-success-700)',
    '#f2d544': 'var(--nf-color-accent-400)',
    '#131415': 'var(--nf-color-accent-contrast)',
  }).map(([k, v]) => [k.toLowerCase(), v]),
);

const MAT_ICON_MAP = {
  add: 'plus',
  delete: 'trash-2',
  edit: 'pencil',
  save: 'save',
  close: 'x',
  search: 'search',
  filter: 'filter',
  refresh: 'refresh-cw',
  download: 'download',
  upload: 'upload',
  print: 'printer',
  more_vert: 'more-vertical',
  arrow_back: 'arrow-left',
  arrow_forward: 'arrow-right',
  chevron_right: 'chevron-right',
  chevron_left: 'chevron-left',
  visibility: 'eye',
  visibility_off: 'eye-off',
  check: 'check',
  cancel: 'x',
  info: 'info',
  warning: 'alert-triangle',
  error: 'alert-circle',
  remove: 'minus',
  content_copy: 'copy',
  open_in_new: 'external-link',
};

function walkDir(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, files);
    else if (/\.(html|scss|ts)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function rel(p) {
  return path.relative(WEB_ROOT, p).replace(/\\/g, '/');
}

function replaceHex(content) {
  return content.replace(/#([0-9a-fA-F]{3,6})\b/g, (match) => {
    const key = match.toLowerCase();
    if (key.length === 4) {
      const expanded =
        '#' +
        key[1] +
        key[1] +
        key[2] +
        key[2] +
        key[3] +
        key[3];
      return HEX_MAP.get(expanded) ?? HEX_MAP.get(key) ?? match;
    }
    return HEX_MAP.get(key) ?? match;
  });
}

function inferButtonVariant(openTag) {
  if (/btn--reject|btn--reset|btn--danger|mat-warn|color=["']warn/i.test(openTag)) return 'danger';
  if (/btn--approve|btn--export|btn--primary|signup-submit|mat-flat-button|mat-raised-button|type=["']submit/i.test(openTag))
    return 'primary';
  if (/btn--ghost|mat-icon-button|tab\b|chantier-link|btn-reload/i.test(openTag)) return 'ghost';
  if (/mat-stroked-button|btn--secondary|btn--export/i.test(openTag)) return 'secondary';
  return 'secondary';
}

function transformButtons(content) {
  let out = content;
  // mat-stroked-button / mat-flat-button / mat-icon-button patterns
  out = out.replace(/<button([^>]*?)mat-icon-button([^>]*)>([\s\S]*?)<\/button>/gi, (_, before, after, inner) => {
    const open = `<button${before}mat-icon-button${after}>`;
    const variant = 'ghost';
    const iconMatch = inner.match(/<mat-icon[^>]*>([^<]+)<\/mat-icon>/i) || inner.match(/<nf-icon[^>]*name=["']([^"']+)["']/i);
    const icon = iconMatch ? ` icon="${iconMatch[1].trim()}"` : '';
    const attrs = `${before}${after}`.replace(/\s*mat-icon-button/gi, '').replace(/\s*type=["']button["']/gi, '');
    const cleanedInner = inner.replace(/<mat-icon[^>]*>[^<]*<\/mat-icon>/gi, '').replace(/<nf-icon[^>]*\/?>/gi, '').trim();
    if (cleanedInner) {
      return `<nf-button variant="${variant}"${icon}${attrs} (clicked)="${extractClick(attrs) || 'onClick($event)'}">${cleanedInner}</nf-button>`;
    }
    return `<nf-button variant="${variant}"${icon}${attrs.replace(/\(click\)=/g, '(clicked)=')}></nf-button>`;
  });

  out = out.replace(/<button([^>]*?)>([\s\S]*?)<\/button>/gi, (match, attrs, inner) => {
    if (attrs.includes('nf-button')) return match;
    const variant = inferButtonVariant(attrs);
    let newAttrs = attrs
      .replace(/\s*mat-stroked-button/gi, '')
      .replace(/\s*mat-flat-button/gi, '')
      .replace(/\s*mat-raised-button/gi, '')
      .replace(/\s*mat-button/gi, '')
      .replace(/\(click\)=/g, '(clicked)=');
    const iconMatch = inner.match(/<mat-icon[^>]*>([^<]+)<\/mat-icon>/i);
    let iconAttr = '';
    let body = inner;
    if (iconMatch) {
      const lucide = MAT_ICON_MAP[iconMatch[1].trim()] ?? iconMatch[1].trim();
      iconAttr = ` icon="${lucide}" iconLibrary="lucide"`;
      body = inner.replace(/<mat-icon[^>]*>[^<]*<\/mat-icon>/gi, '').trim();
    }
    if (!newAttrs.includes('variant=')) {
      newAttrs += ` variant="${variant}"`;
    }
    return `<nf-button${newAttrs}${iconAttr}>${body}</nf-button>`;
  });
  return out;
}

function extractClick(attrs) {
  const m = attrs.match(/\(click\)=["']([^"']+)["']/);
  return m?.[1] ?? null;
}

function transformMatIcons(content) {
  return content.replace(/<mat-icon([^>]*)>([^<]*)<\/mat-icon>/gi, (_, attrs, name) => {
    const lucide = MAT_ICON_MAP[name.trim()] ?? name.trim().replace(/_/g, '-');
    const sizeMatch = attrs.match(/class=["'][^"']*icon-(\w+)/);
    const size = sizeMatch ? ` size="${sizeMatch[1]}"` : '';
    return `<nf-icon name="${lucide}"${size}></nf-icon>`;
  });
}

function transformMatFormFields(content) {
  let out = content;
  // mat-select with mat-form-field wrapper → nf-select
  out = out.replace(
    /<mat-form-field[^>]*>\s*<mat-label>([^<]*)<\/mat-label>\s*<mat-select([^>]*)>([\s\S]*?)<\/mat-select>\s*<\/mat-form-field>/gi,
    (_, label, selectAttrs, options) => {
      const opts = [...options.matchAll(/<mat-option\s+\[value\]="([^"]+)"[^>]*>([^<]*)<\/mat-option>/gi)].map(
        (m) => `{ value: ${m[1]}, label: '${m[2].replace(/'/g, "\\'")}' }`,
      );
      const attrs = selectAttrs.replace(/\[value\]=/g, '[ngModel]=').replace(/\(selectionChange\)=/g, '(ngModelChange)=');
      return `<nf-select label="${label.trim()}" [options]="[${opts.join(', ')}]"${attrs}></nf-select>`;
    },
  );
  // Simple mat-form-field + matInput
  out = out.replace(
    /<mat-form-field[^>]*>\s*(?:<mat-label>([^<]*)<\/mat-label>\s*)?<input([^>]*?)matInput([^>]*)\/?>\s*<\/mat-form-field>/gi,
    (_, label, before, after) => {
      const labelAttr = label ? ` label="${label.trim()}"` : '';
      return `<nf-input${labelAttr}${before}${after}></nf-input>`;
    },
  );
  return out;
}

function removeInlineColorStyles(content) {
  return content.replace(/\sstyle="([^"]*)"/gi, (match, styles) => {
    const cleaned = styles
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((rule) => {
        const prop = rule.split(':')[0]?.trim().toLowerCase();
        return !['color', 'background', 'background-color', 'border-color', 'fill', 'stroke'].includes(prop);
      })
      .join('; ');
    return cleaned ? ` style="${cleaned}"` : '';
  });
}

function fixImports(content, filePath) {
  if (!filePath.endsWith('.ts')) return content;
  let out = content;
  const needsButton = out.includes('<nf-button') || out.includes('nf-button');
  const needsIcon = out.includes('<nf-icon');
  const needsInput = out.includes('<nf-input');
  const needsSelect = out.includes('<nf-select');

  const anatomyImportMatch = out.match(/import\s*\{([^}]+)\}\s*from\s*['"]@lib\/anatomy['"]/);
  const components = new Set();
  if (anatomyImportMatch) {
    anatomyImportMatch[1].split(',').forEach((c) => components.add(c.trim()));
  }

  if (needsButton) components.add('ButtonComponent');
  if (needsIcon) components.add('IconComponent');
  if (needsInput) components.add('NfInputComponent');
  if (needsSelect) components.add('NfSelectComponent');

  const importList = [...components].filter(Boolean).sort().join(', ');
  if (importList && (needsButton || needsIcon || needsInput || needsSelect)) {
    if (anatomyImportMatch) {
      out = out.replace(anatomyImportMatch[0], `import { ${importList} } from '@lib/anatomy'`);
    } else {
      const insertAt = out.indexOf('@Component');
      if (insertAt > 0) {
        out = out.slice(0, insertAt) + `import { ${importList} } from '@lib/anatomy';\n\n` + out.slice(insertAt);
      }
    }
  }

  // Update imports array in @Component
  if (needsButton || needsIcon || needsInput || needsSelect) {
    out = out.replace(/imports:\s*\[([^\]]+)\]/, (m, imports) => {
      const items = new Set(imports.split(',').map((i) => i.trim()).filter(Boolean));
      if (needsButton) items.add('ButtonComponent');
      if (needsIcon) items.add('IconComponent');
      if (needsInput) items.add('NfInputComponent');
      if (needsSelect) items.add('NfSelectComponent');
      // Remove material button/icon if nf replacements present
      if (needsButton) {
        items.delete('MatButtonModule');
      }
      if (needsIcon) {
        items.delete('MatIconModule');
      }
      if (needsInput || needsSelect) {
        items.delete('MatFormFieldModule');
        items.delete('MatInputModule');
        items.delete('MatSelectModule');
      }
      return `imports: [${[...items].join(', ')}]`;
    });
  }

  // Remove unused material imports at top
  if (needsButton && out.includes("import { MatButtonModule }")) {
    out = out.replace(/import \{ MatButtonModule \} from '@angular\/material\/button';\n?/g, '');
  }
  if (needsIcon && out.includes("import { MatIconModule }")) {
    out = out.replace(/import \{ MatIconModule \} from '@angular\/material\/icon';\n?/g, '');
  }
  if ((needsInput || needsSelect) && out.includes('MatFormFieldModule')) {
    out = out.replace(/import \{ MatFormFieldModule \} from '@angular\/material\/form-field';\n?/g, '');
    out = out.replace(/import \{ MatInputModule \} from '@angular\/material\/input';\n?/g, '');
    out = out.replace(/import \{ MatSelectModule \} from '@angular\/material\/select';\n?/g, '');
  }

  return out;
}

function processFile(filePath) {
  const r = rel(filePath);
  if (SKIP_FILES.has(r)) return false;

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = replaceHex(content);
  content = transformMatIcons(content);
  // mat-form-field → nf-input/nf-select: handled manually (dynamic @for options)
  content = transformButtons(content);
  content = removeInlineColorStyles(content);
  content = fixImports(content, filePath);

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

let modified = 0;
const modifiedFiles = [];

for (const scope of SCOPES) {
  const dir = path.join(WEB_ROOT, scope);
  for (const file of walkDir(dir)) {
    if (processFile(file)) {
      modified++;
      modifiedFiles.push(rel(file));
    }
  }
}

console.log(`Modified ${modified} files`);
modifiedFiles.forEach((f) => console.log(`  ${f}`));
