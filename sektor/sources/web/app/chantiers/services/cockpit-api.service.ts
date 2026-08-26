import { Injectable } from '@angular/core';
import { FeatureApiService } from '@platform/lib/anatomy';
import type { CockpitChantier } from './cockpit.model';

@Injectable({ providedIn: 'root' })
export class CockpitApiService extends FeatureApiService<CockpitChantier, never, never> {
  protected override basePath = '/api/v1/chantiers';

  /** Read model cockpit — instantané de lecture, jamais recalculé côté client (AC-10/AC-3). */
  async getCockpit(chantierId: string): Promise<CockpitChantier> {
    return this.get<CockpitChantier>(`${this.basePath}/${chantierId}/cockpit`);
  }
}
