package ma.nafura.platform.documents.docextractor.grid;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Color;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFColor;

/**
 * Lit un classeur comme une grille de cellules.
 *
 * <p>C'est la source la plus fidèle des trois : un classeur <em>est</em> déjà un tableau, il n'y a
 * ni géométrie à reconstruire ni colonne à deviner. Le lecteur de flux qu'elle remplace
 * aplatissait chaque ligne en texte puis rattrapait les colonnes par leur position — il lisait la
 * dernière colonne comme quantité, donc le total, et perdait la quantité sur les bordereaux à six
 * colonnes.
 *
 * <p>Le classeur porte aussi la mise en forme, que le PDF ne donne pas : fond de couleur, corps de
 * police, cellule fusionnée. Dans beaucoup de bordereaux, c'est cela — et non la numérotation —
 * qui marque les lots.
 */
public final class XlsxGridSource {

    /** Au-delà, on n'a plus affaire à un bordereau mais à un export de base. */
    private static final int MAX_ROWS_PER_SHEET = 5_000;

    private final DataFormatter formatter = new DataFormatter(Locale.FRANCE);

    public boolean supports(String fileName, String mimeType) {
        if (mimeType != null) {
            String m = mimeType.toLowerCase(Locale.ROOT);
            if (m.contains("spreadsheet") || m.contains("ms-excel")) {
                return true;
            }
        }
        if (fileName == null) {
            return false;
        }
        String lower = fileName.toLowerCase(Locale.ROOT);
        return lower.endsWith(".xlsx") || lower.endsWith(".xlsm") || lower.endsWith(".xls");
    }

    /**
     * @return une ligne par ligne non vide du classeur, toutes feuilles confondues
     * @throws IllegalArgumentException si le classeur est illisible
     */
    public List<GridRow> read(byte[] bytes) {
        List<GridRow> rows = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                readSheet(workbook.getSheetAt(s), rows);
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Classeur illisible : " + e.getMessage(), e);
        }
        return rows;
    }

    /**
     * Les feuilles sont concaténées : un bordereau découpé en « Table 1 » / « Table 2 » est un
     * seul document, et sa numérotation court d'une feuille à l'autre.
     */
    private void readSheet(Sheet sheet, List<GridRow> out) {
        int width = widthOf(sheet);
        if (width == 0) {
            return;
        }
        int seen = 0;
        for (Row row : sheet) {
            if (seen >= MAX_ROWS_PER_SHEET) {
                break;
            }
            List<String> cells = new ArrayList<>(width);
            for (int c = 0; c < width; c++) {
                Cell cell = row.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                cells.add(cell == null ? "" : formatter.formatCellValue(cell).trim());
            }
            if (cells.stream().allMatch(String::isBlank)) {
                continue;
            }
            seen++;
            out.add(new GridRow(sheet.getSheetName(), row.getRowNum() + 1, cells, styleOf(sheet, row)));
        }
    }

    /**
     * Largeur commune à toutes les lignes : une ligne de titre plus courte que le tableau ne doit
     * pas décaler les colonnes de celles qui suivent.
     */
    private static int widthOf(Sheet sheet) {
        int width = 0;
        for (Row row : sheet) {
            width = Math.max(width, row.getLastCellNum());
        }
        return Math.max(width, 0);
    }

    /** Mise en forme de la première cellule remplie, plus l'indice de fusion sur la ligne. */
    private GridStyle styleOf(Sheet sheet, Row row) {
        Cell anchor = null;
        for (Cell cell : row) {
            if (!formatter.formatCellValue(cell).trim().isEmpty()) {
                anchor = cell;
                break;
            }
        }
        boolean merged = isMerged(sheet, row.getRowNum());
        if (anchor == null) {
            return merged ? new GridStyle("", 0d, false, true) : GridStyle.NONE;
        }
        CellStyle style = anchor.getCellStyle();
        if (style == null) {
            return new GridStyle("", 0d, false, merged);
        }
        Font font = fontOf(sheet, style);
        return new GridStyle(
                argb(style.getFillForegroundColorColor()),
                font == null ? 0d : font.getFontHeightInPoints(),
                font != null && font.getBold(),
                merged);
    }

    private static Font fontOf(Sheet sheet, CellStyle style) {
        try {
            return sheet.getWorkbook().getFontAt(style.getFontIndex());
        } catch (Exception e) {
            return null;
        }
    }

    /** Une fusion horizontale sur la ligne : marqueur de titre dans la plupart des bordereaux. */
    private static boolean isMerged(Sheet sheet, int rowNum) {
        for (CellRangeAddress range : sheet.getMergedRegions()) {
            if (range.getFirstRow() <= rowNum
                    && rowNum <= range.getLastRow()
                    && range.getLastColumn() > range.getFirstColumn()) {
                return true;
            }
        }
        return false;
    }

    /** Couleur de fond en AARRGGBB, vide si absente ou indexée sans correspondance connue. */
    private static String argb(Color color) {
        if (color instanceof XSSFColor xssf && xssf.getARGBHex() != null) {
            return xssf.getARGBHex();
        }
        return "";
    }
}
