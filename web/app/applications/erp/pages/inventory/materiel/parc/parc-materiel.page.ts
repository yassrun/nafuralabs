import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterielListingPage } from '../../catalogue/materiel/materiel-listing';

@Component({
  selector: 'app-parc-materiel',
  standalone: true,
  imports: [CommonModule, MaterielListingPage],
  template: `<app-materiel-listing></app-materiel-listing>`,
})
export class ParcMaterielPage {}
