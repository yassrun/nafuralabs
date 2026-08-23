import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonComponent, ToastService } from '@platform/lib/anatomy';

import {
  DossierEtudeApiService,
  type ConsultationEtude,
} from '../../services/dossier-etude-api.service';

@Component({
  selector: 'app-consultation-etude-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './consultation-etude-panel.component.html',
  styleUrl: './consultation-etude-panel.component.scss',
})
export class ConsultationEtudePanelComponent {
  private readonly api = inject(DossierEtudeApiService);
  private readonly toast = inject(ToastService);

  readonly dossierId = input.required<string>();
  readonly modifiable = input(true);
  readonly change = output<void>();

  readonly consultation = signal<ConsultationEtude | null>(null);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly saving = signal(false);

  readonly paquetSaisi = signal('');
  readonly partenaireSaisi = signal('');
  readonly devisPartenaireId = signal('');
  readonly devisLignesSaisies = signal('');
  readonly cochees = signal<Record<string, boolean>>({});

  readonly identitesEligibles = computed(() => {
    const c = this.consultation();
    if (!c) return [] as { cle: string; pu: number }[];
    const best = new Map<string, number>();
    for (const devis of c.devis ?? []) {
      for (const ligne of devis.lignes ?? []) {
        if (!ligne.cleStable || ligne.prixUnitaire == null) continue;
        const cle = ligne.cleStable.trim().toLowerCase();
        const prev = best.get(cle);
        if (prev == null || ligne.prixUnitaire < prev) best.set(cle, ligne.prixUnitaire);
      }
    }
    return [...best.entries()].map(([cle, pu]) => ({ cle, pu }));
  });

  readonly couvertes = computed(() => {
    const set = new Set(
      (this.consultation()?.identitesCouvertes ?? []).map((i) => i.cleStable),
    );
    return set;
  });

  constructor() {
    effect(() => {
      const id = this.dossierId();
      if (id) void this.reload();
    });
  }

  async reload(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const data = await this.api.getConsultation(this.dossierId());
      this.consultation.set(data);
      this.paquetSaisi.set((data?.paquetCleStables ?? []).join(', '));
      const next: Record<string, boolean> = {};
      for (const row of data?.identitesCouvertes ?? []) {
        next[row.cleStable] = true;
      }
      this.cochees.set(next);
    } catch (err) {
      this.erreur.set(err instanceof Error ? err.message : 'Consultation indisponible');
    } finally {
      this.chargement.set(false);
    }
  }

  async ouvrir(): Promise<void> {
    await this.run(async () => {
      const cles = this.parseCles(this.paquetSaisi());
      const data = await this.api.openConsultation(this.dossierId(), {
        cleStables: cles.length ? cles : undefined,
      });
      this.consultation.set(data);
      this.toast.success('Consultation ouverte');
      this.change.emit();
    });
  }

  async sauverPaquet(): Promise<void> {
    await this.run(async () => {
      const data = await this.api.replacePaquet(this.dossierId(), this.parseCles(this.paquetSaisi()));
      this.consultation.set(data);
      this.toast.success('Paquet enregistré');
    });
  }

  async inviter(): Promise<void> {
    const partenaireId = this.partenaireSaisi().trim();
    if (!partenaireId) return;
    await this.run(async () => {
      const data = await this.api.inviteFournisseur(this.dossierId(), partenaireId);
      this.consultation.set(data);
      this.partenaireSaisi.set('');
      this.toast.success('Fournisseur invité (pas encore consulté)');
    });
  }

  async recevoirDevis(): Promise<void> {
    const partenaireId = this.devisPartenaireId().trim();
    if (!partenaireId) return;
    await this.run(async () => {
      const lignes = this.parseLignes(this.devisLignesSaisies());
      const data = await this.api.recevoirDevis(this.dossierId(), {
        partenaireId,
        lignes: lignes.length ? lignes : undefined,
      });
      this.consultation.set(data);
      this.devisLignesSaisies.set('');
      this.toast.success('Devis reçu');
      this.change.emit();
    });
  }

  toggleCle(cle: string, checked: boolean): void {
    this.cochees.update((cur) => ({ ...cur, [cle]: checked }));
  }

  async appliquer(): Promise<void> {
    const cles = this.identitesEligibles()
      .filter((row) => this.cochees()[row.cle])
      .map((row) => row.cle);
    await this.run(async () => {
      const data = await this.api.identifierConsultation(this.dossierId(), cles);
      this.consultation.set(data);
      this.toast.success('Prix consulté appliqué aux identités cochées');
      this.change.emit();
    });
  }

  private parseCles(raw: string): string[] {
    return raw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private parseLignes(raw: string): Array<{ cleStable: string; prixUnitaire: number }> {
    const lignes: Array<{ cleStable: string; prixUnitaire: number }> = [];
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [cle, puRaw] = trimmed.split(/[;=]/).map((s) => s.trim());
      const pu = Number(puRaw);
      if (cle && Number.isFinite(pu)) {
        lignes.push({ cleStable: cle, prixUnitaire: pu });
      }
    }
    return lignes;
  }

  private async run(work: () => Promise<void>): Promise<void> {
    this.saving.set(true);
    this.erreur.set(undefined);
    try {
      await work();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action impossible';
      this.erreur.set(message);
      this.toast.error(message);
    } finally {
      this.saving.set(false);
    }
  }
}
