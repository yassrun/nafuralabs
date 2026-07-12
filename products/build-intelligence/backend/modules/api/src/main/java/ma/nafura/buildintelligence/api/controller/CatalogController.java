package ma.nafura.buildintelligence.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.api.security.BiReadAccess;
import ma.nafura.buildintelligence.catalog.domain.WorkItem;
import ma.nafura.buildintelligence.catalog.service.CatalogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/build-intelligence/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/work-items")
    @BiReadAccess
    public Page<WorkItem> list(Pageable pageable) {
        return catalogService.listWorkItems(pageable);
    }

    @GetMapping("/search")
    @BiReadAccess
    public List<WorkItem> search(@RequestParam String q) {
        return catalogService.searchWorkItems(q);
    }

    @GetMapping("/prices/statistics")
    @BiReadAccess
    public Map<String, Object> statistics(@RequestParam UUID workItemId) {
        return catalogService.priceStatistics(workItemId);
    }
}
