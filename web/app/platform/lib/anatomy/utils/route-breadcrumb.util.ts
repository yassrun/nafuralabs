import { ActivatedRoute } from '@angular/router';

import type { BreadcrumbItem } from '../types';

/**
 * Build breadcrumb items from `data.breadcrumb` on each activated route snapshot
 * (walk `root` → `firstChild` chain). Each segment URL is cumulative for `route`
 * (absolute path, leading `/`), so intermediate crumbs are clickable.
 *
 * `data.breadcrumb` may be a string label or a function `(params) => string`.
 */
export function buildRouteBreadcrumbs(activatedRoute: ActivatedRoute): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  let path = '';
  let route: ActivatedRoute = activatedRoute.root;

  while (true) {
    const nextChild = route.firstChild;
    if (!nextChild) {
      break;
    }
    route = nextChild;

    const snap = route.snapshot;
    const urlParts = snap.url.map((s) => s.path).filter((p) => p.length > 0);
    if (urlParts.length > 0) {
      const segment = urlParts.join('/');
      path = path ? `${path}/${segment}` : segment;
    }

    const raw = snap.data['breadcrumb'];
    if (raw == null || raw === '') {
      continue;
    }

    const label =
      typeof raw === 'function' ? String(raw(snap.params)) : String(raw);

    const href = path.startsWith('/') ? path : `/${path}`;
    items.push({ label, route: href });
  }

  return items;
}
