import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SelectionModel } from '@angular/cdk/collections';
import { interval, switchMap, startWith, of, catchError } from 'rxjs';
import { CatalogApiService, JobDetail, PlaceSummary } from '../../core/catalog-api.service';
import {
  CatalogSearchStateService,
  PlaceListScope,
} from '../../core/catalog-search-state.service';
import { JobDetailDialog } from './job-detail.dialog';

export type { PlaceListScope };

@Component({
  selector: 'app-catalog-search-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
  ],
  templateUrl: './catalog-search.page.html',
  styleUrl: './catalog-search.page.scss',
})
export class CatalogSearchPage implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly listState = inject(CatalogSearchStateService);

  readonly places = signal<PlaceSummary[]>([]);
  readonly jobs = signal<JobDetail[]>([]);
  readonly loadingPlaces = signal(false);
  readonly loadingJobs = signal(false);
  readonly cleaningNames = signal(false);
  readonly error = signal<string | null>(null);
  readonly importOpen = signal(false);
  readonly scope = signal<PlaceListScope>('pending');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly total = signal(0);
  readonly sort = signal('updatedAt,desc');
  readonly selection = new SelectionModel<string>(true, []);
  readonly districts = signal<Array<{ code: string; label: string }>>([]);
  readonly venueTypeOptions = signal<string[]>([]);
  readonly activityOptions = signal<string[]>([]);
  private venueTypesByCategory: Record<string, string[]> = {};
  private allVenueTypes: string[] = [];
  readonly displayedColumns = [
    'select',
    'photo',
    'name',
    'status',
    'city',
    'category',
    'district',
    'venueType',
    'aiDecision',
    'score',
    'updated',
  ];

  readonly sortActive = () => this.sort().split(',')[0] || 'updatedAt';
  readonly sortDirection = (): 'asc' | 'desc' =>
    (this.sort().split(',')[1] as 'asc' | 'desc') || 'desc';

  private lastKnownJobStatuses = new Map<string, string>();
  /** Guards against out-of-order list responses (sort/filter/page races). */
  private placesRequestSeq = 0;

  readonly filterForm = this.fb.nonNullable.group({
    q: [''],
    cityCode: ['CASABLANCA'],
    category: [''],
    districtCode: [''],
    venueTypes: [[] as string[]],
    activities: [[] as string[]],
    aiDecision: [''],
    enrichmentStatus: [''],
    minScore: [''],
  });

  readonly importForm = this.fb.nonNullable.group({
    mode: ['NEARBY' as 'TEXT' | 'NEARBY'],
    q: [''],
    lat: [33.586, Validators.required],
    lng: [-7.632, Validators.required],
    radiusMeters: [1500, [Validators.required, Validators.min(50)]],
    countryCode: ['MA'],
    cityCode: ['CASABLANCA'],
    primaryCategoryHint: ['SOCIAL_VENUE'],
    maxResults: [20],
  });

  get totalPages(): number {
    const size = this.pageSize();
    const total = this.total();
    return size > 0 ? Math.max(1, Math.ceil(total / size)) : 1;
  }

  get rangeFrom(): number {
    if (this.total() === 0) {
      return 0;
    }
    return this.pageIndex() * this.pageSize() + 1;
  }

  get rangeTo(): number {
    return Math.min((this.pageIndex() + 1) * this.pageSize(), this.total());
  }

  ngOnInit(): void {
    this.restoreListState();
    this.reloadPlaces();
    this.startJobsPolling();
    this.api.listGeoDistricts('casablanca').subscribe({
      next: (res) => this.districts.set(res.districts ?? []),
      error: () => this.districts.set([]),
    });
    this.api.getTaxonomyMeta().subscribe({
      next: (meta) => {
        this.allVenueTypes = meta.venueTypes ?? [];
        this.venueTypesByCategory = meta.venueTypesByCategory ?? {};
        this.activityOptions.set(meta.activities?.length ? meta.activities : [...(meta.offers ?? []), ...(meta.experiences ?? [])]);
        this.refreshVenueTypeOptions(this.filterForm.controls.category.value);
      },
      error: () => {
        this.venueTypesByCategory = {
          SOCIAL_VENUE: [
            'CAFE',
            'TEA_HOUSE',
            'RESTAURANT',
            'BAR',
            'PUB',
            'LOUNGE',
            'SHISHA_LOUNGE',
            'NIGHTCLUB',
            'CABARET',
            'LIVE_MUSIC_VENUE',
            'BEACH_CLUB',
            'EVENT_VENUE',
            'HOTEL_VENUE',
          ],
          BEAUTY: ['SALON', 'BARBERSHOP', 'SPA'],
        };
        this.allVenueTypes = [...this.venueTypesByCategory['SOCIAL_VENUE'], ...this.venueTypesByCategory['BEAUTY'], 'UNKNOWN'];
        this.activityOptions.set([
          'FOOD',
          'COFFEE_TEA',
          'BREAKFAST',
          'BRUNCH',
          'PASTRY_DESSERT',
          'ALCOHOL',
          'SHISHA',
          'DANCE',
          'LIVE_MUSIC',
          'DJ',
          'WATCH_SHOW',
          'WATCH_SPORTS',
          'WORKSHOP',
          'KARAOKE',
          'GAMES',
          'POOL_ACCESS',
        ]);
        this.refreshVenueTypeOptions(this.filterForm.controls.category.value);
      },
    });

    this.filterForm.controls.category.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((category) => {
        this.refreshVenueTypeOptions(category);
        const allowed = new Set(this.venueTypeOptions());
        const selected = this.filterForm.controls.venueTypes.value.filter((t) => allowed.has(t));
        this.filterForm.controls.venueTypes.setValue(selected);
      });
  }

  private restoreListState(): void {
    const snap = this.listState.restore();
    if (!snap) {
      return;
    }
    this.scope.set(snap.scope);
    this.pageIndex.set(snap.pageIndex);
    this.pageSize.set(snap.pageSize);
    this.sort.set(snap.sort);
    this.filterForm.patchValue(snap.filters, { emitEvent: false });
  }

  private persistListState(): void {
    const f = this.filterForm.getRawValue();
    this.listState.save({
      scope: this.scope(),
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      sort: this.sort(),
      filters: {
        q: f.q,
        cityCode: f.cityCode,
        category: f.category,
        districtCode: f.districtCode,
        venueTypes: [...f.venueTypes],
        activities: [...f.activities],
        aiDecision: f.aiDecision,
        enrichmentStatus: f.enrichmentStatus,
        minScore: f.minScore,
      },
    });
  }

  private refreshVenueTypeOptions(category: string | null | undefined): void {
    if (category && this.venueTypesByCategory[category]?.length) {
      this.venueTypeOptions.set(this.venueTypesByCategory[category]);
      return;
    }
    this.venueTypeOptions.set(this.allVenueTypes.length ? this.allVenueTypes : []);
  }

  setScope(scope: PlaceListScope): void {
    this.scope.set(scope);
    this.pageIndex.set(0);
    this.reloadPlaces();
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.reloadPlaces();
  }

  onSortChange(sort: Sort): void {
    if (!sort.active || !sort.direction) {
      this.sort.set('updatedAt,desc');
    } else {
      this.sort.set(`${sort.active},${sort.direction}`);
    }
    this.pageIndex.set(0);
    this.reloadPlaces();
  }

  goToPage(page: number): void {
    const max = this.totalPages - 1;
    const next = Math.min(Math.max(0, page), max);
    if (next === this.pageIndex()) {
      return;
    }
    this.pageIndex.set(next);
    this.reloadPlaces();
  }

  reloadPlaces(): void {
    const requestId = ++this.placesRequestSeq;
    this.persistListState();
    this.loadingPlaces.set(true);
    this.error.set(null);
    const f = this.filterForm.getRawValue();
    const scope = this.scope();

    let status: string | undefined;
    if (scope === 'approved') {
      status = 'REVIEWED';
    } else if (scope === 'pending') {
      status = 'ENRICHED';
    }

    const minScore = f.minScore ? Number(f.minScore) : undefined;

    this.api
      .listPlaces({
        q: f.q || undefined,
        cityCode: f.cityCode || undefined,
        primaryCategory: f.category || undefined,
        status,
        districtCode: f.districtCode || undefined,
        venueTypes: f.venueTypes?.length ? f.venueTypes : undefined,
        activities: f.activities?.length ? f.activities : undefined,
        aiDecision: f.aiDecision || undefined,
        enrichmentStatus: f.enrichmentStatus || undefined,
        minScore: Number.isFinite(minScore) ? minScore : undefined,
        scoreAppId: minScore != null ? 'LAYALI' : undefined,
        sort: this.sort(),
        page: this.pageIndex(),
        size: this.pageSize(),
      })
      .subscribe({
        next: (res) => {
          if (requestId !== this.placesRequestSeq) {
            return;
          }
          this.places.set(res.items ?? []);
          this.total.set(res.page?.total ?? res.items?.length ?? 0);
          this.selection.clear();
          this.loadingPlaces.set(false);
        },
        error: (err) => {
          if (requestId !== this.placesRequestSeq) {
            return;
          }
          this.error.set(err?.message ?? 'Échec chargement lieux');
          this.loadingPlaces.set(false);
        },
      });
  }

  districtOf(row: PlaceSummary): string {
    if (row.districtLabel) {
      return row.districtLabel;
    }
    if (row.districtCode) {
      return row.districtCode;
    }
    const address = row.address ?? {};
    const district = address['district'] ?? address['cityLabel'] ?? '';
    return typeof district === 'string' ? district : '';
  }

  formatVenueTypes(row: PlaceSummary): string {
    if (row.venueTypes?.length) {
      return row.venueTypes.join(' · ');
    }
    return row.venueType || '—';
  }

  startImport(): void {
    const v = this.importForm.getRawValue();
    if (v.mode === 'TEXT' && !v.q.trim()) {
      this.snack.open('Saisir une requête texte', 'OK', { duration: 3000 });
      return;
    }
    if (v.mode === 'NEARBY' && (v.lat == null || v.lng == null)) {
      this.snack.open('lat/lng requis pour NEARBY', 'OK', { duration: 3000 });
      return;
    }

    const body =
      v.mode === 'TEXT'
        ? {
            mode: 'TEXT',
            query: {
              q: v.q.trim(),
              countryCode: v.countryCode,
              cityCode: v.cityCode,
              primaryCategoryHint: v.primaryCategoryHint,
            },
            options: { maxResults: v.maxResults, refreshExisting: false, refreshMedia: true },
          }
        : {
            mode: 'NEARBY',
            query: {
              lat: v.lat,
              lng: v.lng,
              radiusMeters: v.radiusMeters,
              countryCode: v.countryCode,
              cityCode: v.cityCode,
              primaryCategoryHint: v.primaryCategoryHint,
            },
            options: { maxResults: v.maxResults, refreshExisting: false, refreshMedia: true },
          };

    const key = crypto.randomUUID();
    this.api.startSearch(body, key).subscribe({
      next: (res) => {
        this.snack.open(`Import lancé (${res.status})`, 'OK', { duration: 4000 });
        this.importOpen.set(false);
        this.reloadJobsOnce();
      },
      error: (err) => {
        this.snack.open(err?.error?.message ?? err?.message ?? 'Import échoué', 'OK', {
          duration: 5000,
        });
      },
    });
  }

  startCasaEnrichment(): void {
    const key = crypto.randomUUID();
    this.api
      .startEnrichment(
        {
          query: { cityCode: 'CASABLANCA' },
          options: { shadowMode: true },
        },
        key
      )
      .subscribe({
        next: (res) => {
          this.snack.open(`Enrichissement Casa lancé (${res.status})`, 'OK', { duration: 4000 });
          this.reloadJobsOnce();
        },
        error: (err) => {
          this.snack.open(err?.error?.message ?? err?.message ?? 'Enrichissement échoué', 'OK', {
            duration: 5000,
          });
        },
      });
  }

  enrichSelected(): void {
    const ids = this.selection.selected;
    if (!ids.length) {
      return;
    }
    const key = crypto.randomUUID();
    this.api.startEnrichment({ catalogPlaceIds: ids }, key).subscribe({
      next: (res) => {
        this.snack.open(`Enrichissement ${ids.length} lieu(x) (${res.status})`, 'OK', {
          duration: 4000,
        });
        this.reloadJobsOnce();
      },
      error: (err) => {
        this.snack.open(err?.error?.message ?? err?.message ?? 'Enrichissement échoué', 'OK', {
          duration: 5000,
        });
      },
    });
  }

  normalizeNames(): void {
    const f = this.filterForm.getRawValue();
    const body = {
      dryRun: true,
      cityCode: f.cityCode || undefined,
      primaryCategory: f.category || undefined,
    };
    this.cleaningNames.set(true);
    this.api.normalizeNames(body).subscribe({
      next: (preview) => {
        const scopeHint = [f.cityCode, f.category].filter(Boolean).join(' / ') || 'tous';
        const msg =
          `Dry-run (${scopeHint}) : ${preview.updated} à modifier / ${preview.scanned} scannés` +
          (preview.skippedNoDistrict ? ` · ${preview.skippedNoDistrict} sans quartier` : '');
        if (!preview.updated) {
          this.cleaningNames.set(false);
          this.snack.open(msg + ' — rien à faire', 'OK', { duration: 5000 });
          return;
        }
        const samples = (preview.samples ?? [])
          .slice(0, 5)
          .map((s) => `• ${s.before} → ${s.after}`)
          .join('\n');
        const ok = confirm(`${msg}\n\nExemples :\n${samples}\n\nAppliquer maintenant ?`);
        if (!ok) {
          this.cleaningNames.set(false);
          return;
        }
        this.api.normalizeNames({ ...body, dryRun: false }).subscribe({
          next: (applied) => {
            this.cleaningNames.set(false);
            this.snack.open(
              `Noms nettoyés : ${applied.updated} modifié(s) / ${applied.scanned}`,
              'OK',
              { duration: 5000 }
            );
            this.reloadPlaces();
          },
          error: (err) => {
            this.cleaningNames.set(false);
            this.snack.open(err?.error?.message ?? err?.message ?? 'Nettoyage échoué', 'OK', {
              duration: 5000,
            });
          },
        });
      },
      error: (err) => {
        this.cleaningNames.set(false);
        this.snack.open(err?.error?.message ?? err?.message ?? 'Dry-run échoué', 'OK', {
          duration: 5000,
        });
      },
    });
  }

  openPlace(row: PlaceSummary): void {
    void this.router.navigate(['/catalog/places', row.id]);
  }

  openJob(job: JobDetail): void {
    this.api.getJob(job.id).subscribe({
      next: (detail) => this.dialog.open(JobDetailDialog, { data: detail, width: '640px' }),
      error: () => this.dialog.open(JobDetailDialog, { data: job, width: '640px' }),
    });
  }

  toggleAll(checked: boolean): void {
    if (!checked) {
      this.selection.clear();
      return;
    }
    this.places().forEach((p) => this.selection.select(p.id));
  }

  bulkApprove(): void {
    const ids = this.selection.selected;
    if (!ids.length) {
      return;
    }
    this.api.bulkApprove(ids).subscribe({
      next: () => {
        this.snack.open(`${ids.length} lieu(x) approuvé(s)`, 'OK', { duration: 3000 });
        this.reloadPlaces();
      },
      error: (err) => {
        this.snack.open(err?.message ?? 'Bulk approve échoué', 'OK', { duration: 4000 });
      },
    });
  }

  progressLabel(job: JobDetail): string {
    const p = job.progress;
    if (!p) {
      return job.status;
    }
    const current = p['current'] ?? '?';
    const total = p['total'] ?? '?';
    const step = p['stepLabel'] ?? '';
    return `${job.status} ${current}/${total} ${step}`.trim();
  }

  private startJobsPolling(): void {
    this.loadingJobs.set(true);
    interval(3000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.api.listJobs(0, 15).pipe(catchError(() => of({ items: this.jobs() })))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const items = res.items ?? [];
        this.jobs.set(items);
        this.loadingJobs.set(false);

        let shouldRefreshPlaces = false;
        for (const job of items) {
          const prev = this.lastKnownJobStatuses.get(job.id);
          this.lastKnownJobStatuses.set(job.id, job.status);
          if (
            prev &&
            prev !== job.status &&
            (job.status === 'SUCCEEDED' || job.status === 'PARTIAL')
          ) {
            shouldRefreshPlaces = true;
          }
        }
        if (shouldRefreshPlaces) {
          this.reloadPlaces();
        }
      });
  }

  private reloadJobsOnce(): void {
    this.api.listJobs(0, 15).subscribe({
      next: (res) => this.jobs.set(res.items ?? []),
    });
  }
}
