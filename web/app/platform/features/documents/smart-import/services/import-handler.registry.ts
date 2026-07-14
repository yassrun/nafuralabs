import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

import type { ImportHandler } from '../models/smart-import.model';
import { SmartImportError } from '../models/smart-import.errors';

export const SMART_IMPORT_HANDLERS = new InjectionToken<ImportHandler<unknown>[]>(
  'SMART_IMPORT_HANDLERS',
);

export function provideSmartImportHandler<T>(
  handlerOrFactory: ImportHandler<T> | (() => ImportHandler<T>),
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        const registry = inject(ImportHandlerRegistry);
        const handler =
          typeof handlerOrFactory === 'function'
            ? handlerOrFactory()
            : handlerOrFactory;
        registry.register(handler);
      },
    },
  ]);
}

@Injectable({ providedIn: 'root' })
export class ImportHandlerRegistry {
  private readonly handlers = new Map<string, ImportHandler<unknown>>();
  private readonly injectedHandlers = inject(SMART_IMPORT_HANDLERS, { optional: true }) ?? [];

  constructor() {
    for (const handler of this.injectedHandlers) this.register(handler);
  }

  register<T>(handler: ImportHandler<T>): void {
    this.handlers.set(handler.entityKey, handler as ImportHandler<unknown>);
  }

  get(entityKey: string): ImportHandler<unknown> | undefined {
    return this.handlers.get(entityKey);
  }

  require(entityKey: string): ImportHandler<unknown> {
    const handler = this.get(entityKey);
    if (!handler) {
      throw new SmartImportError(
        'HANDLER_MISSING',
        'platform.smartImport.errors.handlerMissing',
      );
    }
    return handler;
  }
}

