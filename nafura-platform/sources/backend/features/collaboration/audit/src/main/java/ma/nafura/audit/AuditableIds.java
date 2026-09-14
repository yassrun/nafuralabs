package ma.nafura.platform.collaboration.audit;

/**
 * Resolves the journal id of an entity. Business keys are not always UUID
 * (chantier, employé, demande d'approbation).
 */
public final class AuditableIds {

    private AuditableIds() {}

    public static String of(Object entity) {
        if (entity == null) {
            return null;
        }
        Object id = AuditPayloadBuilder.getValue(entity, "id");
        return id == null ? null : id.toString();
    }

    public static String ofUuid(java.util.UUID id) {
        return id == null ? null : id.toString();
    }
}
