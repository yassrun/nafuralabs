package ma.nafura.etudes.service.port;

import java.util.List;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.etudes.api.dto.CatalogCandidateDto;
import org.springframework.stereotype.Component;

@Component
public class ItemCatalogResolver implements CatalogResolverPort {

    private final CatalogLookupApi catalogLookupApi;

    public ItemCatalogResolver(CatalogLookupApi catalogLookupApi) {
        this.catalogLookupApi = catalogLookupApi;
    }

    @Override
    public List<CatalogCandidateDto> resolve(String designation, String type, int limit) {
        return catalogLookupApi.lookup(designation, type, limit).stream()
                .map(c -> CatalogCandidateDto.builder()
                        .itemId(c.itemId())
                        .code(c.code())
                        .name(c.name())
                        .unite(c.unite())
                        .nature(c.nature())
                        .score(c.score())
                        .build())
                .toList();
    }
}
