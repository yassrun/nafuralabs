import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

import type { ChatDataCard } from './ai-assistant.types';

@Component({
  selector: 'app-chat-data-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="chat-data-card">
      <h4>{{ card().title }}</h4>

      <ng-container [ngSwitch]="card().type">
        <div *ngSwitchCase="'kpi'" class="chat-data-card__kpi">
          <strong>{{ card().data['value'] ?? '-' }}</strong>
          <small>{{ card().data['trend'] ?? '' }}</small>
        </div>

        <table *ngSwitchCase="'table'" class="chat-data-card__table">
          <tbody>
            <tr *ngFor="let entry of entries()">
              <th>{{ entry[0] }}</th>
              <td>{{ entry[1] }}</td>
            </tr>
          </tbody>
        </table>

        <ul *ngSwitchDefault class="chat-data-card__list">
          <li *ngFor="let entry of entries()">
            <strong>{{ entry[0] }}:</strong> {{ entry[1] }}
          </li>
        </ul>
      </ng-container>
    </article>
  `,
  styles: [
    `
      .chat-data-card {
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 10px;
        padding: 0.5rem 0.6rem;
        background: var(--nf-surface-page, #f9fafb);
        display: grid;
        gap: 0.5rem;
      }
      .chat-data-card h4 {
        margin: 0;
        font-size: 0.85rem;
      }
      .chat-data-card__kpi {
        display: grid;
        gap: 0.2rem;
      }
      .chat-data-card__kpi strong {
        font-size: 1.1rem;
      }
      .chat-data-card__table {
        width: 100%;
        border-collapse: collapse;
      }
      .chat-data-card__table th,
      .chat-data-card__table td {
        border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
        padding: 0.25rem 0;
        text-align: left;
        font-size: 0.78rem;
      }
      .chat-data-card__list {
        margin: 0;
        padding-left: 1rem;
      }
    `,
  ],
})
export class ChatDataCardComponent {
  readonly card = input.required<ChatDataCard>();

  entries(): Array<[string, string]> {
    return Object.entries(this.card().data ?? {}).map(([key, value]) => [key, String(value)]);
  }
}
