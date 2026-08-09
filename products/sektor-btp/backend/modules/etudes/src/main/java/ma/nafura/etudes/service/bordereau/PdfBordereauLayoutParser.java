package ma.nafura.etudes.service.bordereau;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import ma.nafura.etudes.service.bordereau.grid.ColumnMap;
import ma.nafura.etudes.service.port.ExtractionProgress;
import ma.nafura.etudes.service.bordereau.grid.GridBordereauAssembler;
import ma.nafura.etudes.service.bordereau.grid.GridRow;
import ma.nafura.etudes.service.bordereau.grid.GridRowClassifier;
import ma.nafura.etudes.service.bordereau.grid.PdfRuledGridSource;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Parseur géométrique de bordereaux PDF natifs.
 *
 * <p>Ne s'appuie pas sur une codification ou une indentation normalisée : les colonnes
 * (N°, désignation, unité, quantité) sont détectées via en-têtes et positions X, puis les
 * lignes sont reconstruites en candidats scorés.
 */
@Component
public class PdfBordereauLayoutParser {

    private static final Logger log = LoggerFactory.getLogger(PdfBordereauLayoutParser.class);

    static final int MIN_DENSITY_PER_PAGE = 80;
    static final int MIN_ARTICLE_CANDIDATES = 3;
    static final double MIN_PRICED_RATIO = 0.45;

    private static final Pattern CODE_ONLY = Pattern.compile(
            "^\\d+(?:[.\\-\\s]+\\d+[a-zA-Z]?){0,5}\\.?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern CODE_PREFIX = Pattern.compile(
            "^(\\d+(?:[.\\-\\s]+\\d+[a-zA-Z]?){0,5}\\.?)\\s*[-–—:]?\\s*(.+)$",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern QTY = Pattern.compile(
            "^[\\d\\s]+(?:[,.]\\d+)?$");
    private static final Pattern UNIT_TOKEN = Pattern.compile(
            "^(M3|M\u00B3|M2|M\u00B2|ML|KG|KGS|T|U|UN|FF|H|J|L|ENS|E|M\\.L|FORFAIT)$",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern LONG_UNIT = Pattern.compile(
            "^(LE|LA|L['’]|LES)\\s+.+$", Pattern.CASE_INSENSITIVE);
    private static final Pattern SOUS_LOT = Pattern.compile(
            "SOUS\\s*LOT", Pattern.CASE_INSENSITIVE);
    /** Explicit lot header only — not market titles embedding the word LOT. */
    private static final Pattern LOT_HEADER = Pattern.compile(
            "^(?:LOT\\s*N?[°ºo]?\\s*\\d|LOT\\s*[:\\-–]|LOT\\s+\\d)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern HEADER_NOISE = Pattern.compile(
            "(BORDEREAU\\s+DES\\s+PRIX|DESIGNATION\\s+DES|MONTANT\\s+TOTAL|PRIX\\s+UNITAIRE|"
                    + "DETAIL\\s+ESTIMATIF|QUANTITE|N[°ºo]|UNITE)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern MARKET_TITLE = Pattern.compile(
            "(TRAVAUX\\s+DE\\s+CONSTRUCTION|PLATEFORME\\s+AGRO|CHAMBRES?\\s+FROID|"
                    + "ISOLATION\\s+FRIGOR|AMENAGEMENTS?\\s+DES\\s+ENTREPOT|"
                    + "YOUSSOUFIA|AL\\s+YOUSSOUFIA)",
            Pattern.CASE_INSENSITIVE);

    private final PdfRuledGridSource ruledGrid = new PdfRuledGridSource();

    /** Bande de progression réservée à la lecture de la grille, entre les jalons 5 et 40. */
    private static final int GRID_PROGRESS_FROM = 8;
    private static final int GRID_PROGRESS_TO = 35;

    public BordereauParseResult parse(byte[] pdfBytes) {
        return parse(pdfBytes, ExtractionProgress.noop());
    }

    /**
     * @param progress informé page par page pendant la lecture de la grille — un bordereau de
     *     plusieurs centaines de pages ne doit pas laisser la barre figée
     */
    public BordereauParseResult parse(byte[] pdfBytes, ExtractionProgress progress) {
        ExtractionProgress prog = progress != null ? progress : ExtractionProgress.noop();
        if (pdfBytes == null || pdfBytes.length == 0) {
            return BordereauParseResult.failed("empty_pdf");
        }
        // Un bordereau imprimé depuis un tableur garde son quadrillage vectoriel : on lit alors
        // chaque valeur dans sa cellule, ce qui évite d'inférer les colonnes à partir des
        // positions du texte — la source des libellés tronqués. Sans quadrillage exploitable,
        // on retombe sur l'analyse géométrique ci-dessous, inchangée.
        BordereauParseResult fromGrid = parseRuledGrid(pdfBytes, prog);
        if (fromGrid != null) {
            return fromGrid;
        }
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            int pages = document.getNumberOfPages();
            if (pages == 0) {
                return BordereauParseResult.failed("empty_pdf");
            }

            TokenCollector collector = new TokenCollector();
            collector.setSortByPosition(true);
            collector.getText(document);
            List<Token> tokens = collector.tokens;
            if (tokens.isEmpty()) {
                return BordereauParseResult.insufficient(pages, 0, List.of(), "no_text_layer");
            }

            int nonWs = (int) tokens.stream()
                    .map(t -> t.text)
                    .filter(t -> t != null && !t.isBlank())
                    .mapToInt(String::length)
                    .sum();
            int density = nonWs / Math.max(pages, 1);
            if (density < MIN_DENSITY_PER_PAGE) {
                return BordereauParseResult.insufficient(
                        pages, density, List.of(), "low_text_density");
            }

            List<Line> lines = clusterLines(tokens);
            Map<Integer, ColumnBands> bandsByPage = detectColumnsByPage(lines);
            List<BordereauRowCandidate> rows = extractCandidates(lines, bandsByPage, pages);
            Set<Integer> covered = new HashSet<>();
            for (BordereauRowCandidate row : rows) {
                if (row.looksLikeArticle()) {
                    covered.add(row.page());
                }
            }

            List<BordereauRowCandidate> articles = rows.stream()
                    .filter(BordereauRowCandidate::looksLikeArticle)
                    .toList();
            if (articles.size() < MIN_ARTICLE_CANDIDATES) {
                return BordereauParseResult.insufficient(
                        pages, density, rows, "too_few_article_candidates");
            }
            long priced = articles.stream().filter(BordereauRowCandidate::hasPricing).count();
            double pricedRatio = priced / (double) articles.size();
            if (pricedRatio < MIN_PRICED_RATIO) {
                return BordereauParseResult.insufficient(
                        pages, density, rows, "low_priced_ratio");
            }

            log.info(
                    "BDP layout parse: pages={}, density={}, candidates={}, articles={}, priced={}, coveredPages={}",
                    pages,
                    density,
                    rows.size(),
                    articles.size(),
                    priced,
                    covered.size());
            return new BordereauParseResult(
                    pages,
                    density,
                    List.copyOf(rows),
                    Set.copyOf(covered),
                    BordereauParseResult.Quality.USABLE,
                    null);
        } catch (IOException | RuntimeException ex) {
            log.warn("BDP layout parse failed: {}", ex.getMessage());
            return BordereauParseResult.failed(ex.getMessage());
        }
    }

    /**
     * Lecture par la grille du tableau.
     *
     * @return {@code null} si la page ne porte pas de quadrillage exploitable, ou si le résultat
     *     n'atteint pas les seuils de qualité — l'appelant retombe alors sur l'analyse
     *     géométrique. Rendre {@code null} plutôt qu'un résultat médiocre laisse le choix ouvert.
     */
    private BordereauParseResult parseRuledGrid(byte[] pdfBytes, ExtractionProgress progress) {
        List<GridRow> gridRows;
        try {
            gridRows = ruledGrid.read(pdfBytes, (done, total) -> progress.report(
                    GRID_PROGRESS_FROM
                            + (int) ((GRID_PROGRESS_TO - GRID_PROGRESS_FROM)
                                    * done / (double) Math.max(total, 1)),
                    "Lecture du tableau — page " + Math.min(done, total) + "/" + total + "…"));
        } catch (RuntimeException ex) {
            log.warn("Lecture de la grille impossible, repli géométrique : {}", ex.getMessage());
            return null;
        }
        if (gridRows.isEmpty()) {
            return null;
        }

        ColumnMap columns = ColumnMap.resolve(gridRows);
        List<BordereauRowCandidate> candidates = GridBordereauAssembler.assemble(
                gridRows, GridRowClassifier.classify(gridRows, columns), columns);

        List<BordereauRowCandidate> articles = candidates.stream()
                .filter(BordereauRowCandidate::looksLikeArticle)
                .toList();
        if (articles.size() < MIN_ARTICLE_CANDIDATES) {
            return null;
        }
        long priced = articles.stream().filter(BordereauRowCandidate::hasPricing).count();
        if (priced / (double) articles.size() < MIN_PRICED_RATIO) {
            return null;
        }

        Set<Integer> covered = new HashSet<>();
        for (BordereauRowCandidate article : articles) {
            covered.add(article.page());
        }
        int pages = (int) gridRows.stream().map(GridRow::page).distinct().count();
        int density = gridRows.stream()
                .flatMap(r -> r.cells().stream())
                .mapToInt(String::length)
                .sum() / Math.max(pages, 1);

        log.info("BDP grille: pages={}, lignes={}, candidats={}, articles={}, chiffrés={}",
                pages, gridRows.size(), candidates.size(), articles.size(), priced);

        return new BordereauParseResult(
                pages,
                density,
                List.copyOf(candidates),
                Set.copyOf(covered),
                BordereauParseResult.Quality.USABLE,
                null);
    }

    private List<Line> clusterLines(List<Token> tokens) {
        List<Token> sorted = new ArrayList<>(tokens);
        // getYDirAdj() is measured from the top of the page → ascending = reading order.
        sorted.sort(Comparator
                .comparingInt((Token t) -> t.page)
                .thenComparingDouble((Token t) -> t.y)
                .thenComparingDouble(t -> t.x));

        List<Line> lines = new ArrayList<>();
        Line current = null;
        for (Token token : sorted) {
            if (token.text == null || token.text.isBlank()) {
                continue;
            }
            if (current == null
                    || current.page != token.page
                    || Math.abs(current.y - token.y) > lineTolerance(token.h)) {
                current = new Line(token.page, token.y);
                lines.add(current);
            }
            current.tokens.add(token);
            current.y = (current.y * (current.tokens.size() - 1) + token.y) / current.tokens.size();
        }
        for (Line line : lines) {
            line.tokens.sort(Comparator.comparingDouble(t -> t.x));
            line.rebuildText();
        }
        return lines;
    }

    private double lineTolerance(float h) {
        return Math.max(2.5, h * 0.55);
    }

    private Map<Integer, ColumnBands> detectColumnsByPage(List<Line> lines) {
        Map<Integer, List<Line>> byPage = new HashMap<>();
        for (Line line : lines) {
            byPage.computeIfAbsent(line.page, k -> new ArrayList<>()).add(line);
        }
        Map<Integer, ColumnBands> bandsByPage = new HashMap<>();
        ColumnBands fallback = defaultBands();
        ColumnBands lastGood = fallback;
        List<Integer> pages = new ArrayList<>(byPage.keySet());
        pages.sort(Integer::compareTo);
        for (Integer page : pages) {
            ColumnBands detected = detectColumns(byPage.get(page));
            if (detected.fromHeaders) {
                lastGood = detected;
                bandsByPage.put(page, detected);
            } else {
                // Reuse last header-derived geometry — layouts usually stable across pages.
                bandsByPage.put(page, lastGood);
            }
        }
        if (bandsByPage.isEmpty()) {
            bandsByPage.put(1, fallback);
        }
        return bandsByPage;
    }

    private ColumnBands detectColumns(List<Line> lines) {
        Double codeX = null;
        Double unitX = null;
        Double qtyX = null;
        Double designationX = null;
        boolean fromHeaders = false;

        for (Line line : lines) {
            String folded = fold(line.text);
            for (Token token : line.tokens) {
                String tf = fold(token.text);
                if (tf.equals("N") || tf.equals("NO") || tf.startsWith("N")) {
                    if (line.text.toUpperCase(Locale.ROOT).contains("N°")
                            || line.text.toUpperCase(Locale.ROOT).matches(".*N[°ºO].*")
                            || fold(line.text).contains("N")) {
                        // Prefer header line containing N° alone-ish
                        if (folded.contains("DESIGNATION") || folded.equals("N") || folded.startsWith("N")) {
                            codeX = (double) token.x;
                            fromHeaders = true;
                        }
                    }
                }
                if (tf.equals("UNITE")) {
                    unitX = (double) token.x;
                    fromHeaders = true;
                }
                if (tf.equals("QUANTITE") || tf.equals("QTE")) {
                    qtyX = (double) token.x;
                    fromHeaders = true;
                }
                if (tf.equals("DESIGNATION")) {
                    designationX = (double) token.x;
                    fromHeaders = true;
                }
            }
            if (folded.equals("UNITE")) {
                unitX = (double) line.tokens.get(0).x;
                fromHeaders = true;
            }
            if (folded.equals("QUANTITE") || folded.equals("QTE")) {
                qtyX = (double) line.tokens.get(0).x;
                fromHeaders = true;
            }
        }

        // Fallbacks based on typical Moroccan BDP layouts (A4 landscape/portrait).
        if (codeX == null) {
            codeX = 40.0;
        }
        if (designationX == null) {
            designationX = 70.0;
        }
        if (unitX == null) {
            unitX = 300.0;
        }
        if (qtyX == null) {
            qtyX = 360.0;
        }

        double unitStart = unitX - 18;
        double qtyStart = qtyX - 18;
        double codeEnd = Math.min(designationX + 10, unitStart - 40);
        return new ColumnBands(
                codeX - 5, codeEnd, designationX - 5, unitStart, qtyStart, fromHeaders);
    }

    private static ColumnBands defaultBands() {
        return new ColumnBands(35, 80, 65, 282, 342, false);
    }

    private List<BordereauRowCandidate> extractCandidates(
            List<Line> lines, Map<Integer, ColumnBands> bandsByPage, int pageCount) {
        List<BordereauRowCandidate> rows = new ArrayList<>();
        int order = 0;
        PendingArticle pending = null;

        for (int i = 0; i < lines.size(); i++) {
            Line line = lines.get(i);
            String text = line.text.trim();
            if (text.isEmpty()) {
                continue;
            }
            if (isHeaderNoise(text)) {
                continue;
            }

            ColumnBands bands = bandsByPage.getOrDefault(line.page, defaultBands());
            ColumnSlice slice = slice(line, bands);

            // Pure unit / qty lines (no code, no designation) attach to pending article.
            // Never attach from a line that starts a new article — that caused off-by-one.
            boolean lineStartsArticle = (slice.codeText != null
                    && CODE_ONLY.matcher(compactCode(slice.codeText)).matches())
                    || CODE_PREFIX.matcher(text).matches();
            // Long-form unit lines often also carry abbr + qty: "LE METRE CUBE M3 10,00"
            if (pending != null && !lineStartsArticle && LONG_UNIT.matcher(text).matches()) {
                attachUnitOrQty(pending, slice, text);
                extractUnitQtyFromFreeText(pending, text);
                continue;
            }
            if (pending != null
                    && !lineStartsArticle
                    && isPureUnitOrQtyLine(slice, text)
                    && attachUnitOrQty(pending, slice, text)) {
                continue;
            }
            // Unit/qty band-only lines (KG 5600 / U 10 700) even with empty designation.
            if (pending != null && !lineStartsArticle && (slice.unitText != null || slice.qtyText != null)
                    && (slice.designationText == null || slice.designationText.isBlank())
                    && (slice.codeText == null || slice.codeText.isBlank())) {
                attachUnitOrQty(pending, slice, text);
                extractUnitQtyFromFreeText(pending, text);
                continue;
            }

            BordereauRowCandidate.Kind groupKind = detectGrouping(text, slice, bands);
            if (groupKind != null) {
                if (pending != null) {
                    rows.add(pending.toCandidate(nextId(rows.size()), order++));
                    pending = null;
                }
                String code = extractLeadingCode(text);
                String libelle = stripLeadingCode(text);
                rows.add(new BordereauRowCandidate(
                        "g" + rows.size(),
                        line.page,
                        order++,
                        code,
                        libelle.isBlank() ? text : libelle,
                        null,
                        null,
                        groupKind,
                        0.75,
                        text,
                        BordereauRowCandidate.ExtractionMethod.PDFBOX,
                        text));
                continue;
            }

            String leftCode = slice.codeText != null ? slice.codeText.trim() : "";
            boolean codeAlone = !leftCode.isBlank() && CODE_ONLY.matcher(compactCode(leftCode)).matches()
                    && (slice.designationText == null || slice.designationText.isBlank())
                    && slice.unitText == null
                    && slice.qtyText == null;

            boolean codeWithText = false;
            String inlineCode = null;
            String inlineLibelle = null;
            if (!codeAlone) {
                Matcher m = CODE_PREFIX.matcher(text);
                if (m.matches() && slice.x0 < bands.unitStart - 30) {
                    inlineCode = compactCode(m.group(1));
                    inlineLibelle = m.group(2).trim();
                    // Section header: short hierarchical code (1 / 1-1) + title, no pricing.
                    if (!hasUnitOrQty(slice)
                            && !containsUnitOrQtyToken(text)
                            && isSectionCode(inlineCode)
                            && looksLikeSectionTitle(inlineLibelle)) {
                        if (pending != null) {
                            rows.add(pending.toCandidate(nextId(rows.size()), order++));
                            pending = null;
                        }
                        rows.add(new BordereauRowCandidate(
                                "g" + rows.size(),
                                line.page,
                                order++,
                                inlineCode,
                                inlineLibelle,
                                null,
                                null,
                                BordereauRowCandidate.Kind.SECTION,
                                0.65,
                                text,
                                BordereauRowCandidate.ExtractionMethod.PDFBOX,
                                text));
                        continue;
                    }
                    codeWithText = true;
                }
            }

            if (codeAlone || codeWithText) {
                if (pending != null) {
                    rows.add(pending.toCandidate(nextId(rows.size()), order++));
                }
                String code = codeAlone ? compactCode(leftCode) : inlineCode;
                // Prefer geometrically sliced designation — full-line regex includes unit/qty.
                String libelle = slice.designationText != null ? slice.designationText.trim() : "";
                if (libelle.isBlank() && inlineLibelle != null) {
                    libelle = stripTrailingUnitQty(inlineLibelle);
                }
                if (libelle.isBlank()) {
                    String above = designationAbove(lines, i, bands);
                    if (above != null) {
                        libelle = above;
                    }
                }
                pending = new PendingArticle(line.page, code, libelle, line.y);
                attachUnitOrQty(pending, slice, text);
                extractUnitQtyFromFreeText(pending, text);
                continue;
            }

            // Continuation of designation for pending article (never a new code line).
            if (pending != null && !lineStartsArticle) {
                boolean pricingLine = containsUnitOrQtyToken(text)
                        || slice.unitText != null
                        || slice.qtyText != null;
                if (pricingLine) {
                    attachUnitOrQty(pending, slice, text);
                    extractUnitQtyFromFreeText(pending, text);
                    // Keep short designation fragments like "a DE 40 x 40 CM" before pricing.
                    if (slice.designationText != null
                            && !slice.designationText.isBlank()
                            && !LONG_UNIT.matcher(slice.designationText).matches()) {
                        String des = stripTrailingUnitQty(slice.designationText);
                        if (!des.isBlank() && (pending.libelle == null || !pending.libelle.contains(des))) {
                            pending.libelle = (pending.libelle == null || pending.libelle.isBlank())
                                    ? des
                                    : pending.libelle + " " + des;
                        }
                    }
                    continue;
                }
                if (slice.x0 < bands.unitStart
                        && !isHeaderNoise(text)
                        && !LONG_UNIT.matcher(text).matches()) {
                    String des = slice.designationText != null ? slice.designationText.trim() : text;
                    des = stripTrailingUnitQty(des);
                    if (pending.libelle == null || pending.libelle.isBlank()) {
                        pending.libelle = des;
                    } else if (!pending.libelle.contains(des)) {
                        pending.libelle = pending.libelle + " " + des;
                    }
                    continue;
                }
            }

            // Orphan line with unit+qty and designation — treat as ambiguous article.
            if (hasUnitOrQty(slice) && slice.designationText != null && !slice.designationText.isBlank()) {
                if (pending != null) {
                    rows.add(pending.toCandidate(nextId(rows.size()), order++));
                    pending = null;
                }
                String unit = normalizeUnit(slice.unitText);
                BigDecimal qty = parseQty(slice.qtyText);
                rows.add(new BordereauRowCandidate(
                        nextId(rows.size()),
                        line.page,
                        order++,
                        null,
                        slice.designationText.trim(),
                        unit,
                        qty,
                        unit != null || qty != null
                                ? BordereauRowCandidate.Kind.ARTICLE
                                : BordereauRowCandidate.Kind.AMBIGUOUS,
                        0.55,
                        text,
                        BordereauRowCandidate.ExtractionMethod.PDFBOX,
                        text));
            }
        }

        if (pending != null) {
            rows.add(pending.toCandidate(nextId(rows.size()), order));
        }

        // Post-pass: absorb nearby unit/qty that may have been orphaned between articles.
        ColumnBands anyBands = bandsByPage.values().stream().findFirst().orElse(defaultBands());
        return refineCandidates(rows, lines, anyBands);
    }

    private List<BordereauRowCandidate> refineCandidates(
            List<BordereauRowCandidate> rows, List<Line> lines, ColumnBands bands) {
        // Drop noise and empty labels; demote groupings that somehow got unit+qty.
        List<BordereauRowCandidate> out = new ArrayList<>();
        for (BordereauRowCandidate row : rows) {
            if (row.libelle() == null || row.libelle().isBlank()) {
                if (row.code() == null) {
                    continue;
                }
            }
            String lib = cleanLibelle(row.libelle());
            if (lib == null || lib.isBlank()) {
                continue;
            }
            if (HEADER_NOISE.matcher(lib).find() && lib.length() < 40) {
                continue;
            }
            BordereauRowCandidate.Kind kind = row.kind();
            double confidence = row.confidence();
            if (kind == BordereauRowCandidate.Kind.ARTICLE || kind == BordereauRowCandidate.Kind.AMBIGUOUS) {
                if (row.hasPricing()) {
                    kind = BordereauRowCandidate.Kind.ARTICLE;
                    confidence = Math.max(confidence, 0.8);
                } else if (row.unite() != null || row.quantite() != null) {
                    kind = BordereauRowCandidate.Kind.ARTICLE;
                    confidence = Math.max(confidence, 0.65);
                } else if (row.code() != null && looksLikeSectionTitle(lib)) {
                    kind = BordereauRowCandidate.Kind.SECTION;
                    confidence = 0.6;
                } else {
                    kind = BordereauRowCandidate.Kind.AMBIGUOUS;
                }
            }
            out.add(new BordereauRowCandidate(
                    row.rowId(),
                    row.page(),
                    row.order(),
                    row.code(),
                    lib,
                    row.unite(),
                    row.quantite(),
                    kind,
                    confidence,
                    row.rawText(),
                    row.method() != null ? row.method() : BordereauRowCandidate.ExtractionMethod.PDFBOX,
                    row.sourceRef() != null ? row.sourceRef() : row.rawText()));
        }
        return out;
    }

    private static String stripTrailingUnitQty(String libelle) {
        if (libelle == null) {
            return null;
        }
        String cleaned = libelle.trim();
        cleaned = cleaned.replaceAll(
                "(?i)\\s+(M3|M\\u00B3|M2|M\\u00B2|ML|KG|KGS|T|U|UN|FF|H|J|L|ENS|E)\\s+[\\d\\s]+(?:[,.]\\d+)?\\s*$",
                "");
        cleaned = cleaned.replaceAll("(?i)\\s+(M3|M\\u00B3|M2|M\\u00B2|ML|KG|KGS|T|U|UN|FF|H|J|L|ENS|E)\\s*$", "");
        cleaned = cleaned.replaceAll("\\s+[\\d\\s]+(?:[,.]\\d+)?\\s*$", "");
        return cleaned.trim();
    }

    private String designationAbove(List<Line> lines, int codeIndex, ColumnBands bands) {
        if (codeIndex <= 0) {
            return null;
        }
        Line prev = lines.get(codeIndex - 1);
        Line codeLine = lines.get(codeIndex);
        if (prev.page != codeLine.page) {
            return null;
        }
        if (Math.abs(prev.y - codeLine.y) > 14) {
            return null;
        }
        ColumnSlice slice = slice(prev, bands);
        if (slice.designationText == null || slice.designationText.isBlank()) {
            return null;
        }
        if (isHeaderNoise(slice.designationText) || LONG_UNIT.matcher(slice.designationText).matches()) {
            return null;
        }
        // Only if previous line has no code of its own.
        if (slice.codeText != null && CODE_ONLY.matcher(compactCode(slice.codeText)).matches()) {
            return null;
        }
        return slice.designationText.trim();
    }

    private static boolean isPureUnitOrQtyLine(ColumnSlice slice, String fullText) {
        if (slice.designationText != null && !slice.designationText.isBlank()) {
            return false;
        }
        if (slice.codeText != null && !slice.codeText.isBlank()) {
            return false;
        }
        String compact = fullText.replace(" ", "");
        return UNIT_TOKEN.matcher(compact).matches()
                || (QTY.matcher(fullText).matches() && fullText.matches(".*\\d.*"))
                || ((slice.unitText != null || slice.qtyText != null)
                        && (slice.designationText == null || slice.designationText.isBlank()));
    }

    private boolean attachUnitOrQty(PendingArticle pending, ColumnSlice slice, String fullText) {
        boolean attached = false;
        if (slice.unitText != null) {
            String unit = normalizeUnit(slice.unitText);
            if (unit != null && pending.unite == null) {
                pending.unite = unit;
                attached = true;
            }
        } else if (UNIT_TOKEN.matcher(fullText.replace(" ", "")).matches()) {
            if (pending.unite == null) {
                pending.unite = normalizeUnit(fullText);
                attached = true;
            }
        }
        if (slice.qtyText != null) {
            BigDecimal qty = parseQty(slice.qtyText);
            if (qty != null && pending.quantite == null) {
                pending.quantite = qty;
                attached = true;
            }
        } else if (QTY.matcher(fullText).matches() && fullText.matches(".*\\d.*")) {
            // Alone on line — only if we already have a unit (avoids capturing N° as qty).
            if (pending.unite != null && pending.quantite == null) {
                BigDecimal qty = parseQty(fullText);
                if (qty != null) {
                    pending.quantite = qty;
                    attached = true;
                }
            }
        }
        return attached;
    }

    private boolean hasUnitOrQty(ColumnSlice slice) {
        return (slice.unitText != null && !slice.unitText.isBlank())
                || (slice.qtyText != null && !slice.qtyText.isBlank());
    }

    private BordereauRowCandidate.Kind detectGrouping(String text, ColumnSlice slice, ColumnBands bands) {
        String up = text.toUpperCase(Locale.ROOT);
        if (containsUnitOrQtyToken(text)) {
            return null;
        }
        if (isMarketTitleNoise(text)) {
            return null;
        }
        if (SOUS_LOT.matcher(up).find()) {
            return BordereauRowCandidate.Kind.SOUS_LOT;
        }
        // Only explicit "LOT N° 1" / "LOT 1 :" headers — never long titles containing "LOT".
        String trimmed = text.trim();
        if (LOT_HEADER.matcher(trimmed).find() && trimmed.length() < 80) {
            return BordereauRowCandidate.Kind.LOT;
        }
        return null;
    }

    private static boolean isSectionCode(String code) {
        if (code == null || code.isBlank()) {
            return false;
        }
        // "1", "1-1", "3.1" — not leaf articles like "1-1-3" / "3.1.2"
        String[] parts = code.split("[.\\-]");
        return parts.length <= 2;
    }

    private static boolean containsUnitOrQtyToken(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        for (String token : text.split("\\s+")) {
            if (UNIT_TOKEN.matcher(token).matches()) {
                return true;
            }
            if (QTY.matcher(token).matches() && token.matches(".*\\d.*") && token.contains(",")) {
                return true;
            }
        }
        // "5 600,00" / "10 700,00"
        return text.matches("(?i).*\\b(M3|M2|ML|KG|U|ENS|E|FF|T)\\b.*\\d.*")
                || text.matches(".*\\d{1,3}(?:\\s\\d{3})*,\\d+.*");
    }

    private void extractUnitQtyFromFreeText(PendingArticle pending, String text) {
        if (pending == null || text == null) {
            return;
        }
        if (pending.unite == null) {
            for (String token : text.split("\\s+")) {
                if (UNIT_TOKEN.matcher(token).matches()) {
                    pending.unite = normalizeUnit(token);
                    break;
                }
            }
        }
        if (pending.quantite == null) {
            Matcher qtyMatcher = Pattern.compile(
                    "(\\d{1,3}(?:\\s\\d{3})*,\\d+|\\d+,\\d+|\\d{1,3}(?:\\s\\d{3})+)")
                    .matcher(text);
            // Prefer the last numeric amount on the line (qty, not a code).
            String last = null;
            while (qtyMatcher.find()) {
                last = qtyMatcher.group(1);
            }
            if (last != null) {
                pending.quantite = parseQty(last);
            }
        }
    }

    private boolean looksLikeSectionTitle(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        String t = text.trim();
        if (LONG_UNIT.matcher(t).matches()) {
            return false;
        }
        if (UNIT_TOKEN.matcher(t.replace(" ", "")).matches()) {
            return false;
        }
        long letters = t.chars().filter(Character::isLetter).count();
        long upper = t.chars().filter(Character::isUpperCase).count();
        return letters > 4 && upper >= letters * 0.6;
    }

    private boolean isHeaderNoise(String text) {
        String up = text.toUpperCase(Locale.ROOT).trim();
        if (up.length() < 3) {
            return false;
        }
        if (HEADER_NOISE.matcher(up).find() && up.length() < 60) {
            // Keep "SOUS LOT N° ..." — not noise.
            if (SOUS_LOT.matcher(up).find()) {
                return false;
            }
            return true;
        }
        if (isMarketTitleNoise(text)) {
            return true;
        }
        if (up.contains("TOTAL EN DHS") || up.contains("TOTAL TRAVAUX")) {
            return true;
        }
        return false;
    }

    /** Repeated DQE market banner / project title — never a LOT/ARTICLE. */
    public static boolean isMarketTitleNoise(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        String up = text.toUpperCase(Locale.ROOT).trim();
        if (SOUS_LOT.matcher(up).find()) {
            return false;
        }
        if (MARKET_TITLE.matcher(up).find()) {
            return true;
        }
        // Truncated banner fragments embedding "LOT" inside a long amenagement title.
        if (up.contains("LOT") && !up.contains("SOUS") && up.length() > 60
                && (up.contains("ENTREPOT") || up.contains("AMENAGEMENT") || up.contains("RABAT"))) {
            return true;
        }
        return false;
    }

    private ColumnSlice slice(Line line, ColumnBands bands) {
        StringBuilder code = new StringBuilder();
        StringBuilder designation = new StringBuilder();
        StringBuilder unit = new StringBuilder();
        StringBuilder qty = new StringBuilder();
        double x0 = line.tokens.isEmpty() ? 0 : line.tokens.get(0).x;

        for (Token token : line.tokens) {
            String t = token.text;
            if (t == null || t.isBlank()) {
                continue;
            }
            if (token.x >= bands.unitStart && token.x < bands.qtyStart) {
                append(unit, t);
            } else if (token.x >= bands.qtyStart) {
                // Stop before montant/prix if clearly to the right of qty band
                if (token.x > bands.qtyStart + 90 && !QTY.matcher(t.replace(" ", "")).matches()) {
                    continue;
                }
                append(qty, t);
            } else if (token.x < bands.codeEnd && looksLikeCodeToken(t)) {
                // Strict: only real codes in the N° band — never swallow designation words
                // like « FOUILLES » that sit slightly left of the DESIGNATION header.
                append(code, t);
            } else {
                append(designation, t);
            }
        }

        // Reclassify unit/qty if misplaced in designation column.
        String des = designation.toString().trim();
        String unitStr = unit.toString().trim();
        String qtyStr = qty.toString().trim();
        if (unitStr.isBlank() && UNIT_TOKEN.matcher(des.replace(" ", "")).matches()) {
            unitStr = des;
            des = "";
        }
        if (qtyStr.isBlank() && QTY.matcher(des).matches() && des.matches(".*\\d.*")) {
            qtyStr = des;
            des = "";
        }
        // Trailing "… M3 10,00" glued into designation by coarse line merge.
        if ((unitStr.isBlank() || qtyStr.isBlank()) && !des.isBlank()) {
            java.util.regex.Matcher tail = Pattern.compile(
                    "(?i)^(.*?)\\s+(M3|M\\u00B3|M2|M\\u00B2|ML|KG|KGS|T|U|UN|FF|H|J|L|ENS|E)\\s+([\\d\\s]+(?:[,.]\\d+)?)\\s*$")
                    .matcher(des);
            if (tail.matches()) {
                des = tail.group(1).trim();
                if (unitStr.isBlank()) {
                    unitStr = tail.group(2);
                }
                if (qtyStr.isBlank()) {
                    qtyStr = tail.group(3);
                }
            }
        }

        return new ColumnSlice(
                x0,
                emptyToNull(code.toString().trim()),
                emptyToNull(des),
                emptyToNull(unitStr),
                emptyToNull(qtyStr));
    }

    private boolean looksLikeCodeToken(String t) {
        String c = compactCode(t);
        return CODE_ONLY.matcher(c).matches() || c.matches("\\d+[a-zA-Z]?");
    }

    private static void append(StringBuilder sb, String t) {
        if (sb.length() > 0) {
            sb.append(' ');
        }
        sb.append(t);
    }

    private static String emptyToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    private static String nextId(int size) {
        return "r" + size;
    }

    private static String compactCode(String raw) {
        if (raw == null) {
            return null;
        }
        return raw.trim().replaceAll("\\s+", "");
    }

    private static String extractLeadingCode(String text) {
        Matcher m = CODE_PREFIX.matcher(text.trim());
        if (m.matches()) {
            return compactCode(m.group(1));
        }
        if (CODE_ONLY.matcher(compactCode(text)).matches()) {
            return compactCode(text);
        }
        return null;
    }

    private static String stripLeadingCode(String text) {
        Matcher m = CODE_PREFIX.matcher(text.trim());
        if (m.matches()) {
            return m.group(2).trim();
        }
        return text.trim();
    }

    public static String normalizeUnit(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String folded = fold(raw);
        return switch (folded) {
            case "M3" -> "M3";
            case "M2" -> "M2";
            case "ML", "MLIN" -> "ML";
            case "KG", "KGS" -> "KG";
            case "T", "TO", "TONNE", "TONNES" -> "T";
            case "U", "UN", "UNITE", "EA" -> "U";
            case "E" -> "ENS"; // common BDP shorthand for ensemble
            case "ENS", "ENSEMBLE" -> "ENS";
            case "FF", "FORFAIT" -> "FF";
            case "H", "HR", "HEURE", "HEURES" -> "H";
            case "J", "JOUR", "JOURS" -> "J";
            case "L", "LITRE", "LITRES" -> "L";
            default -> folded.length() <= 4 ? folded : null;
        };
    }

    public static BigDecimal parseQty(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String cleaned = raw.trim()
                .replace('\u00A0', ' ')
                .replace(" ", "")
                .replace(',', '.');
        if (!cleaned.matches("\\d+(?:\\.\\d+)?")) {
            return null;
        }
        try {
            return new BigDecimal(cleaned).setScale(3, RoundingMode.HALF_UP).stripTrailingZeros();
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String cleanLibelle(String libelle) {
        if (libelle == null) {
            return null;
        }
        String cleaned = libelle
                .replaceAll("\\s+", " ")
                .replaceAll("(?i)\\bTOTAL\\s+EN\\s+DHS.*$", "")
                .replaceAll("(?i)\\bTOTAL\\s+TRAVAUX.*$", "")
                .trim();
        // Strip trailing dashes used as empty price placeholders
        cleaned = cleaned.replaceAll("(?:\\s*-\\s*)+$", "").trim();
        return cleaned;
    }

    private static String fold(String value) {
        if (value == null) {
            return "";
        }
        String n = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toUpperCase(Locale.ROOT)
                .replace('\u00B3', '3')
                .replace('\u00B2', '2')
                .replaceAll("[^A-Z0-9]", "");
        return n;
    }

    // ── internal models ──────────────────────────────────────────────────────

    private static final class Token {
        final int page;
        final float x;
        final float y;
        final float h;
        final String text;

        Token(int page, float x, float y, float h, String text) {
            this.page = page;
            this.x = x;
            this.y = y;
            this.h = h;
            this.text = text;
        }
    }

    private static final class Line {
        final int page;
        double y;
        final List<Token> tokens = new ArrayList<>();
        String text = "";

        Line(int page, double y) {
            this.page = page;
            this.y = y;
        }

        void rebuildText() {
            StringBuilder sb = new StringBuilder();
            for (Token token : tokens) {
                if (token.text == null || token.text.isBlank()) {
                    continue;
                }
                if (sb.length() > 0) {
                    sb.append(' ');
                }
                sb.append(token.text);
            }
            text = sb.toString();
        }
    }

    private record ColumnBands(
            double codeStart,
            double codeEnd,
            double designationStart,
            double unitStart,
            double qtyStart,
            boolean fromHeaders) {}

    private record ColumnSlice(
            double x0,
            String codeText,
            String designationText,
            String unitText,
            String qtyText) {
        boolean mostlyDesignation(ColumnBands bands) {
            return x0 < bands.unitStart;
        }
    }

    private static final class PendingArticle {
        final int page;
        final String code;
        String libelle;
        String unite;
        BigDecimal quantite;
        final double y;

        PendingArticle(int page, String code, String libelle, double y) {
            this.page = page;
            this.code = code;
            this.libelle = libelle != null ? libelle : "";
            this.y = y;
        }

        BordereauRowCandidate toCandidate(String id, int order) {
            String lib = cleanLibelle(libelle);
            boolean priced = unite != null && quantite != null;
            BordereauRowCandidate.Kind kind;
            double confidence;
            if (priced) {
                kind = BordereauRowCandidate.Kind.ARTICLE;
                confidence = 0.9;
            } else if (unite != null || quantite != null) {
                kind = BordereauRowCandidate.Kind.ARTICLE;
                confidence = 0.7;
            } else if (looksLikeSectionTitleStatic(lib)) {
                kind = BordereauRowCandidate.Kind.SECTION;
                confidence = 0.55;
            } else {
                kind = BordereauRowCandidate.Kind.AMBIGUOUS;
                confidence = 0.5;
            }
            return new BordereauRowCandidate(
                    id, page, order, code, lib, unite, quantite, kind, confidence,
                    (code != null ? code + " " : "") + (lib != null ? lib : ""),
                    BordereauRowCandidate.ExtractionMethod.PDFBOX,
                    (code != null ? code + " " : "") + (lib != null ? lib : ""));
        }

        private static boolean looksLikeSectionTitleStatic(String text) {
            if (text == null || text.isBlank()) {
                return false;
            }
            long letters = text.chars().filter(Character::isLetter).count();
            long upper = text.chars().filter(Character::isUpperCase).count();
            return letters > 4 && upper >= letters * 0.7 && text.length() < 70;
        }
    }

    private static final class TokenCollector extends PDFTextStripper {
        private final List<Token> tokens = new ArrayList<>();

        TokenCollector() throws IOException {
            super();
        }

        @Override
        protected void writeString(String text, List<TextPosition> textPositions) {
            if (textPositions == null || textPositions.isEmpty()) {
                return;
            }
            // Group contiguous positions into word-ish tokens by X gap.
            StringBuilder word = new StringBuilder();
            float startX = textPositions.get(0).getXDirAdj();
            float y = textPositions.get(0).getYDirAdj();
            float h = textPositions.get(0).getHeightDir();
            float lastEnd = startX;
            int page = getCurrentPageNo();

            for (TextPosition pos : textPositions) {
                String unicode = pos.getUnicode();
                if (unicode == null || unicode.isEmpty()) {
                    continue;
                }
                float x = pos.getXDirAdj();
                float gap = x - lastEnd;
                if (word.length() > 0 && (gap > pos.getWidthOfSpace() * 0.5 || unicode.equals(" "))) {
                    flushWord(page, startX, y, h, word);
                    word.setLength(0);
                    if (unicode.equals(" ")) {
                        lastEnd = x + pos.getWidthDirAdj();
                        continue;
                    }
                    startX = x;
                    y = pos.getYDirAdj();
                    h = pos.getHeightDir();
                }
                if (word.length() == 0) {
                    startX = x;
                    y = pos.getYDirAdj();
                    h = pos.getHeightDir();
                }
                if (!unicode.equals(" ")) {
                    word.append(unicode);
                }
                lastEnd = x + pos.getWidthDirAdj();
            }
            flushWord(page, startX, y, h, word);
        }

        private void flushWord(int page, float x, float y, float h, StringBuilder word) {
            if (word.length() == 0) {
                return;
            }
            tokens.add(new Token(page, x, y, h, word.toString()));
        }
    }
}
