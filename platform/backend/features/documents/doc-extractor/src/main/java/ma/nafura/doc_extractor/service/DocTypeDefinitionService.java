package ma.nafura.platform.documents.docextractor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.documents.docextractor.domain.model.DocTypeDefinition;
import ma.nafura.platform.documents.docextractor.domain.model.DocTypeDefinition.Status;
import ma.nafura.platform.documents.docextractor.repository.DocTypeDefinitionRepository;
import ma.nafura.platform.documents.docextractor.api.response.DocTypeDefinitionDto;
import ma.nafura.platform.documents.docextractor.api.response.DocTypeListItemDto;
import ma.nafura.platform.documents.docextractor.api.response.DocTypesByDomainDto;
import ma.nafura.platform.documents.docextractor.api.response.DomainDocTypesDto;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.TreeMap;

@Service
public class DocTypeDefinitionService {

    private final DocTypeDefinitionRepository repository;
    private final ObjectMapper objectMapper;

    public DocTypeDefinitionService(DocTypeDefinitionRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    /**
     * Returns doc types for the domain with their latest published version metadata.
     */
    public List<DocTypeListItemDto> listLatestPublishedByDomain(String domainKey) {
        List<DocTypeDefinition> defs = repository
                .findByDomainKeyAndStatusOrderByDocTypeKeyAscVersionDesc(domainKey, Status.PUBLISHED);

        // Pick latest per docTypeKey (already ordered by docTypeKey then version desc)
        Map<String, DocTypeDefinition> latestByKey = new LinkedHashMap<>();
        for (DocTypeDefinition d : defs) {
            latestByKey.putIfAbsent(d.getDocTypeKey(), d);
        }

        List<DocTypeListItemDto> out = new ArrayList<>(latestByKey.size());
        for (DocTypeDefinition d : latestByKey.values()) {
            out.add(new DocTypeListItemDto(
                    d.getDomainKey(),
                    d.getDocTypeKey(),
                    d.getName(),
                    d.getVersion() != null ? d.getVersion() : 1,
                    d.getOrigin() != null ? d.getOrigin().name() : "SYSTEM",
                    d.getTenantId()
            ));
        }
        return out;
    }

    /**
     * Returns the latest active definition for a (domainKey, docTypeKey).
     */
    public DocTypeDefinitionDto getActive(String domainKey, String docTypeKey) {
        DocTypeDefinition def = repository
                .findFirstByDomainKeyAndDocTypeKeyAndStatusOrderByVersionDesc(domainKey, docTypeKey, Status.PUBLISHED)
                .orElse(null);

        // Fallback for legacy data (pre-status workflow) using is_active=true
        if (def == null) {
            def = repository
                    .findFirstByDomainKeyAndDocTypeKeyAndIsActiveTrueOrderByVersionDesc(domainKey, docTypeKey)
                    .orElseThrow(() -> new CrudNotFoundException("DocTypeDefinition not found"));
        }

        return new DocTypeDefinitionDto(
                def.getId(),
                def.getDomainKey(),
                def.getDocTypeKey(),
                def.getVersion() != null ? def.getVersion() : 1,
                def.getName(),
                parseJson(def.getJsonSchema()),
                parseJson(def.getUiSchema())
        );
    }

    /**
     * Returns a DocTypeDefinition by its ID.
     */
    public DocTypeDefinition getById(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new CrudNotFoundException("DocTypeDefinition not found with id: " + id));
    }

    /**
     * Returns all active doc types organizations by domain.
     */
    public DocTypesByDomainDto listAllActive() {
        List<DocTypeDefinition> defs = repository.findByStatusOrderByDomainKeyAscDocTypeKeyAscVersionDesc(Status.PUBLISHED);

        // Group by domain, then by docTypeKey, keeping only the latest version
        Map<String, Map<String, DocTypeDefinition>> domainMap = new TreeMap<>();
        for (DocTypeDefinition d : defs) {
            domainMap.computeIfAbsent(d.getDomainKey(), k -> new LinkedHashMap<>())
                    .putIfAbsent(d.getDocTypeKey(), d);
        }

        // Convert to DTO structure
        Map<String, DomainDocTypesDto> domains = new LinkedHashMap<>();
        for (Map.Entry<String, Map<String, DocTypeDefinition>> domainEntry : domainMap.entrySet()) {
            String domainKey = domainEntry.getKey();
            List<DocTypeListItemDto> docTypes = new ArrayList<>();
            for (DocTypeDefinition d : domainEntry.getValue().values()) {
                docTypes.add(new DocTypeListItemDto(
                        d.getDomainKey(),
                        d.getDocTypeKey(),
                        d.getName(),
                        d.getVersion() != null ? d.getVersion() : 1,
                        d.getOrigin() != null ? d.getOrigin().name() : "SYSTEM",
                        d.getTenantId()
                ));
            }
            domains.put(domainKey, new DomainDocTypesDto(domainKey, docTypes));
        }

        return new DocTypesByDomainDto(domains);
    }

    private JsonNode parseJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(raw);
        } catch (Exception e) {
            // Safe default: avoid crashing the UI if malformed json stored.
            return objectMapper.createObjectNode();
        }
    }
}


