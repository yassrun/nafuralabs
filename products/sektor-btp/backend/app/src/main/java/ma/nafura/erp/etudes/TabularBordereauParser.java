package ma.nafura.erp.etudes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.etudes.service.bordereau.BordereauParseResult;
import ma.nafura.etudes.service.bordereau.BordereauRowCandidate;
import ma.nafura.etudes.service.bordereau.PdfBordereauLayoutParser;
import ma.nafura.etudes.service.bordereau.grid.ColumnMap;
import ma.nafura.etudes.service.bordereau.grid.GridBordereauAssembler;
import ma.nafura.etudes.service.bordereau.grid.GridRow;
import ma.nafura.etudes.service.bordereau.grid.GridRowClassifier;
import ma.nafura.etudes.service.bordereau.grid.XlsxGridSource;
import ma.nafura.platform.documents.docextractor.service.util.SpreadsheetTextExtractor;
import org.springframework.stereotype.Component;

/**
 * Parseur déterministe XLSX/CSV → candidats bordereau (sans LLM).
 */
@Component
public class TabularBordereauParser {

    private static final Pattern CODE = Pattern.compile(
            "^\\d+(?:[.\\-\\s]+\\d+[a-zA-Z]?){0,5}\\.?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern CODE_PREFIX = Pattern.compile(
            "^(\\d+(?:[.\\-\\s]+\\d+[a-zA-Z]?){0,5}\\.?)\\s*[-–—:]?\\s*(.+)$",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern UNIT = Pattern.compile(
            "^(M3|M\u00B3|M2|M\u00B2|ML|KG|KGS|T|U|UN|FF|H|J|L|ENS|E|FORFAIT)$",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SOUS_LOT = Pattern.compile("SOUS\\s*LOT", Pattern.CASE_INSENSITIVE);
    private static final Pattern LOT = Pattern.compile("\\bLOT\\b", Pattern.CASE_INSENSITIVE);

    private final XlsxGridSource xlsxGrid = new XlsxGridSource();

    public boolean supports(String mimeType, String fileName) {
        if (SpreadsheetTextExtractor.isTabularMime(mimeType)) {
            return true;
        }
        if (fileName == null) {
            return false;
        }
        String lower = fileName.toLowerCase(Locale.ROOT);
        return lower.endsWith(".xlsx")
                || lower.endsWith(".xls")
                || lower.endsWith(".csv");
    }

    public BordereauParseResult parse(byte[] bytes, String fileName, String mimeType) {
        if (bytes == null || bytes.length == 0) {
            return BordereauParseResult.failed("empty_tabular");
        }
        // Un classeur est déjà une grille : on le lit par colonnes avant de tenter quoi que ce
        // soit sur le texte aplati, qui doit retrouver les colonnes par leur position.
        BordereauParseResult grid = parseAsGrid(bytes, fileName, mimeType);
        if (grid != null) {
            return grid;
        }
        String text = SpreadsheetTextExtractor.toPromptText(bytes, mimeType, fileName);
        if (text == null || text.isBlank()) {
            return BordereauParseResult.insufficient(1, 0, List.of(), "empty_tabular_text");
        }
        List<BordereauRowCandidate> rows = new ArrayList<>();
        int order = 0;
        int page = 1;
        for (String rawLine : text.split("\\R")) {
            String line = rawLine.trim();
            if (line.isBlank() || line.startsWith("Spreadsheet file:") || line.startsWith("=== Sheet:")) {
                if (line.startsWith("=== Sheet:")) {
                    page++;
                }
                continue;
            }
            String[] cols = line.contains("\t") ? line.split("\t", -1) : line.split("\\s{2,}");
            BordereauRowCandidate row = mapRow(cols, line, page, order);
            if (row != null) {
                rows.add(row);
                order++;
            }
        }
        if (rows.isEmpty()) {
            return BordereauParseResult.insufficient(page, text.length() / Math.max(page, 1), rows, "no_tabular_rows");
        }
        long articles = rows.stream().filter(BordereauRowCandidate::looksLikeArticle).count();
        if (articles < 1) {
            return BordereauParseResult.insufficient(
                    page, text.length() / Math.max(page, 1), rows, "no_tabular_articles");
        }
        Set<Integer> pages = new LinkedHashSet<>();
        for (BordereauRowCandidate r : rows) {
            if (r.looksLikeArticle()) {
                pages.add(r.page());
            }
        }
        return new BordereauParseResult(
                Math.max(page, 1),
                text.length() / Math.max(page, 1),
                List.copyOf(rows),
                Set.copyOf(pages),
                BordereauParseResult.Quality.USABLE,
                null);
    }

    /**
     * Lecture par colonnes : les cellules gardent leur position, donc la quantité se lit dans la
     * colonne quantité et non « la dernière ». Rend {@code null} quand la source n'est pas un
     * classeur ou que la grille n'a rien donné d'exploitable, pour laisser le repli s'exécuter.
     */
    private BordereauParseResult parseAsGrid(byte[] bytes, String fileName, String mimeType) {
        if (!xlsxGrid.supports(fileName, mimeType)) {
            return null;
        }
        List<GridRow> gridRows;
        try {
            gridRows = xlsxGrid.read(bytes);
        } catch (RuntimeException e) {
            return null;
        }
        if (gridRows.isEmpty()) {
            return null;
        }

        ColumnMap columns = ColumnMap.resolve(gridRows);
        List<BordereauRowCandidate> candidates = GridBordereauAssembler.assemble(
                gridRows, GridRowClassifier.classify(gridRows, columns), columns);

        long articles = candidates.stream().filter(BordereauRowCandidate::looksLikeArticle).count();
        if (articles < 1) {
            return null;
        }

        Set<Integer> pages = new LinkedHashSet<>();
        for (BordereauRowCandidate candidate : candidates) {
            if (candidate.looksLikeArticle()) {
                pages.add(candidate.page());
            }
        }
        int sheets = (int) gridRows.stream().map(GridRow::page).distinct().count();
        return new BordereauParseResult(
                Math.max(sheets, 1),
                gridRows.size() / Math.max(sheets, 1),
                List.copyOf(candidates),
                Set.copyOf(pages),
                BordereauParseResult.Quality.USABLE,
                null);
    }

    private BordereauRowCandidate mapRow(String[] cols, String raw, int page, int order) {
        String joined = String.join(" ", cols).trim();
        if (joined.isBlank()) {
            return null;
        }
        String up = joined.toUpperCase(Locale.ROOT);
        if (up.contains("DESIGNATION") && up.contains("UNITE")) {
            return null;
        }
        if (up.startsWith("TOTAL ") || up.contains("MONTANT TOTAL")) {
            return null;
        }
        if (SOUS_LOT.matcher(up).find()) {
            return group("g" + order, page, order, joined, BordereauRowCandidate.Kind.SOUS_LOT);
        }
        if (LOT.matcher(up).find() && !up.contains("SOUS")) {
            return group("g" + order, page, order, joined, BordereauRowCandidate.Kind.LOT);
        }

        String code = null;
        String libelle = null;
        String unite = null;
        BigDecimal qty = null;

        if (cols.length >= 4) {
            code = blankToNull(cols[0]);
            libelle = blankToNull(cols[1]);
            unite = blankToNull(cols[Math.min(2, cols.length - 2)]);
            qty = PdfBordereauLayoutParser.parseQty(cols[cols.length - 1]);
            if (unite != null) {
                unite = PdfBordereauLayoutParser.normalizeUnit(unite);
            }
        } else if (cols.length == 3) {
            Matcher m = CODE_PREFIX.matcher(cols[0].trim());
            if (m.matches()) {
                code = compact(m.group(1));
                libelle = m.group(2).trim();
            } else if (CODE.matcher(compact(cols[0])).matches()) {
                code = compact(cols[0]);
                libelle = cols[1];
            } else {
                libelle = cols[0];
                unite = PdfBordereauLayoutParser.normalizeUnit(cols[1]);
                qty = PdfBordereauLayoutParser.parseQty(cols[2]);
            }
            if (unite == null && cols.length >= 2) {
                unite = PdfBordereauLayoutParser.normalizeUnit(cols[cols.length - 2]);
            }
            if (qty == null) {
                qty = PdfBordereauLayoutParser.parseQty(cols[cols.length - 1]);
            }
        } else {
            Matcher m = CODE_PREFIX.matcher(joined);
            if (m.matches()) {
                code = compact(m.group(1));
                libelle = m.group(2).trim();
            } else {
                libelle = joined;
            }
            for (String token : joined.split("\\s+")) {
                if (unite == null && UNIT.matcher(token).matches()) {
                    unite = PdfBordereauLayoutParser.normalizeUnit(token);
                }
            }
            qty = PdfBordereauLayoutParser.parseQty(joined.replaceAll(".*?(\\d[\\d\\s]*,\\d+|\\d+)\\s*$", "$1"));
        }

        if (libelle == null || libelle.isBlank()) {
            return null;
        }
        if (code != null && CODE.matcher(compact(code)).matches()
                && unite == null && qty == null
                && looksLikeSection(libelle)) {
            return new BordereauRowCandidate(
                    "g" + order, page, order, compact(code), libelle, null, null,
                    BordereauRowCandidate.Kind.SECTION, 0.7, raw,
                    BordereauRowCandidate.ExtractionMethod.TABLE, raw);
        }

        BordereauRowCandidate.Kind kind = (unite != null || qty != null)
                ? BordereauRowCandidate.Kind.ARTICLE
                : BordereauRowCandidate.Kind.AMBIGUOUS;
        double confidence = (unite != null && qty != null) ? 0.92 : 0.6;
        return new BordereauRowCandidate(
                "r" + order,
                page,
                order,
                code != null ? compact(code) : null,
                libelle.trim(),
                unite,
                qty,
                kind,
                confidence,
                raw,
                BordereauRowCandidate.ExtractionMethod.TABLE,
                raw);
    }

    private static BordereauRowCandidate group(
            String id, int page, int order, String text, BordereauRowCandidate.Kind kind) {
        Matcher m = CODE_PREFIX.matcher(text);
        String code = m.matches() ? compact(m.group(1)) : null;
        String libelle = m.matches() ? m.group(2).trim() : text;
        return new BordereauRowCandidate(
                id, page, order, code, libelle, null, null, kind, 0.8, text,
                BordereauRowCandidate.ExtractionMethod.TABLE, text);
    }

    private static boolean looksLikeSection(String libelle) {
        long letters = libelle.chars().filter(Character::isLetter).count();
        long upper = libelle.chars().filter(Character::isUpperCase).count();
        return letters > 4 && upper >= letters * 0.6;
    }

    private static String compact(String raw) {
        return raw == null ? null : raw.trim().replaceAll("\\s+", "");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
