package ma.nafura.hse.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.hse.api.request.RegistreLegalCreateDto;
import ma.nafura.hse.api.request.RegistreLegalUpdateDto;
import ma.nafura.hse.domain.model.RegistreLegal;
import ma.nafura.hse.repository.RegistreLegalRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RegistreLegalService {

    private final RegistreLegalRepository repository;
    private final RegistreLegalSeedService seedService;

    public RegistreLegalService(RegistreLegalRepository repository, RegistreLegalSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<RegistreLegal> list(String chantierId, String registre, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<RegistreLegal> rows = loadRows(tenantId, chantierId, registre);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(r -> matchesSearch(r, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public RegistreLegal getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Registre légal not found"));
    }

    @Transactional
    public RegistreLegal create(RegistreLegalCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextRegistreId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Registre légal id already exists: " + id);
        }
        if (repository.findByTenantIdOrderByDateDescCreatedAtDesc(tenantId).stream()
                .anyMatch(r -> r.getNumero().equalsIgnoreCase(request.getNumero().trim()))) {
            throw new IllegalArgumentException("Registre numéro already exists: " + request.getNumero());
        }

        RegistreLegal entity = RegistreLegal.builder()
                .id(id)
                .tenantId(tenantId)
                .registre(normalizeRegistre(request.getRegistre()))
                .numero(request.getNumero().trim())
                .date(request.getDate())
                .reference(trimOrNull(request.getReference()))
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .employeId(trimOrNull(request.getEmployeId()))
                .employeNom(trimOrNull(request.getEmployeNom()))
                .description(request.getDescription().trim())
                .statut(normalizeStatut(request.getStatut(), RegistreLegal.STATUT_OUVERT))
                .derniereMaj(request.getDerniereMaj() != null ? request.getDerniereMaj() : request.getDate())
                .extensionJson(trimOrNull(request.getExtensionJson()))
                .build();
        return repository.save(entity);
    }

    @Transactional
    public RegistreLegal update(String id, RegistreLegalUpdateDto request) {
        RegistreLegal entity = getById(id);
        if (request.getRegistre() != null) {
            entity.setRegistre(normalizeRegistre(request.getRegistre()));
        }
        if (request.getNumero() != null) {
            entity.setNumero(request.getNumero().trim());
        }
        if (request.getDate() != null) {
            entity.setDate(request.getDate());
        }
        if (request.getReference() != null) {
            entity.setReference(trimOrNull(request.getReference()));
        }
        if (request.getChantierId() != null) {
            entity.setChantierId(trimOrNull(request.getChantierId()));
        }
        if (request.getChantierCode() != null) {
            entity.setChantierCode(trimOrNull(request.getChantierCode()));
        }
        if (request.getEmployeId() != null) {
            entity.setEmployeId(trimOrNull(request.getEmployeId()));
        }
        if (request.getEmployeNom() != null) {
            entity.setEmployeNom(trimOrNull(request.getEmployeNom()));
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription().trim());
        }
        if (request.getStatut() != null) {
            entity.setStatut(normalizeStatut(request.getStatut(), entity.getStatut()));
        }
        if (request.getDerniereMaj() != null) {
            entity.setDerniereMaj(request.getDerniereMaj());
        }
        if (request.getExtensionJson() != null) {
            entity.setExtensionJson(trimOrNull(request.getExtensionJson()));
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        RegistreLegal entity = getById(id);
        repository.delete(entity);
    }

    private List<RegistreLegal> loadRows(UUID tenantId, String chantierId, String registre) {
        if (StringUtils.hasText(chantierId)) {
            return repository.findByTenantIdAndChantierIdOrderByDateDescCreatedAtDesc(tenantId, chantierId.trim());
        }
        if (StringUtils.hasText(registre)) {
            return repository.findByTenantIdAndRegistreOrderByDateDescCreatedAtDesc(
                    tenantId, normalizeRegistre(registre));
        }
        return repository.findByTenantIdOrderByDateDescCreatedAtDesc(tenantId);
    }

    private boolean matchesSearch(RegistreLegal registre, String term) {
        return contains(registre.getNumero(), term)
                || contains(registre.getDescription(), term)
                || contains(registre.getEmployeNom(), term)
                || contains(registre.getChantierCode(), term)
                || contains(registre.getReference(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private java.util.Optional<RegistreLegal> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return java.util.Optional.empty();
        }
        return repository.findByIdAndTenantId(id, tenantId());
    }

    private String nextRegistreId(UUID tenantId) {
        long count = repository.countByTenantId(tenantId);
        return String.format(Locale.ROOT, "reg-%d", count + 1);
    }

    private String normalizeRegistre(String raw) {
        if (!StringUtils.hasText(raw)) {
            throw new IllegalArgumentException("registre is required");
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeStatut(String raw, String fallback) {
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
