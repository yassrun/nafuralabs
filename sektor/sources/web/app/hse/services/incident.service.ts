import { Injectable } from '@angular/core';

import type { Incident, TypeIncident } from '../models';

@Injectable({ providedIn: 'root' })
export class IncidentService {
  /** AT* ou MP → obligation déclaration CNSS DAT (M-INT-03 branchement ultérieur). */
  requiresCnssDeclaration(incident: Incident): boolean {
    const t = incident.typeIncident;
    if (t === 'MP') return true;
    if (t === 'AT_TRAVAIL' || t === 'AT_TRAJET') return true;
    return false;
  }

  /** Heures calendaires restantes avant fin du délai de 48 h (compteur alerte). */
  hoursUntilCnssDeadline(incident: Incident): number {
    const start = this.parseIncidentStart(incident);
    const deadline = new Date(start.getTime() + 48 * 60 * 60 * 1000);
    return (deadline.getTime() - Date.now()) / (3600 * 1000);
  }

  isCnssDeadlinePassed(incident: Incident): boolean {
    const start = this.parseIncidentStart(incident);
    const deadline = new Date(start.getTime() + 48 * 60 * 60 * 1000);
    return Date.now() > deadline.getTime();
  }

  isCnssWithin48hWindow(incident: Incident): boolean {
    return !this.isCnssDeadlinePassed(incident);
  }

  nextMockCnssReference(type: TypeIncident | undefined): string {
    const y = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 900) + 100;
    const prefix = type === 'MP' ? 'CNSS-MP' : 'CNSS-DA';
    return `${prefix}-${y}-${seq}`;
  }

  buildCnssDatPrintHtml(incident: Incident): string {
    const ref = incident.cnssReferenceDeclaration ?? '—';
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Déclaration CNSS DAT — ${esc(incident.numero)}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#111;} h1{font-size:18px;} table{width:100%;border-collapse:collapse;font-size:13px;margin-top:12px;} th,td{border:1px solid #ccc;padding:8px;text-align:left;} th{background:#f4f4f4;}</style></head><body>
<h1>Déclaration CNSS — DAT (démo)</h1>
<p>Document généré à titre de maquette — envoi API DAMANCOM / XML (M-INT-03) à brancher.</p>
<table>
<tr><th>N° interne</th><td>${esc(incident.numero)}</td></tr>
<tr><th>Date / heure</th><td>${esc(incident.date)}${incident.heure ? ' ' + esc(incident.heure) : ''}</td></tr>
<tr><th>Chantier</th><td>${esc(incident.chantierCode ?? '—')}</td></tr>
<tr><th>Type</th><td>${esc(incident.typeIncident ?? '—')}</td></tr>
<tr><th>Réf. CNSS</th><td>${esc(ref)}</td></tr>
<tr><th>Victime</th><td>${esc(incident.victimeNom ?? '—')} / ${esc(incident.cnssMatriculeVictime ?? '—')}</td></tr>
<tr><th>Description</th><td>${esc(incident.description)}</td></tr>
</table>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
  }

  private parseIncidentStart(incident: Incident): Date {
    const d = incident.date;
    if (!incident.heure) return new Date(`${d}T08:00:00`);
    const [hh, mm] = incident.heure.split(':').map((x) => parseInt(x, 10));
    const h = Number.isFinite(hh) ? hh : 8;
    const m = Number.isFinite(mm) ? mm : 0;
    return new Date(`${d}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  }
}
