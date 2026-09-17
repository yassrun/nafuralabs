import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';

import { ButtonComponent } from '../../atoms/button';
import { NfInputComponent } from '../../atoms/input';
import { SpinnerComponent } from '../../atoms/spinner';
import {
  OSM_TILE_SIZE,
  latToTileY,
  lngToTileX,
  tileXToLng,
  tileYToLat,
  wrapTileX,
} from './map-mercator.util';
import type { NfMapLocation } from './map-picker.model';
import { NominatimGeocodeService } from './nominatim-geocode.service';

export interface MapTile {
  key: string;
  x: number;
  y: number;
  z: number;
  left: number;
  top: number;
}

const DEFAULT_LAT = 33.9716;
const DEFAULT_LNG = -6.8498;
const MIN_ZOOM = 4;
const MAX_ZOOM = 18;
/** Keep in sync with `.nf-map-picker__viewport` height. */
const MAP_HEIGHT = 192;
const TILE_TEMPLATES = [
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
];

/**
 * Reusable map picker: OSM tiles + Nominatim geocode.
 * Click / pin → lat/lng + reverse address. Address search → recenter.
 */
@Component({
  selector: 'nf-map-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonComponent, NfInputComponent, SpinnerComponent],
  templateUrl: './map-picker.component.html',
  styleUrl: './map-picker.component.scss',
})
export class MapPickerComponent {
  private readonly geocode = inject(NominatimGeocodeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly lat = input<number | null>(null);
  readonly lng = input<number | null>(null);
  readonly address = input('');
  readonly city = input('');
  readonly disabled = input(false);
  readonly countryCodes = input('ma');
  readonly tileUrlTemplate = input('');

  readonly latChange = output<number | null>();
  readonly lngChange = output<number | null>();
  readonly addressChange = output<string>();
  readonly cityChange = output<string>();
  readonly locationChange = output<NfMapLocation>();

  readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');

  readonly zoom = signal(12);
  readonly centerLat = signal(DEFAULT_LAT);
  readonly centerLng = signal(DEFAULT_LNG);
  readonly width = signal(640);
  readonly height = signal(MAP_HEIGHT);
  readonly geocodeStatus = signal<'idle' | 'loading' | 'error'>('idle');
  readonly mapStatus = signal<'ok' | 'error'>('ok');
  readonly geocodeMessage = signal('');
  readonly draftAddress = signal('');
  readonly tileErrors = signal(0);
  readonly tilesReady = signal(false);
  readonly tileHost = signal(0);

  private geocodeGen = 0;
  private dragging = false;
  private dragMoved = false;
  private dragStart: { x: number; y: number; lat: number; lng: number } | null = null;
  private lastSearch = '';
  private readonly addressQueries = new Subject<string>();

  readonly hasPin = computed(() => this.lat() != null && this.lng() != null);
  readonly empty = computed(
    () => !this.hasPin() && !(this.address() || this.draftAddress()).trim(),
  );
  readonly tiles = computed(() => this.computeTiles());
  readonly pinStyle = computed(() => {
    const lat = this.lat();
    const lng = this.lng();
    if (lat == null || lng == null) return null;
    const z = this.zoom();
    const cx = lngToTileX(this.centerLng(), z);
    const cy = latToTileY(this.centerLat(), z);
    const px = (lngToTileX(lng, z) - cx) * OSM_TILE_SIZE + this.width() / 2;
    const py = (latToTileY(lat, z) - cy) * OSM_TILE_SIZE + this.height() / 2;
    return { left: `${px}px`, top: `${py}px` };
  });

  constructor() {
    effect(() => {
      const lat = this.lat();
      const lng = this.lng();
      untracked(() => {
        if (lat != null && lng != null) {
          this.centerLat.set(lat);
          this.centerLng.set(lng);
        }
      });
    });
    effect(() => {
      const address = this.address();
      untracked(() => {
        if (address && address !== this.draftAddress()) this.draftAddress.set(address);
      });
    });
    this.addressQueries.pipe(debounceTime(800), takeUntilDestroyed(this.destroyRef)).subscribe((q) => {
      void this.searchAddress(q);
    });
    afterNextRender(() => {
      this.measure();
      const el = this.viewport()?.nativeElement;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(el);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  onAddressInput(value: string): void {
    this.draftAddress.set(value);
    this.addressChange.emit(value);
    if (this.disabled()) return;
    const q = value.trim();
    if (q.length < 3) return;
    this.addressQueries.next(q);
  }

  async searchAddress(query?: string): Promise<void> {
    if (this.disabled()) return;
    const q = (query ?? this.draftAddress()).trim();
    if (!q || q === this.lastSearch) return;
    this.lastSearch = q;
    const gen = ++this.geocodeGen;
    this.geocodeStatus.set('loading');
    this.geocodeMessage.set('');
    try {
      const found = await this.geocode.search(q, this.countryCodes());
      if (gen !== this.geocodeGen) return;
      if (!found || found.lat == null || found.lng == null) {
        this.geocodeStatus.set('error');
        this.geocodeMessage.set('Adresse introuvable. Cliquez la carte ou corrigez la saisie.');
        return;
      }
      this.geocodeStatus.set('idle');
      this.centerLat.set(found.lat);
      this.centerLng.set(found.lng);
      this.draftAddress.set(found.address || q);
      this.emitLocation({
        lat: found.lat,
        lng: found.lng,
        address: found.address || q,
        city: found.city,
      });
    } catch {
      if (gen !== this.geocodeGen) return;
      this.geocodeStatus.set('error');
      this.geocodeMessage.set('Géocodage indisponible. Saisissez l’adresse à la main ou réessayez.');
    }
  }

  onMapClick(event: MouseEvent): void {
    if (this.disabled() || this.dragMoved) return;
    const target = this.viewport()?.nativeElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const z = this.zoom();
    const worldX = lngToTileX(this.centerLng(), z) + (x - this.width() / 2) / OSM_TILE_SIZE;
    const worldY = latToTileY(this.centerLat(), z) + (y - this.height() / 2) / OSM_TILE_SIZE;
    void this.pinAt(tileYToLat(worldY, z), tileXToLng(worldX, z));
  }

  onWheel(event: WheelEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    const next = this.zoom() + (event.deltaY > 0 ? -1 : 1);
    this.zoom.set(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)));
  }

  onPointerDown(event: PointerEvent): void {
    if (this.disabled() || event.button !== 0) return;
    this.dragStart = {
      x: event.clientX,
      y: event.clientY,
      lat: this.centerLat(),
      lng: this.centerLng(),
    };
    this.dragging = true;
    this.dragMoved = false;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging || !this.dragStart) return;
    const dx = event.clientX - this.dragStart.x;
    const dy = event.clientY - this.dragStart.y;
    if (!this.dragMoved && Math.hypot(dx, dy) < 4) return;
    this.dragMoved = true;
    const z = this.zoom();
    this.centerLng.set(tileXToLng(lngToTileX(this.dragStart.lng, z) - dx / OSM_TILE_SIZE, z));
    this.centerLat.set(tileYToLat(latToTileY(this.dragStart.lat, z) - dy / OSM_TILE_SIZE, z));
  }

  onPointerUp(): void {
    this.dragging = false;
    this.dragStart = null;
  }

  zoomBy(delta: number): void {
    this.zoom.set(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.zoom() + delta)));
  }

  retryMap(): void {
    this.tileErrors.set(0);
    this.tilesReady.set(false);
    this.mapStatus.set('ok');
    this.tileHost.update((h) => (h + 1) % TILE_TEMPLATES.length);
  }

  retryGeocode(): void {
    this.lastSearch = '';
    this.geocodeStatus.set('idle');
    this.geocodeMessage.set('');
    void this.searchAddress();
  }

  onTileLoad(): void {
    this.tilesReady.set(true);
    this.tileErrors.set(0);
    if (this.mapStatus() === 'error') this.mapStatus.set('ok');
  }

  onTileError(): void {
    const n = this.tileErrors() + 1;
    this.tileErrors.set(n);
    if (n < 4 || this.tilesReady()) return;
    if (this.tileHost() < TILE_TEMPLATES.length - 1) {
      this.tileHost.update((h) => h + 1);
      this.tileErrors.set(0);
      return;
    }
    this.mapStatus.set('error');
  }

  onLatTyped(raw: number | string | null): void {
    const lat = this.parseCoord(raw);
    this.latChange.emit(lat);
    if (lat != null) this.centerLat.set(lat);
  }

  onLngTyped(raw: number | string | null): void {
    const lng = this.parseCoord(raw);
    this.lngChange.emit(lng);
    if (lng != null) this.centerLng.set(lng);
  }

  private parseCoord(raw: number | string | null): number | null {
    if (raw === '' || raw == null) return null;
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private async pinAt(lat: number, lng: number): Promise<void> {
    this.centerLat.set(lat);
    this.centerLng.set(lng);
    const gen = ++this.geocodeGen;
    this.geocodeStatus.set('loading');
    this.geocodeMessage.set('');
    try {
      const found = await this.geocode.reverse(lat, lng);
      if (gen !== this.geocodeGen) return;
      this.geocodeStatus.set('idle');
      const address = found.address || this.draftAddress();
      this.draftAddress.set(address);
      this.lastSearch = address;
      this.emitLocation({ lat, lng, address, city: found.city || this.city() });
    } catch {
      if (gen !== this.geocodeGen) return;
      this.geocodeStatus.set('error');
      this.geocodeMessage.set('Adresse non extraite. Le pin est posé — saisissez l’adresse à la main.');
      this.emitLocation({
        lat,
        lng,
        address: this.draftAddress() || this.address(),
        city: this.city(),
      });
    }
  }

  private emitLocation(value: NfMapLocation): void {
    this.latChange.emit(value.lat);
    this.lngChange.emit(value.lng);
    this.addressChange.emit(value.address);
    if (value.city) this.cityChange.emit(value.city);
    this.locationChange.emit(value);
  }

  private measure(): void {
    const el = this.viewport()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width) this.width.set(rect.width);
    this.height.set(MAP_HEIGHT);
  }

  private computeTiles(): MapTile[] {
    const z = this.zoom();
    const w = this.width();
    const h = this.height();
    const cx = lngToTileX(this.centerLng(), z);
    const cy = latToTileY(this.centerLat(), z);
    const minX = Math.floor(cx - w / 2 / OSM_TILE_SIZE) - 1;
    const maxX = Math.floor(cx + w / 2 / OSM_TILE_SIZE) + 1;
    const minY = Math.floor(cy - h / 2 / OSM_TILE_SIZE) - 1;
    const maxY = Math.floor(cy + h / 2 / OSM_TILE_SIZE) + 1;
    const maxIndex = 2 ** z - 1;
    const tiles: MapTile[] = [];
    for (let y = minY; y <= maxY; y++) {
      if (y < 0 || y > maxIndex) continue;
      for (let x = minX; x <= maxX; x++) {
        const wrapped = wrapTileX(x, z);
        tiles.push({
          key: `${this.tileHost()}/${z}/${wrapped}/${y}`,
          x: wrapped,
          y,
          z,
          left: (x - cx) * OSM_TILE_SIZE + w / 2,
          top: (y - cy) * OSM_TILE_SIZE + h / 2,
        });
      }
    }
    return tiles;
  }

  tileSrc(tile: MapTile): string {
    const template = this.tileUrlTemplate() || TILE_TEMPLATES[this.tileHost()] || TILE_TEMPLATES[0];
    return template
      .replace('{z}', String(tile.z))
      .replace('{x}', String(tile.x))
      .replace('{y}', String(tile.y));
  }

  formatCoord(value: number | null): string {
    return value == null ? '—' : value.toFixed(5);
  }
}
