import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppShellComponent } from '../app-shell/app-shell.component';

@Component({
  selector: 'nf-host-shell',
  standalone: true,
  imports: [AppShellComponent, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<nf-app-shell><router-outlet /></nf-app-shell>`,
  styles: [`:host { display: block; min-height: 100%; }`],
})
export class NafuraHostShellComponent {}

@Component({
  selector: 'nf-host-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class NafuraHostRootComponent {}
