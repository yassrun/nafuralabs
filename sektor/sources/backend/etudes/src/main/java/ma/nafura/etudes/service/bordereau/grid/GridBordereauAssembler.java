package ma.nafura.etudes.service.bordereau.grid;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import ma.nafura.etudes.service.bordereau.BordereauRowCandidate;
import ma.nafura.platform.documents.docextractor.grid.GridRow;

/**
 * Replie les lignes de la grille en articles, puis en arbre.
 *
 * <p>Un article logique tient rarement sur une ligne physique. La convention marocaine la plus
 * répandue étale le code et le libellé sur une ligne, puis l'unité et la quantité sur la
 * suivante : {@code 1-3-1 | APPORT ET MISE EN PLACE…} puis {@code | LE MÈTRE CUBE | M3 |
 * 1 000,00}. L'assemblage recolle les deux.
 *
 * <p>Le résultat est une liste de {@link BordereauRowCandidate} — le modèle déjà en place dans le
 * pipeline, avec sa page, sa confiance et sa provenance.
 */
public final class GridBordereauAssembler {

    /** Unités pour lesquelles une quantité absente vaut 1 : un forfait est un forfait. */
    private static final Set<String> IMPLICIT_ONE = Set.of("ENS", "E", "FF", "F", "FORFAIT");
    /** « Pour mémoire » : la ligne existe et n'est jamais chiffrée. Aucune anomalie. */
    private static final Set<String> NOT_PRICED = Set.of("PM");

    private GridBordereauAssembler() {}

    /**
     * @param rows lignes de la grille
     * @param kinds étiquettes produites par {@link GridRowClassifier}, même indexation
     * @param map correspondance des colonnes
     */
    public static List<BordereauRowCandidate> assemble(
            List<GridRow> rows, List<GridRowClassifier.Kind> kinds, ColumnMap map) {

        List<BordereauRowCandidate> candidates = new ArrayList<>();
        String pendingCode = null;
        String pendingLibelle = null;
        int order = 0;
        String currentLotMajor = null;

        for (int i = 0; i < rows.size(); i++) {
            GridRow row = rows.get(i);
            GridRowClassifier.Kind kind = kinds.get(i);
            String designation = GridRowClassifier.designationOf(row, map);

            switch (kind) {
                case LOT -> {
                    pendingCode = null;
                    pendingLibelle = null;
                    currentLotMajor = GridRowClassifier.lotMajor(designation);
                    candidates.add(group(row, designation, kind, order++));
                }
                case SOUS_LOT -> {
                    pendingCode = null;
                    pendingLibelle = null;
                    var asLot = GridRowClassifier.sousLotAsLot(designation);
                    if (asLot.matches()) {
                        String lib = asLot.group(1) + "-" + asLot.group(2).trim();
                        currentLotMajor = asLot.group(1);
                        candidates.add(new BordereauRowCandidate(
                                rowId(row), pageOf(row), order++, null, lib, null, null,
                                BordereauRowCandidate.Kind.LOT, 0.9d, lib,
                                BordereauRowCandidate.ExtractionMethod.LOCAL, row.page()));
                        break;
                    }
                    var section = GridRowClassifier.sectionMajor(designation);
                    if (section.find()) {
                        String major = String.valueOf(Integer.parseInt(section.group(1)));
                        if (currentLotMajor == null || !currentLotMajor.equals(major)) {
                            String rest = designation.replaceFirst(
                                    "^\\s*0?\\d+\\s*[.\\-]\\s*0?\\d+\\s*[-\\u2013.]?\\s*",
                                    "").trim();
                            String lib = rest.isEmpty() ? major : major + " - " + rest;
                            currentLotMajor = major;
                            candidates.add(new BordereauRowCandidate(
                                    rowId(row) + ":lot", pageOf(row), order++, null, lib, null, null,
                                    BordereauRowCandidate.Kind.LOT, 0.85d, lib,
                                    BordereauRowCandidate.ExtractionMethod.LOCAL, row.page()));
                        }
                    }
                    candidates.add(group(row, designation, kind, order++));
                }
                case HEAD -> {
                    pendingCode = row.cell(map.code());
                    pendingLibelle = designation;
                }
                case MEASURE -> {
                    boolean continuation = pendingLibelle != null
                            && GridRowClassifier.designationOf(row, map).length() < 30
                            && row.cell(map.code()).isEmpty();
                    String code = continuation ? pendingCode : row.cell(map.code());
                    String libelle = continuation ? pendingLibelle : designation;
                    pendingCode = null;
                    pendingLibelle = null;
                    candidates.add(article(row, code, libelle, map, order++));
                }
                case AMBIGUOUS -> candidates.add(new BordereauRowCandidate(
                        rowId(row), pageOf(row), order++, row.cell(map.code()), designation,
                        null, null, BordereauRowCandidate.Kind.AMBIGUOUS, 0.4d, designation,
                        BordereauRowCandidate.ExtractionMethod.LOCAL, row.page()));
                default -> {
                    // NOISE, SKIP : rien à conserver.
                }
            }
        }
        return pruneEmptyGroups(candidates);
    }

    /**
     * Retire les groupes qui ne coiffent aucun article.
     *
     * <p>La règle de dernier recours du classifieur promeut en sous-lot tout ce qui ressemble à
     * un titre — en capitales, numéroté. Dans un bordereau entièrement en capitales, cela ramasse
     * aussi des fins de libellé enroulées. Un titre qui ne précède aucun poste n'en était pas un :
     * c'est le seul test qui les sépare de façon fiable, et il vient après coup.
     */
    private static List<BordereauRowCandidate> pruneEmptyGroups(
            List<BordereauRowCandidate> candidates) {

        boolean[] keep = new boolean[candidates.size()];
        for (int i = 0; i < candidates.size(); i++) {
            BordereauRowCandidate candidate = candidates.get(i);
            if (candidate.kind() == BordereauRowCandidate.Kind.ARTICLE
                    || candidate.kind() == BordereauRowCandidate.Kind.AMBIGUOUS) {
                keep[i] = true;
                continue;
            }
            boolean lot = candidate.kind() == BordereauRowCandidate.Kind.LOT;
            for (int j = i + 1; j < candidates.size(); j++) {
                BordereauRowCandidate next = candidates.get(j);
                if (next.kind() == BordereauRowCandidate.Kind.ARTICLE) {
                    keep[i] = true;
                    break;
                }
                if (next.kind() == BordereauRowCandidate.Kind.LOT) {
                    break;
                }
                if (!lot
                        && next.kind() == BordereauRowCandidate.Kind.SOUS_LOT
                        && closesSousLot(candidate, next)) {
                    break;
                }
            }
        }
        List<BordereauRowCandidate> kept = new ArrayList<>(candidates.size());
        for (int i = 0; i < candidates.size(); i++) {
            if (keep[i]) {
                kept.add(candidates.get(i));
            }
        }
        return kept;
    }

    /** Un chapitre lettré n'est pas vide parce que 3.1 suit ; un 3.3 n'est pas vide parce qu'un bandeau suit. */
    private static boolean closesSousLot(BordereauRowCandidate current, BordereauRowCandidate next) {
        if (current.isLetteredChapter()) {
            return next.isLetteredChapter();
        }
        if (current.isNumberedSection()) {
            return next.isNumberedSection() || next.isLetteredChapter();
        }
        return true;
    }

    private static BordereauRowCandidate group(
            GridRow row, String libelle, GridRowClassifier.Kind kind, int order) {
        BordereauRowCandidate.Kind mapped = kind == GridRowClassifier.Kind.LOT
                ? BordereauRowCandidate.Kind.LOT
                : BordereauRowCandidate.Kind.SOUS_LOT;
        String[] split = GridRowClassifier.splitGroupPrefix(libelle);
        String code = split[0];
        String label = split[1] != null && !split[1].isBlank() ? split[1] : libelle;
        return new BordereauRowCandidate(
                rowId(row), pageOf(row), order, code, label, null, null, mapped, 0.9d,
                libelle, BordereauRowCandidate.ExtractionMethod.LOCAL, row.page());
    }

    private static BordereauRowCandidate article(
            GridRow row, String code, String libelle, ColumnMap map, int order) {
        String unite = GridRowClassifier.unitOf(row, map);
        BigDecimal quantite = parseQuantity(GridRowClassifier.quantityOf(row, map));

        String folded = unite.toUpperCase(Locale.ROOT);
        if (quantite == null && IMPLICIT_ONE.contains(folded)) {
            quantite = BigDecimal.ONE;
        }
        double confidence = unite.isEmpty() || quantite == null ? 0.7d : 0.95d;
        if (NOT_PRICED.contains(folded)) {
            confidence = 0.95d;
        }
        return new BordereauRowCandidate(
                rowId(row), pageOf(row), order,
                code == null || code.isBlank() ? null : code.trim(),
                libelle,
                unite.isEmpty() ? null : unite,
                quantite,
                BordereauRowCandidate.Kind.ARTICLE,
                confidence,
                libelle,
                BordereauRowCandidate.ExtractionMethod.LOCAL,
                row.page());
    }

    /**
     * Les quantités arrivent en format francophone : espace insécable comme séparateur de
     * milliers, virgule décimale. {@code 1 000,00} doit donner mille, pas une erreur.
     */
    static BigDecimal parseQuantity(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        Double parsed = GridRowClassifier.parseNumericToken(raw);
        return parsed == null ? null : BigDecimal.valueOf(parsed);
    }

    private static String rowId(GridRow row) {
        return row.page() + ":" + row.index();
    }

    private static int pageOf(GridRow row) {
        String page = row.page();
        if (page != null && page.startsWith("p")) {
            try {
                return Integer.parseInt(page.substring(1));
            } catch (NumberFormatException ignored) {
                // Feuille de classeur nommée : la page n'a pas de sens numérique.
            }
        }
        return 1;
    }
}
