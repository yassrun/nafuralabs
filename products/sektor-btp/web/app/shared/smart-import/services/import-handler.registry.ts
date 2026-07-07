import { Injectable } from '@angular/core';

import type { ImportHandler } from '../models/smart-import.model';

@Injectable({ providedIn: 'root' })
export class ImportHandlerRegistry {
  private readonly handlers = new Map<string, ImportHandler<unknown>>();

  register<T>(handler: ImportHandler<T>): void {
    this.handlers.set(handler.entityKey, handler as ImportHandler<unknown>);
  }

  get(entityKey: string): ImportHandler<unknown> | undefined {
    return this.handlers.get(entityKey);
  }

  require(entityKey: string): ImportHandler<unknown> {
    const handler = this.get(entityKey);
    if (!handler) {
      throw new Error(`SMART_IMPORT_HANDLER_NOT_FOUND:${entityKey}`);
    }
    return handler;
  }
}
