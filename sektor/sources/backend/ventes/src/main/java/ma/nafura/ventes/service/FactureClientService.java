package ma.nafura.ventes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.SituationLigneDto;
import ma.nafura.chantiers.api.dto.SituationTravauxDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.ventes.api.request.FactureClientCreateDto;
import ma.nafura.ventes.api.request.FactureClientLigneInputDto;
import ma.nafura.ventes.api.request.FactureClientUpdateDto;
import ma.nafura.ventes.domain.model.FactureClient;
import ma.nafura.ventes.domain.model.FactureClientLigne;
import ma.nafura.ventes.repository.FactureClientRepository;
import ma.nafura.ventes.service.FactureClientTotalsCalculator.ChantierRates;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FactureClientService {

    private final FactureClientRepository repository;
    private final FactureClientSeedService seedService;
    private final ChantierRepository chantierRepository;
    private final EncaissementClientService encaissementService;

    public FactureClientService(
            FactureClientRepository repository,
            FactureClientSeedService seedService,
            ChantierRepository chantierRepository,
            EncaissementClientService encaissementService) {
        this.repository = repository;
        this.seedService = seedService;
        this.chantierRepository = chantierRepository;
        this.encaissementService = encaissementService;
    }

    @Transactional(readOnly = true)
    public List<FactureClient> list(String status, String clientId, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<FactureClient> rows = loadRows(tenantId, status, clientId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(f -> matchesSearch(f, term)).toList();
        }
        rows.forEach(this::enrichFacture);
        return rows;
    }

    @Transactional(readOnly = true)
    public FactureClient getById(UUID id) {
        seedService.seedIfEmpty();
        FactureClient entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Facture client not found"));
        enrichFacture(entity);
        return entity;
    }

    @Transactional
    public FactureClient create(FactureClientCreateDto request) {
        UUID tenantId = tenantId();
        Chantier chantier = resolveChantier(tenantId, request.getChantierId());
        FactureClient entity = FactureClient.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .type(resolveType(request.getType(), FactureClient.TYPE_DIVERSE))
                .clientId(request.getClientId().trim())
                .clientName(trimOrNull(request.getClientName()))
                .bccId(trimOrNull(request.getBccId()))
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .dateEmission(request.getDateEmission())
                .dateEcheance(request.getDateEcheance())
                .modePaiement(trimOrNull(request.getModePaiement()))
                .tvaTaux(request.getTvaTaux())
                .status(resolveStatus(request.getStatus(), FactureClient.STATUS_BROUILLON))
                .notes(trimOrNull(request.getNotes()))
                .lignes(new ArrayList<>())
                .build();
        applyFinancialInputs(
                entity,
                request.getRetenueGarantieTaux(),
                request.getResorptionAvanceMontant(),
                request.getMarchePublic(),
                chantier);
        applyLignes(entity, request.getLignes(), tenantId);
        recalcTotals(entity, chantier, request.getRetenueGarantieTaux());
        FactureClient saved = repository.save(entity);
        enrichFacture(saved);
        return saved;
    }

    @Transactional
    public FactureClient createFromSituation(SituationTravauxDto situation) {
        if (situation == null || !StringUtils.hasText(situation.getChantierId())) {
            throw new IllegalArgumentException("Situation chantier is required");
        }
        UUID tenantId = tenantId();
        Chantier chantier = resolveChantier(tenantId, situation.getChantierId());
        if (chantier == null || !StringUtils.hasText(chantier.getClientId())) {
            throw new IllegalStateException("Chantier client is required to create a situation facture");
        }

        FactureClientCreateDto request = new FactureClientCreateDto();
        request.setType(FactureClient.TYPE_SITUATION);
        request.setClientId(chantier.getClientId());
        request.setClientName(trimOrNull(chantier.getClientName()));
        request.setChantierId(situation.getChantierId());
        request.setChantierCode(trimOrNull(situation.getChantierCode()));
        request.setDateEmission(situation.getDateEmission());
        request.setDateEcheance(situation.getDateEmission().plusDays(30));
        request.setTvaTaux(situation.getTvaTaux());
        request.setRetenueGarantieTaux(situation.getRetenueGarantiePercent());
        request.setResorptionAvanceMontant(
                situation.getRetenueAvanceMontant() != null
                        ? situation.getRetenueAvanceMontant()
                        : BigDecimal.ZERO);
        request.setStatus(FactureClient.STATUS_BROUILLON);
        request.setNotes(buildSituationNotes(situation));
        request.setLignes(mapSituationLignes(situation.getLignes()));

        return create(request);
    }

    @Transactional
    public FactureClient update(UUID id, FactureClientUpdateDto request) {
        FactureClient entity = getById(id);
        Chantier chantier = resolveChantier(tenantId(), coalesceChantierId(entity, request));
        if (request.getType() != null) {
            entity.setType(resolveType(request.getType(), entity.getType()));
        }
        if (request.getClientId() != null) {
            entity.setClientId(request.getClientId().trim());
        }
        if (request.getClientName() != null) {
            entity.setClientName(trimOrNull(request.getClientName()));
        }
        if (request.getBccId() != null) {
            entity.setBccId(trimOrNull(request.getBccId()));
        }
        if (request.getChantierId() != null) {
            entity.setChantierId(trimOrNull(request.getChantierId()));
        }
        if (request.getChantierCode() != null) {
            entity.setChantierCode(trimOrNull(request.getChantierCode()));
        }
        if (request.getDateEmission() != null) {
            entity.setDateEmission(request.getDateEmission());
        }
        if (request.getDateEcheance() != null) {
            entity.setDateEcheance(request.getDateEcheance());
        }
        if (request.getModePaiement() != null) {
            entity.setModePaiement(trimOrNull(request.getModePaiement()));
        }
        if (request.getTvaTaux() != null) {
            entity.setTvaTaux(request.getTvaTaux());
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getRetenueGarantieTaux() != null
                || request.getResorptionAvanceMontant() != null
                || request.getMarchePublic() != null
                || request.getChantierId() != null) {
            applyFinancialInputs(
                    entity,
                    request.getRetenueGarantieTaux(),
                    request.getResorptionAvanceMontant(),
                    request.getMarchePublic(),
                    chantier);
        }
        if (request.getLignes() != null) {
            entity.getLignes().clear();
            applyLignes(entity, request.getLignes(), tenantId());
        }
        recalcTotals(entity, chantier, request.getRetenueGarantieTaux());
        FactureClient saved = repository.save(entity);
        enrichFacture(saved);
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        FactureClient entity = getById(id);
        repository.delete(entity);
    }

    private void recalcTotals(FactureClient entity, Chantier chantier, BigDecimal requestRgTaux) {
        entity.setRetenueGarantieTaux(resolveRetenueGarantieTaux(requestRgTaux, entity, chantier));
        FactureClientTotalsCalculator.applyTotals(entity, toRates(chantier));
    }

    private void applyFinancialInputs(
            FactureClient entity,
            BigDecimal requestRgTaux,
            BigDecimal resorptionAvanceMontant,
            Boolean marchePublic,
            Chantier chantier) {
        if (requestRgTaux != null) {
            entity.setRetenueGarantieTaux(requestRgTaux);
        }
        if (resorptionAvanceMontant != null) {
            entity.setResorptionAvanceMontant(resorptionAvanceMontant);
        }
        if (marchePublic != null || chantier != null) {
            entity.setMarchePublic(resolveMarchePublic(marchePublic, chantier, entity.getMarchePublic()));
        }
    }

    private BigDecimal resolveRetenueGarantieTaux(
            BigDecimal requestTaux, FactureClient entity, Chantier chantier) {
        if (requestTaux != null) {
            return requestTaux;
        }
        if (chantier != null && chantier.getTauxRg() != null) {
            return chantier.getTauxRg();
        }
        if (FactureClient.TYPE_SITUATION.equals(entity.getType())) {
            return FactureClientTotalsCalculator.DEFAULT_RG_SITUATION_TAUX;
        }
        return BigDecimal.ZERO;
    }

    private boolean resolveMarchePublic(Boolean requestFlag, Chantier chantier, Boolean current) {
        if (requestFlag != null) {
            return requestFlag;
        }
        if (chantier != null
                && chantier.getTauxRas() != null
                && chantier.getTauxRas().compareTo(BigDecimal.ZERO) > 0) {
            return true;
        }
        return current != null && current;
    }

    private ChantierRates toRates(Chantier chantier) {
        if (chantier == null) {
            return ChantierRates.empty();
        }
        return new ChantierRates(chantier.getTauxRg(), chantier.getTauxRas());
    }

    private Chantier resolveChantier(UUID tenantId, String chantierId) {
        if (!StringUtils.hasText(chantierId)) {
            return null;
        }
        return chantierRepository
                .findByIdAndTenantId(chantierId.trim(), tenantId)
                .orElse(null);
    }

    private String coalesceChantierId(FactureClient entity, FactureClientUpdateDto request) {
        if (request.getChantierId() != null) {
            return request.getChantierId();
        }
        return entity.getChantierId();
    }

    private List<FactureClient> loadRows(UUID tenantId, String status, String clientId) {
        boolean hasStatus = StringUtils.hasText(status);
        boolean hasClient = StringUtils.hasText(clientId);
        if (hasStatus && hasClient) {
            return repository.findByTenantIdAndStatusAndClientIdOrderByCreatedAtDesc(
                    tenantId, status.trim(), clientId.trim());
        }
        if (hasStatus) {
            return repository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status.trim());
        }
        if (hasClient) {
            return repository.findByTenantIdAndClientIdOrderByCreatedAtDesc(tenantId, clientId.trim());
        }
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    private void applyLignes(FactureClient entity, List<FactureClientLigneInputDto> inputs, UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        int index = 0;
        for (FactureClientLigneInputDto input : inputs) {
            index++;
            FactureClientLigne ligne = FactureClientLigne.builder()
                    .tenantId(tenantId)
                    .facture(entity)
                    .ordre(input.getOrdre() != null ? input.getOrdre() : index)
                    .designation(input.getDesignation().trim())
                    .unite(trimOrNull(input.getUnite()))
                    .quantite(input.getQuantite())
                    .prixUnitaireHt(input.getPrixUnitaireHt())
                    .totalHt(input.getTotalHt())
                    .build();
            entity.getLignes().add(ligne);
        }
    }

    private String nextNumero(UUID tenantId) {
        long count = repository.countByTenantId(tenantId) + 1;
        return "FAC-" + Year.now().getValue() + "-" + String.format("%04d", count);
    }

    private String resolveType(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        return requested.trim().toUpperCase(Locale.ROOT);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case FactureClient.STATUS_BROUILLON,
                    FactureClient.STATUS_EMISE,
                    FactureClient.STATUS_PARTIELLEMENT_PAYEE,
                    FactureClient.STATUS_PAYEE,
                    FactureClient.STATUS_EN_LITIGE,
                    FactureClient.STATUS_AVOIRISEE,
                    FactureClient.STATUS_ANNULEE -> normalized;
            default -> fallback;
        };
    }

    private boolean matchesSearch(FactureClient f, String term) {
        return contains(f.getNumero(), term)
                || contains(f.getClientName(), term)
                || contains(f.getChantierCode(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private void enrichFacture(FactureClient entity) {
        attachLigneFactureIds(entity);
        encaissementService.attachEncaissements(entity);
    }

    private void attachLigneFactureIds(FactureClient entity) {
        if (entity.getLignes() == null) {
            return;
        }
        for (FactureClientLigne ligne : entity.getLignes()) {
            ligne.setFacture(entity);
        }
    }

    private String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private List<FactureClientLigneInputDto> mapSituationLignes(List<SituationLigneDto> lignes) {
        if (lignes == null || lignes.isEmpty()) {
            return List.of();
        }
        List<FactureClientLigneInputDto> mapped = new ArrayList<>();
        int index = 0;
        for (SituationLigneDto ligne : lignes) {
            BigDecimal qtyPrecedente =
                    ligne.getQuantitePrecedente() != null ? ligne.getQuantitePrecedente() : BigDecimal.ZERO;
            BigDecimal qtyPeriode = ligne.getQuantiteCumulee().subtract(qtyPrecedente);
            if (qtyPeriode.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            BigDecimal prixUnitaire = ligne.getPrixUnitaire() != null ? ligne.getPrixUnitaire() : BigDecimal.ZERO;
            BigDecimal totalHt = qtyPeriode.multiply(prixUnitaire).setScale(4, RoundingMode.HALF_UP);

            index++;
            FactureClientLigneInputDto input = new FactureClientLigneInputDto();
            input.setOrdre(index);
            input.setDesignation(ligne.getDesignation());
            input.setUnite(trimOrNull(ligne.getUnite()));
            input.setQuantite(qtyPeriode);
            input.setPrixUnitaireHt(prixUnitaire);
            input.setTotalHt(totalHt);
            mapped.add(input);
        }
        return mapped;
    }

    private String buildSituationNotes(SituationTravauxDto situation) {
        if (situation == null || !StringUtils.hasText(situation.getNumero())) {
            return null;
        }
        return "Facture générée depuis la situation " + situation.getNumero();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
