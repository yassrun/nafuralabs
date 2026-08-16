import type { JsonSchemaRoot } from '@platform/app/document-extraction/models/json-schema.model';
import type { UiSchema } from '@platform/app/document-extraction/models/ui-schema.model';
import type { DocTypeDefinition } from '@platform/app/document-extraction/models/doc-type-definition.model';

/**
 * Screen-owned extraction contract. Not loaded from DocTypeDefinition catalog.
 */
export interface ExtractionSchemaBundle {
  name: string;
  description?: string;
  dataSchema: JsonSchemaRoot;
  presentationSchema: UiSchema;
  instructions?: string;
  /** For bulk imports: path to the root array field. */
  arrayPath?: string;
}

/** Adapter for review UIs that still expect a DocTypeDefinition-shaped object. */
export function toReviewDefinition(bundle: ExtractionSchemaBundle): DocTypeDefinition {
  return {
    id: `local-${bundle.name}`,
    domainKey: 'local',
    docTypeKey: 'local',
    version: 1,
    name: bundle.name,
    description: bundle.description,
    status: 'PUBLISHED',
    origin: 'TENANT',
    jsonSchema: bundle.dataSchema,
    uiSchema: {
      ...bundle.presentationSchema,
      sections: bundle.presentationSchema.sections ?? [],
    },
    promptTemplate: bundle.instructions,
  };
}
