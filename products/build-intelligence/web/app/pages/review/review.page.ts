import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'bi-review-page',
  template: `
    <section>
      <h1>Revue humaine</h1>
      <p>Validation, correction, fusion ou rejet des extractions.</p>
    </section>
  `,
})
export class ReviewPage {}
