package ma.nafura.hse.service;

import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.hse.api.request.CapaActionCreateDto;
import ma.nafura.hse.api.request.NonConformiteAssignerDto;
import ma.nafura.hse.api.request.NonConformiteCreateDto;
import ma.nafura.hse.api.request.NonConformiteUpdateDto;
import ma.nafura.hse.domain.model.CapaAction;
import ma.nafura.hse.domain.model.NonConformite;
import ma.nafura.hse.repository.CapaActionRepository;
import ma.nafura.hse.repository.NonConformiteRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class NonConformiteService {

    private static final Pattern NC_NUMERO_SUFFIX =
            Pattern.compile("^NC-(\\d{4})-(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern NC_ID_SUFFIX = Pattern.compile("^nc(\\d+)$", Pattern.CASE_INSENSITIVE);

    private static final Set<String> IN_PROGRESS_STATUSES =
            Set.of(NonConformite.STATUS_ASSIGNEE, NonConformite.STATUS_EN_TRAITEMENT);

    private final NonConformiteRepository repository;
    private final CapaActionRepository capaRepository;
    private final NonConformiteSeedService seedService;

    public NonConformiteService(
            NonConformiteRepository repository,
            CapaActionRepository capaRepository,
            NonConformiteSeedService seedService) {
        this.repository = repository;
        this.capaRepository = capaRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<NonConformite> list(String status, String type, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<NonConformite> rows = loadRows(tenantId, status, type);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(nc -> matchesSearch(nc, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public NonConformite getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Non-conformité not found"));
    }

    @Transactional
    public NonConformite create(NonConformiteCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextNcId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Non-conformité id already exists: " + id);
        }

        NonConformite entity = NonConformite.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .dateNc(request.getDateNc())
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .zoneChantier(trimOrNull(request.getZoneChantier()))
                .typeNc(normalizeType(request.getTypeNc()))
                .description(request.getDescription().trim())
                .causesRacines(trimOrNull(request.getCausesRacines()))
                .actionCorrective(trimOrNull(request.getActionCorrective()))
                .actionPreventive(trimOrNull(request.getActionPreventive()))
                .verificationEfficacite(trimOrNull(request.getVerificationEfficacite()))
                .dateVerificationEfficacite(request.getDateVerificationEfficacite())
                .responsableId(trimOrNull(request.getResponsableId()))
                .responsableNom(trimOrNull(request.getResponsableNom()))
                .dateEcheance(request.getDateEcheance())
                .sourceInspectionId(trimOrNull(request.getSourceInspectionId()))
                .sourceInspectionNumero(trimOrNull(request.getSourceInspectionNumero()))
                .cnssOuInspectionReference(trimOrNull(request.getCnssOuInspectionReference()))
                .registreLegalNumero(trimOrNull(request.getRegistreLegalNumero()))
                .status(normalizeStatus(request.getStatus(), NonConformite.STATUS_OUVERTE))
                .notes(trimOrNull(request.getNotes()))
                .build();
        return repository.save(entity);
    }

    @Transactional
    public NonConformite update(String id, NonConformiteUpdateDto request) {
        NonConformite entity = getById(id);
        if (request.getDateNc() != null) {
            entity.setDateNc(request.getDateNc());
        }
        if (request.getChantierId() != null) {
            entity.setChantierId(trimOrNull(request.getChantierId()));
        }
        if (request.getChantierCode() != null) {
            entity.setChantierCode(trimOrNull(request.getChantierCode()));
        }
        if (request.getZoneChantier() != null) {
            entity.setZoneChantier(trimOrNull(request.getZoneChantier()));
        }
        if (request.getTypeNc() != null) {
            entity.setTypeNc(normalizeType(request.getTypeNc()));
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription().trim());
        }
        if (request.getCausesRacines() != null) {
            entity.setCausesRacines(trimOrNull(request.getCausesRacines()));
        }
        if (request.getActionCorrective() != null) {
            entity.setActionCorrective(trimOrNull(request.getActionCorrective()));
        }
        if (request.getActionPreventive() != null) {
            entity.setActionPreventive(trimOrNull(request.getActionPreventive()));
        }
        if (request.getVerificationEfficacite() != null) {
            entity.setVerificationEfficacite(trimOrNull(request.getVerificationEfficacite()));
        }
        if (request.getDateVerificationEfficacite() != null) {
            entity.setDateVerificationEfficacite(request.getDateVerificationEfficacite());
        }
        if (request.getResponsableId() != null) {
            entity.setResponsableId(trimOrNull(request.getResponsableId()));
        }
        if (request.getResponsableNom() != null) {
            entity.setResponsableNom(trimOrNull(request.getResponsableNom()));
        }
        if (request.getDateEcheance() != null) {
            entity.setDateEcheance(request.getDateEcheance());
        }
        if (request.getSourceInspectionId() != null) {
            entity.setSourceInspectionId(trimOrNull(request.getSourceInspectionId()));
        }
        if (request.getSourceInspectionNumero() != null) {
            entity.setSourceInspectionNumero(trimOrNull(request.getSourceInspectionNumero()));
        }
        if (request.getCnssOuInspectionReference() != null) {
            entity.setCnssOuInspectionReference(trimOrNull(request.getCnssOuInspectionReference()));
        }
        if (request.getRegistreLegalNumero() != null) {
            entity.setRegistreLegalNumero(trimOrNull(request.getRegistreLegalNumero()));
        }
        if (request.getStatus() != null) {
            entity.setStatus(normalizeStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        NonConformite entity = getById(id);
        repository.delete(entity);
    }

    @Transactional
    public NonConformite assigner(String id, NonConformiteAssignerDto request) {
        NonConformite entity = getById(id);
        if (!NonConformite.STATUS_OUVERTE.equals(entity.getStatus())) {
            throw new IllegalStateException("Non-conformité must be OUVERTE to assign");
        }
        if (request != null) {
            if (request.getResponsableId() != null) {
                entity.setResponsableId(trimOrNull(request.getResponsableId()));
            }
            if (request.getResponsableNom() != null) {
                entity.setResponsableNom(trimOrNull(request.getResponsableNom()));
            }
            if (request.getDateEcheance() != null) {
                entity.setDateEcheance(request.getDateEcheance());
            }
        }
        entity.setStatus(NonConformite.STATUS_ASSIGNEE);
        return repository.save(entity);
    }

    @Transactional
    public NonConformite traiter(String id) {
        NonConformite entity = getById(id);
        String status = entity.getStatus();
        if (NonConformite.STATUS_OUVERTE.equals(status)) {
            entity.setStatus(NonConformite.STATUS_EN_TRAITEMENT);
        } else if (NonConformite.STATUS_ASSIGNEE.equals(status)) {
            entity.setStatus(NonConformite.STATUS_EN_TRAITEMENT);
        } else {
            throw new IllegalStateException("Non-conformité must be OUVERTE or ASSIGNEE to start treatment");
        }
        return repository.save(entity);
    }

    @Transactional
    public NonConformite verifier(String id) {
        NonConformite entity = getById(id);
        if (!NonConformite.STATUS_EN_TRAITEMENT.equals(entity.getStatus())) {
            throw new IllegalStateException("Non-conformité must be EN_TRAITEMENT to verify");
        }
        entity.setStatus(NonConformite.STATUS_VERIFIEE);
        return repository.save(entity);
    }

    @Transactional
    public NonConformite cloturer(String id) {
        NonConformite entity = getById(id);
        if (!NonConformite.STATUS_VERIFIEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Non-conformité must be VERIFIEE to close");
        }
        entity.setStatus(NonConformite.STATUS_CLOTUREE);
        return repository.save(entity);
    }

    @Transactional
    public CapaAction createCapa(String id, CapaActionCreateDto request) {
        NonConformite entity = getById(id);
        UUID tenantId = tenantId();
        String capaId = nextCapaId(tenantId, entity.getId());
        String typeCapa = normalizeCapaType(request.getTypeCapa());

        CapaAction capa = CapaAction.builder()
                .id(capaId)
                .tenantId(tenantId)
                .nonConformite(entity)
                .typeCapa(typeCapa)
                .description(request.getDescription().trim())
                .responsableId(trimOrNull(request.getResponsableId()))
                .responsableNom(trimOrNull(request.getResponsableNom()))
                .dateEcheance(request.getDateEcheance())
                .status(CapaAction.STATUS_PLANIFIEE)
                .build();

        if (CapaAction.TYPE_CORRECTIVE.equals(typeCapa)) {
            entity.setActionCorrective(capa.getDescription());
        } else if (CapaAction.TYPE_PREVENTIVE.equals(typeCapa)) {
            entity.setActionPreventive(capa.getDescription());
        }
        if (capa.getResponsableId() != null) {
            entity.setResponsableId(capa.getResponsableId());
        }
        if (capa.getResponsableNom() != null) {
            entity.setResponsableNom(capa.getResponsableNom());
        }
        if (capa.getDateEcheance() != null) {
            entity.setDateEcheance(capa.getDateEcheance());
        }

        entity.getCapaActions().add(capa);
        repository.save(entity);
        return capaRepository.save(capa);
    }

    private List<NonConformite> loadRows(UUID tenantId, String status, String type) {
        String normalizedStatus = normalizeStatusFilter(status);
        String normalizedType = normalizeTypeFilter(type);

        if (normalizedStatus != null && "EN_COURS".equals(normalizedStatus)) {
            List<NonConformite> rows = repository.findByTenantIdOrderByDateNcDescCreatedAtDesc(tenantId);
            rows = rows.stream().filter(nc -> IN_PROGRESS_STATUSES.contains(nc.getStatus())).toList();
            if (normalizedType != null) {
                rows = rows.stream().filter(nc -> normalizedType.equals(nc.getTypeNc())).toList();
            }
            return rows;
        }

        if (normalizedStatus != null && normalizedType != null) {
            return repository.findByTenantIdAndStatusAndTypeNcOrderByDateNcDescCreatedAtDesc(
                    tenantId, normalizedStatus, normalizedType);
        }
        if (normalizedStatus != null) {
            return repository.findByTenantIdAndStatusOrderByDateNcDescCreatedAtDesc(tenantId, normalizedStatus);
        }
        if (normalizedType != null) {
            return repository.findByTenantIdAndTypeNcOrderByDateNcDescCreatedAtDesc(tenantId, normalizedType);
        }
        return repository.findByTenantIdOrderByDateNcDescCreatedAtDesc(tenantId);
    }

    private boolean matchesSearch(NonConformite nc, String term) {
        return contains(nc.getNumero(), term)
                || contains(nc.getDescription(), term)
                || contains(nc.getResponsableNom(), term)
                || contains(nc.getChantierCode(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private java.util.Optional<NonConformite> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return java.util.Optional.empty();
        }
        return repository.findByIdAndTenantId(id, tenantId());
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        int max = 0;
        for (NonConformite nc : repository.findByTenantIdOrderByDateNcDescCreatedAtDesc(tenantId)) {
            Matcher matcher = NC_NUMERO_SUFFIX.matcher(nc.getNumero());
            if (matcher.matches() && Integer.parseInt(matcher.group(1)) == year) {
                max = Math.max(max, Integer.parseInt(matcher.group(2)));
            }
        }
        return String.format(Locale.ROOT, "NC-%d-%04d", year, max + 1);
    }

    private String nextNcId(UUID tenantId) {
        int max = 0;
        for (NonConformite nc : repository.findByTenantIdOrderByDateNcDescCreatedAtDesc(tenantId)) {
            Matcher matcher = NC_ID_SUFFIX.matcher(nc.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "nc%03d", max + 1);
    }

    private String nextCapaId(UUID tenantId, String ncId) {
        List<CapaAction> existing =
                capaRepository.findByTenantIdAndNonConformiteIdOrderByCreatedAtAsc(tenantId, ncId);
        return ncId + "-capa" + String.format(Locale.ROOT, "%02d", existing.size() + 1);
    }

    private String normalizeType(String raw) {
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeCapaType(String raw) {
        String value = raw.trim().toUpperCase(Locale.ROOT);
        return switch (value) {
            case "CORRECTIVE", "CORRECTIF", "ACTION_CORRECTIVE" -> CapaAction.TYPE_CORRECTIVE;
            case "PREVENTIVE", "PREVENTIF", "ACTION_PREVENTIVE" -> CapaAction.TYPE_PREVENTIVE;
            default -> value;
        };
    }

    private String normalizeStatus(String raw, String fallback) {
        if (!StringUtils.hasText(raw)) {
            return fallback;
        }
        String value = raw.trim().toUpperCase(Locale.ROOT);
        return switch (value) {
            case "OUVERTE", "OUVERT" -> NonConformite.STATUS_OUVERTE;
            case "ASSIGNEE", "ASSIGNE" -> NonConformite.STATUS_ASSIGNEE;
            case "EN_TRAITEMENT", "EN_COURS", "EN COURS" -> NonConformite.STATUS_EN_TRAITEMENT;
            case "VERIFIEE", "VERIFIE" -> NonConformite.STATUS_VERIFIEE;
            case "CLOTUREE", "CLOTURE", "CLOS" -> NonConformite.STATUS_CLOTUREE;
            default -> value;
        };
    }

    private String normalizeStatusFilter(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim().toUpperCase(Locale.ROOT);
        if ("EN_COURS".equals(trimmed)) {
            return "EN_COURS";
        }
        return normalizeStatus(trimmed, trimmed);
    }

    private String normalizeTypeFilter(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
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
