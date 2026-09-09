export interface PublicationOptions { technical:boolean;execution:boolean; }
export interface PublicationRow { id:string;parentId:string|null;kind:string;label:string;start:string|null;finish:string|null;progress:number|null; }
export interface PublicationContent { chantierCode:string;chantierName:string;client:string;options:PublicationOptions;rows:PublicationRow[]; }
export interface PublicationPreview { token:string;content:PublicationContent;canPublish:boolean; }
export interface PublicationVersion {
  id:string;version:number;numero:number;title:string;publishedAt:string;publishedBy:string;content:PublicationContent;
  acknowledgements:{outcome:string;date:string;clientName:string;evidence:string;note:string;actor:string;recordedAt:string}[];
}
export function publicationChanges(previous:PublicationContent,current:PublicationContent):string[] {
  const before=new Map(previous.rows.map(r=>[r.id,r]));const changes:string[]=[];
  if(previous.client!==current.client || previous.chantierCode!==current.chantierCode || previous.chantierName!==current.chantierName)changes.push('Identification du chantier ou du client modifiée');
  if(previous.options.technical!==current.options.technical || previous.options.execution!==current.options.execution)changes.push('Périmètre des activités complémentaires modifié');
  for(const row of current.rows){const old=before.get(row.id);if(!old)changes.push(`${row.label} : ajouté`);
    else {
      const details:string[]=[];
      if(old.start!==row.start||old.finish!==row.finish)details.push(`dates ${old.start??'non planifié'} → ${old.finish??'—'} remplacées par ${row.start??'non planifié'} → ${row.finish??'—'}`);
      if(old.progress!==row.progress)details.push(`avancement ${old.progress??'—'} % → ${row.progress??'—'} %`);
      if(old.label!==row.label)details.push('intitulé modifié');
      if(old.parentId!==row.parentId||old.kind!==row.kind)details.push('rattachement ou type modifié');
      if(details.length)changes.push(`${row.label} : ${details.join(' ; ')}`);
    }
    before.delete(row.id);
  }
  before.forEach(row=>changes.push(`${row.label} : retiré`));return changes;
}
