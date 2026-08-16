package ma.nafura.etudes.service.bordereau;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Assemble un {@link ImportTreeRequest} à partir des candidats locaux + classification LLM.
 *
 * <p>Les valeurs article (libellé, unité, quantité) restent locales ; le LLM ne fournit que
 * la hiérarchie (lots / sous-lots) et les affectations par {@code rowId}.
 */
@Component
public class BordereauHybridAssembler {

    public ImportTreeRequest assemble(BordereauParseResult parse, JsonNode classification) {
        Map<String, BordereauRowCandidate> byId = new LinkedHashMap<>();
        for (BordereauRowCandidate row : parse.rows()) {
            byId.put(row.rowId(), row);
        }

        ImportTreeRequest tree = new ImportTreeRequest();
        if (classification == null || !classification.has("lots") || !classification.get("lots").isArray()) {
            tree.getArbre().addAll(flatFallback(parse));
            return tree;
        }

        Set<String> assigned = new HashSet<>();
        for (JsonNode lotNode : classification.get("lots")) {
            ImportNoeudDto lot = mapGroup(lotNode, DpgfNoeud.TYPE_LOT, "Lot", byId, assigned);
            if (lot != null && !PdfBordereauLayoutParser.isMarketTitleNoise(lot.getLibelle())) {
                tree.getArbre().add(lot);
            }
        }

        // Articles non classés → lot technique pour ne rien perdre.
        List<ImportNoeudDto> orphans = new ArrayList<>();
        for (BordereauRowCandidate row : parse.articleCandidates()) {
            if (!assigned.contains(row.rowId())) {
                orphans.add(toArticle(row));
            }
        }
        if (!orphans.isEmpty()) {
            ImportNoeudDto orphanLot = new ImportNoeudDto();
            orphanLot.setType(DpgfNoeud.TYPE_LOT);
            orphanLot.setCode(null);
            orphanLot.setLibelle("A classer");
            orphanLot.setEnfants(orphans);
            tree.getArbre().add(orphanLot);
        }

        if (tree.getArbre().isEmpty()) {
            tree.getArbre().addAll(flatFallback(parse));
        }
        return tree;
    }

    /**
     * Reconstruction locale sans LLM.
     *
     * <p>Stratégie (DQE marocain typique) :
     * <ol>
     *   <li>Collecte les libellés « SOUS LOT N° X » / « LOT X » (ignore les titres marché).</li>
     *   <li>Attache chaque article/section au lot dont le numéro correspond au préfixe de code
     *       (1-1-1 → lot 1, 3.2.1 → lot 3) — résiste au désordre de lecture PDF où les en-têtes
     *       SOUS LOT arrivent après les articles.</li>
     *   <li>Fallback séquentiel si aucun préfixe exploitable.</li>
     * </ol>
     */
    public ImportTreeRequest assembleLocalOnly(BordereauParseResult parse) {
        ImportTreeRequest byCode = assembleByCodePrefix(parse);
        ImportTreeRequest sequential = assembleSequential(parse);
        int expected = parse.articleCandidates().size();
        int byCodeArticles = countArticlesDeep(byCode.getArbre());
        int seqArticles = countArticlesDeep(sequential.getArbre());
        int byCodeSous = countKind(byCode.getArbre(), DpgfNoeud.TYPE_SOUS_LOT);
        int seqSous = countKind(sequential.getArbre(), DpgfNoeud.TYPE_SOUS_LOT);

        boolean hasLetteredChapter = false;
        for (BordereauRowCandidate row : parse.rows()) {
            if (row.isLetteredChapter()) {
                hasLetteredChapter = true;
                break;
            }
        }
        // Villa / tableurs : bandeaux SOUS_LOT sans code (« MENUISERIE BOIS »). Le rattachement
        // par préfixe de code les ignore et plaque tous les articles sous le LOT → 1.7 puis 1.2
        // sans parent. L'ordre documentaire les conserve.
        // BDP lettré (A- COURANTS FORTS → 3.1 / 3.2) : l'ordre documentaire nest le chapitre.
        boolean preferSequential = (seqSous > byCodeSous || (hasLetteredChapter && seqSous >= byCodeSous))
                && seqArticles >= Math.max(1, (expected + 1) / 2)
                && seqArticles >= (int) Math.floor(byCodeArticles * 0.9);
        if (preferSequential) {
            return sequential;
        }

        boolean enoughArticles = byCodeArticles >= Math.max(1, (expected + 1) / 2);
        boolean multiLot = byCode.getArbre().size() >= 2;
        boolean singleNamedLot = byCode.getArbre().size() == 1
                && byCode.getArbre().get(0).getLibelle() != null
                && !byCode.getArbre().get(0).getLibelle().startsWith("Lot ");
        if (enoughArticles && (multiLot || singleNamedLot || byCodeArticles >= 3)) {
            return byCode;
        }
        return sequential;
    }

    private static int countKind(List<ImportNoeudDto> nodes, String type) {
        if (nodes == null) {
            return 0;
        }
        int n = 0;
        for (ImportNoeudDto node : nodes) {
            if (node == null) {
                continue;
            }
            if (type.equalsIgnoreCase(node.getType())) {
                n++;
            }
            n += countKind(node.getEnfants(), type);
        }
        return n;
    }

    private ImportTreeRequest assembleByCodePrefix(BordereauParseResult parse) {
        Map<String, ImportNoeudDto> lotsByKey = new LinkedHashMap<>();
        Map<String, String> lotLabels = new LinkedHashMap<>();

        for (BordereauRowCandidate row : parse.rows()) {
            if (PdfBordereauLayoutParser.isMarketTitleNoise(row.libelle())) {
                continue;
            }
            if (row.kind() == BordereauRowCandidate.Kind.LOT) {
                String key = extractLotKey(row);
                if (key == null || !isPlausibleLotKey(key)) {
                    continue;
                }
                rememberLotLabel(lotLabels, key, row.libelle(), 250);
                lotsByKey.computeIfAbsent(key, k -> newGroup(DpgfNoeud.TYPE_LOT, k, lotLabels.get(k)));
                lotsByKey.get(key).setLibelle(lotLabels.get(key));
            } else if (row.kind() == BordereauRowCandidate.Kind.SOUS_LOT) {
                // Chapter "SOUS LOT N° X : TITLE" names the lot.
                // Subsection codes like 1-05 « MAÇONNERIES » must NOT rename lot 1.
                String keyFromLibelle = lotKeyFromSousLotLibelle(row.libelle());
                if (keyFromLibelle != null && isPlausibleLotKey(keyFromLibelle)) {
                    rememberLotLabel(
                            lotLabels, keyFromLibelle, chapterTitleFromSousLot(row.libelle()), 300);
                    lotsByKey.computeIfAbsent(
                            keyFromLibelle,
                            k -> newGroup(DpgfNoeud.TYPE_LOT, k, lotLabels.get(k)));
                    lotsByKey.get(keyFromLibelle).setLibelle(lotLabels.get(keyFromLibelle));
                } else {
                    String key = leadingLotKey(row.code());
                    if (key != null && isPlausibleLotKey(key)) {
                        lotsByKey.computeIfAbsent(
                                key, k -> newGroup(DpgfNoeud.TYPE_LOT, k, lotLabels.getOrDefault(k, "Lot " + k)));
                    }
                }
            } else if (row.kind() == BordereauRowCandidate.Kind.SECTION && isTopLevelSection(row.code())) {
                // "1 - TERRASSEMENT" when SOUS LOT header was missed in reading order.
                // Ignore false positives like code=1 « PORTE SAVON LIQUIDE » (page accessories).
                if (!looksLikeLotChapterTitle(row.libelle())) {
                    continue;
                }
                String key = leadingLotKey(row.code());
                if (key != null && isPlausibleLotKey(key)) {
                    rememberLotLabel(lotLabels, key, row.libelle(), 200);
                    lotsByKey.computeIfAbsent(key, k -> newGroup(DpgfNoeud.TYPE_LOT, k, lotLabels.get(k)));
                    lotsByKey.get(key).setLibelle(lotLabels.get(key));
                }
            }
        }

        // Ensure lots exist for article prefixes even without SOUS LOT headers.
        for (BordereauRowCandidate row : parse.articleCandidates()) {
            String key = leadingLotKey(row.code());
            if (key != null && isPlausibleLotKey(key)) {
                lotsByKey.computeIfAbsent(
                        key, k -> newGroup(DpgfNoeud.TYPE_LOT, k, lotLabels.getOrDefault(k, "Lot " + k)));
            }
        }

        Map<String, ImportNoeudDto> sectionByKey = new LinkedHashMap<>();
        Map<String, ImportNoeudDto> chapitreByLot = new LinkedHashMap<>();
        String cursorLot = lotsByKey.isEmpty() ? null : lotsByKey.keySet().iterator().next();
        for (BordereauRowCandidate row : parse.rows()) {
            if (PdfBordereauLayoutParser.isMarketTitleNoise(row.libelle())) {
                continue;
            }
            if (row.kind() == BordereauRowCandidate.Kind.LOT) {
                String key = extractLotKey(row);
                if (key != null && lotsByKey.containsKey(key)) {
                    cursorLot = key;
                }
                continue;
            }
            if (row.kind() == BordereauRowCandidate.Kind.SOUS_LOT) {
                String keyFromLibelle = lotKeyFromSousLotLibelle(row.libelle());
                if (keyFromLibelle != null && lotsByKey.containsKey(keyFromLibelle)) {
                    cursorLot = keyFromLibelle;
                    continue;
                }
                if (row.isLetteredChapter() && cursorLot != null && lotsByKey.containsKey(cursorLot)) {
                    ImportNoeudDto chapter = newGroup(DpgfNoeud.TYPE_SOUS_LOT, row);
                    lotsByKey.get(cursorLot).getEnfants().add(chapter);
                    chapitreByLot.put(cursorLot, chapter);
                    continue;
                }
                if (row.isNumberedSection()) {
                    attachNumberedSection(row, lotsByKey, sectionByKey, chapitreByLot);
                }
                continue;
            }
            if (row.kind() != BordereauRowCandidate.Kind.SECTION) {
                continue;
            }
            attachNumberedSection(row, lotsByKey, sectionByKey, chapitreByLot);
        }

        for (BordereauRowCandidate row : parse.articleCandidates()) {
            if (PdfBordereauLayoutParser.isMarketTitleNoise(row.libelle())) {
                continue;
            }
            ImportNoeudDto article = toArticle(row);
            String lotKey = leadingLotKey(row.code());
            if (lotKey != null && !isPlausibleLotKey(lotKey)) {
                lotKey = null;
            }
            ImportNoeudDto lot = lotKey != null ? lotsByKey.get(lotKey) : null;
            if (lot == null) {
                lot = lotsByKey.computeIfAbsent("_", k -> newGroup(DpgfNoeud.TYPE_LOT, null, "A classer"));
            }
            String sectionKey = sectionKeyForArticle(row.code());
            ImportNoeudDto section = sectionKey != null ? sectionByKey.get(sectionKey) : null;
            if (section != null) {
                section.getEnfants().add(article);
            } else {
                lot.getEnfants().add(article);
            }
        }

        // Drop empty / spurious lots, sort by numeric code.
        List<Map.Entry<String, ImportNoeudDto>> ordered = new ArrayList<>(lotsByKey.entrySet());
        ordered.sort((a, b) -> {
            if ("_".equals(a.getKey())) {
                return 1;
            }
            if ("_".equals(b.getKey())) {
                return -1;
            }
            try {
                return Integer.compare(Integer.parseInt(a.getKey()), Integer.parseInt(b.getKey()));
            } catch (NumberFormatException ex) {
                return a.getKey().compareTo(b.getKey());
            }
        });

        ImportTreeRequest tree = new ImportTreeRequest();
        for (Map.Entry<String, ImportNoeudDto> e : ordered) {
            ImportNoeudDto lot = e.getValue();
            int articles = countArticlesDeep(List.of(lot));
            if (articles == 0) {
                continue;
            }
            // Spurious prefix (e.g. qty misread as code 120) with no real label.
            if (!"_".equals(e.getKey())
                    && !isPlausibleLotKey(e.getKey())
                    && (lot.getLibelle() == null || lot.getLibelle().startsWith("Lot "))) {
                continue;
            }
            if (lotLabels.containsKey(e.getKey())) {
                lot.setLibelle(lotLabels.get(e.getKey()));
            }
            tree.getArbre().add(lot);
        }
        return tree;
    }

    private static void rememberLotLabel(
            Map<String, String> lotLabels, String key, String libelle, int baseScore) {
        if (!StringUtils.hasText(libelle) || !isPlausibleLotKey(key)) {
            return;
        }
        String label = libelle.trim();
        String existing = lotLabels.get(key);
        if (existing == null) {
            lotLabels.put(key, label);
            return;
        }
        int newScore = lotLabelScore(label) + baseScore;
        int oldScore = lotLabelScore(existing); // intrinsic only — don't forget chapter bonuses
        if (newScore > oldScore) {
            lotLabels.put(key, label);
        }
    }

    /**
     * Prefers chapter titles (SOUS LOT / TERRASSEMENT-GROS ŒUVRE) over subsection names
     * (MAÇONNERIES, ENDUITS…) that share the same lot prefix.
     */
    private static int lotLabelScore(String label) {
        if (label == null || label.isBlank()) {
            return Integer.MIN_VALUE;
        }
        String u = label.toUpperCase(Locale.ROOT);
        int score = 0;
        if (u.contains("SOUS LOT") || u.matches(".*\\bLOT\\s*N?[°ºO]?\\s*\\d+.*")) {
            score += 80;
        }
        if (u.contains("TERRASSEMENT")
                || u.contains("GROS OEUVRE")
                || u.contains("GROS-OEUVRE")
                || u.contains("GROS ŒUVRE")
                || u.contains("GROS-ŒUVRE")) {
            score += 100;
        }
        if (u.contains("ELECTRIC")
                || u.contains("CHARPENTE")
                || u.contains("PLOMBERIE")
                || u.contains("PEINTURE")
                || u.contains("MENUISERIE")
                || u.contains("FAUX PLAFOND")
                || u.contains("FLUIDE")) {
            score += 40;
        }
        // Typical subsections of gros œuvre — never promote as lot title.
        if (u.contains("MAÇONNER")
                || u.contains("MACONNER")
                || u.contains("CLOISON")
                || u.contains("ENDUIT")
                || u.contains("DALLAGE")
                || u.contains("REGARD")
                || u.contains("FONDATION")
                || u.contains("DIVERS")
                || u.startsWith("PORTE ")
                || u.contains("SAVON")
                || u.contains("PAPIER")) {
            score -= 80;
        }
        score += Math.min(label.length(), 40);
        return score;
    }

    private static boolean looksLikeLotChapterTitle(String libelle) {
        if (libelle == null || libelle.isBlank()) {
            return false;
        }
        String u = libelle.toUpperCase(Locale.ROOT);
        if (u.startsWith("PORTE ")
                || u.contains("SAVON")
                || u.contains("PAPIER")
                || u.contains("ROBINET")
                || u.contains("MIROIR")) {
            return false;
        }
        if (u.contains("TERRASSEMENT")
                || u.contains("GROS")
                || u.contains("ELECTRIC")
                || u.contains("CHARPENTE")
                || u.contains("PLOMBERIE")
                || u.contains("PEINTURE")
                || u.contains("MENUISERIE")
                || u.contains("FAUX PLAFOND")
                || u.contains("FLUIDE")
                || u.contains("FRIGORIF")
                || u.contains("SOUS LOT")
                || u.matches(".*\\bLOT\\s*\\d+.*")) {
            return true;
        }
        return libelle.trim().length() >= 15;
    }

    private static String lotKeyFromSousLotLibelle(String libelle) {
        if (libelle == null || libelle.isBlank()) {
            return null;
        }
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("(?:SOUS\\s*)?LOT\\s*N?[°ºo]?\\s*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(libelle);
        if (m.find()) {
            return String.valueOf(Integer.parseInt(m.group(1)));
        }
        return null;
    }

    private static String chapterTitleFromSousLot(String libelle) {
        if (libelle == null) {
            return null;
        }
        String cleaned = libelle
                .replaceAll("(?i)^\\s*SOUS\\s*LOT\\s*N?[°ºo]?\\s*\\d+\\s*[:.\\-–—]?\\s*", "")
                .trim();
        return cleaned.isEmpty() ? libelle.trim() : cleaned;
    }

    private static boolean isPlausibleLotKey(String key) {
        if (key == null || key.isBlank()) {
            return false;
        }
        try {
            int n = Integer.parseInt(key);
            return n >= 1 && n <= 30;
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    private static boolean isTopLevelSection(String code) {
        String compact = compactCode(code);
        if (compact == null) {
            return false;
        }
        // "1", "01", "2" — not "1-1" / "3.2"
        return compact.matches("0*\\d{1,2}");
    }

    private ImportTreeRequest assembleSequential(BordereauParseResult parse) {
        ImportTreeRequest tree = new ImportTreeRequest();
        ImportNoeudDto currentLot = null;
        ImportNoeudDto currentChapitre = null;
        ImportNoeudDto currentSousLot = null;

        for (BordereauRowCandidate row : parse.rows()) {
            if (row.kind() == BordereauRowCandidate.Kind.LOT) {
                if (PdfBordereauLayoutParser.isMarketTitleNoise(row.libelle())) {
                    continue;
                }
                currentLot = newGroup(DpgfNoeud.TYPE_LOT, row);
                tree.getArbre().add(currentLot);
                currentChapitre = null;
                currentSousLot = null;
                continue;
            }
            if (row.kind() == BordereauRowCandidate.Kind.SOUS_LOT
                    || row.kind() == BordereauRowCandidate.Kind.SECTION) {
                if (PdfBordereauLayoutParser.isMarketTitleNoise(row.libelle())) {
                    continue;
                }
                String chapterKey = lotKeyFromSousLotLibelle(row.libelle());
                if (chapterKey != null) {
                    // « SOUS LOT N° X : TITLE » → lot racine
                    currentLot = newGroup(
                            DpgfNoeud.TYPE_LOT,
                            chapterKey,
                            chapterTitleFromSousLot(row.libelle()));
                    tree.getArbre().add(currentLot);
                    currentChapitre = null;
                    currentSousLot = null;
                    continue;
                }
                if (isTopLevelSection(row.code()) && currentLot == null
                        && looksLikeLotChapterTitle(row.libelle())) {
                    currentLot = newGroup(DpgfNoeud.TYPE_LOT, row);
                    tree.getArbre().add(currentLot);
                    currentChapitre = null;
                    currentSousLot = null;
                    continue;
                }
                if (currentLot == null) {
                    currentLot = newGroup(DpgfNoeud.TYPE_LOT, "1", "Lot 1");
                    tree.getArbre().add(currentLot);
                }
                ImportNoeudDto group = newGroup(DpgfNoeud.TYPE_SOUS_LOT, row);
                if (row.isLetteredChapter()) {
                    currentChapitre = group;
                    currentLot.getEnfants().add(group);
                    currentSousLot = group;
                } else if (row.isNumberedSection()) {
                    ImportNoeudDto parent = currentLot;
                    if (currentChapitre != null && sectionBelongsToLot(row, currentLot)) {
                        parent = currentChapitre;
                    }
                    parent.getEnfants().add(group);
                    currentSousLot = group;
                } else {
                    ImportNoeudDto parent;
                    if (currentSousLot != null && isNumberedGroup(currentSousLot)) {
                        parent = currentSousLot;
                    } else if (currentChapitre != null) {
                        parent = currentChapitre;
                    } else {
                        parent = currentLot;
                    }
                    parent.getEnfants().add(group);
                    currentSousLot = group;
                }
                continue;
            }
            if (!row.looksLikeArticle()) {
                continue;
            }
            if (PdfBordereauLayoutParser.isMarketTitleNoise(row.libelle())) {
                continue;
            }
            ImportNoeudDto article = toArticle(row);
            if (currentSousLot != null) {
                currentSousLot.getEnfants().add(article);
            } else if (currentLot != null) {
                currentLot.getEnfants().add(article);
            } else {
                currentLot = newGroup(DpgfNoeud.TYPE_LOT, "1", "Lot 1");
                tree.getArbre().add(currentLot);
                currentLot.getEnfants().add(article);
            }
        }

        if (tree.getArbre().isEmpty()) {
            tree.getArbre().addAll(flatFallback(parse));
        }
        return tree;
    }

    private void attachNumberedSection(
            BordereauRowCandidate row,
            Map<String, ImportNoeudDto> lotsByKey,
            Map<String, ImportNoeudDto> sectionByKey,
            Map<String, ImportNoeudDto> chapitreByLot) {
        if (isTopLevelSection(row.code())) {
            return;
        }
        String lotKey = leadingLotKey(row.code());
        if (lotKey == null || !lotsByKey.containsKey(lotKey)) {
            return;
        }
        String sectionKey = compactCode(row.code());
        if (sectionKey == null || sectionByKey.containsKey(sectionKey)) {
            return;
        }
        ImportNoeudDto section = newGroup(DpgfNoeud.TYPE_SOUS_LOT, row);
        ImportNoeudDto parent = chapitreByLot.getOrDefault(lotKey, lotsByKey.get(lotKey));
        parent.getEnfants().add(section);
        sectionByKey.put(sectionKey, section);
    }

    private static boolean sectionBelongsToLot(BordereauRowCandidate row, ImportNoeudDto lot) {
        if (lot == null) {
            return false;
        }
        String sectionLot = leadingLotKey(row.code());
        if (sectionLot == null) {
            return true;
        }
        String lotCode = lot.getCode();
        if (lotCode == null || lotCode.isBlank()) {
            return true;
        }
        String lotKey = leadingLotKey(lotCode);
        if (lotKey == null) {
            lotKey = compactCode(lotCode);
        }
        return sectionLot.equals(lotKey);
    }

    private static boolean isNumberedGroup(ImportNoeudDto node) {
        if (node == null) {
            return false;
        }
        String c = node.getCode() == null ? "" : node.getCode().trim();
        if (c.matches("\\d+[.\\-]\\d+.*")) {
            return true;
        }
        String lib = node.getLibelle() == null ? "" : node.getLibelle().trim();
        return lib.matches("(?i)^\\d+[.\\-]\\d+\\b.*");
    }

    private static String extractLotKey(BordereauRowCandidate row) {
        String fromCode = leadingLotKey(row.code());
        if (fromCode != null) {
            return fromCode;
        }
        String lib = row.libelle() == null ? "" : row.libelle();
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("(?:SOUS\\s*)?LOT\\s*N?[°ºo]?\\s*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(lib);
        if (m.find()) {
            return String.valueOf(Integer.parseInt(m.group(1)));
        }
        return null;
    }

    private static String leadingLotKey(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        String compact = compactCode(code);
        if (compact == null) {
            return null;
        }
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("^0*(\\d+)").matcher(compact);
        if (!m.find()) {
            return null;
        }
        return String.valueOf(Integer.parseInt(m.group(1)));
    }

    /** Section key for article "1-1-3" → "1-1" ; "3.2.1" → "3.2". */
    private static String sectionKeyForArticle(String code) {
        String compact = compactCode(code);
        if (compact == null) {
            return null;
        }
        String[] parts = compact.split("[.\\-]");
        if (parts.length < 2) {
            return null;
        }
        return parts[0] + (compact.contains(".") ? "." : "-") + parts[1];
    }

    private static String compactCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        return code.trim().replaceAll("\\s+", "");
    }

    private static int countArticlesDeep(List<ImportNoeudDto> nodes) {
        if (nodes == null) {
            return 0;
        }
        int n = 0;
        for (ImportNoeudDto node : nodes) {
            if (DpgfNoeud.TYPE_ARTICLE.equalsIgnoreCase(node.getType())) {
                n++;
            }
            n += countArticlesDeep(node.getEnfants());
        }
        return n;
    }

    private List<ImportNoeudDto> flatFallback(BordereauParseResult parse) {
        ImportNoeudDto lot = newGroup(DpgfNoeud.TYPE_LOT, "1", "Bordereau");
        for (BordereauRowCandidate row : parse.articleCandidates()) {
            lot.getEnfants().add(toArticle(row));
        }
        return lot.getEnfants().isEmpty() ? List.of() : List.of(lot);
    }

    private ImportNoeudDto mapGroup(
            JsonNode node,
            String type,
            String defaultLibelle,
            Map<String, BordereauRowCandidate> byId,
            Set<String> assigned) {
        if (node == null || !node.isObject()) {
            return null;
        }
        ImportNoeudDto group = new ImportNoeudDto();
        group.setType(type);
        group.setCode(text(node, "code"));
        String libelle = text(node, "libelle");
        group.setLibelle(StringUtils.hasText(libelle) ? libelle : defaultLibelle);

        if (node.has("children") && node.get("children").isArray()) {
            for (JsonNode child : node.get("children")) {
                ImportNoeudDto sous = mapGroup(
                        child, DpgfNoeud.TYPE_SOUS_LOT, "Sous-lot", byId, assigned);
                if (sous != null) {
                    group.getEnfants().add(sous);
                }
            }
        }
        if (node.has("articleRowIds") && node.get("articleRowIds").isArray()) {
            for (JsonNode idNode : node.get("articleRowIds")) {
                if (idNode == null || !idNode.isTextual()) {
                    continue;
                }
                String rowId = idNode.asText();
                BordereauRowCandidate row = byId.get(rowId);
                if (row == null || !row.looksLikeArticle() || !assigned.add(rowId)) {
                    continue;
                }
                group.getEnfants().add(toArticle(row));
            }
        }
        // Drop empty groups (no children and no useful label).
        if (group.getEnfants().isEmpty() && !StringUtils.hasText(group.getLibelle())) {
            return null;
        }
        return group;
    }

    private static ImportNoeudDto newGroup(String type, BordereauRowCandidate row) {
        return newGroup(type, row.code(), row.libelle());
    }

    private static ImportNoeudDto newGroup(String type, String code, String libelle) {
        ImportNoeudDto group = new ImportNoeudDto();
        group.setType(type);
        group.setCode(code);
        group.setLibelle(StringUtils.hasText(libelle) ? libelle : type);
        group.setEnfants(new ArrayList<>());
        return group;
    }

    private static ImportNoeudDto toArticle(BordereauRowCandidate row) {
        ImportNoeudDto article = new ImportNoeudDto();
        article.setType(DpgfNoeud.TYPE_ARTICLE);
        article.setCode(row.code());
        article.setLibelle(StringUtils.hasText(row.libelle()) ? row.libelle() : "Poste");
        article.setUnite(row.unite());
        article.setQuantite(row.quantite());
        // Pas d'origine tant que non chiffré (ERP-66).
        article.setOrigineCout(null);
        article.setCoutDeduit(false);
        article.setOrdre(row.order());
        return article;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull() || !value.isTextual() || value.asText().isBlank()) {
            return null;
        }
        return value.asText().trim();
    }

    /** Compact prompt payload for the LLM classifier. */
    public String buildClassifierPrompt(BordereauParseResult parse) {
        StringBuilder sb = new StringBuilder();
        sb.append("Candidats extraits d'un bordereau BTP (")
                .append(parse.pageCount())
                .append(" pages).\n");
        sb.append("Assigne chaque article à un lot / sous-lot / chapitre lettré (A-).\n");
        sb.append("Un A- / B- est parent des sections 3.1, 3.2 — ne les mets pas au même niveau.\n");
        sb.append("Conserve les libellés fournis tels quels (déjà complets).\n\n");

        sb.append("GROUPES détectés :\n");
        for (BordereauRowCandidate g : parse.groupingCandidates()) {
            sb.append("- ").append(g.rowId())
                    .append(" [").append(g.kind()).append("] page=").append(g.page())
                    .append(" code=").append(nullToEmpty(g.code()))
                    .append(" | ").append(nullToEmpty(g.libelle()))
                    .append('\n');
        }

        sb.append("\nARTICLES :\n");
        for (BordereauRowCandidate a : parse.articleCandidates()) {
            sb.append("- ").append(a.rowId())
                    .append(" page=").append(a.page())
                    .append(" code=").append(nullToEmpty(a.code()))
                    .append(" | ").append(nullToEmpty(a.libelle()))
                    .append(" | unite=").append(nullToEmpty(a.unite()))
                    .append(" | qte=").append(a.quantite() != null ? a.quantite().toPlainString() : "")
                    .append('\n');
        }
        return sb.toString();
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
