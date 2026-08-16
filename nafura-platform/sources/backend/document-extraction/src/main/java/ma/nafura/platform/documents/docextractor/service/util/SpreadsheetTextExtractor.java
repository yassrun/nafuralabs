package ma.nafura.platform.documents.docextractor.service.util;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Converts tabular files Gemini cannot ingest as binary (XLSX/XLS/CSV)
 * into plain text suitable for the prompt.
 */
public final class SpreadsheetTextExtractor {

    private static final int MAX_SHEETS = 5;
    private static final int MAX_ROWS_PER_SHEET = 400;
    private static final int MAX_CHARS = 120_000;

    private SpreadsheetTextExtractor() {}

    public static boolean isTabularMime(String mimeType) {
        if (mimeType == null || mimeType.isBlank()) {
            return false;
        }
        String mime = mimeType.toLowerCase(Locale.ROOT);
        return mime.contains("spreadsheet")
                || mime.contains("excel")
                || "text/csv".equals(mime)
                || "application/csv".equals(mime)
                || "text/plain".equals(mime);
    }

    public static String toPromptText(byte[] bytes, String mimeType, String fileName) {
        String mime = mimeType == null ? "" : mimeType.toLowerCase(Locale.ROOT);
        String label = (fileName == null || fileName.isBlank()) ? "document" : fileName;
        if (mime.contains("csv") || mime.equals("text/plain") || looksLikeCsv(fileName)) {
            return truncate("Spreadsheet file: " + label + "\n\n" + new String(bytes, StandardCharsets.UTF_8));
        }
        return truncate(workbookToText(bytes, label));
    }

    private static boolean looksLikeCsv(String fileName) {
        return fileName != null && fileName.toLowerCase(Locale.ROOT).endsWith(".csv");
    }

    private static String workbookToText(byte[] bytes, String label) {
        DataFormatter formatter = new DataFormatter();
        StringBuilder out = new StringBuilder();
        out.append("Spreadsheet file: ").append(label).append('\n');
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            int sheetCount = Math.min(workbook.getNumberOfSheets(), MAX_SHEETS);
            for (int s = 0; s < sheetCount; s++) {
                Sheet sheet = workbook.getSheetAt(s);
                out.append("\n=== Sheet: ").append(sheet.getSheetName()).append(" ===\n");
                int printed = 0;
                for (Row row : sheet) {
                    if (printed >= MAX_ROWS_PER_SHEET) {
                        out.append("... (truncated)\n");
                        break;
                    }
                    StringBuilder line = new StringBuilder();
                    short last = row.getLastCellNum();
                    for (int c = 0; c < last; c++) {
                        if (c > 0) {
                            line.append('\t');
                        }
                        Cell cell = row.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                        line.append(cell == null ? "" : formatter.formatCellValue(cell).trim());
                    }
                    String text = line.toString().replaceAll("\\t+$", "");
                    if (!text.isBlank()) {
                        out.append(text).append('\n');
                        printed++;
                    }
                    if (out.length() >= MAX_CHARS) {
                        return truncate(out.toString());
                    }
                }
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Unable to read spreadsheet content: " + e.getMessage(), e);
        }
        return out.toString();
    }

    private static String truncate(String value) {
        if (value.length() <= MAX_CHARS) {
            return value;
        }
        return value.substring(0, MAX_CHARS) + "\n... (truncated)";
    }
}
