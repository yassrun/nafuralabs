package ma.nafura.hse.service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.hse.api.request.PhsCreateDto;
import ma.nafura.hse.domain.model.Phs;
import ma.nafura.hse.repository.PhsRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PhsService {

    private final PhsRepository repository;
    private final PhsSeedService seedService;

    public PhsService(PhsRepository repository, PhsSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<Phs> list() {
        seedService.seedIfEmpty();
        return repository.findByTenantIdOrderByDateRevisionDescCreatedAtDesc(tenantId());
    }

    @Transactional(readOnly = true)
    public Phs getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("PHS not found"));
    }

    @Transactional
    public Phs create(PhsCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextPhsId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("PHS id already exists: " + id);
        }

        Phs entity = Phs.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(request.getNumero().trim())
                .titre(request.getTitre().trim())
                .version(request.getVersion() != null ? request.getVersion() : 1)
                .dateRevision(request.getDateRevision())
                .auteurNom(request.getAuteurNom().trim())
                .contenu(trimOrNull(request.getContenu()))
                .status(normalizeStatus(request.getStatus(), Phs.STATUS_BROUILLON))
                .build();
        return repository.save(entity);
    }

    private String nextPhsId(UUID tenantId) {
        long count = repository.countByTenantId(tenantId);
        return String.format(Locale.ROOT, "phs-%03d", count + 1);
    }

    private java.util.Optional<Phs> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return java.util.Optional.empty();
        }
        return repository.findByIdAndTenantId(id, tenantId());
    }

    private String normalizeStatus(String raw, String fallback) {
        if (!StringUtils.hasText(raw)) {
            return fallback;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
