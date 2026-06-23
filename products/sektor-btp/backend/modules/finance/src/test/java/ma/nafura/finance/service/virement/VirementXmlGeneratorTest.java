package ma.nafura.finance.service.virement;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.domain.model.VirementLine;
import org.junit.jupiter.api.Test;

class VirementXmlGeneratorTest {

    private final VirementXmlGenerator generator = new VirementXmlGenerator();

    @Test
    void sepaContainsAmountAndIban() {
        String xml = generator.generate("SEPA", LocalDate.of(2026, 5, 1), List.of(line()));
        assertTrue(xml.contains("CstmrCdtTrfInitn"));
        assertTrue(xml.contains("1500.00"));
        assertTrue(xml.contains("MA123456789012345678901234"));
    }

    @Test
    void awbStubContainsBankCode() {
        String xml = generator.generate("AWB", LocalDate.of(2026, 5, 1), List.of(line()));
        assertTrue(xml.contains("banque=\"AWB\""));
    }

    @Test
    void bmceStubContainsBankCode() {
        String xml = generator.generate("BMCE", LocalDate.of(2026, 5, 1), List.of(line()));
        assertTrue(xml.contains("banque=\"BMCE\""));
    }

    @Test
    void cihStubContainsBankCode() {
        String xml = generator.generate("CIH", LocalDate.of(2026, 5, 1), List.of(line()));
        assertTrue(xml.contains("banque=\"CIH\""));
    }

    @Test
    void bpStubContainsBankCode() {
        String xml = generator.generate("BP", LocalDate.of(2026, 5, 1), List.of(line()));
        assertTrue(xml.contains("banque=\"BP\""));
    }

    private static VirementLine line() {
        return VirementLine.builder()
                .id(UUID.randomUUID())
                .beneficiaryName("ACME")
                .beneficiaryRib("MA123456789012345678901234")
                .amount(new BigDecimal("1500.00"))
                .motif("Facture")
                .build();
    }
}
