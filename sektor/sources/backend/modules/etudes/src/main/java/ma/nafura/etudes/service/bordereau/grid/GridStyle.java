package ma.nafura.etudes.service.bordereau.grid;

/**
 * Mise en forme d'une ligne, dans la mesure où la source la porte.
 *
 * <p>Ces signaux ne servent pas à décorer : dans bien des bordereaux ils <em>sont</em> la
 * structure. Un classeur marque typiquement ses lots par un fond de couleur et une taille de
 * police, sans qu'aucune numérotation ne le dise. La chaîne ne présume d'aucune convention —
 * elle relève la mise en forme des lignes indiscutables, puis lit le reste à travers elle.
 *
 * <p>Un PDF ne fournit ni fond ni fusion exploitables : {@link #NONE} y est la norme, et la
 * classification s'appuie alors sur la numérotation. Aucun étage n'exige ces signaux.
 */
public record GridStyle(
        /** Couleur de fond, format {@code AARRGGBB}, ou vide. */
        String fill,
        /** Corps de la police en points, ou 0 si inconnu. */
        double fontSize,
        boolean bold,
        /** La ligne porte une cellule fusionnée à gauche — marqueur structurel fréquent. */
        boolean merged) {

    public static final GridStyle NONE = new GridStyle("", 0d, false, false);

    public GridStyle {
        fill = fill == null ? "" : fill;
    }

    /** Aucun signal de mise en forme exploitable sur cette ligne. */
    public boolean isBlank() {
        return fill.isEmpty() && fontSize == 0d && !bold && !merged;
    }
}
