package ma.nafura.buildintelligence.extraction.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.extraction.domain.ExtractedFact;
import ma.nafura.buildintelligence.extraction.domain.ValidationStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExtractionValidationService {

    public void applyBusinessChecks(ExtractedFact fact) {
        Map<String, Object> payload = fact.getPayload();
        List<String> issues = new ArrayList<>();

        BigDecimal quantity = toDecimal(payload.get("quantity"));
        BigDecimal unitPrice = toDecimal(payload.get("unitPrice"));
        BigDecimal total = toDecimal(payload.get("totalAmount"));

        if (quantity != null && unitPrice != null && total != null) {
            BigDecimal expected = quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            BigDecimal delta = expected.subtract(total).abs();
            if (delta.compareTo(BigDecimal.ONE) > 0) {
                issues.add("quantity_x_unit_mismatch");
            }
        }

        if (payload.get("unit") == null || payload.get("unit").toString().isBlank()) {
            issues.add("missing_unit");
        }

        Map<String, Object> evidence = fact.getEvidence() != null ? new HashMap<>(fact.getEvidence()) : new HashMap<>();
        evidence.put("validationIssues", issues);
        fact.setEvidence(evidence);

        if (!issues.isEmpty() && fact.getConfidence() != null && fact.getConfidence().compareTo(new BigDecimal("0.90")) > 0) {
            fact.setConfidence(new BigDecimal("0.75"));
        }
        if (!issues.isEmpty()) {
            fact.setValidationStatus(ValidationStatus.PENDING_REVIEW);
        }
    }

    private static BigDecimal toDecimal(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        try {
            return new BigDecimal(value.toString().replace(" ", "").replace(",", "."));
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
