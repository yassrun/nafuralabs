/**
 * Zones where the custom pencil must hide and the native cursor shows.
 * Project cards are handled separately (circle cursor) even with data-no-draw.
 */
export const NATIVE_CURSOR_SELECTOR = [
  "a",
  "button",
  "header",
  "nav",
  "footer",
  "input",
  "textarea",
  "select",
  "label",
  "dialog",
  '[role="button"]',
  "[data-no-draw]",
].join(", ");
