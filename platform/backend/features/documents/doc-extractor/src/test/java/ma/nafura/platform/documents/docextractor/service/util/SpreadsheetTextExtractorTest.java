package ma.nafura.platform.documents.docextractor.service.util;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class SpreadsheetTextExtractorTest {

    @Test
    void detectsSpreadsheetMimes() {
        assertThat(SpreadsheetTextExtractor.isTabularMime(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).isTrue();
        assertThat(SpreadsheetTextExtractor.isTabularMime("text/csv")).isTrue();
        assertThat(SpreadsheetTextExtractor.isTabularMime("application/pdf")).isFalse();
    }

    @Test
    void convertsCsvBytesToPromptText() {
        byte[] csv = "code,designation,quantite\nL01,Terrassement,10\n".getBytes(StandardCharsets.UTF_8);
        String text = SpreadsheetTextExtractor.toPromptText(csv, "text/csv", "lots.csv");
        assertThat(text).contains("lots.csv");
        assertThat(text).contains("Terrassement");
    }

    @Test
    void convertsXlsxWorkbookToPromptText() throws Exception {
        byte[] xlsx;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Lots");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("code");
            header.createCell(1).setCellValue("designation");
            Row row = sheet.createRow(1);
            row.createCell(0).setCellValue("L01");
            row.createCell(1).setCellValue("Gros oeuvre");
            workbook.write(out);
            xlsx = out.toByteArray();
        }

        String text = SpreadsheetTextExtractor.toPromptText(
                xlsx,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "bpde.xlsx"
        );
        assertThat(text).contains("bpde.xlsx");
        assertThat(text).contains("Gros oeuvre");
        assertThat(text).contains("L01");
    }
}
