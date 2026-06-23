package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.request.DevisCreateDto;
import ma.nafura.etudes.api.request.DevisLigneInputDto;
import ma.nafura.etudes.api.request.DevisUpdateDto;
import ma.nafura.etudes.api.dto.ConvertToChantierResultDto;
import ma.nafura.etudes.domain.model.Devis;
import ma.nafura.etudes.domain.model.DevisLigne;
import ma.nafura.etudes.domain.model.DevisVersion;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DevisVersionRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DevisService {

    private static final int MONEY_SCALE = 2;

    private final DevisRepository repository;
    private final DevisVersionRepository versionRepository;
    private final DevisSeedService seedService;
    private final DpgfService dpgfService;
    private final DevisGenerationService generationService;

    public DevisService(
            DevisRepository repository,
            DevisVersionRepository versionRepository,
            DevisSeedService seedService,
            DpgfService dpgfService,
            DevisGenerationService generationService) {
        this.repository = repository;
        this.versionRepository = versionRepository;
        this.seedService = seedService;
        this.dpgfService = dpgfService;
        this.generationService = generationService;
    }

    @Transactional(readOnly = true)
    public List<Devis> list(
            String status,
            String clientId,
            LocalDate dateFrom,
            LocalDate dateTo,
            BigDecimal montantMin,
            BigDecimal montantMax,
            String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Devis> rows = loadRows(tenantId, status, clientId);
        if (dateFrom != null) {
            rows = rows.stream().filter(d -> !d.getDateEmission().isBefore(dateFrom)).toList();
        }
        if (dateTo != null) {
            rows = rows.stream().filter(d -> !d.getDateEmission().isAfter(dateTo)).toList();
        }
        if (montantMin != null) {
            rows = rows.stream()
                    .filter(d -> d.getTotalHt().compareTo(montantMin) >= 0)
                    .toList();
        }
        if (montantMax != null) {
            rows = rows.stream()
                    .filter(d -> d.getTotalHt().compareTo(montantMax) <= 0)
                    .toList();
        }
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(d -> matchesSearch(d, term)).toList();
        }
        rows.forEach(this::attachLigneDevisRefs);
        return rows;
    }

    @Transactional(readOnly = true)
    public Devis getById(UUID id) {
        seedService.seedIfEmpty();
        Devis entity = requireDevis(id);
        attachLigneDevisRefs(entity);
        return entity;
    }

    @Transactional
    public Devis create(DevisCreateDto request) {
        UUID tenantId = tenantId();
        Devis entity = Devis.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .version(1)
                .clientId(request.getClientId().trim())
                .clientName(trimOrNull(request.getClientName()))
                .contactClient(trimOrNull(request.getContactClient()))
                .objet(request.getObjet().trim())
                .ville(trimOrNull(request.getVille()))
                .dateEmission(request.getDateEmission())
                .dateValidite(request.getDateValidite())
                .metreId(parseUuidOrNull(request.getMetreId()))
                .dpgfId(parseUuidOrNull(request.getDpgfId()))
                .bibliothequeReference(trimOrNull(request.getBibliothequeReference()))
                .conditionsPaiement(request.getConditionsPaiement().trim())
                .delaiExecutionJours(request.getDelaiExecutionJours())
                .tvaTaux(request.getTvaTaux() != null ? request.getTvaTaux() : new BigDecimal("20"))
                .remiseGlobalePercent(request.getRemiseGlobalePercent())
                .status(normalizeStatusOrDefault(request.getStatus()))
                .notes(trimOrNull(request.getNotes()))
                .lignes(new ArrayList<>())
                .historiqueVersions(new ArrayList<>())
                .build();

        applyLignes(entity, request.getLignes(), tenantId);
        applyTotals(entity);
        return repository.save(entity);
    }

    @Transactional
    public Devis createFromDpgf(UUID dpgfId) {
        Dpgf dpgf = dpgfService.getById(dpgfId);
        UUID tenantId = tenantId();
        LocalDate today = LocalDate.now();

        Devis entity = Devis.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .version(1)
                .clientId("cli-default")
                .objet("Chiffrage — "
                        + (StringUtils.hasText(dpgf.getProjetNom()) ? dpgf.getProjetNom() : dpgf.getNumero()))
                .dateEmission(today)
                .dateValidite(today.plusMonths(2))
                .metreId(dpgf.getMetreId())
                .dpgfId(dpgf.getId())
                .bibliothequeReference("DPGF " + dpgf.getNumero())
                .conditionsPaiement("Selon marché / CCAG-T — conditions type")
                .delaiExecutionJours(180)
                .tvaTaux(dpgf.getTvaTaux())
                .status(Devis.STATUS_BROUILLON)
                .lignes(new ArrayList<>())
                .historiqueVersions(new ArrayList<>())
                .build();

        List<DevisLigne> generated = generationService.toDevisLignes(dpgf, null, tenantId);
        for (DevisLigne ligne : generated) {
            ligne.setDevis(entity);
            entity.getLignes().add(ligne);
        }
        applyTotals(entity);
        return repository.save(entity);
    }

    @Transactional
    public Devis update(UUID id, DevisUpdateDto request) {
        Devis entity = requireDevis(id);
        UUID tenantId = tenantId();

        if (request.getClientId() != null) {
            entity.setClientId(request.getClientId().trim());
        }
        if (request.getClientName() != null) {
            entity.setClientName(trimOrNull(request.getClientName()));
        }
        if (request.getContactClient() != null) {
            entity.setContactClient(trimOrNull(request.getContactClient()));
        }
        if (request.getObjet() != null) {
            entity.setObjet(request.getObjet().trim());
        }
        if (request.getVille() != null) {
            entity.setVille(trimOrNull(request.getVille()));
        }
        if (request.getDateEmission() != null) {
            entity.setDateEmission(request.getDateEmission());
        }
        if (request.getDateValidite() != null) {
            entity.setDateValidite(request.getDateValidite());
        }
        if (request.getMetreId() != null) {
            entity.setMetreId(parseUuidOrNull(request.getMetreId()));
        }
        if (request.getDpgfId() != null) {
            entity.setDpgfId(parseUuidOrNull(request.getDpgfId()));
        }
        if (request.getBibliothequeReference() != null) {
            entity.setBibliothequeReference(trimOrNull(request.getBibliothequeReference()));
        }
        if (request.getConditionsPaiement() != null) {
            entity.setConditionsPaiement(request.getConditionsPaiement().trim());
        }
        if (request.getDelaiExecutionJours() != null) {
            entity.setDelaiExecutionJours(request.getDelaiExecutionJours());
        }
        if (request.getTvaTaux() != null) {
            entity.setTvaTaux(request.getTvaTaux());
        }
        if (request.getRemiseGlobalePercent() != null) {
            entity.setRemiseGlobalePercent(request.getRemiseGlobalePercent());
        }
        if (request.getStatus() != null) {
            entity.setStatus(normalizeStatusOrDefault(request.getStatus()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getLignes() != null) {
            entity.getLignes().clear();
            applyLignes(entity, request.getLignes(), tenantId);
        }
        applyTotals(entity);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id) {
        Devis entity = requireDevis(id);
        repository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<DevisVersion> listVersions(UUID id) {
        requireDevis(id);
        return versionRepository.findByDevisIdAndTenantIdOrderByVersionAsc(id, tenantId());
    }

    @Transactional
    public Devis createVersion(UUID id, String modifications) {
        Devis entity = requireDevis(id);
        DevisVersion snapshot = DevisVersion.builder()
                .tenantId(tenantId())
                .devis(entity)
                .version(entity.getVersion())
                .snapshotDate(LocalDate.now())
                .totalHt(entity.getTotalHt())
                .modifications(StringUtils.hasText(modifications)
                        ? modifications.trim()
                        : "Snapshot avant nouvelle version")
                .build();
        entity.getHistoriqueVersions().add(snapshot);
        entity.setVersion(entity.getVersion() + 1);
        entity.setStatus(Devis.STATUS_BROUILLON);
        return repository.save(entity);
    }

    @Transactional
    public Devis submit(UUID id) {
        Devis entity = requireDevis(id);
        entity.setStatus(Devis.STATUS_EMIS);
        return repository.save(entity);
    }

    @Transactional
    public Devis marquerGagne(UUID id) {
        Devis entity = requireDevis(id);
        entity.setStatus(Devis.STATUS_APPROUVE);
        return repository.save(entity);
    }

    @Transactional
    public ConvertToChantierResultDto convertToChantier(UUID id) {
        Devis entity = requireDevis(id);
        if (!Devis.STATUS_APPROUVE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only APPROUVE devis can be converted to chantier");
        }
        if (!StringUtils.hasText(entity.getChantierGenereId())) {
            entity.setChantierGenereId(nextChantierStubId());
            entity = repository.save(entity);
        }
        attachLigneDevisRefs(entity);
        return ConvertToChantierResultDto.builder()
                .chantierId(entity.getChantierGenereId())
                .devis(entity)
                .build();
    }

    private List<Devis> loadRows(UUID tenantId, String status, String clientId) {
        if (StringUtils.hasText(status) && StringUtils.hasText(clientId)) {
            return repository.findByTenantIdAndStatusOrderByDateEmissionDescCreatedAtDesc(
                            tenantId, status.trim())
                    .stream()
                    .filter(d -> clientId.trim().equals(d.getClientId()))
                    .sorted(defaultComparator())
                    .toList();
        }
        if (StringUtils.hasText(status)) {
            return repository.findByTenantIdAndStatusOrderByDateEmissionDescCreatedAtDesc(
                    tenantId, status.trim());
        }
        if (StringUtils.hasText(clientId)) {
            return repository.findByTenantIdAndClientIdOrderByDateEmissionDescCreatedAtDesc(
                    tenantId, clientId.trim());
        }
        return repository.findByTenantIdOrderByDateEmissionDescCreatedAtDesc(tenantId);
    }

    private Comparator<Devis> defaultComparator() {
        return Comparator.comparing(Devis::getDateEmission, Comparator.reverseOrder())
                .thenComparing(Devis::getCreatedAt, Comparator.reverseOrder());
    }

    private void applyLignes(Devis entity, List<DevisLigneInputDto> inputs, UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        Map<String, UUID> idByClientKey = new HashMap<>();
        int fallbackOrdre = 0;
        for (DevisLigneInputDto input : inputs) {
            fallbackOrdre += 1;
            UUID explicitId = parseUuidOrNull(input.getId());
            if (explicitId != null && input.getId() != null && !input.getId().isBlank()) {
                idByClientKey.put(input.getId().trim(), explicitId);
            }

            UUID parentId = resolveParentId(input.getParentLigneId(), idByClientKey);
            BigDecimal qty = input.getQuantite();
            BigDecimal pu = input.getPrixUnitaireHt();
            BigDecimal totalHt = input.getTotalHt();
            if (totalHt == null && qty != null && pu != null) {
                totalHt = qty.multiply(pu).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
            }

            DevisLigne.DevisLigneBuilder ligneBuilder = DevisLigne.builder()
                    .tenantId(tenantId)
                    .devis(entity)
                    .ordre(input.getOrdre() != null ? input.getOrdre() : fallbackOrdre)
                    .parentLigneId(parentId)
                    .type(normalizeLigneType(input.getType()))
                    .code(trimOrNull(input.getCode()))
                    .designation(input.getDesignation().trim())
                    .ouvrageId(parseUuidOrNull(input.getOuvrageId()))
                    .unite(trimOrNull(input.getUnite()))
                    .quantite(qty)
                    .prixUnitaireHt(pu)
                    .totalHt(totalHt)
                    .remisePercent(input.getRemisePercent())
                    .notes(trimOrNull(input.getNotes()));
            if (explicitId != null) {
                ligneBuilder.id(explicitId);
            }
            entity.getLignes().add(ligneBuilder.build());
        }
    }

    private UUID resolveParentId(String parentRef, Map<String, UUID> idByClientKey) {
        if (!StringUtils.hasText(parentRef)) {
            return null;
        }
        UUID mapped = idByClientKey.get(parentRef.trim());
        if (mapped != null) {
            return mapped;
        }
        return parseUuidOrNull(parentRef);
    }

    private void applyTotals(Devis entity) {
        BigDecimal totalHt = BigDecimal.ZERO;
        if (entity.getLignes() != null) {
            for (DevisLigne ligne : entity.getLignes()) {
                if (DevisLigne.TYPE_OUVRAGE.equals(ligne.getType()) && ligne.getTotalHt() != null) {
                    totalHt = totalHt.add(ligne.getTotalHt());
                }
            }
        }
        if (entity.getRemiseGlobalePercent() != null
                && entity.getRemiseGlobalePercent().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal factor = BigDecimal.ONE.subtract(
                    entity.getRemiseGlobalePercent().divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP));
            totalHt = totalHt.multiply(factor);
        }
        totalHt = totalHt.setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal tvaTaux = entity.getTvaTaux() != null ? entity.getTvaTaux() : new BigDecimal("20");
        BigDecimal totalTva = totalHt
                .multiply(tvaTaux)
                .divide(new BigDecimal("100"), MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal totalTtc = totalHt.add(totalTva).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        entity.setTotalHt(totalHt);
        entity.setTotalTva(totalTva);
        entity.setTotalTtc(totalTtc);
    }

    private void attachLigneDevisRefs(Devis entity) {
        if (entity.getLignes() == null) {
            return;
        }
        for (DevisLigne ligne : entity.getLignes()) {
            ligne.setDevis(entity);
        }
    }

    private boolean matchesSearch(Devis entity, String term) {
        return contains(entity.getNumero(), term)
                || contains(entity.getObjet(), term)
                || contains(entity.getClientName(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private Devis requireDevis(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Devis not found"));
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        String prefix = "DV-" + year + "-";
        long count = repository.countByTenantIdAndNumeroStartingWith(tenantId, prefix);
        return prefix + String.format(Locale.ROOT, "%04d", count + 1);
    }

    private String nextChantierStubId() {
        int year = Year.now().getValue();
        return "CH-" + year + "-" + String.format(Locale.ROOT, "%03d", Math.abs(UUID.randomUUID().hashCode()) % 900 + 100);
    }

    private String normalizeStatusOrDefault(String status) {
        if (!StringUtils.hasText(status)) {
            return Devis.STATUS_BROUILLON;
        }
        return status.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeLigneType(String type) {
        if (!StringUtils.hasText(type)) {
            throw new IllegalArgumentException("Ligne type is required");
        }
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        if (!DevisLigne.TYPE_CHAPITRE.equals(normalized)
                && !DevisLigne.TYPE_OUVRAGE.equals(normalized)
                && !DevisLigne.TYPE_TEXTE.equals(normalized)) {
            throw new IllegalArgumentException("Invalid ligne type: " + type);
        }
        return normalized;
    }

    private UUID parseUuidOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return UUID.fromString(value.trim());
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
