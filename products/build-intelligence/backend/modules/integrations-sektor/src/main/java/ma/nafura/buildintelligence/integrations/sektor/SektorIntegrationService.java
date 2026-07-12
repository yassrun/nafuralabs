package ma.nafura.buildintelligence.integrations.sektor;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.catalog.domain.WorkItem;
import ma.nafura.buildintelligence.catalog.service.CatalogService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SektorIntegrationService {

    private final CatalogService catalogService;
    private final RestClient.Builder restClientBuilder;

    @Value("${build-intelligence.integrations.sektor.api-base-url:http://localhost:8082}")
    private String sektorApiBaseUrl;

    public List<WorkItem> searchForEtudes(String query) {
        return catalogService.searchWorkItems(query);
    }

    public Map<String, Object> proposeImportToEtudes(UUID workItemId, String actorSub) {
        WorkItem workItem = catalogService.getWorkItem(workItemId)
                .orElseThrow(() -> new IllegalArgumentException("Work item not found"));

        Map<String, Object> proposal = Map.of(
                "action", "IMPORT_OUVRAGE",
                "status", "PROPOSED",
                "tenantId", TenantContext.getTenantId().toString(),
                "actorSub", actorSub,
                "payload", Map.of(
                        "designation", workItem.getDesignation(),
                        "unite", workItem.getUnitCode(),
                        "source", "build-intelligence",
                        "workItemId", workItem.getId()
                )
        );

        try {
            restClientBuilder.build()
                    .post()
                    .uri(sektorApiBaseUrl + "/api/v1/etudes/ouvrages/import-proposal")
                    .body(proposal)
                    .retrieve()
                    .toBodilessEntity();
            return Map.of("status", "FORWARDED", "proposal", proposal);
        } catch (Exception ex) {
            return Map.of("status", "PROPOSED_ONLY", "proposal", proposal, "warning", ex.getMessage());
        }
    }
}
