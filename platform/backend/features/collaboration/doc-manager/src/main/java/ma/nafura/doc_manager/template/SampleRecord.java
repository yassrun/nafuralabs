package ma.nafura.platform.collaboration.docmanager.template;

import java.util.UUID;

/**
 * A real record offered in the editor's "preview with" picker.
 *
 * @param id    entity id, passed back as {@code sampleEntityId} when previewing
 * @param label what the user sees, e.g. "DEV-2026-001 — Résidence Al Manar"
 */
public record SampleRecord(UUID id, String label) {}
