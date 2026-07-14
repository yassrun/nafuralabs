import type { ExtractionSchemaBundle } from './extraction-schema.types';

/** Schema expected by the reception detail screen when scanning a BL. */
export const RECEPTION_BL_EXTRACTION_SCHEMA: ExtractionSchemaBundle = {
  name: 'Bon de livraison',
  description: 'Delivery note: header + parties + line items for reception form fill.',
  instructions: `You are a document extraction assistant. Extract data for a Bon de Livraison (BL).
Return ONLY valid JSON that matches the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- If a required field is not found in the document, you MUST use null.
- Do NOT invent values. Only extract information that is explicitly visible.
- Dates must be YYYY-MM-DD. Numbers must be numeric values.`,
  dataSchema: {
    type: 'object',
    required: ['blReference', 'date', 'sender', 'receiver', 'items'],
    properties: {
      blReference: { type: 'string', title: 'BL Reference' },
      date: { type: 'string', format: 'date', title: 'Date' },
      issuer: { type: 'string', title: 'Issuer' },
      sender: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', title: 'Sender name' },
          address: { type: 'string', title: 'Sender address' },
        },
      },
      receiver: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', title: 'Receiver name' },
          address: { type: 'string', title: 'Receiver address' },
        },
      },
      items: {
        type: 'array',
        minItems: 0,
        items: {
          type: 'object',
          required: ['itemReference', 'itemDesignation', 'quantity', 'uom'],
          properties: {
            itemReference: { type: 'string', title: 'Item ref' },
            itemDesignation: { type: 'string', title: 'Designation' },
            quantity: { type: 'number', title: 'Quantity' },
            uom: { type: 'string', title: 'Unit' },
            unitPrice: { type: 'number', title: 'Unit price' },
            totalPrice: { type: 'number', title: 'Total price' },
          },
        },
      },
    },
  },
  presentationSchema: {
    importPolicy: 'PARTIAL',
    sections: [
      {
        title: 'Header',
        columns: 2,
        fields: [
          { path: 'blReference', label: 'BL Reference' },
          { path: 'date', label: 'Date' },
          { path: 'issuer', label: 'Issuer' },
        ],
      },
      {
        title: 'Sender',
        columns: 2,
        fields: [
          { path: 'sender.name', label: 'Name' },
          { path: 'sender.address', label: 'Address' },
        ],
      },
      {
        title: 'Receiver',
        columns: 2,
        fields: [
          { path: 'receiver.name', label: 'Name' },
          { path: 'receiver.address', label: 'Address' },
        ],
      },
    ],
    arrays: [
      {
        path: 'items',
        title: 'Items',
        columns: [
          { path: 'itemReference', label: 'Ref', widthPx: 140 },
          { path: 'itemDesignation', label: 'Designation' },
          { path: 'quantity', label: 'Qty', widthPx: 90 },
          { path: 'uom', label: 'UoM', widthPx: 90 },
          { path: 'unitPrice', label: 'Unit Price', widthPx: 110 },
          { path: 'totalPrice', label: 'Total', widthPx: 110 },
        ],
      },
    ],
  },
};
