package ma.nafura.finance.service.bank;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class BankStatementImportParserTest {

    private final BankStatementImportParser parser = new BankStatementImportParser();

    @Test
    void parseCsvReadsDebitCreditColumns() {
        String csv =
                """
                date;libelle;debit;credit;reference
                2026-01-10;Virement client;0;1500.50;VIR-001
                2026-01-12;Frais bancaires;25.00;0;FRAIS-01
                """;
        List<ImportedStatementLine> rows = parser.parseCsv(csv);
        assertEquals(2, rows.size());
        assertEquals(LocalDate.of(2026, 1, 10), rows.get(0).lineDate());
        assertEquals(new BigDecimal("1500.50"), rows.get(0).receiptAmount());
        assertEquals(BigDecimal.ZERO, rows.get(0).paymentAmount());
        assertEquals(new BigDecimal("25.00"), rows.get(1).paymentAmount());
    }

    @Test
    void parseOfxExtractsTransactions() {
        String ofx =
                """
                <OFX>
                <STMTTRN>
                <TRNTYPE>CREDIT</TRNTYPE>
                <DTPOSTED>20260115</DTPOSTED>
                <TRNAMT>1200.00</TRNAMT>
                <NAME>Client ABC</NAME>
                <FITID>fit-1</FITID>
                </STMTTRN>
                <STMTTRN>
                <TRNTYPE>DEBIT</TRNTYPE>
                <DTPOSTED>20260116</DTPOSTED>
                <TRNAMT>-45.00</TRNAMT>
                <MEMO>Commission</MEMO>
                <FITID>fit-2</FITID>
                </STMTTRN>
                </OFX>
                """;
        List<ImportedStatementLine> rows = parser.parse("releve.ofx", ofx);
        assertEquals(2, rows.size());
        assertEquals(new BigDecimal("1200.0000"), rows.get(0).receiptAmount());
        assertEquals(new BigDecimal("45.0000"), rows.get(1).paymentAmount());
    }

    @Test
    void rejectsEmptyFile() {
        assertThrows(IllegalArgumentException.class, () -> parser.parse("empty.csv", "   "));
    }

    @Test
    void parseCsvSkipsZeroAmountRows() {
        String csv =
                """
                date;libelle;debit;credit
                2026-01-01;Zero;0;0
                """;
        assertTrue(parser.parseCsv(csv).isEmpty());
    }
}
