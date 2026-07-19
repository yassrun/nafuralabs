package ma.nafura.chantiers.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.DocumentChantierDto;
import ma.nafura.chantiers.api.request.DocumentChantierCreateDto;
import ma.nafura.chantiers.api.request.DocumentChantierUpdateDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.domain.model.DocumentChantier;
import ma.nafura.chantiers.repository.DocumentChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DocumentChantierService {

    private final DocumentChantierRepository repository;
    private final ChantierService chantierService;
    private final ChantierDocumentsSeedService seedService;
    private final ObjectMapper objectMapper;

    public DocumentChantierService(
            DocumentChantierRepository repository,
            ChantierService chantierService,
            ChantierDocumentsSeedService seedService,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.chantierService = chantierService;
        this.seedService = seedService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Page<DocumentChantierDto> listAll(
            int page,
            int size,
            String search,
            String chantierId,
            List<String> types,
            String uploadedBy,
            LocalDate dateFrom,
            LocalDate dateTo) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        Specification<DocumentChantier> filters =
                (root, query, cb) -> cb.equal(root.get("tenantId"), tenantId);
        if (StringUtils.hasText(chantierId)) {
            filters = filters.and((root, query, cb) -> cb.equal(root.get("chantierId"), chantierId.trim()));
        }
        if (types != null && !types.isEmpty()) {
            List<String> normalizedTypes =
                    types.stream().filter(StringUtils::hasText).map(String::trim).toList();
            if (!normalizedTypes.isEmpty()) {
                filters = filters.and((root, query, cb) -> root.get("type").in(normalizedTypes));
            }
        }
        if (StringUtils.hasText(search)) {
            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            filters = filters.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("titre")), pattern),
                    cb.like(cb.lower(root.get("fichier")), pattern),
                    cb.like(cb.lower(root.get("type")), pattern)));
        }
        if (StringUtils.hasText(uploadedBy)) {
            String pattern = "%" + uploadedBy.trim().toLowerCase(Locale.ROOT) + "%";
            filters = filters.and(
                    (root, query, cb) -> cb.like(cb.lower(root.get("uploadedPar")), pattern));
        }
        if (dateFrom != null) {
            filters = filters.and(
                    (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("uploadedAt"), dateFrom));
        }
        if (dateTo != null) {
            filters =
                    filters.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("uploadedAt"), dateTo));
        }
        Pageable pageable = PageRequest.of(
                Math.max(0, page),
                Math.min(Math.max(1, size), 200),
                Sort.by(Sort.Order.desc("uploadedAt"), Sort.Order.desc("createdAt")));
        return repository.findAll(filters, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<DocumentChantierDto> listByChantier(String chantierId) {
        seedService.seedIfEmpty();
        Chantier chantier = chantierService.getById(chantierId);
        return repository
                .findByTenantIdAndChantierIdOrderByUploadedAtDescCreatedAtDesc(tenantId(), chantierId)
                .stream()
                .map(row -> toDto(row, chantier))
                .toList();
    }

    @Transactional
    public DocumentChantierDto create(String chantierId, DocumentChantierCreateDto body) {
        Chantier chantier = chantierService.getById(chantierId);
        DocumentChantier entity = DocumentChantier.builder()
                .id("doc-" + UUID.randomUUID())
                .tenantId(tenantId())
                .chantierId(chantierId)
                .type(body.getType().trim())
                .titre(body.getTitre().trim())
                .fichier(body.getFichier().trim())
                .storageKey(StringUtils.hasText(body.getStorageKey()) ? body.getStorageKey().trim() : null)
                .taille(body.getTaille())
                .uploadedAt(body.getUploadedAt())
                .uploadedPar(body.getUploadedPar().trim())
                .tags(tagsToJson(body.getTags()))
                .build();
        return toDto(repository.save(entity), chantier);
    }

    @Transactional
    public DocumentChantierDto update(String chantierId, String id, DocumentChantierUpdateDto body) {
        Chantier chantier = chantierService.getById(chantierId);
        DocumentChantier entity = getEntity(chantierId, id);
        if (StringUtils.hasText(body.getType())) {
            entity.setType(body.getType().trim());
        }
        if (StringUtils.hasText(body.getTitre())) {
            entity.setTitre(body.getTitre().trim());
        }
        if (StringUtils.hasText(body.getFichier())) {
            entity.setFichier(body.getFichier().trim());
        }
        if (body.getStorageKey() != null) {
            entity.setStorageKey(StringUtils.hasText(body.getStorageKey()) ? body.getStorageKey().trim() : null);
        }
        if (body.getTaille() != null) {
            entity.setTaille(body.getTaille());
        }
        if (body.getUploadedAt() != null) {
            entity.setUploadedAt(body.getUploadedAt());
        }
        if (StringUtils.hasText(body.getUploadedPar())) {
            entity.setUploadedPar(body.getUploadedPar().trim());
        }
        if (body.getTags() != null) {
            entity.setTags(tagsToJson(body.getTags()));
        }
        return toDto(repository.save(entity), chantier);
    }

    @Transactional
    public void delete(String chantierId, String id) {
        chantierService.getById(chantierId);
        repository.delete(getEntity(chantierId, id));
    }

    private DocumentChantier getEntity(String chantierId, String id) {
        return repository
                .findById(id)
                .filter(row -> row.getTenantId().equals(tenantId()) && row.getChantierId().equals(chantierId))
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));
    }

    private DocumentChantierDto toDto(DocumentChantier row) {
        Chantier chantier = chantierService.getById(row.getChantierId());
        return toDto(row, chantier);
    }

    private DocumentChantierDto toDto(DocumentChantier row, Chantier chantier) {
        return DocumentChantierDto.builder()
                .id(row.getId())
                .chantierId(row.getChantierId())
                .chantierCode(chantier.getCode())
                .type(row.getType())
                .titre(row.getTitre())
                .fichier(row.getFichier())
                .storageKey(row.getStorageKey())
                .taille(row.getTaille())
                .uploadedAt(row.getUploadedAt())
                .uploadedPar(row.getUploadedPar())
                .tags(tagsFromJson(row.getTags()))
                .build();
    }

    private String tagsToJson(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(tags);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid tags", ex);
        }
    }

    private List<String> tagsFromJson(String json) {
        if (!StringUtils.hasText(json)) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            return new ArrayList<>();
        }
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
