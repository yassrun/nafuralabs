package ma.nafura.platform.documents.docextractor.plan;

/**
 * Comment lire ce fichier. Typé, borné — jamais du code généré.
 * Attaché à une trame, mis en cache par empreinte (par tenant).
 */
public record ReadingPlan(
        /** Feuille / pages, où commence le tableau. */
        String source,
        /** Étiquette → champ, par position relative. Vide en vague 1. */
        java.util.List<Anchor> anchors,
        /** Indice de colonne → champ du dataSchema. */
        java.util.List<ColumnBinding> columns,
        java.util.List<RowClass> rowClasses,
        Hierarchy hierarchy,
        /** Réservé pour la matrice — nommé, non résolu. */
        Depivot depivot,
        /** Collections à la racine. Objet racine, toujours. */
        java.util.List<String> arrayPaths
) {
    public ReadingPlan {
        source = source == null || source.isBlank() ? "grid" : source;
        anchors = anchors == null ? java.util.List.of() : java.util.List.copyOf(anchors);
        columns = columns == null ? java.util.List.of() : java.util.List.copyOf(columns);
        rowClasses = rowClasses == null ? java.util.List.of() : java.util.List.copyOf(rowClasses);
        hierarchy = hierarchy == null ? Hierarchy.NONE : hierarchy;
        depivot = depivot == null ? Depivot.RESERVED : depivot;
        arrayPaths = arrayPaths == null ? java.util.List.of() : java.util.List.copyOf(arrayPaths);
    }

    /** Étiquette voisine d'une valeur — lecteur d'ancres, vague 2. */
    public record Anchor(String label, String field) {}

    public record ColumnBinding(int index, String field) {}

    public record RowClass(String name, String signal) {}

    public enum Hierarchy {
        NONE,
        LEARNED
    }

    public enum Depivot {
        RESERVED
    }
}
