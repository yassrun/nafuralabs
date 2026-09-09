import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@platform/lib/anatomy/components';
import { ActiviteApiService, type ActiviteChantier } from '../../services/activite-api.service';
import { PlanningFacade, toIsoDate } from '../services/planning.facade';
import type { PlanningReport, ReportPreview } from '../services/planning-report';

@Component({selector:'app-planning-reports',standalone:true,imports:[CommonModule,FormsModule,ButtonComponent],
  template:`
    <details class="panel" aria-label="Reports entre semaines"><summary>Reporter des activités <span>{{ pending() }} {{ pending() > 1 ? 'propositions' : 'proposition' }} en attente sur ce chantier</span></summary>
      <p>Reportez une activité entière ou seulement son reste à faire. Le conducteur ou un supérieur valide la proposition d’une autre personne.</p>
      <p>Pour une activité commencée, le début et l’avancement sont conservés. Saisissez les heures restantes : elles ne sont pas déduites du pourcentage d’avancement. Les achats existants restent à rapprocher.</p>
      @if(error()){<p role="alert">{{ error() }}</p>}@if(message()){<p role="status">{{ message() }}</p>}
      <nf-button variant="tertiary" [disabled]="busy()" (clicked)="reload()">Actualiser les reports</nf-button>
      @if(canPrepare()){
        <fieldset [disabled]="busy()"><legend>Activités à reporter · semaine du {{ start()|date:'dd/MM/yyyy' }}</legend>
          @for(a of eligible();track a.id){<label class="choice"><input type="checkbox" [checked]="selected().includes(a.id)" (change)="toggle(a.id)" />{{ a.libelle }} · {{ started(a) ? 'Reste à faire' : 'Activité entière' }} · {{ a.dateDebut|date:'dd/MM' }} → {{ a.dateFin|date:'dd/MM' }}</label>
            @if(selected().includes(a.id) && started(a)){
              <label>Heures restantes pour {{ a.libelle }} <input type="number" min="0.5" step="0.5" [ngModel]="remainingHours[a.id]" (ngModelChange)="remainingHours[a.id]=$event;preview.set(null)" /></label>
              @if(a.planningRemainder){<small>Dernière prévision : {{ a.planningRemainder.minutes/60 }} h à partir du {{ a.planningRemainder.resumeStart|date:'dd/MM/yyyy' }}.</small>}
            }
          }
          @empty{<p>Aucune activité à reporter sur cette semaine.</p>}
          @if(hasRemaining()){<label>Date d’arrêté du reste à faire <input type="date" [min]="start()" [max]="today" [ngModel]="statusDate" (ngModelChange)="statusDate=$event;preview.set(null)" /></label>}
          <label>Semaine de destination (lundi) <input type="date" [ngModel]="target" (ngModelChange)="target=$event;preview.set(null)" /></label>
          <label>Motif du report <textarea [(ngModel)]="reason" maxlength="4000" rows="2"></textarea></label>
          <nf-button variant="secondary" [disabled]="busy() || !selected().length || !target" (clicked)="simulate()">Voir l’impact avant de proposer</nf-button>
        </fieldset>
      }
      @if(preview();as p){
        <h4>Aperçu du report · {{ p.changes.length }} {{ p.changes.length > 1 ? 'lignes déplacées' : 'ligne déplacée' }}</h4>
        <ng-container [ngTemplateOutlet]="impact" [ngTemplateOutletContext]="{p:p}" />
        <nf-button [disabled]="busy() || !reason.trim()" (clicked)="propose()">Soumettre cette proposition</nf-button>
      }
      @for(r of reports();track r.id){<details><summary>{{ label(r.status) }} · {{ r.preview.request.sourceWeek|date:'dd/MM' }} → {{ r.preview.request.targetWeek|date:'dd/MM' }} · {{ r.reason }}</summary>
        <ng-container [ngTemplateOutlet]="impact" [ngTemplateOutletContext]="{p:r.preview}" />
        <p>Proposé le {{ r.proposedAt|date:'dd/MM/yyyy HH:mm' }} par {{ r.proposedBy }}</p>
        @if(r.decidedAt){<p>{{ r.decisionNote }} · {{ r.decidedAt|date:'dd/MM/yyyy HH:mm' }} · {{ r.decidedBy }}</p>}
        @if(r.canDecide || r.canCancel){<label>Motif de la décision <textarea [ngModel]="decisionNotes[r.id]??''" (ngModelChange)="decisionNotes[r.id]=$event" maxlength="4000" rows="2"></textarea></label>
          <div class="actions">@if(r.canDecide){
            <nf-button [disabled]="busy() || !decisionNotes[r.id]?.trim()" (clicked)="decide(r,'APPROVE')">Valider et appliquer le report</nf-button>
            <nf-button variant="secondary" [disabled]="busy() || !decisionNotes[r.id]?.trim()" (clicked)="decide(r,'REJECT')">Refuser le report</nf-button>}
            @if(r.canCancel){<nf-button variant="secondary" [disabled]="busy() || !decisionNotes[r.id]?.trim()" (clicked)="decide(r,'CANCEL')">Retirer ma proposition</nf-button>}</div>
        }
      </details>}
    </details>
    <ng-template #impact let-p="p">
      <div class="table-wrap"><table><thead><tr><th>Activité / jalon</th><th>Dates actuelles</th><th>Dates proposées</th></tr></thead><tbody>
        @for(row of p.changes;track row.id){<tr><td>{{ row.label }}{{ row.critical?' · Critique':'' }}</td><td>{{ row.previousStart|date:'dd/MM/yyyy' }} → {{ row.previousFinish|date:'dd/MM/yyyy' }}</td><td>{{ row.start|date:'dd/MM/yyyy' }} → {{ row.finish|date:'dd/MM/yyyy' }}
          @if(row.workStart && row.workStart!==row.start){<br/><strong>Reprise : {{ row.workStart|date:'dd/MM/yyyy' }}</strong>}
          @if(p.request.remaining?.[row.id];as r){<br/>{{ r.minutes/60 }} h restantes · arrêté au {{ r.statusDate|date:'dd/MM/yyyy' }}}
        </td></tr>}
      </tbody></table></div>
      <p>Fin du réseau après report : {{ p.finish|date:'dd/MM/yyyy' }}. Les lignes affichées comprennent les successeurs déplacés et les ajustements calculés selon les calendriers.</p>
      <details><summary>Semaines et moyens à revoir</summary><ul>@for(w of p.weeks;track w.start){<li>Semaine du {{ w.start|date:'dd/MM/yyyy' }} · {{ weekLabel(w.status) }}{{ w.revision?' · R'+w.revision:'' }}</li>}</ul>
        <p>Les révisions enregistrées sont conservées. Une semaine soumise ou validée dont le contenu change doit être soumise ou validée à nouveau.</p>
        <ul>@for(check of p.checks;track $index){<li>{{ check }}</li>}</ul>
      </details>
    </ng-template>
  `,
  styles:[`p{margin:.65rem 0;line-height:1.5}h4{margin:1rem 0 .5rem}summary{line-height:1.5}.actions{margin:.65rem 0}.table-wrap{margin:.65rem 0}`,
    `.panel{margin:1rem 0;padding:1rem;border:1px solid var(--nf-color-border);border-radius:.65rem}summary{cursor:pointer}summary span{font-size:.8rem;margin-left:.6rem}p,li{font-size:.85rem}fieldset{border:1px solid var(--nf-color-border);margin:.75rem 0;padding:.75rem}label{display:grid;gap:.3rem;margin:.6rem 0;font-size:.85rem}.choice{display:flex;align-items:center}input,textarea{font:inherit;padding:.5rem;border:1px solid var(--nf-color-border);border-radius:.4rem}details details{margin-top:.75rem;padding:.6rem;border-top:1px solid var(--nf-color-border)}.actions{display:flex;gap:.5rem;flex-wrap:wrap}.table-wrap{overflow:auto;max-height:22rem}table{width:100%;border-collapse:collapse;font-size:.85rem}th,td{text-align:left;padding:.5rem;border-bottom:1px solid var(--nf-color-border)}[role=alert]{color:#b42318}`]
})
export class PlanningReportsComponent {
  readonly chantierId=input.required<string>();readonly start=input.required<string>();readonly canPrepare=input(false);
  readonly api=inject(ActiviteApiService);readonly facade=inject(PlanningFacade);
  readonly reports=signal<PlanningReport[]>([]);readonly preview=signal<ReportPreview|null>(null);readonly selected=signal<string[]>([]);
  readonly busy=signal(false);readonly error=signal('');readonly message=signal('');
  readonly pending=computed(()=>this.reports().filter(r=>r.status==='PROPOSE').length);
  readonly eligible=computed(()=>this.facade.activites().filter(a=>a.chantierId===this.chantierId()&&a.forme==='ACTIVITE'&&a.status!=='TERMINE'&&(a.avancementPercent??0)<100&&a.dateDebut<this.plusWeek(this.start())&&(this.started(a)||a.dateDebut>=this.start())));
  readonly hasRemaining=computed(()=>this.eligible().some(a=>this.selected().includes(a.id)&&this.started(a)));
  readonly today=toIsoDate(new Date());statusDate=this.today;remainingHours:Record<string,number>={};
  target='';reason='';decisionNotes:Record<string,string>={};private generation=0;
  constructor(){effect(()=>{this.chantierId();const start=this.start();untracked(()=>{this.selected.set([]);this.preview.set(null);this.reports.set([]);this.target=this.plusWeek(start);this.reason='';this.remainingHours={};this.statusDate=this.today;this.message.set('');this.decisionNotes={};void this.reload();});});}
  started(a:ActiviteChantier){return a.status!=='PLANIFIE'||(a.avancementPercent??0)>0||!!a.planningRemainder;}
  ngOnDestroy(){this.generation++;}
  private plusWeek(value:string){const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+7);return d.toISOString().slice(0,10);}
  toggle(id:string){this.selected.update(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);this.preview.set(null);}
  async reload(){const id=this.chantierId(),g=++this.generation;this.busy.set(true);this.error.set('');this.preview.set(null);
    try{const rows=await this.api.planningReports(id);if(g===this.generation)this.reports.set(rows);}catch(e:any){if(g===this.generation)this.error.set(this.reasonFor(e));}finally{if(g===this.generation)this.busy.set(false);}}
  async simulate(){const id=this.chantierId(),g=this.generation;this.busy.set(true);this.error.set('');this.preview.set(null);this.message.set('');
    try{const remaining:Record<string,{statusDate:string;minutes:number}>={};
      for(const a of this.eligible().filter(a=>this.selected().includes(a.id)&&this.started(a))){const hours=this.remainingHours[a.id];if(!Number.isFinite(hours)||hours<=0)throw new Error('Renseignez les heures restantes pour chaque activité commencée.');remaining[a.id]={statusDate:this.statusDate,minutes:Math.round(hours*60)};}
      const p=await this.api.previewReport(id,{sourceWeek:this.start(),targetWeek:this.target,activityIds:this.selected(),remaining});if(g===this.generation)this.preview.set(p);}catch(e:any){if(g===this.generation)this.error.set(e?.error?this.reasonFor(e):e?.message||this.reasonFor(e));}finally{if(g===this.generation)this.busy.set(false);}}
  async propose(){const p=this.preview();if(!p||this.busy())return;const id=this.chantierId(),g=this.generation;this.busy.set(true);this.error.set('');
    try{const r=await this.api.proposeReport(id,{request:p.request,token:p.token,reason:this.reason});if(g===this.generation){this.reports.update(all=>[r,...all]);this.preview.set(null);this.message.set('Proposition enregistrée. Les dates restent inchangées jusqu’à sa validation.');}}
    catch(e:any){if(g===this.generation){this.error.set(this.reasonFor(e));this.preview.set(null);}}finally{if(g===this.generation)this.busy.set(false);}}
  async decide(r:PlanningReport,action:string){if(this.busy())return;const id=this.chantierId(),g=this.generation;this.busy.set(true);this.error.set('');
    try{const next=await this.api.decideReport(id,r.id,{version:r.version,action,note:this.decisionNotes[r.id]});if(g===this.generation){this.reports.update(all=>all.map(x=>x.id===r.id?next:x));this.message.set(action==='APPROVE'?'Report appliqué. Revérifiez les semaines concernées et les dates des achats.':'Décision enregistrée.');}
      if(action==='APPROVE'&&g===this.generation&&id===this.chantierId())await this.facade.reloadChantier(id);
    }catch(e:any){if(g===this.generation)this.error.set(this.reasonFor(e));}finally{if(g===this.generation)this.busy.set(false);}}
  label(s:string){return ({PROPOSE:'À décider',APPLIQUE:'Report appliqué',REFUSE:'Report refusé',ANNULE:'Proposition retirée'} as Record<string,string>)[s]??s;}
  weekLabel(s:string){return ({NON_PREPAREE:'Non préparée',BROUILLON:'Brouillon',SOUMISE:'Soumise',VALIDEE:'Validée',A_REVALIDER:'À revalider',A_RESOUMETTRE:'À soumettre à nouveau',A_CORRIGER:'À corriger'} as Record<string,string>)[s]??s;}
  private reasonFor(e:any){return e?.error?.message||e?.error?.detail||'Action indisponible. Actualisez et vérifiez vos droits.';}
}
