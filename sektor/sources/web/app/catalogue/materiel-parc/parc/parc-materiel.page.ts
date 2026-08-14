import { Component, ChangeDetectionStrategy } from '@angular/core';

import { MaterielListingPage } from '../../materiel/materiel-listing';

@Component({
  selector: 'app-parc-materiel',
  standalone: true,
  imports: [MaterielListingPage],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<app-materiel-listing></app-materiel-listing>`,
})
export class ParcMaterielPage {}
