import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ContextHeaderComponent } from '../../../../../lib/design-system';

@Component({
  selector: 'app-extraction-settings-shell-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, TranslateModule, ContextHeaderComponent],
  templateUrl: './extraction-settings-shell-page.component.html',
  styleUrl: './extraction-settings-shell-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtractionSettingsShellPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  goGeneral(): void {
    this.router.navigate(['./general'], { relativeTo: this.route });
  }
}


