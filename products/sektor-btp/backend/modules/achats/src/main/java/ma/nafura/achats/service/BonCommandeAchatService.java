package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.api.request.BonCommandeAchatCreateDto;
import ma.nafura.achats.api.request.BonCommandeAchatLigneInputDto;
import ma.nafura.achats.api.request.BonCommandeAchatUpdateDto;
import ma.nafura.achats.domain.model.AppelOffreAchat;
import ma.nafura.achats.domain.model.AppelOffreLigne;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.BonCommandeAchatLigne;
import ma.nafura.achats.domain.model.OffreFournisseur;
import ma.nafura.achats.domain.model.OffreFournisseurLigne;
import ma.nafura.achats.repository.BonCommandeAchatRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.event.ErpNotificationPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class BonCommandeAchatService {

    private final BonCommandeAchatRepository repository;
    private final BonCommandeAchatSeedService seedService;
    private final ErpNotificationPublisher erpNotificationPublisher;

    public BonCommandeAchatService(
            BonCommandeAchatRepository repository,
            BonCommandeAchatSeedService seedService,
            ErpNotificationPublisher erpNotificationPublisher) {
        this.repository = repository;
        this.seedService = seedService;
        this.erpNotificationPublisher = erpNotificationPublisher;
    }

    @Transactional(readOnly = true)
    public List<BonCommandeAchat> list(
            String status, String fournisseurId, String chantierId, String rubrique, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<BonCommandeAchat> rows = loadRows(tenantId, status, fournisseurId, chantierId);
        if (StringUtils.hasText(rubrique)) {
            String rub = rubrique.trim();
            rows = rows.stream().filter(b -> rub.equals(b.getRubrique())).toList();
        }
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(b -> matchesSearch(b, term)).toList();
        }
        rows.forEach(this::attachLigneBcIds);
        return rows;
    }

    @Transactional(readOnly = true)
    public BonCommandeAchat getById(UUID id) {
        seedService.seedIfEmpty();
        BonCommandeAchat entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Bon commande achat not found"));
        attachLigneBcIds(entity);
        return entity;
    }

    @Transactional
    public BonCommandeAchat create(BonCommandeAchatCreateDto request) {
        UUID tenantId = tenantId();
        BigDecimal tvaTaux = request.getTvaTaux() != null ? request.getTvaTaux() : new BigDecimal("20");
        BonCommandeAchat entity = BonCommandeAchat.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .fournisseurId(request.getFournisseurId().trim())
                .fournisseurName(trimOrNull(request.getFournisseurName()))
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .chantierName(trimOrNull(request.getChantierName()))
                .daId(trimOrNull(request.getDaId()))
                .daNumero(trimOrNull(request.getDaNumero()))
                .aoId(trimOrNull(request.getAoId()))
                .aoNumero(trimOrNull(request.getAoNumero()))
                .contratId(trimOrNull(request.getContratId()))
                .contratNumero(trimOrNull(request.getContratNumero()))
                .rubrique(trimOrNull(request.getRubrique()))
                .dateCreation(request.getDateCreation() != null ? request.getDateCreation() : LocalDate.now())
                .dateLivraisonPrevue(request.getDateLivraisonPrevue())
                .conditionsPaiement(request.getConditionsPaiement().trim())
                .modeReglement(trimOrNull(request.getModeReglement()))
                .tvaTaux(tvaTaux)
                .status(resolveStatus(request.getStatus(), BonCommandeAchat.STATUS_BROUILLON))
                .validateurId(trimOrNull(request.getValidateurId()))
                .validateurName(trimOrNull(request.getValidateurName()))
                .validationDate(request.getValidationDate())
                .notes(trimOrNull(request.getNotes()))
                .lignes(new ArrayList<>())
                .build();
        applyLignes(entity, request.getLignes(), tenantId);
        recomputeTotals(entity);
        BonCommandeAchat saved = repository.save(entity);
        attachLigneBcIds(saved);
        return saved;
    }

    @Transactional
    public BonCommandeAchat update(UUID id, BonCommandeAchatUpdateDto request) {
        BonCommandeAchat entity = getById(id);
        if (request.getFournisseurId() != null) {
            entity.setFournisseurId(request.getFournisseurId().trim());
        }
        if (request.getFournisseurName() != null) {
            entity.setFournisseurName(trimOrNull(request.getFournisseurName()));
        }
        if (request.getChantierId() != null) {
            entity.setChantierId(trimOrNull(request.getChantierId()));
        }
        if (request.getChantierCode() != null) {
            entity.setChantierCode(trimOrNull(request.getChantierCode()));
        }
        if (request.getChantierName() != null) {
            entity.setChantierName(trimOrNull(request.getChantierName()));
        }
        if (request.getDaId() != null) {
            entity.setDaId(trimOrNull(request.getDaId()));
        }
        if (request.getDaNumero() != null) {
            entity.setDaNumero(trimOrNull(request.getDaNumero()));
        }
        if (request.getAoId() != null) {
            entity.setAoId(trimOrNull(request.getAoId()));
        }
        if (request.getAoNumero() != null) {
            entity.setAoNumero(trimOrNull(request.getAoNumero()));
        }
        if (request.getContratId() != null) {
            entity.setContratId(trimOrNull(request.getContratId()));
        }
        if (request.getContratNumero() != null) {
            entity.setContratNumero(trimOrNull(request.getContratNumero()));
        }
        if (request.getRubrique() != null) {
            entity.setRubrique(trimOrNull(request.getRubrique()));
        }
        if (request.getDateCreation() != null) {
            entity.setDateCreation(request.getDateCreation());
        }
        if (request.getDateLivraisonPrevue() != null) {
            entity.setDateLivraisonPrevue(request.getDateLivraisonPrevue());
        }
        if (request.getConditionsPaiement() != null) {
            entity.setConditionsPaiement(request.getConditionsPaiement().trim());
        }
        if (request.getModeReglement() != null) {
            entity.setModeReglement(trimOrNull(request.getModeReglement()));
        }
        if (request.getTvaTaux() != null) {
            entity.setTvaTaux(request.getTvaTaux());
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getValidateurId() != null) {
            entity.setValidateurId(trimOrNull(request.getValidateurId()));
        }
        if (request.getValidateurName() != null) {
            entity.setValidateurName(trimOrNull(request.getValidateurName()));
        }
        if (request.getValidationDate() != null) {
            entity.setValidationDate(request.getValidationDate());
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getLignes() != null) {
            entity.getLignes().clear();
            applyLignes(entity, request.getLignes(), tenantId());
            recomputeTotals(entity);
        } else if (request.getTvaTaux() != null) {
            entity.setTotalTtc(computeTtc(entity.getTotalHt(), entity.getTvaTaux()));
        }
        BonCommandeAchat saved = repository.save(entity);
        attachLigneBcIds(saved);
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        BonCommandeAchat entity = getById(id);
        repository.delete(entity);
    }

    @Transactional
    public BonCommandeAchat submit(UUID id) {
        BonCommandeAchat entity = getById(id);
        if (!BonCommandeAchat.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft purchase orders can be submitted");
        }
        entity.setStatus(BonCommandeAchat.STATUS_VALIDE);
        BonCommandeAchat saved = saveWithLines(entity);
        publishBcEvent(
                saved,
                "SOUMIS",
                "BC à valider : " + saved.getNumero(),
                supplierLabel(saved),
                "DAF",
                "DG");
        return saved;
    }

    @Transactional
    public BonCommandeAchat approve(UUID id, String validateurId, String validateurName) {
        BonCommandeAchat entity = getById(id);
        if (!BonCommandeAchat.STATUS_BROUILLON.equals(entity.getStatus())
                && !BonCommandeAchat.STATUS_VALIDE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft or validated purchase orders can be approved");
        }
        entity.setStatus(BonCommandeAchat.STATUS_VALIDE);
        if (StringUtils.hasText(validateurId)) {
            entity.setValidateurId(validateurId.trim());
        }
        if (StringUtils.hasText(validateurName)) {
            entity.setValidateurName(validateurName.trim());
        }
        entity.setValidationDate(LocalDate.now());
        BonCommandeAchat saved = saveWithLines(entity);
        publishBcEvent(
                saved,
                "APPROUVE",
                "BC validé : " + saved.getNumero(),
                supplierLabel(saved),
                "CONDUCTEUR_TRAVAUX",
                "COMPTABLE");
        return saved;
    }

    @Transactional
    public BonCommandeAchat send(UUID id) {
        BonCommandeAchat entity = getById(id);
        if (!BonCommandeAchat.STATUS_VALIDE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only validated purchase orders can be sent");
        }
        entity.setStatus(BonCommandeAchat.STATUS_ENVOYE);
        BonCommandeAchat saved = saveWithLines(entity);
        publishBcEvent(
                saved,
                "ENVOYE",
                "BC envoyé : " + saved.getNumero(),
                supplierLabel(saved),
                "COMPTABLE",
                "CONDUCTEUR_TRAVAUX");
        return saved;
    }

    @Transactional
    public BonCommandeAchat createFromAppelOffre(
            AppelOffreAchat ao, String fournisseurId, String fournisseurName, OffreFournisseur winningOffer) {
        if (StringUtils.hasText(ao.getBcGenereId())) {
            return getById(UUID.fromString(ao.getBcGenereId()));
        }
        UUID tenantId = tenantId();
        Map<UUID, BigDecimal> priceByAoLine = new HashMap<>();
        if (winningOffer != null && winningOffer.getLignes() != null) {
            for (OffreFournisseurLigne offreLigne : winningOffer.getLignes()) {
                if (offreLigne.getAppelOffreLigne() != null && offreLigne.getAppelOffreLigne().getId() != null) {
                    priceByAoLine.put(offreLigne.getAppelOffreLigne().getId(), offreLigne.getPrixUnitaireHt());
                }
            }
        }
        BonCommandeAchat entity = BonCommandeAchat.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .fournisseurId(fournisseurId.trim())
                .fournisseurName(trimOrNull(fournisseurName))
                .chantierId(ao.getChantierId())
                .chantierCode(ao.getChantierCode())
                .chantierName(ao.getChantierName())
                .aoId(ao.getId().toString())
                .aoNumero(ao.getNumero())
                .rubrique("MATERIAUX")
                .dateCreation(LocalDate.now())
                .dateLivraisonPrevue(LocalDate.now().plusDays(30))
                .conditionsPaiement("30j")
                .tvaTaux(new BigDecimal("20"))
                .status(BonCommandeAchat.STATUS_BROUILLON)
                .lignes(new ArrayList<>())
                .build();
        if (ao.getLignes() != null) {
            for (AppelOffreLigne aoLigne : ao.getLignes()) {
                BigDecimal unitPrice = priceByAoLine.getOrDefault(aoLigne.getId(), BigDecimal.ZERO);
                BigDecimal qty = aoLigne.getQuantite();
                BigDecimal lineTotal = unitPrice.multiply(qty).setScale(4, RoundingMode.HALF_UP);
                BonCommandeAchatLigne ligne = BonCommandeAchatLigne.builder()
                        .tenantId(tenantId)
                        .bonCommande(entity)
                        .articleId(aoLigne.getArticleId())
                        .articleCode(aoLigne.getArticleCode())
                        .articleName(aoLigne.getArticleName())
                        .quantite(qty)
                        .quantiteLivree(BigDecimal.ZERO)
                        .quantiteFacturee(BigDecimal.ZERO)
                        .uomCode(aoLigne.getUomCode())
                        .prixUnitaireHt(unitPrice)
                        .totalHt(lineTotal)
                        .build();
                entity.getLignes().add(ligne);
            }
        }
        recomputeTotals(entity);
        BonCommandeAchat saved = repository.save(entity);
        attachLigneBcIds(saved);
        return saved;
    }

    @Transactional
    public BonCommandeAchat saveAfterReception(BonCommandeAchat entity) {
        return saveWithLines(entity);
    }

    @Transactional
    public BonCommandeAchat acknowledgeReception(UUID id) {
        BonCommandeAchat entity = getById(id);
        if (!BonCommandeAchat.STATUS_ENVOYE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only sent purchase orders can acknowledge receipt");
        }
        entity.setStatus(BonCommandeAchat.STATUS_ACCUSE_RECEPTION);
        return saveWithLines(entity);
    }

    @Transactional
    public BonCommandeAchat cancel(UUID id) {
        BonCommandeAchat entity = getById(id);
        String status = entity.getStatus();
        if (!BonCommandeAchat.STATUS_ENVOYE.equals(status)
                && !BonCommandeAchat.STATUS_ACCUSE_RECEPTION.equals(status)
                && !BonCommandeAchat.STATUS_PARTIELLEMENT_LIVRE.equals(status)) {
            throw new IllegalStateException("Purchase order cannot be cancelled in current status");
        }
        entity.setStatus(BonCommandeAchat.STATUS_ANNULE);
        return saveWithLines(entity);
    }

    @Transactional
    public BonCommandeAchat close(UUID id) {
        BonCommandeAchat entity = getById(id);
        if (!BonCommandeAchat.STATUS_LIVRE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only fully delivered purchase orders can be closed");
        }
        entity.setStatus(BonCommandeAchat.STATUS_CLOTURE);
        return saveWithLines(entity);
    }

    private BonCommandeAchat saveWithLines(BonCommandeAchat entity) {
        entity.setUpdatedAt(OffsetDateTime.now());
        BonCommandeAchat saved = repository.save(entity);
        attachLigneBcIds(saved);
        return saved;
    }

    private List<BonCommandeAchat> loadRows(
            UUID tenantId, String status, String fournisseurId, String chantierId) {
        boolean hasStatus = StringUtils.hasText(status);
        boolean hasFournisseur = StringUtils.hasText(fournisseurId);
        boolean hasChantier = StringUtils.hasText(chantierId);
        if (hasStatus && hasFournisseur && hasChantier) {
            return repository.findByTenantIdAndStatusAndFournisseurIdAndChantierIdOrderByCreatedAtDesc(
                    tenantId, status.trim(), fournisseurId.trim(), chantierId.trim());
        }
        if (hasStatus && hasFournisseur) {
            return repository.findByTenantIdAndStatusAndFournisseurIdOrderByCreatedAtDesc(
                    tenantId, status.trim(), fournisseurId.trim());
        }
        if (hasStatus && hasChantier) {
            return repository.findByTenantIdAndStatusAndChantierIdOrderByCreatedAtDesc(
                    tenantId, status.trim(), chantierId.trim());
        }
        if (hasFournisseur && hasChantier) {
            return repository.findByTenantIdAndFournisseurIdAndChantierIdOrderByCreatedAtDesc(
                    tenantId, fournisseurId.trim(), chantierId.trim());
        }
        if (hasStatus) {
            return repository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status.trim());
        }
        if (hasFournisseur) {
            return repository.findByTenantIdAndFournisseurIdOrderByCreatedAtDesc(tenantId, fournisseurId.trim());
        }
        if (hasChantier) {
            return repository.findByTenantIdAndChantierIdOrderByCreatedAtDesc(tenantId, chantierId.trim());
        }
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    private void applyLignes(
            BonCommandeAchat entity, List<BonCommandeAchatLigneInputDto> inputs, UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        for (BonCommandeAchatLigneInputDto input : inputs) {
            BigDecimal qty = input.getQuantite();
            BigDecimal unitPrice = input.getPrixUnitaireHt();
            BigDecimal lineTotal = input.getTotalHt();
            if (lineTotal == null) {
                lineTotal = unitPrice.multiply(qty);
            }
            BonCommandeAchatLigne ligne = BonCommandeAchatLigne.builder()
                    .tenantId(tenantId)
                    .bonCommande(entity)
                    .articleId(input.getArticleId().trim())
                    .articleCode(trimOrNull(input.getArticleCode()))
                    .articleName(trimOrNull(input.getArticleName()))
                    .quantite(qty)
                    .quantiteLivree(input.getQuantiteLivree() != null ? input.getQuantiteLivree() : BigDecimal.ZERO)
                    .quantiteFacturee(
                            input.getQuantiteFacturee() != null ? input.getQuantiteFacturee() : BigDecimal.ZERO)
                    .uomCode(trimOrNull(input.getUomCode()))
                    .prixUnitaireHt(unitPrice)
                    .totalHt(lineTotal)
                    .notes(trimOrNull(input.getNotes()))
                    .build();
            entity.getLignes().add(ligne);
        }
    }

    private void recomputeTotals(BonCommandeAchat entity) {
        BigDecimal totalHt = entity.getLignes().stream()
                .map(l -> l.getTotalHt() != null ? l.getTotalHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        entity.setTotalHt(totalHt);
        entity.setTotalTtc(computeTtc(totalHt, entity.getTvaTaux()));
    }

    private BigDecimal computeTtc(BigDecimal totalHt, BigDecimal tvaTaux) {
        if (totalHt == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal rate = tvaTaux != null ? tvaTaux : BigDecimal.ZERO;
        return totalHt
                .multiply(BigDecimal.ONE.add(rate.divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP)))
                .setScale(4, RoundingMode.HALF_UP);
    }

    private String nextNumero(UUID tenantId) {
        long count = repository.countByTenantId(tenantId) + 1;
        return "BC-" + Year.now().getValue() + "-" + String.format("%05d", count);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case BonCommandeAchat.STATUS_BROUILLON,
                    BonCommandeAchat.STATUS_VALIDE,
                    BonCommandeAchat.STATUS_ENVOYE,
                    BonCommandeAchat.STATUS_ACCUSE_RECEPTION,
                    BonCommandeAchat.STATUS_PARTIELLEMENT_LIVRE,
                    BonCommandeAchat.STATUS_LIVRE,
                    BonCommandeAchat.STATUS_FACTURE,
                    BonCommandeAchat.STATUS_CLOTURE,
                    BonCommandeAchat.STATUS_ANNULE -> normalized;
            default -> fallback;
        };
    }

    private boolean matchesSearch(BonCommandeAchat b, String term) {
        return contains(b.getNumero(), term)
                || contains(b.getFournisseurName(), term)
                || contains(b.getChantierName(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private void attachLigneBcIds(BonCommandeAchat entity) {
        if (entity.getLignes() == null) {
            return;
        }
        for (BonCommandeAchatLigne ligne : entity.getLignes()) {
            ligne.setBonCommande(entity);
        }
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

    private void publishBcEvent(
            BonCommandeAchat entity, String transition, String title, String body, String... roles) {
        erpNotificationPublisher.notifyRoles(
                tenantId(),
                "BON_COMMANDE",
                entity.getId().toString(),
                entity.getNumero(),
                transition,
                title,
                body,
                "/achats/commandes/" + entity.getId(),
                roles);
    }

    private String supplierLabel(BonCommandeAchat entity) {
        if (StringUtils.hasText(entity.getFournisseurName())) {
            return entity.getFournisseurName().trim();
        }
        return entity.getFournisseurId();
    }
}
