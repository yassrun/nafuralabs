import { Component, computed, effect, inject, input, signal, untracked, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@platform/lib/anatomy/components';
import { ActiviteApiService, type PlanningSupply } from '../../services/activite-api.service';
import { PlanningFacade, toIsoDate } from '../services/planning.facade';
import { supplyAlerts, purchasingStatus } from '../services/planning-supply';

@Component({
  selector:'app-planning-supplies',standalone:true,imports:[CommonModule,FormsModule,RouterLink,ButtonComponent],
  changeDetection:ChangeDetectionStrategy.OnPush,
  template:`
    <section aria-label="Approvisionnements des activités">
      <header><div><h3>Approvisionnements</h3><p>Anticiper les achats depuis les dates des activités.</p></div><nf-button variant="tertiary" [disabled]="loading()" (clicked)="reload()">Actualiser les achats</nf-button></header>
      @if(error()) {<p role="alert">{{ error() }}</p>}
      @else if(loading()) {<p role="status">Chargement du suivi achats…</p>}
      @else {
        <div class="filters"><span>{{ rows().length }} {{ rows().length > 1 ? 'besoins' : 'besoin' }} · {{ alertCount() }} à vérifier</span><label><input type="checkbox" [ngModel]="onlyAlerts()" (ngModelChange)="onlyAlerts.set($event)" /> À vérifier seulement</label></div>
        <div class="table-wrap"><table><thead><tr><th>Besoin / activité</th><th>Lancer avant</th><th>Nécessaire le</th><th>Suivi achats</th></tr></thead><tbody>
          @for(r of visible(); track r.needId) {
            <tr><td><strong>{{ r.label }} · {{ r.quantity }} {{ r.unit }}</strong><br/><button type="button" (click)="facade.openActivite(r.activityId)">{{ r.activityLabel }}</button></td>
              <td>{{ r.launchDate | date:'dd/MM/yyyy' }}</td><td>{{ r.neededDate | date:'dd/MM/yyyy' }}</td>
              <td>@if(r.demandId) {<a [routerLink]="['/achats/demandes',r.demandId]">{{ r.demandNumber }}</a> · {{ status(r.demandStatus) }}}
                @else if(r.sourceUnavailable) {<span>Source à vérifier</span>}
                @else {<nf-button variant="tertiary" (clicked)="facade.openActivite(r.activityId)">Préparer le besoin</nf-button>}
                @for(alert of alerts(r); track alert) {<p class="warning">{{ alert }}</p>}
                @if(r.orders.length) {<details><summary>{{ r.orders.length }} commande(s) · réceptions</summary>
                  @for(o of r.orders; track o.id) {<div class="order"><a [routerLink]="['/achats/commandes',o.id]">{{ o.number }}</a> · {{ status(o.status) }}<p>Livraison prévue : {{ o.expectedDate ? (o.expectedDate | date:'dd/MM/yyyy') : 'Non renseignée' }}</p>
                    @for(receipt of o.receipts; track receipt.id) {<p>{{ receipt.number }} · {{ receipt.date | date:'dd/MM/yyyy' }} · {{ status(receipt.status) }}</p>}
                    @empty {<p>Aucune réception enregistrée.</p>}
                  </div>}
                </details>}
              </td></tr>
          } @empty {<tr><td colspan="4">{{ onlyAlerts() ? 'Aucun besoin à vérifier avec ce filtre.' : 'Aucun besoin matière ou matériel. Ouvrez une activité pour en ajouter.' }}</td></tr>}
        </tbody></table></div>
        <p class="hint">Délais en jours calendaires. Les états viennent des pièces Achats ; une commande livrée ne garantit pas, à elle seule, la couverture de la quantité du besoin. Une date modifiée dans le planning ne modifie pas les pièces déjà créées.</p>
      }
    </section>
  `,
  styles:[`:host{display:block;margin-top:1.5rem}section{border:1px solid var(--nf-color-border);border-radius:.65rem;padding:1rem}header,.filters{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap}h3{margin:0;font-size:1rem}p,.filters{font-size:.8rem}header p{margin:.3rem 0;color:var(--nf-color-text-secondary)}.filters{margin:1rem 0}label{display:flex;align-items:center;gap:.4rem}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:.85rem}th,td{text-align:left;padding:.75rem;vertical-align:top;border-bottom:1px solid var(--nf-color-border)}th:nth-child(2),th:nth-child(3),td:nth-child(2),td:nth-child(3){white-space:nowrap}.warning,[role=alert]{color:#a13a13;margin:.4rem 0}.hint{color:var(--nf-color-text-secondary);margin-bottom:0}summary{cursor:pointer;margin-top:.5rem}.order{padding:.6rem 0}.order p{margin:.3rem 0}td>button{border:0;background:transparent;padding:.35rem 0;color:var(--nf-color-primary);cursor:pointer;text-align:left}`]
})
export class PlanningSuppliesComponent {
  readonly chantierId=input.required<string>();readonly facade=inject(PlanningFacade);private readonly api=inject(ActiviteApiService);
  readonly rows=signal<PlanningSupply[]>([]);readonly loading=signal(false);readonly error=signal('');readonly onlyAlerts=signal(false);
  readonly today=signal(toIsoDate(new Date()));private generation=0;
  readonly status=purchasingStatus;alerts(r:PlanningSupply){return supplyAlerts(r,this.today());}
  readonly alertCount=computed(()=>this.rows().filter(r=>this.alerts(r).length).length);
  readonly visible=computed(()=>this.rows().filter(r=>!this.onlyAlerts() || this.alerts(r).length));
  constructor(){effect(()=>{this.chantierId();this.facade.activites();untracked(()=>void this.reload());});}
  async reload():Promise<void>{
    const id=this.chantierId(),generation=++this.generation;this.rows.set([]);this.error.set('');this.loading.set(true);this.today.set(toIsoDate(new Date()));
    try {const rows=await this.api.planningSupplies(id);if(generation===this.generation)this.rows.set(rows);}
    catch {if(generation===this.generation)this.error.set('Suivi achats indisponible ou accès refusé. Les besoins restent accessibles dans les activités.');}
    finally {if(generation===this.generation)this.loading.set(false);}
  }
}
