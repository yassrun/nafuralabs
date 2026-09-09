import type { PlanningSupply } from '../../services/activite-api.service';

export function supplyAlerts(row:PlanningSupply,today:string):string[] {
  const alerts:string[]=[];
  if(row.sourceUnavailable) return ['Demande liée introuvable ou inaccessible : vérifier dans Achats.'];
  if(row.demandStatus==='REJETEE') alerts.push('Demande rejetée : corriger la demande dans Achats.');
  if((!row.demandId || ['BROUILLON','REJETEE'].includes(row.demandStatus??'')) && row.launchDate<today)
    alerts.push('Date de lancement dépassée : préparer ou compléter la demande.');
  if(row.demandId && row.demandDate!==row.neededDate) alerts.push('Échéance de la demande différente du besoin actuel.');
  const active=row.orders.filter(o=>o.status!=='ANNULE');
  if(row.orders.length && !active.length) alerts.push('Toutes les commandes liées sont annulées.');
  if(row.demandStatus==='CONVERTIE' && !row.orders.length) alerts.push('Demande convertie, commande liée introuvable : vérifier dans Achats.');
  for(const order of active) {
    if(order.status==='LIVRE') continue;
    if(!order.expectedDate) alerts.push(`${order.number} : date de livraison à renseigner.`);
    else {
      if(order.expectedDate>row.neededDate) alerts.push(`${order.number} : livraison prévue après la date du besoin.`);
      if(order.expectedDate<today) alerts.push(`${order.number} : échéance dépassée, livraison complète à vérifier.`);
    }
    if(order.status==='BROUILLON') alerts.push(`${order.number} : commande encore en brouillon.`);
  }
  return alerts;
}
export function purchasingStatus(value:string|null):string {
  return ({BROUILLON:'Brouillon',SOUMISE:'Soumise',APPROUVEE:'Approuvée',REJETEE:'Rejetée',CONVERTIE:'Convertie en commande',VALIDE:'Validé',ENVOYE:'Envoyée',ACCUSE_RECEPTION:'Accusée réception',PARTIELLEMENT_LIVRE:'Partiellement livrée',LIVRE:'Livrée',FACTURE:'Facturée',CLOTURE:'Clôturée',ANNULE:'Annulé'} as Record<string,string>)[value??'']??value??'À préparer';
}
