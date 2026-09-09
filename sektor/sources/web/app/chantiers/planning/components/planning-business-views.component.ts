import { Component, computed, effect, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanningWeekComponent } from './planning-week.component';
import { PlanningSuppliesComponent } from './planning-supplies.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@platform/lib/anatomy/components';
import { PlanningFacade, toIsoDate } from '../services/planning.facade';
import { ActiviteApiService, type PlanningResourceDay } from '../../services/activite-api.service';
import { ChantierAffectationApiService, type ChantierAffectation } from '../../services/chantier-affectation-api.service';
import { SituationApiService } from '../../situations/services/situation-api.service';
import { FactureClientApiService, type ApiFactureClient } from '../../../ventes/factures/services/facture-client-api.service';
import type { SituationListItem } from '../../models';
import { BudgetApiService } from '../../budget/services/budget-api.service';
import type { BudgetNoeud } from '../../budget/models/budget.model';
import { marketPlanning } from '../services/planning-market';

@Component({
  selector: 'app-planning-business-views', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonComponent, PlanningWeekComponent, PlanningSuppliesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!chantierId()) { <p>Sélectionnez un chantier pour afficher cette vue.</p> }
    @else {
      @if(view()!=='RESSOURCES' || resourceTab()==='EQUIPES') {<nf-button variant="secondary" [disabled]="loading()" (clicked)="exportCsv()">Exporter cette vue (CSV)</nf-button>}
      @if (loading()) { <p role="status">Chargement des données du chantier…</p> }
      @if (error()) { <p role="alert">{{ error() }}</p><nf-button variant="secondary" (clicked)="reload()">Réessayer</nf-button> }
      @if (view() === 'CLIENT') {
        <h2>Planning client</h2><p>Prévision courante issue du planning. Cette vue n’est pas une version publiée ni un accord du client.</p>
        <h3>Lots et ouvrages vendus</h3>
        <p>Dates issues des activités rattachées. L’avancement vient des ouvrages ; il ne s’agit pas d’une moyenne des activités. Un ouvrage sans activité reste visible.</p>
        <div class="controls">
          <nf-button variant="tertiary" (clicked)="collapseMarket()">Tout replier</nf-button>
          <nf-button variant="tertiary" (clicked)="collapsed.set([])">Tout développer</nf-button>
          <label><input type="checkbox" [ngModel]="showLinkedActivities()" (ngModelChange)="showLinkedActivities.set($event)" /> Détail des activités rattachées</label>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Lot / ouvrage</th><th>Début prévu</th><th>Fin prévue</th><th>Couverture du planning</th><th>Avancement ouvrages</th></tr></thead><tbody>
          @for(row of visibleMarketRows(); track row.id) {
            <tr><td [style.padding-left.rem]="0.75 + row.depth * 1.25">
              @if(row.expandable) { <button type="button" [attr.aria-expanded]="!collapsed().includes(row.id)" [attr.aria-label]="'Développer ou replier ' + row.label" (click)="toggleMarket(row.id)">{{ collapsed().includes(row.id) ? '▸' : '▾' }}</button> }
              {{ row.label }}</td>
              <td>{{ row.start ? (row.start | date:'dd/MM/yyyy') : 'Non planifié' }}</td><td>{{ row.finish ? (row.finish | date:'dd/MM/yyyy') : '—' }}</td>
              <td>{{ row.activityCount }} activité(s) · {{ row.plannedPosts }}/{{ row.totalPosts }} postes rattachés</td>
              <td>{{ row.progress == null ? '—' : (row.progress | number:'1.0-1') + ' %' }}</td>
            </tr>
            @if(showLinkedActivities() && !collapsed().includes(row.id) && !row.expandable) {
              @for(a of row.activities; track a.id) { <tr><td [style.padding-left.rem]="2 + row.depth * 1.25"><button type="button" (click)="facade.openActivite(a.id)">{{ a.libelle }}</button></td><td>{{ a.dateDebut | date:'dd/MM/yyyy' }}</td><td>{{ a.dateFin | date:'dd/MM/yyyy' }}</td><td colspan="2">Activité liée</td></tr> }
            }
          } @empty { <tr><td colspan="5">{{ loading() ? 'Chargement…' : 'Aucun ouvrage vendu chargé.' }}</td></tr> }
        </tbody></table></div>
        <h3>Jalons et activités complémentaires</h3>
        <div class="controls"><label><input type="checkbox" [ngModel]="includeTechnical()" (ngModelChange)="includeTechnical.set($event)" /> Jalons techniques</label>
        <label><input type="checkbox" [ngModel]="includeExecution()" (ngModelChange)="includeExecution.set($event)" /> Activités d’exécution</label></div>
        <div class="table-wrap"><table><thead><tr><th>Activité / jalon</th><th>Début</th><th>Fin</th><th>Avancement physique</th></tr></thead><tbody>
          @for (activity of clientRows(); track activity.id) { <tr><td>{{ activity.libelle }}</td><td>{{ activity.dateDebut | date:'dd/MM/yyyy' }}</td><td>{{ activity.dateFin | date:'dd/MM/yyyy' }}</td><td>{{ activity.avancementPercent ?? 0 }} %</td></tr> }
          @empty { <tr><td colspan="4">Aucun jalon contractuel. Créez un jalon de nature « Jalon contractuel » dans l’exécution, ou élargissez cette vue.</td></tr> }
        </tbody></table></div>
      }
      @if (view() === 'FINANCIER') {
        <h2>Planning financier</h2><p>Les jalons financiers sont des prévisions. Une situation, une facture et un encaissement restent des événements distincts.</p>
        <h3>Jalons financiers prévus</h3><div class="table-wrap"><table><thead><tr><th>Jalon</th><th>Date prévue</th></tr></thead><tbody>
          @for (activity of financialMilestones(); track activity.id) { <tr><td>{{ activity.libelle }}</td><td>{{ activity.dateDebut | date:'dd/MM/yyyy' }}</td></tr> }
          @empty { <tr><td colspan="2">Aucun jalon financier planifié.</td></tr> }
        </tbody></table></div>
        <h3>Situations du chantier</h3><div class="table-wrap"><table><thead><tr><th>Situation</th><th>Période</th><th>Statut</th><th>Net TTC source</th></tr></thead><tbody>
          @for (s of situations(); track s.id) { <tr><td><a [routerLink]="['/chantiers/situations',s.id]">{{ s.numero }}</a></td><td>{{ s.datePeriodeDebut | date:'dd/MM/yyyy' }} → {{ s.datePeriodeFin | date:'dd/MM/yyyy' }}</td><td>{{ s.status }}</td><td>{{ s.netAPayerTtc | number:'1.2-2' }}</td></tr> }
          @empty { <tr><td colspan="4">{{ loading() ? 'Chargement…' : 'Aucune situation chargée.' }}</td></tr> }
        </tbody></table></div>
        <h3>Échéances des factures liées aux situations</h3><p>Devise à vérifier sur chaque pièce ; les montants ne sont pas additionnés. Une date d’échéance ne prouve pas le paiement.</p>
        <div class="table-wrap"><table><thead><tr><th>Facture</th><th>Échéance</th><th>Net TTC</th><th>Encaissé TTC</th><th>Reste TTC</th><th>Statut</th></tr></thead><tbody>
          @for (f of invoices(); track f.id) { <tr><td><a [routerLink]="['/ventes/factures',f.id]">{{ f.numero }}</a></td><td>{{ f.dateEcheance | date:'dd/MM/yyyy' }}</td><td>{{ f.netAPayerTtc | number:'1.2-2' }}</td><td>{{ f.cumulEncaisseTtc | number:'1.2-2' }}</td><td>{{ f.resteTtc | number:'1.2-2' }}</td><td>{{ f.status }}</td></tr> }
          @empty { <tr><td colspan="6">Aucune facture liée chargée.</td></tr> }
        </tbody></table></div>
      }
      @if (view() === 'RESSOURCES') {
        <h2>Ressources du chantier</h2>
        <div class="controls" aria-label="Type de ressources">
          <nf-button [variant]="resourceTab()==='EQUIPES'?'primary':'tertiary'" (clicked)="resourceTab.set('EQUIPES')">Équipes et semaine</nf-button>
          <nf-button [variant]="resourceTab()==='ACHATS'?'primary':'tertiary'" (clicked)="resourceTab.set('ACHATS')">Achats et livraisons</nf-button>
        </div>
        @if(resourceTab()==='EQUIPES') {
        <p>Charge du chantier et réservations sur les autres chantiers. Les congés approuvés sont signalés sans afficher leur motif. La surcharge reste indicative : les heures ne sont pas encore positionnées sur des créneaux précis.</p>
        <label>Semaine à partir du <input type="date" [ngModel]="weekStart()" (ngModelChange)="setWeek($event)" /></label>
        <app-planning-week [chantierId]="chantierId()!" [start]="weekStart()" [assignments]="assignments()" />
        @if (facade.capacites().editerStructure) {
          <form class="controls" (submit)="$event.preventDefault(); reserve()">
            <label>Activité <select name="activity" [(ngModel)]="activityId"><option value="">Choisir une activité</option>@for(a of activityRows(); track a.id) { <option [value]="a.id">{{ a.libelle }}</option> }</select></label>
            <label>Collaborateur <select name="assignment" [(ngModel)]="assignmentId"><option value="">Choisir un collaborateur</option>@for(a of assignments(); track a.id) { <option [value]="a.id">{{ a.employeNom || a.employeMatricule || a.employeId }} · {{ a.roleLabel || a.roleCode }}</option> }</select></label>
            <label>Heures réservées par jour <input type="number" name="hours" [(ngModel)]="hours" min="0" max="24" step="0.5" /></label>
            <nf-button [disabled]="saving() || !activityId || !assignmentId" (clicked)="reserve()">Réserver / remplacer</nf-button>
          </form><p>La réservation couvre les jours travaillés de l’activité. Saisir 0 retire cette réservation.</p>
        }
        <div class="table-wrap"><table><thead><tr><th>Collaborateur</th>@for(day of days(); track day) { <th>{{ day | date:'EEE dd/MM' }}</th> }</tr></thead><tbody>
          @for (employee of employees(); track employee.id) { <tr><td>{{ employee.name }}</td>@for(day of days(); track day) { @let load = loadFor(employee.id,day); <td [class.overload]="load?.overload || load?.approvedAbsence">{{ (load?.reservedMinutes ?? 0)/60 }} h ici
            @if(load?.otherReservedMinutes) {<br/><small>+ {{ load!.otherReservedMinutes/60 }} h ailleurs</small>}
            <br/><small>Repère : {{ (load?.calendarMinutes ?? 0)/60 }} h</small>
            @if(load?.approvedAbsence) {<br/><strong>Congé approuvé</strong>} @else if(load?.partialAbsence) {<br/><strong>Congé partiel · vérifier les horaires</strong>}
            @if(load?.overload) { <br/><strong>Surcharge à vérifier</strong> }</td> }</tr> }
          @empty { <tr><td colspan="8">Aucun collaborateur affecté chargé. Constituez d’abord l’équipe du chantier.</td></tr> }
        </tbody></table></div>
        <p>Le repère est la plus grande capacité journalière des calendriers concernés, sans cumul des journées. Les congés partiels restent des alertes tant que leurs horaires ne sont pas précisés. Les engins ne sont pas encore suivis dans cette grille.</p>
        <h3>Réservations enregistrées</h3><ul>@for(a of activityRows(); track a.id) { @for(r of a.planningAllocations; track r.affectationId) { <li>{{ a.libelle }} · {{ assignmentName(r.affectationId) }} · {{ r.minutesParJour/60 }} h/j</li> } }</ul>
        <h3>Préparer les activités de la période</h3>
        <p>Activités qui recoupent ces sept jours. Ouvrez une activité pour compléter ses besoins ou préparer sa demande d’achat. Cette liste ne valide pas la semaine.</p>
        <div class="table-wrap"><table><thead><tr><th>Activité</th><th>Début</th><th>Fin</th><th>Besoins</th></tr></thead><tbody>
          @for(a of weekActivities(); track a.id) {
            <tr><td><nf-button variant="tertiary" (clicked)="facade.openActivite(a.id)">{{ a.libelle }}</nf-button></td><td>{{ a.dateDebut | date:'dd/MM/yyyy' }}</td><td>{{ a.dateFin | date:'dd/MM/yyyy' }}</td><td>{{ a.planningNeeds?.length ?? 0 }} besoin(s) renseigné(s)</td></tr>
          } @empty {<tr><td colspan="4">Aucune activité sur cette période.</td></tr>}
        </tbody></table></div>
        } @else {<app-planning-supplies [chantierId]="chantierId()!" />}
      }
    }
  `,
  styles: [`:host { display:block; min-width:0; } h2 { font-size:1.2rem; } h3 { font-size:1rem; margin-top:1.5rem; } p { font-size:.85rem; color:var(--nf-color-text-secondary); } .controls {display:flex;flex-wrap:wrap;gap:.8rem;align-items:end;margin:1rem 0;} label {display:grid;gap:.4rem;font-size:.85rem;} input,select {font:inherit;padding:.6rem;border:1px solid var(--nf-color-border);border-radius:.45rem;background:var(--nf-color-surface);color:inherit;max-width:100%;} .table-wrap {overflow:auto;} table {width:100%;border-collapse:collapse;font-size:.85rem;} th,td {padding:.75rem;text-align:left;border-bottom:1px solid var(--nf-color-border);white-space:nowrap;} .overload {background:#fff0e5;color:#a13a13;} [role=alert] {color:#b42318;}`],
})
export class PlanningBusinessViewsComponent {
  readonly view = input.required<'CLIENT'|'FINANCIER'|'RESSOURCES'>();
  readonly facade=inject(PlanningFacade);
  private readonly api=inject(ActiviteApiService);
  private readonly assignmentApi=inject(ChantierAffectationApiService);
  private readonly situationApi=inject(SituationApiService);
  private readonly invoiceApi=inject(FactureClientApiService);
  private readonly budgetApi=inject(BudgetApiService);
  readonly marketNodes=signal<BudgetNoeud[]>([]);
  readonly collapsed=signal<string[]>([]);
  readonly showLinkedActivities=signal(false);
  readonly marketRows=computed(()=>marketPlanning(this.marketNodes(),this.allRows()));
  readonly visibleMarketRows=computed(()=>this.marketRows().filter(row=>!row.parentIds.some(id=>this.collapsed().includes(id))));
  toggleMarket(id:string):void {this.collapsed.update(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);}
  collapseMarket():void {this.collapsed.set(this.marketRows().map(row=>row.id));}
  readonly chantierId=computed(()=>this.facade.summary().monoChantier?.id);
  readonly loading=signal(false); readonly saving=signal(false); readonly error=signal('');
  readonly includeTechnical=signal(false); readonly includeExecution=signal(false);
  readonly weekStart=signal(this.monday(toIsoDate(new Date())));
  readonly resourceTab=signal<'EQUIPES'|'ACHATS'>('EQUIPES');
  readonly assignments=signal<ChantierAffectation[]>([]); readonly loads=signal<PlanningResourceDay[]>([]);
  readonly situations=signal<SituationListItem[]>([]); readonly invoices=signal<ApiFactureClient[]>([]);
  activityId=''; assignmentId=''; hours=8; private generation=0;
  readonly allRows=computed(()=>this.facade.activites().filter(a=>a.chantierId===this.chantierId()));
  readonly activityRows=computed(()=>this.allRows().filter(a=>a.forme==='ACTIVITE'));
  readonly clientRows=computed(()=>this.allRows().filter(a=>a.natureCode==='JALON_CONTRACTUEL' || (this.includeTechnical() && a.natureCode==='JALON_TECHNIQUE') || (this.includeExecution() && a.forme==='ACTIVITE')));
  readonly financialMilestones=computed(()=>this.allRows().filter(a=>a.natureCode==='JALON_FINANCIER'));
  readonly employees=computed(()=>[...new Map(this.assignments().map(a=>[a.employeId,{id:a.employeId,name:a.employeNom || a.employeMatricule || a.employeId}])).values()]);
  readonly days=computed(()=>Array.from({length:7},(_,i)=> { const d=new Date(this.weekStart()+'T12:00:00'); d.setDate(d.getDate()+i); return toIsoDate(d); }));
  readonly weekActivities=computed(()=>this.activityRows().filter(a=>a.dateDebut<=this.days()[6] && a.dateFin>=this.weekStart()));
  constructor() { effect(()=>{this.chantierId();this.view();this.weekStart();void this.reload();}); }
  private monday(value:string):string {const d=new Date(value+'T12:00:00');d.setDate(d.getDate()-(d.getDay()+6)%7);return toIsoDate(d);}
  setWeek(value:string) { if (/^\d{4}-\d{2}-\d{2}$/.test(value)) this.weekStart.set(this.monday(value)); }
  loadFor(id:string,date:string) {return this.loads().find(r=>r.employeId===id && r.date===date);}
  assignmentName(id:string) {const a=this.assignments().find(a=>a.id===id);return a?.employeNom || a?.employeMatricule || id;}
  async reload():Promise<void> {
    const id=this.chantierId(), view=this.view(), start=this.weekStart(), generation=++this.generation;
    this.error.set('');this.assignments.set([]);this.loads.set([]);this.situations.set([]);this.invoices.set([]);
    this.marketNodes.set([]);
    if(!id) {this.loading.set(false);return;}
    this.loading.set(true);
    try {
      if(view==='CLIENT') {
        const tree=await this.budgetApi.getArbre(id);
        if(generation!==this.generation)return;
        this.marketNodes.set(tree.lots??[]);
      } else if(view==='RESSOURCES') {
        const [assignments,loads]=await Promise.all([this.assignmentApi.listByChantier(id),this.api.resourceWeek(id,start)]);
        if(generation!==this.generation)return;
        this.assignments.set(assignments.filter(a=>a.isActive));this.loads.set(loads);
      } else {
        const situations=await this.situationApi.listByChantier(id);
        if(generation!==this.generation)return; this.situations.set(situations);
        const ids=[...new Set(situations.map(s=>s.factureId).filter((id):id is string=>!!id))];
        const results=await Promise.allSettled(ids.map(id=>this.invoiceApi.getPlanningFacture(id)));
        if(generation!==this.generation)return;
        this.invoices.set(results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]));
        if(results.some(r=>r.status==='rejected')) this.error.set('Certaines factures liées ne sont pas accessibles. Les montants affichés sont partiels.');
      }
    } catch {if(generation===this.generation)this.error.set('Données indisponibles ou accès refusé pour cette vue.');}
    finally {if(generation===this.generation)this.loading.set(false);}
  }
  async reserve():Promise<void> {
    const id=this.chantierId(); if(!id || !this.activityId || !this.assignmentId || this.saving())return;
    if (!Number.isFinite(Number(this.hours)) || Number(this.hours)<0 || Number(this.hours)>24) {this.error.set('Saisissez entre 0 et 24 heures par jour.');return;}
    this.saving.set(true);this.error.set('');
    try {await this.api.reserveResource(id,this.activityId,this.assignmentId,Math.round(Number(this.hours)*60));await this.facade.loadAll();await this.reload();}
    catch(error:any) {this.error.set(error?.error?.message || 'Réservation refusée. Vérifiez les dates de l’affectation et vos droits.');}
    finally {this.saving.set(false);}
  }
  exportCsv():void {
    const rows:unknown[][]=[['Chantier',this.facade.summary().monoChantier?.code],['Vue',this.view()],['État','Prévision courante — non publiée'],[]];
    if(this.view()==='CLIENT') {
      rows.push(['Lot / ouvrage','Début prévu','Fin prévue','Activités','Postes rattachés','Postes vendus','Avancement ouvrages (%)']);
      this.visibleMarketRows().forEach(r=>{
        rows.push([r.label,r.start,r.finish,r.activityCount,r.plannedPosts,r.totalPosts,r.progress]);
        if(this.showLinkedActivities() && !this.collapsed().includes(r.id) && !r.expandable)
          r.activities.forEach(a=>rows.push(['  '+a.libelle,a.dateDebut,a.dateFin,'Activité liée','','','']));
      });
      rows.push([],['Jalons et activités complémentaires']);
      rows.push(['Activité / jalon','Début','Fin','Avancement physique (%)']);
      this.clientRows().forEach(a=>rows.push([a.libelle,a.dateDebut,a.dateFin,a.avancementPercent??0]));
    } else if(this.view()==='RESSOURCES') {
      rows.push(['Charge indicative : ici + autres chantiers ; repère calendrier ; congé approuvé'],['Collaborateur',...this.days()]);
      this.employees().forEach(e=>rows.push([e.name,...this.days().map(d=>{const r=this.loadFor(e.id,d);return `${(r?.reservedMinutes??0)/60} h ici + ${(r?.otherReservedMinutes??0)/60} h ailleurs / repère ${(r?.calendarMinutes??0)/60} h${r?.approvedAbsence?' ; congé approuvé':r?.partialAbsence?' ; congé partiel à vérifier':''}`;})]));
    } else {
      rows.push(['Jalon financier prévu','Date']);this.financialMilestones().forEach(a=>rows.push([a.libelle,a.dateDebut]));
      rows.push([],['Situation','Début période','Fin période','Statut','Net TTC — devise à vérifier sur la pièce']);
      this.situations().forEach(s=>rows.push([s.numero,s.datePeriodeDebut,s.datePeriodeFin,s.status,s.netAPayerTtc]));
      rows.push([],['Facture liée','Échéance','Net TTC','Encaissé TTC','Reste TTC','Statut']);
      this.invoices().forEach(f=>rows.push([f.numero,f.dateEcheance,f.netAPayerTtc,f.cumulEncaisseTtc,f.resteTtc,f.status]));
    }
    if(this.error()) rows.push([],['Attention',this.error()]);
    const escape=(value:unknown)=>{let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(escape).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download=`planning-${this.view().toLowerCase()}-${this.chantierId()}.csv`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
