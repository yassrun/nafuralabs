import { JsonPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { CatalogApiService, PlaceDetail } from '../../core/catalog-api.service';

@Component({
  selector: 'app-catalog-place-review-page',
  standalone: true,
  imports: [
    JsonPipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  templateUrl: './catalog-place-review.page.html',
  styleUrl: './catalog-place-review.page.scss',
})
export class CatalogPlaceReviewPage implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly place = signal<PlaceDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly venueTypeOptions = signal<string[]>([]);
  readonly settingOptions = signal<string[]>([]);
  readonly offerOptions = signal<string[]>([]);
  readonly experienceOptions = signal<string[]>([]);
  readonly suitableForOptions = signal<string[]>([]);
  readonly districtOptions = signal<Array<{ code: string; label: string }>>([]);
  private venueTypesByCategory: Record<string, string[]> = {};
  private allVenueTypes: string[] = [];

  readonly taxonomyForm = this.fb.nonNullable.group({
    venueTypes: [[] as string[]],
    settings: [[] as string[]],
    offers: [[] as string[]],
    experiences: [[] as string[]],
    suitableFor: [[] as string[]],
    verdict: [''],
  });

  readonly districtForm = this.fb.nonNullable.group({
    districtCode: [''],
  });

  private readonly weekdayLabels: Record<string, string> = {
    '0': 'Dimanche',
    '1': 'Lundi',
    '2': 'Mardi',
    '3': 'Mercredi',
    '4': 'Jeudi',
    '5': 'Vendredi',
    '6': 'Samedi',
    SUNDAY: 'Dimanche',
    MONDAY: 'Lundi',
    TUESDAY: 'Mardi',
    WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi',
    FRIDAY: 'Vendredi',
    SATURDAY: 'Samedi',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('placeId');
    if (!id) {
      this.error.set('placeId manquant');
      this.loading.set(false);
      return;
    }
    this.api.getTaxonomyMeta().subscribe({
      next: (meta) => {
        this.allVenueTypes = meta.venueTypes ?? [];
        this.venueTypesByCategory = meta.venueTypesByCategory ?? {};
        this.settingOptions.set(meta.settings ?? []);
        this.offerOptions.set(meta.offers ?? []);
        this.experienceOptions.set(meta.experiences ?? []);
        this.suitableForOptions.set(meta.suitableFor ?? []);
        this.applyVenueTypeOptionsForPlace(this.place());
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
        this.allVenueTypes = [
          ...this.venueTypesByCategory['SOCIAL_VENUE'],
          ...this.venueTypesByCategory['BEAUTY'],
          'UNKNOWN',
        ];
        this.settingOptions.set([
          'INDOOR',
          'OUTDOOR',
          'TERRACE',
          'ROOFTOP',
          'GARDEN',
          'COURTYARD',
          'POOL_SIDE',
          'BEACHFRONT',
          'WATERFRONT',
          'SEA_VIEW',
          'PANORAMIC_VIEW',
          'HOTEL_INSIDE',
          'MALL_INSIDE',
        ]);
        this.offerOptions.set([
          'FOOD',
          'COFFEE_TEA',
          'BREAKFAST',
          'BRUNCH',
          'PASTRY_DESSERT',
          'ALCOHOL',
          'SHISHA',
        ]);
        this.experienceOptions.set([
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
        this.suitableForOptions.set([
          'WORK_STUDY',
          'BUSINESS_MEETING',
          'DATE',
          'FAMILY',
          'FRIENDS_GROUP',
          'CELEBRATION',
          'NETWORKING',
          'PRIVATE_EVENT',
        ]);
        this.applyVenueTypeOptionsForPlace(this.place());
      },
    });
    this.api.listGeoDistricts('casablanca').subscribe({
      next: (res) => this.districtOptions.set(res.districts ?? []),
      error: () => this.districtOptions.set([]),
    });
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPlace(id).subscribe({
      next: (place) => {
        this.place.set(place);
        this.applyVenueTypeOptionsForPlace(place);
        this.patchTaxonomyForm(place);
        this.patchDistrictForm(place);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.status === 404 ? 'Lieu introuvable' : err?.message ?? 'Erreur');
        this.loading.set(false);
      },
    });
  }

  private applyVenueTypeOptionsForPlace(place: PlaceDetail | null): void {
    const category = place?.primaryCategory;
    if (category && this.venueTypesByCategory[category]?.length) {
      this.venueTypeOptions.set(this.venueTypesByCategory[category]);
      return;
    }
    this.venueTypeOptions.set(this.allVenueTypes.length ? this.allVenueTypes : []);
  }

  enrichment(): Record<string, unknown> | null {
    return this.place()?.enrichment ?? null;
  }

  manualOverride(): boolean {
    return !!this.enrichment()?.['manualOverride'];
  }

  districtMethod(): string {
    return String(this.enrichment()?.['geoMethod'] ?? '');
  }

  saveDistrict(): void {
    const p = this.place();
    if (!p) {
      return;
    }
    const code = this.districtForm.controls.districtCode.value;
    if (!code) {
      this.snack.open('Choisir un quartier', 'OK', { duration: 2500 });
      return;
    }
    this.busy.set(true);
    this.api.patchDistrict(p.id, code).subscribe({
      next: (updated) => {
        this.place.set(updated);
        this.patchDistrictForm(updated);
        this.busy.set(false);
        this.snack.open('Quartier enregistré (manuel)', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.busy.set(false);
        this.snack.open(err?.error?.message ?? err?.message ?? 'Échec quartier', 'OK', {
          duration: 4000,
        });
      },
    });
  }

  weekdayLabel(day: unknown): string {
    const key = String(day ?? '').toUpperCase();
    return this.weekdayLabels[key] ?? this.weekdayLabels[String(day)] ?? String(day ?? '—');
  }

  hourRanges(day: Record<string, unknown>): string {
    const ranges = day['ranges'];
    if (!Array.isArray(ranges) || !ranges.length) {
      return 'Fermé / non renseigné';
    }
    return ranges
      .map((r) => {
        const row = r as Record<string, unknown>;
        const from = row['from'] ?? '?';
        const to = row['to'] ?? '?';
        return `${from} → ${to}`;
      })
      .join(', ');
  }

  toggleVenueType(type: string): void {
    const current = [...this.taxonomyForm.controls.venueTypes.value];
    const idx = current.indexOf(type);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(type);
    }
    this.taxonomyForm.controls.venueTypes.setValue(current);
  }

  isVenueTypeSelected(type: string): boolean {
    return this.taxonomyForm.controls.venueTypes.value.includes(type);
  }

  isPrimaryVenueType(type: string): boolean {
    return this.taxonomyForm.controls.venueTypes.value[0] === type;
  }

  setPrimaryVenueType(type: string): void {
    const current = [...this.taxonomyForm.controls.venueTypes.value];
    const idx = current.indexOf(type);
    if (idx < 0) {
      current.unshift(type);
    } else if (idx > 0) {
      current.splice(idx, 1);
      current.unshift(type);
    }
    this.taxonomyForm.controls.venueTypes.setValue(current);
  }

  toggleFacet(
    control: 'settings' | 'offers' | 'experiences' | 'suitableFor',
    value: string
  ): void {
    const current = [...this.taxonomyForm.controls[control].value];
    const idx = current.indexOf(value);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }
    this.taxonomyForm.controls[control].setValue(current);
  }

  isFacetSelected(
    control: 'settings' | 'offers' | 'experiences' | 'suitableFor',
    value: string
  ): boolean {
    return this.taxonomyForm.controls[control].value.includes(value);
  }

  saveTaxonomy(): void {
    const p = this.place();
    if (!p) {
      return;
    }
    const value = this.taxonomyForm.getRawValue();
    const offers = [...value.offers];
    const venueTypes = value.venueTypes.length ? [...value.venueTypes] : ['UNKNOWN'];
    const servesAlcohol = offers.includes('ALCOHOL') ? true : null;

    this.busy.set(true);
    this.api
      .patchEnrichment(p.id, {
        venueTypes,
        settings: [...value.settings],
        offers,
        experiences: [...value.experiences],
        suitableFor: [...value.suitableFor],
        servesAlcohol,
        verdict: value.verdict || null,
      })
      .subscribe({
        next: (updated) => {
          this.place.set(updated);
          this.patchTaxonomyForm(updated);
          this.busy.set(false);
          this.snack.open('Taxonomie enregistrée (override manuel)', 'OK', { duration: 3000 });
        },
        error: (err) => {
          this.busy.set(false);
          this.snack.open(err?.error?.message ?? err?.message ?? 'Échec sauvegarde', 'OK', {
            duration: 4000,
          });
        },
      });
  }

  approve(): void {
    this.act('approve');
  }

  reject(): void {
    this.act('reject');
  }

  archive(): void {
    this.act('archive');
  }

  reenrich(step?: string): void {
    const p = this.place();
    if (!p) {
      return;
    }
    if (step === 'AI_CLASSIFY' && this.manualOverride()) {
      if (
        !confirm(
          'Relancer l’IA va écraser la taxonomie manuelle (alcool, type, activités). Continuer ?'
        )
      ) {
        return;
      }
    }
    this.busy.set(true);
    this.api
      .startEnrichment(
        {
          catalogPlaceIds: [p.id],
          options: step ? { resumeFromStep: step } : {},
        },
        crypto.randomUUID()
      )
      .subscribe({
        next: (res) => {
          this.busy.set(false);
          this.snack.open(`Étape relancée (${res.status})`, 'OK', { duration: 3500 });
          this.load(p.id);
        },
        error: (err) => {
          this.busy.set(false);
          this.snack.open(err?.message ?? 'Relance échouée', 'OK', { duration: 4000 });
        },
      });
  }

  setPrimary(mediaId: string): void {
    const p = this.place();
    if (!p) {
      return;
    }
    this.busy.set(true);
    this.api.setPrimaryMedia(p.id, mediaId).subscribe({
      next: (updated) => {
        this.place.set(updated);
        this.patchTaxonomyForm(updated);
        this.busy.set(false);
        this.snack.open('Photo de couverture mise à jour', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.busy.set(false);
        this.snack.open(err?.error?.message ?? err?.message ?? 'Échec couverture', 'OK', {
          duration: 4000,
        });
      },
    });
  }

  remove(): void {
    const p = this.place();
    if (!p) {
      return;
    }
    if (!confirm(`Supprimer définitivement « ${p.canonicalName} » ?`)) {
      return;
    }
    this.busy.set(true);
    this.api.delete(p.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.snack.open('Lieu supprimé', 'OK', { duration: 3000 });
        void this.router.navigateByUrl('/catalog/search');
      },
      error: (err) => {
        this.busy.set(false);
        this.snack.open(err?.message ?? 'Suppression échouée', 'OK', { duration: 4000 });
      },
    });
  }

  private patchTaxonomyForm(place: PlaceDetail): void {
    const enrichment = place.enrichment ?? {};
    const asStringArray = (key: string): string[] =>
      Array.isArray(enrichment[key]) ? (enrichment[key] as string[]).filter(Boolean) : [];

    let venueTypes = asStringArray('venueTypes');
    if (!venueTypes.length && enrichment['venueType']) {
      venueTypes = [String(enrichment['venueType'])];
    }
    let offers = asStringArray('offers');
    let experiences = asStringArray('experiences');
    if (!offers.length && !experiences.length) {
      const legacy = asStringArray('activities');
      for (const a of legacy) {
        if (['FOOD', 'COFFEE_TEA', 'BREAKFAST', 'BRUNCH', 'PASTRY_DESSERT', 'ALCOHOL', 'SHISHA'].includes(a)) {
          offers.push(a);
        } else if (a === 'DINE') {
          offers.push('FOOD');
        } else if (a === 'DRINK_ALCOHOL') {
          offers.push('ALCOHOL');
        } else if (
          [
            'DANCE',
            'LIVE_MUSIC',
            'DJ',
            'WATCH_SHOW',
            'WATCH_SPORTS',
            'WORKSHOP',
            'KARAOKE',
            'GAMES',
            'POOL_ACCESS',
          ].includes(a)
        ) {
          experiences.push(a);
        }
      }
    }
    let settings = asStringArray('settings');
    // Empty settings → INDOOR by default. After operator unchecks and saves [],
    // we still get [] from API; treat missing/null the same. Persisted [] stays [].
    // V10 backfills existing [] to ["INDOOR"]; subsequent explicit clears remain [].
    if (!settings.length) {
      const raw = enrichment['settings'];
      const explicitlyEmpty =
        Array.isArray(raw) && raw.length === 0 && !!this.enrichment()?.['manualOverride'];
      if (!explicitlyEmpty) {
        settings = ['INDOOR'];
      }
    }
    const suitableFor = asStringArray('suitableFor').length
      ? asStringArray('suitableFor')
      : asStringArray('audienceTags');

    this.taxonomyForm.reset({
      venueTypes: [...venueTypes],
      settings: [...settings],
      offers: [...offers],
      experiences: [...experiences],
      suitableFor: [...suitableFor],
      verdict: String(enrichment['verdict'] ?? ''),
    });
  }

  private patchDistrictForm(place: PlaceDetail): void {
    const enrichment = place.enrichment ?? {};
    const code = String(enrichment['districtCode'] ?? place.districtCode ?? '');
    this.districtForm.reset({ districtCode: code });
  }

  private act(action: 'approve' | 'reject' | 'archive'): void {
    const p = this.place();
    if (!p) {
      return;
    }
    this.busy.set(true);
    const call =
      action === 'approve'
        ? this.api.approve(p.id)
        : action === 'reject'
          ? this.api.reject(p.id)
          : this.api.archive(p.id);
    call.subscribe({
      next: (updated) => {
        this.place.set(updated);
        this.busy.set(false);
        this.snack.open(`Statut → ${updated.status}`, 'OK', { duration: 3000 });
        if (action === 'archive') {
          void this.router.navigateByUrl('/catalog/search');
        }
      },
      error: (err) => {
        this.busy.set(false);
        this.snack.open(err?.message ?? 'Action échouée', 'OK', { duration: 4000 });
      },
    });
  }
}
