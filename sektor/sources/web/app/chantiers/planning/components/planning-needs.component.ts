import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@platform/lib/anatomy/components';
import { ActiviteApiService, type PlanningNeed } from '../../services/activite-api.service';
import { PlanningFacade } from '../services/planning.facade';

@Component({
  selector:'app-planning-needs',standalone:true,imports:[CommonModule,FormsModule,RouterLink,ButtonComponent],
  template:`
    @if(activity(); as a) {
      <p>Dates calculées depuis le début enregistré de l’activité. Les délais sont exprimés en jours calendaires. Un besoin prévu ne confirme pas sa disponibilité.</p>
      @if(a.planningRemainder; as remainder) {
        <p>Reprise prévue le {{ remainder.resumeStart | date:'dd/MM/yyyy' }}. Les besoins conservent leurs quantités et dates initiales : vérifiez ce qui reste à fournir et ajustez les échéances dans Achats avant toute soumission.</p>
      }
      @if(error()) {<p role="alert">{{ error() }}</p>}
      @for(n of a.planningNeeds ?? []; track n.id) {
        <article>
          <strong>{{ n.label }} · {{ n.quantity }} {{ n.unit }}</strong>
          <p>{{ typeLabel(n.type) }} · Nécessaire le {{ needDate(n.daysBeforeStart) | date:'dd/MM/yyyy' }} · À lancer au plus tard le {{ needDate(n.daysBeforeStart+n.leadDays) | date:'dd/MM/yyyy' }}</p>
          @if(n.demandeId) {
            <a [routerLink]="['/achats/demandes',n.demandeId]">Ouvrir {{ n.demandeNumero }}</a><p>Consultez la demande pour son statut. La livraison n’est pas confirmée par ce lien.</p>
            @if(n.requestedDate !== needDate(n.daysBeforeStart)) {<p role="alert">La date du besoin a changé depuis la préparation de la demande. Vérifiez son échéance dans Achats.</p>}
          } @else if(facade.capacites().editerStructure) {
            @if(n.type==='MATIERE' || n.type==='MATERIEL') {<nf-button variant="secondary" [disabled]="busy()" (clicked)="purchase(n.id)">Préparer une demande d’achat</nf-button>}
            <nf-button variant="tertiary" [disabled]="busy()" (clicked)="remove(n.id)">Retirer le besoin</nf-button>
          }
        </article>
      } @empty {<p>Aucun besoin renseigné.</p>}
      @if(facade.capacites().editerStructure) {
        <details><summary>Ajouter un besoin</summary><div class="fields">
          <label>Type <select [(ngModel)]="type" [ngModelOptions]="{standalone:true}"><option value="PERSONNEL">Équipe interne</option><option value="MATIERE">Matériaux / consommables</option><option value="MATERIEL">Engins / outillage</option><option value="SOUS_TRAITANCE">Sous-traitance</option></select></label>
          <label>Besoin <input [(ngModel)]="label" [ngModelOptions]="{standalone:true}" maxlength="250" placeholder="Ex. béton C25, grue, équipe coffrage" /></label>
          <label>Quantité <input type="number" [(ngModel)]="quantity" [ngModelOptions]="{standalone:true}" min="0.01" step="0.01" /></label>
          <label>Unité <input [(ngModel)]="unit" [ngModelOptions]="{standalone:true}" maxlength="30" placeholder="m³, personnes, jours…" /></label>
          <label>Nécessaire combien de jours avant le début ? <input type="number" [(ngModel)]="before" [ngModelOptions]="{standalone:true}" min="0" max="3650" /></label>
          <label>Délai de préparation / approvisionnement (jours) <input type="number" [(ngModel)]="lead" [ngModelOptions]="{standalone:true}" min="0" max="3650" /></label>
          <nf-button [disabled]="busy() || !label.trim() || !unit.trim()" (clicked)="add()">Enregistrer le besoin</nf-button>
        </div></details>
        <p>La demande d’achat est créée en brouillon, sans article ni prix estimé : complétez-la avant soumission. Les demandes d’équipe et de sous-traitance restent à traiter dans leurs modules.</p>
      }
    }
  `,
  styles:[`:host{display:block;}p{font-size:.8rem;color:#667085;}article{padding:.75rem 0;border-bottom:1px solid #dbe1eb;} .fields{display:grid;grid-template-columns:1fr 1fr;gap:.7rem;padding-top:.7rem;}label{display:grid;gap:.35rem;font-size:.8rem;}input,select{width:100%;box-sizing:border-box;font:inherit;padding:.5rem;border:1px solid #dbe1eb;border-radius:.4rem;}[role=alert]{color:#b42318;}summary{cursor:pointer;margin-top:.75rem;}@media(max-width:600px){.fields{grid-template-columns:1fr;}}`]
})
export class PlanningNeedsComponent {
  readonly activityId=input.required<string>();
  readonly facade=inject(PlanningFacade);private readonly api=inject(ActiviteApiService);
  readonly activity=computed(()=>this.facade.activites().find(a=>a.id===this.activityId()));
  readonly busy=signal(false);readonly error=signal('');
  type:PlanningNeed['type']='MATIERE';label='';quantity=1;unit='';before=0;lead=0;
  typeLabel(type:string):string {return ({PERSONNEL:'Équipe interne',MATIERE:'Matériaux',MATERIEL:'Matériel',SOUS_TRAITANCE:'Sous-traitance'} as Record<string,string>)[type]??type;}
  needDate(days:number):string {const d=new Date(this.activity()!.dateDebut+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-days);return d.toISOString().slice(0,10);}
  private async execute(action:()=>Promise<unknown>):Promise<boolean> {
    if(this.busy())return false;this.busy.set(true);this.error.set('');
    try{await action();await this.facade.loadAll();return true;}catch(e:any){this.error.set(e?.error?.message || 'Opération refusée. Vérifiez les données et vos droits.');return false;}finally{this.busy.set(false);}
  }
  async add():Promise<void> {const a=this.activity();if(!a)return;
    if(!Number.isFinite(this.quantity)||this.quantity<=0||!Number.isInteger(this.before)||!Number.isInteger(this.lead)||this.before<0||this.lead<0){this.error.set('Vérifiez la quantité et les délais entiers positifs ou nuls.');return;}
    if(await this.execute(()=>this.api.addNeed(a.chantierId,a.id,{type:this.type,label:this.label,quantity:this.quantity,unit:this.unit,daysBeforeStart:this.before,leadDays:this.lead}))) this.label='';
  }
  async remove(id:string):Promise<void> {const a=this.activity();if(a)await this.execute(()=>this.api.removeNeed(a.chantierId,a.id,id));}
  async purchase(id:string):Promise<void> {const a=this.activity();if(a)await this.execute(()=>this.api.preparePurchase(a.chantierId,a.id,id));}
}
