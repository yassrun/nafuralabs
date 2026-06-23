package ma.nafura.platform.documents.docextractor.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.documents.docextractor.api.response.DocTypeDefinitionDto;
import ma.nafura.platform.documents.docextractor.api.response.DocTypesByDomainDto;
import ma.nafura.platform.documents.docextractor.api.response.DomainListItemDto;
import ma.nafura.platform.documents.docextractor.domain.model.catalog.DomainCatalog;
import ma.nafura.platform.documents.docextractor.service.DocTypeDefinitionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Legacy doc-type endpoints used by the ERP web app and doc-extractor workspace.
 */
@RestController
@RequestMapping("/api/doc-types")
@RequiredArgsConstructor
public class DocTypeController {

    private final DocTypeDefinitionService docTypeDefinitionService;

    @GetMapping("/{domainKey}/{docTypeKey}/active")
    public DocTypeDefinitionDto getActive(
            @PathVariable String domainKey,
            @PathVariable String docTypeKey,
            @RequestParam(required = false) UUID tenantId
    ) {
        return docTypeDefinitionService.getActive(domainKey, docTypeKey);
    }

    @GetMapping("/by-tenant")
    public DocTypesByDomainDto listByTenant(@RequestParam(required = false) UUID tenantId) {
        return docTypeDefinitionService.listAllActive();
    }

    @GetMapping("/domains")
    public List<DomainListItemDto> listDomains() {
        return DomainCatalog.v1().stream()
                .map(d -> new DomainListItemDto(d.key(), d.label()))
                .toList();
    }
}
