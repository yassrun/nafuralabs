package ma.nafura.buildintelligence.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.api.dto.BiDtos;
import ma.nafura.buildintelligence.api.security.BiReadAccess;
import ma.nafura.buildintelligence.retrieval.service.HybridSearchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/build-intelligence/search")
@RequiredArgsConstructor
public class SearchController {

    private final HybridSearchService hybridSearchService;

    @GetMapping
    @BiReadAccess
    public BiDtos.SearchResponse search(@RequestParam String q,
                                        @RequestParam(defaultValue = "20") int limit) {
        return new BiDtos.SearchResponse(hybridSearchService.search(q, limit));
    }
}
