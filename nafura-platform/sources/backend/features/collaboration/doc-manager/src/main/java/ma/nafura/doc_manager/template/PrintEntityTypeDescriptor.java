package ma.nafura.platform.collaboration.docmanager.template;

/**
 * A printable document type declared by a product module.
 *
 * <p>Replaces the bare {@code String} the admin UI used to show raw ("devis"): the editor needs a
 * translatable label, and the preview needs to know whether real records can be picked.
 *
 * @param code             stored in {@code DocumentTemplate.entityType}, e.g. "facture_client"
 * @param labelKey         i18n key for the display label
 * @param module           owning module, for diagnostics ("etudes", "ventes")
 * @param supportsRealPreview whether the provider can search and resolve real records
 */
public record PrintEntityTypeDescriptor(
        String code, String labelKey, String module, boolean supportsRealPreview) {

    public static PrintEntityTypeDescriptor of(String code, String labelKey, String module) {
        return new PrintEntityTypeDescriptor(code, labelKey, module, true);
    }
}
