import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import type { AssistantBlock, AssistantLink } from '../services/conversation-api.service';

@Component({
  selector: 'nf-assistant-block-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (summary()) {
      <p class="nf-assistant-block__summary">{{ summary() }}</p>
    }

    @for (block of blocks(); track $index) {
      <article class="nf-assistant-block" [attr.data-type]="block.type">
        @if (block.title) {
          <h4 class="nf-assistant-block__title">{{ block.title }}</h4>
        }
        @switch (block.type) {
          @case ('KPI') {
            <div class="nf-assistant-block__kpi">{{ block.content }}</div>
          }
          @case ('LIST') {
            <ul class="nf-assistant-block__list">
              @for (item of listItems(block); track $index) {
                <li>{{ formatItem(item) }}</li>
              }
            </ul>
          }
          @default {
            @if (block.content) {
              <div class="nf-assistant-block__text">{{ block.content }}</div>
            }
          }
        }
      </article>
    }

    @if (links().length) {
      <div class="nf-assistant-block__links">
        @for (link of links(); track link.route) {
          <button type="button" class="nf-assistant-block__link" (click)="navigate.emit(link.route)">
            {{ link.label }}
          </button>
        }
      </div>
    }
  `,
  styles: [
    `
      .nf-assistant-block__summary {
        margin: 0 0 0.5rem;
      }
      .nf-assistant-block {
        margin-top: 0.5rem;
        padding: 0.5rem 0.65rem;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 8px;
      }
      .nf-assistant-block__title {
        margin: 0 0 0.35rem;
        font-size: 0.85rem;
      }
      .nf-assistant-block__kpi {
        font-size: 1.25rem;
        font-weight: 600;
      }
      .nf-assistant-block__list {
        margin: 0;
        padding-left: 1rem;
      }
      .nf-assistant-block__links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.5rem;
      }
      .nf-assistant-block__link {
        border: 1px solid var(--nf-border-default, #d1d5db);
        background: var(--nf-color-surface, #fff);
        border-radius: 999px;
        padding: 0.2rem 0.65rem;
        cursor: pointer;
      }
    `,
  ],
})
export class AssistantBlockRendererComponent {
  readonly summary = input<string | null | undefined>('');
  readonly blocks = input<AssistantBlock[]>([]);
  readonly links = input<AssistantLink[]>([]);
  readonly navigate = output<string>();

  listItems(block: AssistantBlock): unknown[] {
    const items = block.data?.['items'];
    return Array.isArray(items) ? items : [];
  }

  formatItem(item: unknown): string {
    if (item == null) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object') {
      const record = item as Record<string, unknown>;
      return String(record['title'] ?? record['label'] ?? record['name'] ?? record['code'] ?? JSON.stringify(item));
    }
    return String(item);
  }
}
