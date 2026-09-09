import { Component, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, DrawerComponent } from '@platform/lib/anatomy/components';
import type { CalendrierCreneau, CalendrierException } from '../../../services/activite-api.service';
import { PlanningFacade, toIsoDate } from '../../services/planning.facade';

@Component({
  selector: 'app-calendrier-drawer', standalone: true,
  imports: [FormsModule, ButtonComponent, DrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-drawer [open]="facade.calendarOpen()" [title]="facade.calendarScope() === 'activite' ? 'Calendrier de cette activité' : 'Calendrier du chantier'" size="md" (closed)="facade.closeCalendar()">
      @if (facade.calendarOpen()) {
      <form class="calendar-editor" (submit)="$event.preventDefault(); save()">
        <p>Définissez les jours travaillés, les équipes de nuit et les exceptions datées.</p>
        <fieldset [disabled]="!facade.capacites().administrerCalendrier || facade.saving()">
          <div class="row">
            @if (facade.calendarScope() === 'chantier') { <label>Date d’effet <input type="date" name="effective" [(ngModel)]="effective" required /></label> }
            <label>Fuseau horaire <input name="timezone" [(ngModel)]="timezone" required placeholder="Africa/Casablanca" /></label>
          </div>
          <h3>Semaine type</h3>
          @for (day of days; track $index; let index = $index) {
            <section class="day"><strong>{{ day }}</strong>
              @for (slot of slots; track $index; let slotIndex = $index) {
                @if (slot.jourSemaine === index + 1) {
                  <div class="row">
                    <label>Début <input type="time" [name]="'start' + slotIndex" [(ngModel)]="slot.heureDebut" required /></label>
                    <label>Fin <input type="time" [name]="'end' + slotIndex" [(ngModel)]="slot.heureFin" required /></label>
                    <label><input type="checkbox" [name]="'night' + slotIndex" [(ngModel)]="slot.lendemain" /> Fin le lendemain</label>
                    <button type="button" (click)="removeSlot(slotIndex)" [attr.aria-label]="'Supprimer le créneau du ' + day">Retirer</button>
                  </div>
                }
              }
              @if (!hasDay(index + 1)) { <span class="muted">Non travaillé</span> }
              <button type="button" (click)="addSlot(index + 1)">+ Créneau</button>
            </section>
          }
          <h3>Jours fériés et exceptions</h3>
          @for (exception of exceptions; track $index; let index = $index) {
            <section class="day">
              <div class="row">
                <label>Date <input type="date" [name]="'exceptionDate' + index" [(ngModel)]="exception.dateLocale" required /></label>
                <label>Organisation <select [name]="'exceptionType' + index" [(ngModel)]="exception.type" (ngModelChange)="changeException(exception)"><option value="FERMETURE">Non travaillé</option><option value="OUVERTURE">Horaires spécifiques</option></select></label>
                <button type="button" (click)="removeException(index)">Retirer</button>
              </div>
              @if (exception.type === 'OUVERTURE') {
                @for (slot of exception.creneaux; track $index; let j = $index) {
                  <div class="row">
                    <label>Début <input type="time" [name]="'exStart' + index + '-' + j" [(ngModel)]="slot.heureDebut" required /></label>
                    <label>Fin <input type="time" [name]="'exEnd' + index + '-' + j" [(ngModel)]="slot.heureFin" required /></label>
                    <label><input type="checkbox" [name]="'exNight' + index + '-' + j" [(ngModel)]="slot.lendemain" /> Fin le lendemain</label>
                  </div>
                }
                <button type="button" (click)="addExceptionSlot(exception)">+ Créneau</button>
              }
            </section>
          }
          <button type="button" (click)="addException()">+ Exception datée</button>
        </fieldset>
        <p class="muted">{{ facade.calendarScope() === 'activite' ? 'Ce calendrier remplace celui du chantier pour cette activité. Il sera enregistré avec l’activité.' : 'Enregistrer met à jour la version à cette date d’effet. Les activités existantes ne sont pas recalculées automatiquement.' }}</p>
        @if (error() || facade.calendarError()) { <p role="alert">{{ error() || facade.calendarError() }}</p> }
        <div class="footer">
          <nf-button variant="secondary" (clicked)="facade.closeCalendar()">Annuler</nf-button>
          @if (facade.capacites().administrerCalendrier) {
            <nf-button [disabled]="facade.saving()" (clicked)="save()">{{ facade.saving() ? 'Enregistrement…' : (facade.calendarScope() === 'activite' ? 'Appliquer à l’activité' : 'Enregistrer le calendrier') }}</nf-button>
          }
        </div>
      </form>
      }
    </nf-drawer>
  `,
  styles: [`
    .calendar-editor { display:grid; gap:1rem; }
    fieldset { border:0; padding:0; min-width:0; }
    .row { display:flex; flex-wrap:wrap; gap:.6rem; align-items:end; }
    label { display:grid; gap:.3rem; font-size:.8rem; }
    input, select, button { font:inherit; padding:.5rem; border:1px solid var(--nf-color-border, #dbe2ee); border-radius:.4rem; background:var(--nf-color-surface, white); color:inherit; }
    button { cursor:pointer; } input[type=checkbox] { width:1rem; }
    .day { display:grid; gap:.5rem; padding:.75rem 0; border-bottom:1px solid var(--nf-color-border, #dbe2ee); }
    .day > button { justify-self:start; } .muted { font-size:.8rem; color:var(--nf-color-text-secondary); }
    .footer { display:flex; justify-content:flex-end; gap:.75rem; position:sticky; bottom:0; background:var(--nf-color-surface, white); padding:.75rem 0; }
    [role=alert] { color:var(--nf-color-danger-600, #b91c1c); }
  `],
})
export class CalendrierDrawerComponent {
  readonly facade = inject(PlanningFacade);
  readonly days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  readonly error = signal('');
  slots: CalendrierCreneau[] = [];
  exceptions: CalendrierException[] = [];
  effective = ''; timezone = '';
  constructor() {
    effect(() => {
      if (!this.facade.calendarOpen()) return;
      const context = this.facade.calendarEditorContext();
      this.slots = structuredClone(context.creneaux);
      this.exceptions = structuredClone(context.exceptions);
      this.effective = context.dateEffet || toIsoDate(new Date());
      this.timezone = context.fuseauIana;
      this.error.set('');
    });
  }
  hasDay(day: number): boolean { return this.slots.some(slot => slot.jourSemaine === day); }
  addSlot(day: number): void { this.slots.push({ jourSemaine: day, heureDebut: '08:00', heureFin: '16:00', lendemain: false }); }
  removeSlot(index: number): void { this.slots.splice(index, 1); }
  addException(): void { this.exceptions.push({ dateLocale: '', type: 'FERMETURE', creneaux: [] }); }
  removeException(index: number): void { this.exceptions.splice(index, 1); }
  changeException(exception: CalendrierException): void { exception.creneaux = []; if (exception.type === 'OUVERTURE') this.addExceptionSlot(exception); }
  addExceptionSlot(exception: CalendrierException): void { (exception.creneaux ??= []).push({ heureDebut: '08:00', heureFin: '16:00', lendemain: false }); }
  async save(): Promise<void> {
    this.error.set('');
    if (!this.effective || !this.timezone.trim() || this.exceptions.some(ex => !ex.dateLocale)) {
      this.error.set('Renseignez la date d’effet, le fuseau et la date de chaque exception.'); return;
    }
    try { new Intl.DateTimeFormat('fr', { timeZone: this.timezone }); }
    catch { this.error.set('Le fuseau horaire doit être valide, par exemple Africa/Casablanca.'); return; }
    const slots = [...this.slots, ...this.exceptions.flatMap(ex => ex.creneaux ?? [])];
    if (slots.some(slot => !slot.heureDebut || !slot.heureFin || (!slot.lendemain && slot.heureFin <= slot.heureDebut))) {
      this.error.set('Vérifiez les horaires. Pour un poste de nuit, cochez « Fin le lendemain ».'); return;
    }
    if (new Set(this.exceptions.map(ex => ex.dateLocale)).size !== this.exceptions.length) {
      this.error.set('Une seule exception est autorisée par date.'); return;
    }
    const result = await this.facade.saveCalendar({ dateEffet: this.effective, fuseauIana: this.timezone.trim(), creneaux: this.slots, exceptions: this.exceptions });
    if (result.ok) this.facade.closeCalendar();
    else if (result.message) this.error.set(result.message);
  }
}
