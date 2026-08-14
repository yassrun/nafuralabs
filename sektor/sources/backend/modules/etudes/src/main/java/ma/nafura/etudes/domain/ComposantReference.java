package ma.nafura.etudes.domain;

import java.util.UUID;
import org.springframework.util.StringUtils;

/**
 * Résolution et validation de la référence typée d'un composant (L2).
 * La contrainte d'exclusivité est aussi en base ; ce helper normalise l'entrée API.
 */
public final class ComposantReference {

    private final ReferenceType type;
    private final UUID itemId;
    private final UUID ouvrageId;
    private final String libelle;

    private ComposantReference(ReferenceType type, UUID itemId, UUID ouvrageId, String libelle) {
        this.type = type;
        this.itemId = itemId;
        this.ouvrageId = ouvrageId;
        this.libelle = libelle;
    }

    public ReferenceType type() {
        return type;
    }

    public UUID itemId() {
        return itemId;
    }

    public UUID ouvrageId() {
        return ouvrageId;
    }

    public String libelle() {
        return libelle;
    }

    /**
     * Normalise une saisie. Legacy {@code articleOuPosteId} / {@code articleId} → LIBRE + libellé.
     */
    public static ComposantReference resolve(
            String referenceTypeRaw,
            UUID itemId,
            UUID ouvrageId,
            String libelle,
            String legacyArticleRef) {
        ReferenceType type = ReferenceType.from(referenceTypeRaw);
        String resolvedLibelle = firstNonBlank(libelle, legacyArticleRef);

        if (type == null) {
            if (itemId != null && ouvrageId == null) {
                type = ReferenceType.ITEM;
            } else if (ouvrageId != null && itemId == null) {
                type = ReferenceType.OUVRAGE;
            } else {
                type = ReferenceType.LIBRE;
            }
        }

        return switch (type) {
            case ITEM -> {
                if (itemId == null) {
                    throw new IllegalArgumentException("etudes.composant.reference.item_id.required");
                }
                String label = requireLibelle(resolvedLibelle, itemId.toString());
                yield new ComposantReference(ReferenceType.ITEM, itemId, null, label);
            }
            case OUVRAGE -> {
                if (ouvrageId == null) {
                    throw new IllegalArgumentException("etudes.composant.reference.ouvrage_id.required");
                }
                String label = requireLibelle(resolvedLibelle, ouvrageId.toString());
                yield new ComposantReference(ReferenceType.OUVRAGE, null, ouvrageId, label);
            }
            case LIBRE -> {
                String label = requireLibelle(resolvedLibelle, null);
                yield new ComposantReference(ReferenceType.LIBRE, null, null, label);
            }
        };
    }

    public static ComposantReference libre(String libelle) {
        return resolve(ReferenceType.LIBRE.name(), null, null, libelle, null);
    }

    private static String requireLibelle(String libelle, String fallback) {
        String value = firstNonBlank(libelle, fallback);
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("etudes.composant.reference.libelle.required");
        }
        return value.trim();
    }

    private static String firstNonBlank(String a, String b) {
        if (StringUtils.hasText(a)) {
            return a.trim();
        }
        if (StringUtils.hasText(b)) {
            return b.trim();
        }
        return null;
    }
}
