package ma.nafura.etudes.service.bordereau.grid;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Étiquette chaque ligne de la grille : bruit, titre, poste, ligne de mesure.
 *
 * <p>Aucune règle fixe ne classe correctement tous les bordereaux — mais chaque bordereau est
 * cohérent avec lui-même. Un classeur marque ses lots par un fond orange en 14,5 pt et ses
 * sous-lots par un fond vert en 10 pt, sans qu'aucune numérotation ne le dise ; un autre n'a
 * aucune couleur mais une numérotation stricte. Le classifieur relève donc d'abord les lignes
 * indiscutables, en déduit la convention du document, puis lit le reste à travers elle.
 *
 * <p>Chacune des règles ci-dessous a été ajoutée pour un échec constaté sur un fichier réel,
 * jamais par anticipation. La spécification exécutable est dans
 * {@code products/sektor-btp/docs/extraction/}.
 */
public final class GridRowClassifier {

    /** Étiquette d'une ligne de la grille. */
    public enum Kind {
        /** En-tête répété, total, bandeau : à écarter. */
        NOISE,
        /** Ni bruit ni contenu : ligne vide, fragment de libellé enroulé. */
        SKIP,
        /** Porte une unité ou une quantité : c'est là que vit le poste. */
        MEASURE,
        /** Porte le code et le libellé ; la mesure est sur la ligne suivante. */
        HEAD,
        LOT,
        SOUS_LOT,
        /** Le document ne tranche pas — à faire confirmer par l'utilisateur. */
        AMBIGUOUS
    }

    private static final Pattern NUMERIC = Pattern.compile("-?[\\d\\s\\u00a0]+(?:[.,]\\d+)?");
    private static final Pattern NOISE_START = Pattern.compile(
            "^(TOTAL|SOUS[- ]TOTAL|RECAPITULATION|R\u00c9CAPITULATION|MONTANT|ARRETE|ARR\u00caTE"
                    + "|REPORT|A REPORTER|[_*\\-\u2013\u2014.\\s]+)$",
            Pattern.CASE_INSENSITIVE);
    /** « b/ - TOTAL RÉSEAU… » : TOTAL n'est pas toujours en tête de chaîne. */
    private static final Pattern TOTAL_ANYWHERE = Pattern.compile(
            "\\b(TOTAL|TOTAUX|RECAPITULATION|R\u00c9CAPITULATION|REPORT)\\b",
            Pattern.CASE_INSENSITIVE);
    /** « LE MÈTRE CUBE », « Le mètre cube : » — insensible à la casse, les deux existent. */
    private static final Pattern MEASURE_PHRASE = Pattern.compile(
            "^(LE|LA|L')\\s?[A-Z\u00c0-\u00dca-z\u00e0-\u00fc]", Pattern.CASE_INSENSITIVE);
    private static final Pattern LOT_KEYWORD = Pattern.compile(
            "^\\s*(LOT|TRANCHE|CHAPITRE)\\s*(N[\u00b0o]\\s*)?[\\dIVX]", Pattern.CASE_INSENSITIVE);
    private static final Pattern SOUS_LOT_KEYWORD =
            Pattern.compile("^\\s*SOUS[\\s-]?LOT\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern PREFIX =
            Pattern.compile("^\\s*(\\d+(?:[-.]\\d+)*|[a-zA-Z])\\s*[-\u2013/]\\s*(.+)$");
    private static final Pattern ROMAN = Pattern.compile("^\\s*([IVX]{1,5})\\s*[-\u2013/]");

    /** Un texte revenant au moins tant de fois est soit un bandeau, soit un titre réimprimé. */
    private static final int REPEAT_THRESHOLD = 3;
    /** Au-delà de cette couverture du document, c'est du décor et non un titre de division. */
    private static final double BANNER_COVERAGE = 0.6d;
    /** Nombre d'attributs de mise en forme à partager pour être « de la même famille ». */
    private static final int SIGNATURE_MATCH = 4;

    private GridRowClassifier() {}

    /**
     * @param rows lignes de la grille, en-tête compris
     * @param map correspondance des colonnes
     * @return une étiquette par ligne de {@code rows}, même indexation
     */
    public static List<Kind> classify(List<GridRow> rows, ColumnMap map) {
        Kind[] kinds = new Kind[rows.size()];

        // ── passe 0 : bandeaux et titres réimprimés ────────────────────────
        // Un classeur imprimé réimprime son bandeau toutes les N lignes, et réimprime aussi le
        // titre de la division en cours. Le premier couvre tout le document, le second se limite
        // à son bloc : c'est ce qui les sépare.
        Map<String, List<Integer>> occurrences = new LinkedHashMap<>();
        for (int i = 0; i < rows.size(); i++) {
            GridRow row = rows.get(i);
            if (unitOf(row, map).isEmpty() && quantityOf(row, map).isEmpty()) {
                String key = ColumnMap.fold(designationOf(row, map));
                if (key.length() > 3) {
                    occurrences.computeIfAbsent(key, k -> new ArrayList<>()).add(i);
                }
            }
        }
        Map<String, Integer> banners = new HashMap<>();
        Map<String, Integer> sectionFirst = new HashMap<>();
        int total = Math.max(rows.size(), 1);
        for (Map.Entry<String, List<Integer>> entry : occurrences.entrySet()) {
            List<Integer> positions = entry.getValue();
            if (positions.size() < REPEAT_THRESHOLD) {
                continue;
            }
            double coverage =
                    (positions.get(positions.size() - 1) - positions.get(0)) / (double) total;
            if (coverage >= BANNER_COVERAGE) {
                banners.put(entry.getKey(), positions.size());
            } else {
                sectionFirst.put(entry.getKey(), positions.get(0));
            }
        }

        // ── passe 1 : ancres ───────────────────────────────────────────────
        int start = map.headerRow() >= 0 ? map.headerRow() + 1 : 0;
        for (int i = 0; i < start; i++) {
            kinds[i] = Kind.NOISE;
        }
        for (int i = start; i < rows.size(); i++) {
            GridRow row = rows.get(i);
            String designation = designationOf(row, map);
            if (designation.isEmpty()) {
                kinds[i] = Kind.SKIP;
                continue;
            }
            String folded = ColumnMap.fold(designation);
            String unite = unitOf(row, map);
            String quantite = quantityOf(row, map);

            if (folded.startsWith("DESIGNATION") || folded.startsWith("N")
                    && folded.length() <= 6 || NOISE_START.matcher(designation).matches()) {
                kinds[i] = Kind.NOISE;
                continue;
            }
            if (unite.isEmpty() && quantite.isEmpty()) {
                if (TOTAL_ANYWHERE.matcher(designation).find()) {
                    kinds[i] = Kind.NOISE;
                    continue;
                }
                if (banners.containsKey(folded)) {
                    kinds[i] = Kind.NOISE;
                    continue;
                }
                Integer first = sectionFirst.get(folded);
                if (first != null && first != i) {
                    kinds[i] = Kind.NOISE;
                    continue;
                }
                if (MEASURE_PHRASE.matcher(designation).find() && designation.length() < 30) {
                    kinds[i] = Kind.SKIP;
                    continue;
                }
            }
            if (!unite.isEmpty() || !quantite.isEmpty()) {
                kinds[i] = Kind.MEASURE;
            } else if (SOUS_LOT_KEYWORD.matcher(designation).find()) {
                kinds[i] = Kind.SOUS_LOT;
            } else if (LOT_KEYWORD.matcher(designation).find()) {
                kinds[i] = Kind.LOT;
            }
        }

        // ── passe 2 : la grammaire du document, relevée sur les ancres ─────
        Map<Kind, Signature> learned = new HashMap<>();
        for (Kind anchor : List.of(Kind.LOT, Kind.SOUS_LOT, Kind.MEASURE)) {
            Map<Signature, Integer> tally = new LinkedHashMap<>();
            for (int i = 0; i < rows.size(); i++) {
                if (kinds[i] == anchor) {
                    tally.merge(Signature.of(rows.get(i), map), 1, Integer::sum);
                }
            }
            tally.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .ifPresent(e -> learned.put(anchor, e.getKey()));
        }

        // ── passe 3 : le reste, par proximité à la grammaire apprise ───────
        for (int i = start; i < rows.size(); i++) {
            if (kinds[i] != null) {
                continue;
            }
            GridRow row = rows.get(i);
            Signature signature = Signature.of(row, map);
            String code = cellOf(row, map.code());
            String designation = designationOf(row, map);

            if (!code.isEmpty() && i + 1 < rows.size() && kinds[i + 1] == Kind.MEASURE) {
                GridRow next = rows.get(i + 1);
                boolean nextIsMeasureLine = MEASURE_PHRASE.matcher(designationOf(next, map)).find()
                        || cellOf(next, map.code()).isEmpty();
                if (nextIsMeasureLine) {
                    kinds[i] = Kind.HEAD;
                    continue;
                }
            }
            if (matches(signature, learned.get(Kind.LOT))) {
                kinds[i] = Kind.LOT;
            } else if (matches(signature, learned.get(Kind.SOUS_LOT))) {
                kinds[i] = Kind.SOUS_LOT;
            } else if (!code.isEmpty() && matches(signature, learned.get(Kind.MEASURE))) {
                kinds[i] = Kind.HEAD;
            } else if (row.style().merged() || signature.upper()
                    || shapeOf(designation, code) != null) {
                // Un vrai titre est fusionné, en capitales, ou numéroté. Sinon c'est une fin de
                // libellé enroulée sur la ligne suivante — « publiques », « et durcisseur ».
                kinds[i] = Kind.SOUS_LOT;
            } else if (!code.isEmpty()) {
                kinds[i] = Kind.AMBIGUOUS;
            } else {
                kinds[i] = Kind.SKIP;
            }
        }

        // ── passe 3b : le rang, d'après les formes de numérotation présentes ─
        // On ne présume pas que « 1 » soit un lot et « a/ » un sous-lot : on relève les formes
        // que CE document emploie, et on les ordonne. { ROMAN, LETTER } → II/ est un lot et b/
        // un sous-lot ; { NUM1, NUMN } → 3- est un lot et 3.1. un sous-lot.
        Map<Integer, String> shapes = new LinkedHashMap<>();
        for (int i = start; i < rows.size(); i++) {
            if (kinds[i] != Kind.LOT && kinds[i] != Kind.SOUS_LOT) {
                continue;
            }
            String designation = designationOf(rows.get(i), map);
            if (LOT_KEYWORD.matcher(designation).find()
                    || SOUS_LOT_KEYWORD.matcher(designation).find()) {
                continue; // le mot-clé prime toujours
            }
            String shape = shapeOf(designation, cellOf(rows.get(i), map.code()));
            if (shape != null) {
                shapes.put(i, shape);
            }
        }
        List<String> present = SHAPE_ORDER.stream()
                .filter(s -> shapes.containsValue(s))
                .toList();
        if (!present.isEmpty()) {
            String topRank = present.get(0);
            shapes.forEach((index, shape) ->
                    kinds[index] = shape.equals(topRank) ? Kind.LOT : Kind.SOUS_LOT);
        }

        List<Kind> result = new ArrayList<>(rows.size());
        for (Kind kind : kinds) {
            result.add(kind == null ? Kind.SKIP : kind);
        }
        return result;
    }

    /** Formes de numérotation, du plus englobant au plus fin. */
    private static final List<String> SHAPE_ORDER = List.of("ROMAN", "NUM1", "LETTER", "NUMN");

    /** Forme de la numérotation d'un groupe : « II/ », « 1 », « b/ », « 1-3 ». */
    static String shapeOf(String designation, String code) {
        if (ROMAN.matcher(designation).find()) {
            return "ROMAN";
        }
        Matcher prefix = PREFIX.matcher(designation);
        String token = null;
        if (prefix.matches()) {
            token = prefix.group(1);
        } else if (!code.isEmpty() && code.length() <= 12 && !code.contains(" ")) {
            token = code;
        }
        if (token == null || token.isEmpty()) {
            return null;
        }
        if (token.chars().allMatch(Character::isLetter)) {
            return switch (token.toUpperCase(Locale.ROOT)) {
                case "I", "V", "X" -> "ROMAN";
                default -> "LETTER";
            };
        }
        return token.split("[-./]").length == 1 ? "NUM1" : "NUMN";
    }

    /** Grammaire visuelle d'une ligne, telle que l'œil la lit. */
    private record Signature(String fill, int fontSize, boolean bold, int column, boolean upper) {
        static Signature of(GridRow row, ColumnMap map) {
            String designation = designationOf(row, map);
            long letters = designation.chars().filter(Character::isLetter).count();
            long uppercase = designation.chars()
                    .filter(Character::isLetter)
                    .filter(Character::isUpperCase)
                    .count();
            boolean upper = letters > 0 && uppercase / (double) letters > 0.85d;
            return new Signature(
                    row.style().fill(),
                    (int) Math.round(row.style().fontSize()),
                    row.style().bold(),
                    row.firstFilledColumn(),
                    upper);
        }
    }

    private static boolean matches(Signature signature, Signature reference) {
        if (reference == null) {
            return false;
        }
        int shared = 0;
        shared += signature.fill().equals(reference.fill()) ? 1 : 0;
        shared += signature.fontSize() == reference.fontSize() ? 1 : 0;
        shared += signature.bold() == reference.bold() ? 1 : 0;
        shared += signature.column() == reference.column() ? 1 : 0;
        shared += signature.upper() == reference.upper() ? 1 : 0;
        return shared >= SIGNATURE_MATCH;
    }

    /**
     * Désignation de la ligne — la cellule de la colonne désignation, ou à défaut la cellule la
     * plus longue : les titres de lot débordent souvent de leur colonne.
     */
    static String designationOf(GridRow row, ColumnMap map) {
        String direct = cellOf(row, map.designation());
        return direct.isEmpty() ? row.longestTextCell() : direct;
    }

    static String unitOf(GridRow row, ColumnMap map) {
        String value = cellOf(row, map.unite());
        return value.length() > 0 && value.length() <= 6 ? value : "";
    }

    static String quantityOf(GridRow row, ColumnMap map) {
        String value = cellOf(row, map.quantite());
        if (value.isEmpty() || value.equals("-") || !NUMERIC.matcher(value).matches()) {
            return "";
        }
        return value;
    }

    private static String cellOf(GridRow row, int column) {
        return column == ColumnMap.ABSENT ? "" : row.cell(column);
    }
}
