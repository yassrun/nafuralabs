package ma.nafura.etudes.service.bordereau.grid;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Correspondance entre les colonnes du fichier et les colonnes logiques du bordereau.
 *
 * <p>Les en-têtes varient d'un maître d'ouvrage à l'autre — {@code N°} ou {@code N° PRIX},
 * {@code UNITE} ou {@code U}, {@code QUANTITE} ou {@code QUANTITE TOTAL}. Quand l'en-tête ne
 * suffit pas, les colonnes se déduisent du contenu : celle qui porte le plus de texte est la
 * désignation, celle qui porte le plus de nombres est la quantité.
 *
 * <p>La colonne code est le cas le plus ingrat : elle n'a souvent aucun en-tête. Elle se
 * reconnaît à ses jetons courts et sans espace — {@code 1-3-1}, {@code a/2}, {@code 4.35} —
 * à gauche de la désignation.
 */
public record ColumnMap(int code, int designation, int unite, int quantite, int headerRow) {

    /** Colonne absente du fichier. */
    public static final int ABSENT = -1;

    private static final Map<String, Set<String>> SYNONYMS = new LinkedHashMap<>();

    static {
        SYNONYMS.put("code", Set.of("N", "N PRIX", "NPRIX", "CODE", "NUMERO", "REF"));
        SYNONYMS.put("designation", Set.of("DESIGNATION", "DESIGNATIONDESOUVRAGES", "LIBELLE",
                "OUVRAGE", "OUVRAGES", "NATUREDESTRAVAUX"));
        SYNONYMS.put("unite", Set.of("UNITE", "U", "UN", "UNITES"));
        SYNONYMS.put("quantite", Set.of("QUANTITE", "QUANTITES", "QTE", "Q", "QUANTITETOTAL"));
    }

    private static final Pattern NUMERIC = Pattern.compile("-?[\\d\\s\\u00a0]+(?:[.,]\\d+)?");
    private static final Pattern CODE_TOKEN =
            Pattern.compile("[A-Za-z]?\\d+(?:[-./][\\dA-Za-z]+)*|[a-zA-Z]/\\d+|[a-zA-Z]");

    /** Nombre minimum de jetons pour qu'une colonne soit tenue pour la colonne code. */
    private static final int CODE_TOKEN_THRESHOLD = 5;

    /**
     * Une colonne quantité a été identifiée dans le fichier.
     *
     * <p>Sert à distinguer deux situations que le taux de lignes chiffrées confond : un bordereau
     * de prix sans quantités — colonne présente, cellules vides — et une lecture ratée où les
     * colonnes sont parties en vrac. La première est un fait sur le document et doit être
     * acceptée ; seule la seconde justifie de rejeter la lecture.
     */
    public boolean hasQuantite() {
        return quantite != ABSENT;
    }

    public boolean hasCode() {
        return code != ABSENT;
    }

    /**
     * Déduit la correspondance des colonnes.
     *
     * @param rows lignes de la grille, en-tête compris
     */
    public static ColumnMap resolve(List<GridRow> rows) {
        if (rows.isEmpty()) {
            return new ColumnMap(ABSENT, 0, ABSENT, ABSENT, -1);
        }
        Map<String, Integer> found = new LinkedHashMap<>();
        int headerRow = -1;
        int bestScore = 0;

        int scanLimit = Math.min(rows.size(), 40);
        for (int position = 0; position < scanLimit; position++) {
            Map<String, Integer> candidate = new LinkedHashMap<>();
            int score = 0;
            List<String> cells = rows.get(position).cells();
            for (int column = 0; column < cells.size(); column++) {
                String folded = fold(cells.get(column));
                if (folded.isEmpty() || folded.length() > 34) {
                    continue;
                }
                for (Map.Entry<String, Set<String>> entry : SYNONYMS.entrySet()) {
                    if (!candidate.containsKey(entry.getKey()) && entry.getValue().contains(folded)) {
                        candidate.put(entry.getKey(), column);
                        score += switch (entry.getKey()) {
                            case "designation", "quantite" -> 2;
                            default -> 1;
                        };
                    }
                }
            }
            if (score > bestScore) {
                found = candidate;
                bestScore = score;
                headerRow = position;
            }
        }

        int columnCount = rows.stream().mapToInt(r -> r.cells().size()).max().orElse(1);
        int designation = found.getOrDefault("designation", inferDesignation(rows, columnCount));
        int quantite = found.getOrDefault("quantite", inferQuantite(rows, columnCount));
        int unite = found.getOrDefault("unite", ABSENT);
        int code = found.containsKey("code")
                ? found.get("code")
                : inferCode(rows, designation);

        return new ColumnMap(code, designation, unite, quantite, headerRow);
    }

    /** La désignation porte, de loin, le plus de texte. */
    private static int inferDesignation(List<GridRow> rows, int columnCount) {
        long[] lengths = new long[columnCount];
        for (GridRow row : rows) {
            for (int column = 0; column < row.cells().size(); column++) {
                lengths[column] += row.cell(column).length();
            }
        }
        return indexOfMax(lengths);
    }

    /** La quantité est la colonne la plus dense en valeurs numériques. */
    private static int inferQuantite(List<GridRow> rows, int columnCount) {
        long[] counts = new long[columnCount];
        for (GridRow row : rows) {
            for (int column = 0; column < row.cells().size(); column++) {
                if (NUMERIC.matcher(row.cell(column)).matches()) {
                    counts[column]++;
                }
            }
        }
        return indexOfMax(counts);
    }

    /**
     * La colonne code n'a presque jamais d'en-tête : on la reconnaît à ses jetons courts, sans
     * espace, à gauche de la désignation. Sans ce repli, les libellés d'article se retrouvent
     * remplacés par la ligne de mesure — « Le mètre cube : » pour tous les postes.
     */
    private static int inferCode(List<GridRow> rows, int designation) {
        if (designation <= 0) {
            return ABSENT;
        }
        long[] counts = new long[designation];
        for (GridRow row : rows) {
            for (int column = 0; column < designation && column < row.cells().size(); column++) {
                String value = row.cell(column);
                if (!value.isEmpty() && value.length() <= 12 && !value.contains(" ")
                        && CODE_TOKEN.matcher(value).matches()) {
                    counts[column]++;
                }
            }
        }
        int best = indexOfMax(counts);
        return counts[best] >= CODE_TOKEN_THRESHOLD ? best : ABSENT;
    }

    private static int indexOfMax(long[] values) {
        int best = 0;
        for (int i = 1; i < values.length; i++) {
            if (values[i] > values[best]) {
                best = i;
            }
        }
        return best;
    }

    /** Forme comparable : majuscules, sans accents, sans ponctuation ni espaces. */
    static String fold(String value) {
        if (value == null) {
            return "";
        }
        return java.text.Normalizer.normalize(value.trim(), java.text.Normalizer.Form.NFKD)
                .replaceAll("\\p{M}+", "")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]", "");
    }
}
