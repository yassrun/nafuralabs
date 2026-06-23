package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import ma.nafura.chantiers.api.dto.ChantierLookupDto;
import ma.nafura.chantiers.api.request.ChantierCreateDto;
import ma.nafura.chantiers.api.request.ChantierUpdateDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ChantierService {

    private static final Pattern CODE_SUFFIX = Pattern.compile("^CH-20\\d{2}-(\\d{3})$", Pattern.CASE_INSENSITIVE);

    private final ChantierRepository repository;
    private final ChantierSeedService seedService;
    private final ChantierProgressSyncService progressSyncService;

    public ChantierService(
            ChantierRepository repository,
            ChantierSeedService seedService,
            ChantierProgressSyncService progressSyncService) {
        this.repository = repository;
        this.seedService = seedService;
        this.progressSyncService = progressSyncService;
    }

    @Transactional(readOnly = true)
    public List<Chantier> list(String status, String clientId, String societeId, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Chantier> rows = loadRows(tenantId, status, clientId, societeId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(c -> matchesSearch(c, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public List<ChantierLookupDto> lookup(String search) {
        return list(null, null, null, search).stream()
                .map(c -> ChantierLookupDto.builder()
                        .id(c.getId())
                        .code(c.getCode())
                        .label(c.getLabel())
                        .status(c.getStatus())
                        .build())
                .toList();
    }

    @Transactional
    public Chantier getById(String id) {
        seedService.seedIfEmpty();
        progressSyncService.syncFromAvancements(id);
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Chantier not found"));
    }

    @Transactional
    public Chantier create(ChantierCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextChantierId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Chantier id already exists: " + id);
        }
        String code = StringUtils.hasText(request.getCode()) ? request.getCode().trim() : nextChantierCode(tenantId);
        Chantier entity = Chantier.builder()
                .id(id)
                .tenantId(tenantId)
                .code(code)
                .label(request.getLabel().trim())
                .description(trimOrNull(request.getDescription()))
                .chantierType(resolveType(request.getChantierType()))
                .clientId(trimOrNull(request.getClientId()))
                .clientName(trimOrNull(request.getClientName()))
                .marcheNumero(trimOrNull(request.getMarcheNumero()))
                .typeCcagT(trimOrNull(request.getTypeCcagT()))
                .moaId(trimOrNull(request.getMoaId()))
                .moeId(trimOrNull(request.getMoeId()))
                .betId(trimOrNull(request.getBetId()))
                .adresse(trimOrNull(request.getAdresse()))
                .ville(trimOrNull(request.getVille()))
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .dateDemarrage(request.getDateDemarrage())
                .dureeMois(request.getDureeMois())
                .dateFinPrevue(request.getDateFinPrevue())
                .dateFinReelle(request.getDateFinReelle())
                .montantHt(defaultAmount(request.getMontantHt()))
                .tauxTva(defaultRate(request.getTauxTva(), new BigDecimal("20")))
                .tauxRg(request.getTauxRg())
                .tauxRas(request.getTauxRas())
                .tauxAvance(request.getTauxAvance())
                .avancementPercent(defaultRate(request.getAvancementPercent(), BigDecimal.ZERO))
                .status(resolveBackendStatus(request.getStatus(), Chantier.STATUS_BROUILLON))
                .chefChantierUserId(trimOrNull(request.getChefChantierUserId()))
                .chefChantierName(trimOrNull(request.getChefChantierName()))
                .conducteurTravauxUserId(trimOrNull(request.getConducteurTravauxUserId()))
                .conducteurTravauxName(trimOrNull(request.getConducteurTravauxName()))
                .ingenieurUserId(trimOrNull(request.getIngenieurUserId()))
                .ingenieurName(trimOrNull(request.getIngenieurName()))
                .societeId(trimOrNull(request.getSocieteId()))
                .active(request.getActive() == null || request.getActive())
                .build();
        return repository.save(entity);
    }

    @Transactional
    public Chantier update(String id, ChantierUpdateDto request) {
        Chantier entity = getById(id);
        if (request.getCode() != null) {
            entity.setCode(request.getCode().trim());
        }
        if (request.getLabel() != null) {
            entity.setLabel(request.getLabel().trim());
        }
        if (request.getDescription() != null) {
            entity.setDescription(trimOrNull(request.getDescription()));
        }
        if (request.getChantierType() != null) {
            entity.setChantierType(resolveType(request.getChantierType()));
        }
        if (request.getClientId() != null) {
            entity.setClientId(trimOrNull(request.getClientId()));
        }
        if (request.getClientName() != null) {
            entity.setClientName(trimOrNull(request.getClientName()));
        }
        if (request.getMarcheNumero() != null) {
            entity.setMarcheNumero(trimOrNull(request.getMarcheNumero()));
        }
        if (request.getTypeCcagT() != null) {
            entity.setTypeCcagT(trimOrNull(request.getTypeCcagT()));
        }
        if (request.getMoaId() != null) {
            entity.setMoaId(trimOrNull(request.getMoaId()));
        }
        if (request.getMoeId() != null) {
            entity.setMoeId(trimOrNull(request.getMoeId()));
        }
        if (request.getBetId() != null) {
            entity.setBetId(trimOrNull(request.getBetId()));
        }
        if (request.getAdresse() != null) {
            entity.setAdresse(trimOrNull(request.getAdresse()));
        }
        if (request.getVille() != null) {
            entity.setVille(trimOrNull(request.getVille()));
        }
        if (request.getLatitude() != null) {
            entity.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            entity.setLongitude(request.getLongitude());
        }
        if (request.getDateDemarrage() != null) {
            entity.setDateDemarrage(request.getDateDemarrage());
        }
        if (request.getDureeMois() != null) {
            entity.setDureeMois(request.getDureeMois());
        }
        if (request.getDateFinPrevue() != null) {
            entity.setDateFinPrevue(request.getDateFinPrevue());
        }
        if (request.getDateFinReelle() != null) {
            entity.setDateFinReelle(request.getDateFinReelle());
        }
        if (request.getMontantHt() != null) {
            entity.setMontantHt(request.getMontantHt());
        }
        if (request.getTauxTva() != null) {
            entity.setTauxTva(request.getTauxTva());
        }
        if (request.getTauxRg() != null) {
            entity.setTauxRg(request.getTauxRg());
        }
        if (request.getTauxRas() != null) {
            entity.setTauxRas(request.getTauxRas());
        }
        if (request.getTauxAvance() != null) {
            entity.setTauxAvance(request.getTauxAvance());
        }
        if (request.getAvancementPercent() != null) {
            entity.setAvancementPercent(request.getAvancementPercent());
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveBackendStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getChefChantierUserId() != null) {
            entity.setChefChantierUserId(trimOrNull(request.getChefChantierUserId()));
        }
        if (request.getChefChantierName() != null) {
            entity.setChefChantierName(trimOrNull(request.getChefChantierName()));
        }
        if (request.getConducteurTravauxUserId() != null) {
            entity.setConducteurTravauxUserId(trimOrNull(request.getConducteurTravauxUserId()));
        }
        if (request.getConducteurTravauxName() != null) {
            entity.setConducteurTravauxName(trimOrNull(request.getConducteurTravauxName()));
        }
        if (request.getIngenieurUserId() != null) {
            entity.setIngenieurUserId(trimOrNull(request.getIngenieurUserId()));
        }
        if (request.getIngenieurName() != null) {
            entity.setIngenieurName(trimOrNull(request.getIngenieurName()));
        }
        if (request.getSocieteId() != null) {
            entity.setSocieteId(trimOrNull(request.getSocieteId()));
        }
        if (request.getActive() != null) {
            entity.setActive(request.getActive());
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft chantiers can be deleted");
        }
        repository.delete(entity);
    }

    @Transactional
    public Chantier demarrer(String id) {
        Chantier entity = getById(id);
        String status = entity.getStatus();
        if (!Chantier.STATUS_BROUILLON.equals(status) && !Chantier.STATUS_EN_PREPARATION.equals(status)) {
            throw new IllegalStateException("Chantier cannot be started from status " + status);
        }
        entity.setStatus(Chantier.STATUS_EN_COURS);
        if (entity.getDateDemarrage() == null) {
            entity.setDateDemarrage(LocalDate.now());
        }
        return repository.save(entity);
    }

    @Transactional
    public Chantier suspendre(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_EN_COURS.equals(entity.getStatus())) {
            throw new IllegalStateException("Only active chantiers can be suspended");
        }
        entity.setStatus(Chantier.STATUS_SUSPENDU);
        return repository.save(entity);
    }

    @Transactional
    public Chantier reprendre(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_SUSPENDU.equals(entity.getStatus())) {
            throw new IllegalStateException("Only suspended chantiers can be resumed");
        }
        entity.setStatus(Chantier.STATUS_EN_COURS);
        return repository.save(entity);
    }

    @Transactional
    public Chantier receptionProvisoire(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_EN_COURS.equals(entity.getStatus())) {
            throw new IllegalStateException("Provisional reception requires EN_COURS status");
        }
        entity.setStatus(Chantier.STATUS_RECEPTION_PROVISOIRE);
        return repository.save(entity);
    }

    @Transactional
    public Chantier receptionDefinitive(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_RECEPTION_PROVISOIRE.equals(entity.getStatus())) {
            throw new IllegalStateException("Final reception requires RECEPTIONNE_PROVISOIRE status");
        }
        entity.setStatus(Chantier.STATUS_RECEPTION_DEFINITIF);
        return repository.save(entity);
    }

    @Transactional
    public Chantier clore(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_RECEPTION_DEFINITIF.equals(entity.getStatus())) {
            throw new IllegalStateException("Closing requires RECEPTIONNE_DEFINITIF status");
        }
        entity.setStatus(Chantier.STATUS_CLOS);
        entity.setActive(false);
        if (entity.getDateFinReelle() == null) {
            entity.setDateFinReelle(LocalDate.now());
        }
        return repository.save(entity);
    }

    private List<Chantier> loadRows(UUID tenantId, String status, String clientId, String societeId) {
        List<String> backendStatuses = resolveStatusFilter(status);
        boolean hasClient = StringUtils.hasText(clientId);
        boolean hasSociete = StringUtils.hasText(societeId);

        if (backendStatuses != null && !backendStatuses.isEmpty()) {
            List<Chantier> merged = new ArrayList<>();
            for (String backendStatus : backendStatuses) {
                merged.addAll(loadRowsForStatus(tenantId, backendStatus, clientId, societeId, hasClient, hasSociete));
            }
            return merged.stream()
                    .distinct()
                    .sorted((a, b) -> a.getCode().compareToIgnoreCase(b.getCode()))
                    .toList();
        }

        if (hasClient && hasSociete) {
            return repository
                    .findByTenantIdAndClientIdOrderByCodeAsc(tenantId, clientId.trim())
                    .stream()
                    .filter(c -> societeId.trim().equals(c.getSocieteId()))
                    .toList();
        }
        if (hasClient) {
            return repository.findByTenantIdAndClientIdOrderByCodeAsc(tenantId, clientId.trim());
        }
        if (hasSociete) {
            return repository.findByTenantIdAndSocieteIdOrderByCodeAsc(tenantId, societeId.trim());
        }
        return repository.findByTenantIdOrderByCodeAsc(tenantId);
    }

    private List<Chantier> loadRowsForStatus(
            UUID tenantId,
            String backendStatus,
            String clientId,
            String societeId,
            boolean hasClient,
            boolean hasSociete) {
        if (hasClient && hasSociete) {
            return repository
                    .findByTenantIdAndStatusAndClientIdOrderByCodeAsc(tenantId, backendStatus, clientId.trim())
                    .stream()
                    .filter(c -> societeId.trim().equals(c.getSocieteId()))
                    .toList();
        }
        if (hasClient) {
            return repository.findByTenantIdAndStatusAndClientIdOrderByCodeAsc(
                    tenantId, backendStatus, clientId.trim());
        }
        if (hasSociete) {
            return repository.findByTenantIdAndStatusAndSocieteIdOrderByCodeAsc(
                    tenantId, backendStatus, societeId.trim());
        }
        return repository.findByTenantIdAndStatusOrderByCodeAsc(tenantId, backendStatus);
    }

    private List<String> resolveStatusFilter(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if ("PROSPECT".equals(normalized)) {
            return List.of(Chantier.STATUS_BROUILLON, Chantier.STATUS_EN_PREPARATION);
        }
        if ("TERMINE".equals(normalized) || Chantier.STATUS_EN_COURS.equals(normalized)) {
            return List.of(Chantier.STATUS_EN_COURS);
        }
        if (Chantier.STATUS_SUSPENDU.equals(normalized)) {
            return List.of(Chantier.STATUS_SUSPENDU);
        }
        if ("RECEPTIONNE".equals(normalized)) {
            return List.of(Chantier.STATUS_RECEPTION_PROVISOIRE, Chantier.STATUS_RECEPTION_DEFINITIF);
        }
        if ("CLOTURE".equals(normalized) || Chantier.STATUS_CLOS.equals(normalized)) {
            return List.of(Chantier.STATUS_CLOS);
        }
        if ("ANNULE".equals(normalized)) {
            return List.of();
        }
        return List.of(normalized);
    }

    private Optional<Chantier> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        UUID tenantId = tenantId();
        Optional<Chantier> byId = repository.findByIdAndTenantId(id, tenantId);
        if (byId.isPresent()) {
            return byId;
        }
        Optional<Chantier> byCode = repository.findByTenantIdAndCode(tenantId, id);
        if (byCode.isPresent()) {
            return byCode;
        }
        var codeMatch = CODE_SUFFIX.matcher(id);
        if (codeMatch.matches()) {
            String guessed = "ch-" + codeMatch.group(1);
            return repository.findByIdAndTenantId(guessed, tenantId);
        }
        return Optional.empty();
    }

    private String resolveBackendStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "PROSPECT" -> Chantier.STATUS_EN_PREPARATION;
            case "TERMINE" -> Chantier.STATUS_EN_COURS;
            case "RECEPTIONNE" -> Chantier.STATUS_RECEPTION_PROVISOIRE;
            case "CLOTURE", "ANNULE", Chantier.STATUS_CLOS -> Chantier.STATUS_CLOS;
            case Chantier.STATUS_BROUILLON,
                    Chantier.STATUS_EN_PREPARATION,
                    Chantier.STATUS_EN_COURS,
                    Chantier.STATUS_SUSPENDU,
                    Chantier.STATUS_RECEPTION_PROVISOIRE,
                    Chantier.STATUS_RECEPTION_DEFINITIF -> normalized;
            default -> fallback;
        };
    }

    private String resolveType(String type) {
        return StringUtils.hasText(type) ? type.trim().toUpperCase(Locale.ROOT) : "BATIMENT";
    }

    private String nextChantierId(UUID tenantId) {
        int max = 0;
        for (Chantier c : repository.findByTenantIdOrderByCodeAsc(tenantId)) {
            var m = Pattern.compile("^ch-(\\d+)$", Pattern.CASE_INSENSITIVE).matcher(c.getId());
            if (m.matches()) {
                max = Math.max(max, Integer.parseInt(m.group(1)));
            }
        }
        return "ch-" + String.format("%03d", max + 1);
    }

    private String nextChantierCode(UUID tenantId) {
        int year = Year.now().getValue();
        int max = 0;
        for (Chantier c : repository.findByTenantIdOrderByCodeAsc(tenantId)) {
            var m = Pattern.compile("^CH-" + year + "-(\\d+)$", Pattern.CASE_INSENSITIVE).matcher(c.getCode());
            if (m.matches()) {
                max = Math.max(max, Integer.parseInt(m.group(1)));
            }
        }
        return "CH-" + year + "-" + String.format("%03d", max + 1);
    }

    private boolean matchesSearch(Chantier c, String term) {
        return contains(c.getCode(), term)
                || contains(c.getLabel(), term)
                || contains(c.getClientName(), term)
                || contains(c.getVille(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal defaultRate(BigDecimal value, BigDecimal fallback) {
        return value != null ? value : fallback;
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
