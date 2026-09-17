import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import type { NfMapLocation, NominatimResult } from './map-picker.model';
import { locationFromNominatim } from './nominatim-city.util';

const NOMINATIM = 'https://nominatim.openstreetmap.org';

/**
 * Forward / reverse geocoding via OSM Nominatim. No API key.
 * Callers must debounce: Nominatim asks for at most one request per second.
 */
@Injectable({ providedIn: 'root' })
export class NominatimGeocodeService {
  private readonly http = inject(HttpClient);

  async reverse(lat: number, lng: number): Promise<NfMapLocation> {
    const params = this.baseParams()
      .set('lat', String(lat))
      .set('lon', String(lng));
    const hit = await firstValueFrom(
      this.http.get<NominatimResult>(`${NOMINATIM}/reverse`, { params }),
    );
    return (
      locationFromNominatim(hit) ?? {
        lat,
        lng,
        address: '',
        city: '',
      }
    );
  }

  async search(query: string, countryCodes = 'ma'): Promise<NfMapLocation | null> {
    const q = query.trim();
    if (!q) return null;
    let params = this.baseParams().set('q', q).set('limit', '1');
    if (countryCodes) params = params.set('countrycodes', countryCodes);
    const hits = await firstValueFrom(
      this.http.get<NominatimResult[]>(`${NOMINATIM}/search`, { params }),
    );
    const first = hits?.[0];
    return first ? locationFromNominatim(first) : null;
  }

  private baseParams(): HttpParams {
    return new HttpParams()
      .set('format', 'jsonv2')
      .set('addressdetails', '1')
      .set('accept-language', 'fr');
  }
}
