import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@platform/lib/anatomy/components';
import { ActiviteApiService } from '../../services/activite-api.service';
import { publicationChanges, type PublicationPreview, type PublicationVersion } from '../services/planning-publication';

@Component({
  selector:'app-planning-publications',standalone:true,imports:[CommonModule,FormsModule,ButtonComponent],
  template:`
    <details class="panel" (toggle)="opened=$any($event.target).open" aria-label="Versions du planning client">
      <summary>Versions client <span>{{ versions().length }} {{ versions().length > 1 ? 'publiées' : 'publiée' }}</span></summary>
      <p>Une publication fige le contenu pour préparer son partage. Elle n’envoie aucun message et ne vaut pas accord du client.</p>
      <div class="actions"><nf-button variant="secondary" [disabled]="busy()" (clicked)="prepare()">Préparer une version</nf-button>
        <nf-button variant="tertiary" [disabled]="busy()" (clicked)="reload()">Actualiser les versions</nf-button></div>
      @if(error()){<p role="alert">{{ error() }}</p>}
      @if(message()){<p role="status">{{ message() }}</p>}
      @if(busy()){<p role="status">Chargement…</p>}
      @if(preview();as p){
        <h3>Aperçu à publier · {{ p.content.chantierCode }}</h3>
        <p>Lots vendus et jalons contractuels{{ technical() ? ', jalons techniques' : '' }}{{ execution() ? ', activités d’exécution' : '' }}. Les lignes sans dates restent signalées « Non planifié ».</p>
        <div class="table-wrap"><table><thead><tr><th>Ligne</th><th>Début</th><th>Fin</th></tr></thead><tbody>
          @for(row of p.content.rows;track row.id){<tr><td [class.child]="row.parentId">{{ row.label }}</td><td>{{ row.start ? (row.start|date:'dd/MM/yyyy') : 'Non planifié' }}</td><td>{{ row.finish ? (row.finish|date:'dd/MM/yyyy') : '—' }}</td></tr>}
        </tbody></table></div>
        @if(changes().length){<details><summary>{{ changes().length }} {{ changes().length > 1 ? 'différences' : 'différence' }} avec la dernière publication</summary><ul>@for(change of changes();track $index){<li>{{ change }}</li>}</ul></details>}
        @else if(versions().length){<p>Contenu identique à la dernière publication.</p>}
        @if(p.canPublish){<label>Intitulé de la version <input [(ngModel)]="title" maxlength="200" /></label>
          <nf-button [disabled]="busy() || !title.trim() || !p.content.rows.length" (clicked)="publish()">Figer et publier cette version</nf-button>}
        @else{<p>La publication est réservée au directeur travaux ou à la direction habilitée sur ce chantier.</p>}
      }
      @for(v of versions();track v.id){
        <details><summary>V{{ v.numero }} · {{ v.title }} · {{ v.publishedAt|date:'dd/MM/yyyy HH:mm' }}
          <span>{{ v.acknowledgements.length ? outcome(v.acknowledgements[v.acknowledgements.length-1].outcome)+' enregistré' : 'Sans retour client enregistré' }}</span></summary>
          <nf-button variant="secondary" (clicked)="exportVersion(v)">Exporter cette version (CSV)</nf-button>
          <div class="table-wrap"><table><thead><tr><th>Ligne publiée</th><th>Début</th><th>Fin</th><th>Avancement ouvrages</th></tr></thead><tbody>
            @for(row of v.content.rows;track row.id){<tr><td [class.child]="row.parentId">{{ row.label }}</td><td>{{ row.start ? (row.start|date:'dd/MM/yyyy') : 'Non planifié' }}</td><td>{{ row.finish ? (row.finish|date:'dd/MM/yyyy') : '—' }}</td><td>{{ row.progress==null ? '—' : (row.progress|number:'1.0-1')+' %' }}</td></tr>}
          </tbody></table></div>
          @for(a of v.acknowledgements;track $index){<article><strong>{{ outcome(a.outcome) }} · {{ a.date|date:'dd/MM/yyyy' }}</strong><p>{{ a.clientName }} · Preuve : {{ a.evidence }}</p><p>{{ a.note }}</p><small>Enregistré le {{ a.recordedAt|date:'dd/MM/yyyy HH:mm' }} par {{ a.actor }}</small></article>}
          @if(canPublish()){
            <nf-button variant="tertiary" [disabled]="busy()" (clicked)="selectReturn(v.id)">Enregistrer un retour client</nf-button>
            @if(returnId===v.id){<fieldset [disabled]="busy()"><legend>Retour sur la version V{{ v.numero }}</legend>
              <label>Retour <select [(ngModel)]="returnOutcome"><option value="ACCORD">Accord</option><option value="RESERVES">Réserves</option><option value="REFUS">Refus</option></select></label>
              <label>Date du retour <input type="date" [(ngModel)]="returnDate" /></label>
              <label>Interlocuteur client <input [(ngModel)]="clientName" maxlength="200" /></label>
              <label>Référence de la preuve (courrier, PV, document) <input [(ngModel)]="evidence" maxlength="1000" /></label>
              <label>Note <textarea [(ngModel)]="note" maxlength="4000" rows="2"></textarea></label>
              <p>Conservez la pièce dans les documents du chantier. Cet enregistrement trace un retour ; il ne vérifie pas une signature électronique.</p>
              <nf-button [disabled]="busy() || !returnDate || !clientName.trim() || !evidence.trim()" (clicked)="acknowledge(v)">Enregistrer le retour et sa preuve</nf-button>
            </fieldset>}
          }
          <details><summary>Traçabilité de publication</summary><p>Publié par {{ v.publishedBy }} · Identifiant {{ v.id }}</p></details>
        </details>
      } @empty{<p>Aucune version publiée.</p>}
    </details>
  `,
  styles:[`.panel > p{margin:.65rem 0;line-height:1.5}.actions{margin:.75rem 0}h3{margin:1rem 0 .4rem}article p{margin:.4rem 0}summary{line-height:1.5}fieldset{padding:.75rem}`,
    `.panel{margin:1rem 0;padding:1rem;border:1px solid var(--nf-color-border);border-radius:.65rem}summary{cursor:pointer}summary span{margin-left:.75rem;font-size:.8rem;color:var(--nf-color-text-secondary)}p,li{font-size:.85rem}.actions{display:flex;gap:.5rem;flex-wrap:wrap}h3{font-size:1rem}details details,article{margin-top:.8rem;padding:.6rem;border-top:1px solid var(--nf-color-border)}label{display:grid;gap:.3rem;margin:.6rem 0;font-size:.85rem}input,select,textarea{font:inherit;padding:.5rem;border:1px solid var(--nf-color-border);border-radius:.4rem}fieldset{margin-top:.75rem;border:1px solid var(--nf-color-border)}.table-wrap{overflow:auto;max-height:22rem;margin:.75rem 0}table{width:100%;border-collapse:collapse;font-size:.85rem}th,td{text-align:left;padding:.6rem;border-bottom:1px solid var(--nf-color-border)}th{position:sticky;top:0;background:var(--nf-color-surface,#fff)}.child{padding-left:2rem}[role=alert]{color:#b42318}`]
})
export class PlanningPublicationsComponent {
  readonly chantierId=input.required<string>();readonly technical=input(false);readonly execution=input(false);
  readonly api=inject(ActiviteApiService);readonly versions=signal<PublicationVersion[]>([]);readonly preview=signal<PublicationPreview|null>(null);
  readonly canPublish=signal(false);readonly busy=signal(false);readonly error=signal('');readonly message=signal('');
  readonly changes=computed(()=>this.preview()&&this.versions().length?publicationChanges(this.versions()[0].content,this.preview()!.content):[]);
  title='';opened=false;returnId='';returnOutcome='ACCORD';returnDate='';clientName='';evidence='';note='';private generation=0;
  constructor(){effect(()=>{this.chantierId();this.technical();this.execution();untracked(()=>{this.versions.set([]);this.preview.set(null);this.canPublish.set(false);this.returnId='';this.message.set('');void this.reload();});});}
  ngOnDestroy(){this.generation++;}
  async reload(){const id=this.chantierId(),g=++this.generation;this.busy.set(true);this.error.set('');
    try{const [versions,p]=await Promise.all([this.api.planningPublications(id),this.api.previewPublication(id,{technical:this.technical(),execution:this.execution()})]);if(g===this.generation){this.versions.set(versions);this.canPublish.set(p.canPublish);}}
    catch(e:any){if(g===this.generation)this.error.set(this.reason(e));}finally{if(g===this.generation)this.busy.set(false);}}
  async prepare(){const id=this.chantierId(),g=++this.generation;this.busy.set(true);this.error.set('');this.message.set('');this.preview.set(null);
    try{const p=await this.api.previewPublication(id,{technical:this.technical(),execution:this.execution()});if(g===this.generation){this.preview.set(p);this.canPublish.set(p.canPublish);this.title=`Planning client — ${p.content.chantierCode}`;}}
    catch(e:any){if(g===this.generation)this.error.set(this.reason(e));}finally{if(g===this.generation)this.busy.set(false);}}
  async publish(){const p=this.preview();if(!p||this.busy())return;const id=this.chantierId(),g=this.generation;this.busy.set(true);this.error.set('');
    try{const v=await this.api.publishPlanning(id,{title:this.title,token:p.token,options:p.content.options});if(g===this.generation){this.versions.update(all=>[v,...all]);this.preview.set(null);this.message.set(`Version V${v.numero} figée. Vous pouvez l’exporter.`);}}
    catch(e:any){if(g===this.generation){this.error.set(this.reason(e));this.preview.set(null);}}finally{if(g===this.generation)this.busy.set(false);}}
  selectReturn(id:string){this.returnId=id;this.returnOutcome='ACCORD';this.returnDate='';this.clientName='';this.evidence='';this.note='';}
  async acknowledge(v:PublicationVersion){if(this.busy())return;const id=this.chantierId(),g=this.generation;this.busy.set(true);this.error.set('');
    try{const next=await this.api.acknowledgePlanning(id,v.id,{version:v.version,outcome:this.returnOutcome,date:this.returnDate,clientName:this.clientName,evidence:this.evidence,note:this.note});if(g===this.generation){this.versions.update(all=>all.map(x=>x.id===v.id?next:x));this.returnId='';this.message.set('Retour client ajouté à l’historique.');}}
    catch(e:any){if(g===this.generation)this.error.set(this.reason(e));}finally{if(g===this.generation)this.busy.set(false);}}
  outcome(value:string){return ({ACCORD:'Accord',RESERVES:'Réserves',REFUS:'Refus'} as Record<string,string>)[value]??value;}
  private reason(e:any){return e?.error?.message||e?.error?.detail||'Action indisponible. Actualisez et vérifiez vos droits.';}
  exportVersion(v:PublicationVersion){const rows:unknown[][]=[['Planning client',v.content.chantierCode,v.content.chantierName],['Version',v.numero,v.title,v.publishedAt],['Client',v.content.client],[],['Ligne','Parent','Début','Fin','Avancement ouvrages (%)']];
    v.content.rows.forEach(r=>rows.push([r.label,v.content.rows.find(p=>p.id===r.parentId)?.label??'',r.start??'Non planifié',r.finish,r.progress]));
    const escape=(value:unknown)=>{let s=String(value??'');if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(escape).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`planning-client-v${v.numero}-${v.id}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
