package ma.nafura.currency.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Resolves Bank Al-Maghrib (BAM) indicative exchange rates against MAD.
 * Uses a configurable HTTP feed when present, otherwise curated fallback quotes.
 */
@Component
public class BamExchangeRateProvider {

    private static final Logger log = LoggerFactory.getLogger(BamExchangeRateProvider.class);

    private static final List<String> SUPPORTED_CODES = List.of("EUR", "USD", "GBP", "CHF", "CAD", "SAR");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String apiUrl;

    public BamExchangeRateProvider(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${nafura.currency.bam.api-url:}") String apiUrl) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.apiUrl = apiUrl == null ? "" : apiUrl.trim();
    }

    /**
     * @return map of ISO currency code → MAD per 1 unit of foreign currency
     */
    public Map<String, BigDecimal> fetchRatesAgainstMad() {
        if (!apiUrl.isEmpty()) {
            try {
                Map<String, BigDecimal> remote = parseRemoteRates(restTemplate.getForObject(apiUrl, String.class));
                if (!remote.isEmpty()) {
                    return remote;
                }
            } catch (RestClientException ex) {
                log.warn("BAM rate feed unavailable at {} — using fallback quotes", apiUrl, ex);
            }
        }
        return fallbackRates();
    }

    private Map<String, BigDecimal> parseRemoteRates(String body) {
        Map<String, BigDecimal> rates = new LinkedHashMap<>();
        if (body == null || body.isBlank()) {
            return rates;
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            if (root.isArray()) {
                for (JsonNode row : root) {
                    putIfPresent(rates, row.path("code").asText(null), row.path("rate").asText(null));
                    putIfPresent(rates, row.path("devise").asText(null), row.path("cours").asText(null));
                }
            } else if (root.isObject()) {
                if (root.has("rates") && root.get("rates").isObject()) {
                    root.get("rates").fields().forEachRemaining(entry ->
                            putIfPresent(rates, entry.getKey(), entry.getValue().asText(null)));
                } else {
                    root.fields().forEachRemaining(entry ->
                            putIfPresent(rates, entry.getKey(), entry.getValue().asText(null)));
                }
            }
        } catch (Exception ex) {
            log.warn("Unable to parse BAM rate payload — using fallback quotes", ex);
            return Map.of();
        }
        return rates;
    }

    private void putIfPresent(Map<String, BigDecimal> rates, String code, String rawRate) {
        if (code == null || rawRate == null || rawRate.isBlank()) {
            return;
        }
        String normalized = code.trim().toUpperCase();
        if (!SUPPORTED_CODES.contains(normalized)) {
            return;
        }
        try {
            BigDecimal rate = new BigDecimal(rawRate.replace(',', '.').trim());
            if (rate.compareTo(BigDecimal.ZERO) > 0) {
                rates.put(normalized, rate);
            }
        } catch (NumberFormatException ignored) {
            // skip malformed row
        }
    }

    private Map<String, BigDecimal> fallbackRates() {
        Map<String, BigDecimal> rates = new LinkedHashMap<>();
        rates.put("EUR", new BigDecimal("10.8500"));
        rates.put("USD", new BigDecimal("10.1200"));
        rates.put("GBP", new BigDecimal("12.6500"));
        rates.put("CHF", new BigDecimal("11.4200"));
        rates.put("CAD", new BigDecimal("7.3800"));
        rates.put("SAR", new BigDecimal("2.6980"));
        return rates;
    }
}
