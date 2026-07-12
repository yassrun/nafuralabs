package ma.nafura.buildintelligence.extraction.service;

import ma.nafura.buildintelligence.extraction.domain.ExtractedFact;
import ma.nafura.buildintelligence.extraction.domain.ValidationStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExtractionValidationServiceTest {

    private final ExtractionValidationService service = new ExtractionValidationService();

    @Test
    void flagsQuantityUnitPriceMismatch() {
        ExtractedFact fact = new ExtractedFact();
        Map<String, Object> payload = new HashMap<>();
        payload.put("quantity", 10);
        payload.put("unitPrice", 100);
        payload.put("totalAmount", 500);
        payload.put("unit", "m2");
        fact.setPayload(payload);
        fact.setConfidence(new BigDecimal("0.95"));
        fact.setEvidence(new HashMap<>());

        service.applyBusinessChecks(fact);

        assertEquals(ValidationStatus.PENDING_REVIEW, fact.getValidationStatus());
        assertTrue(fact.getEvidence().get("validationIssues").toString().contains("quantity_x_unit_mismatch"));
    }
}
