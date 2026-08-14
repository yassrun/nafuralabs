package ma.nafura.etudes.service.bordereau.grid;

import java.util.List;

/**
 * Une ligne de tableau, telle qu'elle existe dans le fichier — quel que soit le contenant.
 *
 * <p>C'est le contrat commun des {@link GridSource} : un classeur, un tableau Word et un PDF
 * quadrillé produisent tous des {@code GridRow}. Tout ce qui suit dans la chaîne d'extraction
 * ne connaît que ce type, et reste donc identique d'un format à l'autre.
 *
 * <p>Les cellules sont indexées par colonne logique du tableau, cellule vide comprise : c'est ce
 * qui permet de lire une valeur par sa colonne plutôt que par sa position dans le flux texte.
 * C'est précisément ce qu'un parseur de flux ne peut pas faire, et la raison pour laquelle il
 * tronquait les libellés multi-colonnes.
 */
public record GridRow(
        /** Page (PDF) ou nom de feuille (classeur). Sert au diagnostic et au tri. */
        String page,
        /** Indice de la ligne dans sa page / feuille, 1-based. */
        int index,
        /** Cellules dans l'ordre des colonnes ; jamais {@code null}, éventuellement vides. */
        List<String> cells,
        /** Mise en forme de la première cellule non vide — souvent porteuse de la structure. */
        GridStyle style) {

    public GridRow {
        cells = cells == null ? List.of() : List.copyOf(cells);
        style = style == null ? GridStyle.NONE : style;
    }

    public static GridRow of(String page, int index, List<String> cells) {
        return new GridRow(page, index, cells, GridStyle.NONE);
    }

    /** Cellule à l'index donné, ou chaîne vide si la colonne n'existe pas sur cette ligne. */
    public String cell(int columnIndex) {
        if (columnIndex < 0 || columnIndex >= cells.size()) {
            return "";
        }
        String value = cells.get(columnIndex);
        return value == null ? "" : value.trim();
    }

    public boolean isEmpty() {
        return cells.stream().allMatch(c -> c == null || c.isBlank());
    }

    /** Index de la première colonne remplie — indice d'indentation dans bien des bordereaux. */
    public int firstFilledColumn() {
        for (int i = 0; i < cells.size(); i++) {
            String value = cells.get(i);
            if (value != null && !value.isBlank()) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Cellule la plus longue de la ligne, hors valeurs purement numériques.
     *
     * <p>Les titres de lot débordent souvent de leur colonne, ou sont posés dans une cellule
     * fusionnée à gauche du tableau : la colonne désignation est alors vide alors que le titre
     * est bien là.
     */
    public String longestTextCell() {
        String best = "";
        for (String value : cells) {
            if (value == null) {
                continue;
            }
            String trimmed = value.trim();
            if (trimmed.length() > best.length() && !isNumeric(trimmed)) {
                best = trimmed;
            }
        }
        return best;
    }

    private static boolean isNumeric(String value) {
        return value.matches("-?[\\d\\s\\u00a0]+(?:[.,]\\d+)?");
    }
}
