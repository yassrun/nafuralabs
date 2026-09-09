import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@platform/lib/anatomy/components';
import { ActiviteApiService } from '../../services/activite-api.service';
import { PlanningFacade } from '../services/planning.facade';
import { PlanningReportsComponent } from './planning-reports.component';
import type { ChantierAffectation } from '../../services/chantier-affectation-api.service';

export interface WeekSnapshot { activities:{id:string;label:string;start:string;finish:string;needs:any[];allocations:any[];remainder?:{resumeStart:string;statusDate:string;minutes:number}}[]; conflicts:string[]; }
export interface PlanningWeekView {
  version:number|null;revision:number;status:string;note:string;changed:boolean;token:string;
  current:WeekSnapshot;submitted:WeekSnapshot|null;
  history:{revision:number;action:string;actor:string;at:string;note:string;snapshot:string}[];
  canPrepare:boolean;canDecide:boolean;ownPreparation:boolean;
}
@Component({
  selector:'app-planning-week',standalone:true,imports:[CommonModule,FormsModule,ButtonComponent,PlanningReportsComponent],
  template:`
    <section aria-label="Validation de la semaine">
      <div class="title"><h3>Semaine du {{ start() | date:'dd/MM/yyyy' }}</h3>
      @if(data();as w){<span>{{ label(w.status) }} · Révision {{ w.revision }}</span>}
      <nf-button variant="tertiary" [disabled]="busy()" (clicked)="reload()">Actualiser</nf-button></div>
      @if(error()){<p role="alert">{{ error() }}</p>}
      @if(loading()){<p role="status">Chargement de la préparation…</p>}
      @if(data();as w){
        @if(w.changed){<p role="alert">Les activités ou leurs moyens ont changé depuis la préparation enregistrée.</p>}
        <p>{{ w.current.activities.length }} {{ w.current.activities.length > 1 ? 'activités' : 'activité' }} · Les surcharges restent des alertes. Les affectations indisponibles et les réservations pendant un congé approuvé bloquent la validation.</p>
        @for(conflict of w.current.conflicts;track conflict){<p role="alert">{{ conflict }}</p>}
        @if(w.ownPreparation){<p>Vous avez participé à la préparation. Une autre personne habilitée doit la valider.</p>}
        @if(w.canPrepare || w.canDecide){
          <label>Note de préparation / motif <textarea [(ngModel)]="note" maxlength="4000" rows="2" [disabled]="busy() || loading()"></textarea></label>
          <div class="actions">
            @if(w.canPrepare && (w.status==='NON_PREPAREE' || w.status==='BROUILLON')){
              <nf-button [disabled]="busy() || loading()" (clicked)="act('SAVE')">Enregistrer la préparation</nf-button>
              @if(w.status==='BROUILLON'){<nf-button variant="secondary" [disabled]="busy() || loading() || w.changed || note!==(w.note??'') || !w.current.activities.length" (clicked)="act('SUBMIT')">Soumettre la semaine</nf-button>}
            }
            @if(w.canPrepare && !['NON_PREPAREE','BROUILLON'].includes(w.status)){
              <nf-button variant="secondary" [disabled]="busy() || loading() || !note.trim()" (clicked)="act('REVISE')">Préparer une nouvelle révision</nf-button>
            }
            @if(w.canDecide && w.status==='SOUMISE'){
              <nf-button [disabled]="busy() || loading() || !!w.current.conflicts.length" (clicked)="act('APPROVE')">Valider cette révision</nf-button>
              <nf-button variant="secondary" [disabled]="busy() || loading() || !note.trim()" (clicked)="act('REJECT')">Demander des corrections</nf-button>
            }
          </div>
        }
        @if(w.submitted){<details><summary>Contenu enregistré de la révision {{ w.revision }}</summary>
          <ul>@for(a of w.submitted.activities;track a.id){<li>{{ a.label }} · {{ a.start | date:'dd/MM' }} → {{ a.finish | date:'dd/MM' }}
            @if(a.remainder){<p>Reprise le {{ a.remainder.resumeStart|date:'dd/MM' }} · {{ a.remainder.minutes/60 }} h restantes, arrêté au {{ a.remainder.statusDate|date:'dd/MM' }}.</p>}
            <ul>@for(r of a.allocations;track r.affectationId){<li>{{ assignmentName(r.affectationId) }} · {{ r.minutesParJour/60 }} h/j</li>}
            @for(n of a.needs;track n.id){<li>{{ n.label }} · {{ n.quantity }} {{ n.unit }} · {{ n.daysBeforeStart }} j avant le début · délai {{ n.leadDays }} j</li>}</ul>
          </li>}</ul>
        </details>}
        @if(w.history.length){<details><summary>Historique des révisions et décisions ({{ w.history.length }})</summary>
          @for(event of w.history;track $index){<article><strong>R{{ event.revision }} · {{ actionLabel(event.action) }}</strong> · {{ event.at | date:'dd/MM/yyyy HH:mm' }}
            <p>{{ event.note }}</p><details><summary>Contenu et traçabilité</summary><p>Identifiant de l’auteur : {{ event.actor }}</p>
              <ul>@for(a of historical(event.snapshot);track a.id){<li>{{ a.label }} · {{ a.start | date:'dd/MM' }} → {{ a.finish | date:'dd/MM' }}
                @if(a.remainder){<p>Reprise le {{ a.remainder.resumeStart|date:'dd/MM' }} · {{ a.remainder.minutes/60 }} h restantes, arrêté au {{ a.remainder.statusDate|date:'dd/MM' }}.</p>}
                <ul>@for(r of a.allocations;track r.affectationId){<li>{{ assignmentName(r.affectationId) }} · {{ r.minutesParJour/60 }} h/j</li>}
                @for(n of a.needs;track n.id){<li>{{ n.label }} · {{ n.quantity }} {{ n.unit }} · {{ n.daysBeforeStart }} j avant le début · délai {{ n.leadDays }} j</li>}</ul>
              </li>}</ul>
            </details></article>}
        </details>}
      }
    </section>
    <app-planning-reports [chantierId]="chantierId()" [start]="start()" [canPrepare]="data()?.canPrepare ?? false" />
  `,
  styles:[`section{margin:1rem 0;padding:1rem;border:1px solid var(--nf-color-border);border-radius:.65rem}.title,.actions{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}h3{margin:0;font-size:1rem}.title span{font-size:.85rem}p,li{font-size:.85rem}label{display:grid;gap:.4rem;font-size:.85rem}textarea{font:inherit;padding:.6rem;border:1px solid var(--nf-color-border);border-radius:.4rem}.actions,details{margin-top:.75rem}summary{cursor:pointer}article{padding:.6rem;border-bottom:1px solid var(--nf-color-border)}[role=alert]{color:#b42318}`]
})
export class PlanningWeekComponent {
  readonly chantierId=input.required<string>();readonly start=input.required<string>();
  readonly assignments=input<ChantierAffectation[]>([]);
  readonly api=inject(ActiviteApiService);readonly facade=inject(PlanningFacade);
  readonly data=signal<PlanningWeekView|null>(null);readonly busy=signal(false);readonly loading=signal(false);readonly error=signal('');
  note='';private generation=0;private context='';
  constructor(){effect(()=>{this.chantierId();this.start();this.facade.activites();untracked(()=>void this.reload());});}
  async reload(){const id=this.chantierId(),start=this.start(),generation=++this.generation,key=id+start;
    const keepNote=this.context===key && this.data()!=null && this.note!==(this.data()?.note??'');this.context=key;
    this.loading.set(true);this.error.set('');this.data.set(null);
    try{const data=await this.api.planningWeek(id,start);if(generation===this.generation){this.data.set(data);if(!keepNote)this.note=data.note??'';}}
    catch(e:any){if(generation===this.generation)this.error.set(e?.error?.message||'Préparation indisponible. Réessayez.');}
    finally{if(generation===this.generation)this.loading.set(false);}
  }
  async act(action:string){const w=this.data();if(!w||this.busy())return;const id=this.chantierId(),start=this.start(),generation=this.generation;this.busy.set(true);this.error.set('');
    try{const updated=await this.api.commandPlanningWeek(id,start,action,{version:w.version,token:w.token,note:this.note});if(generation===this.generation){this.data.set(updated);this.note=updated.note??'';}}
    catch(e:any){if(generation===this.generation)this.error.set(e?.error?.message||e?.error?.detail||'Action refusée. Actualisez et vérifiez vos droits.');}
    finally{this.busy.set(false);}
  }
  historical(snapshot:string):WeekSnapshot['activities']{try{return JSON.parse(snapshot).activities??[];}catch{return [];}}
  assignmentName(id:string):string {const a=this.assignments().find(a=>a.id===id);return a?.employeNom||a?.employeMatricule||id;}
  label(status:string){return ({NON_PREPAREE:'Non préparée',BROUILLON:'Brouillon',SOUMISE:'Soumise',VALIDEE:'Validée',A_CORRIGER:'À corriger',A_REVALIDER:'À revalider',A_RESOUMETTRE:'À soumettre à nouveau'} as Record<string,string>)[status]??status;}
  actionLabel(action:string){return ({SAVE:'Préparation enregistrée',SUBMIT:'Semaine soumise',APPROVE:'Révision validée',REJECT:'Corrections demandées',REVISE:'Nouvelle révision'} as Record<string,string>)[action]??action;}
}
