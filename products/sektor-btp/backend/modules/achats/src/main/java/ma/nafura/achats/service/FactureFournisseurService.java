package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.achats.api.dto.MatchingReceptionDto;
import ma.nafura.achats.api.dto.MatchingToleranceDto;
import ma.nafura.achats.api.request.FactureFournisseurCreateDto;
import ma.nafura.achats.api.request.FactureFournisseurLigneInputDto;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.FactureFournisseur;
import ma.nafura.achats.domain.model.FactureFournisseurLigne;
import ma.nafura.achats.domain.model.ReceptionAchat;
import ma.nafura.achats.repository.FactureFournisseurRepository;
import ma.nafura.finance.api.request.JournalEntryCreateDto;
import ma.nafura.finance.api.request.JournalEntryLineDto;
import ma.nafura.finance.domain.model.AccountingJournal;
import ma.nafura.finance.repository.AccountingJournalRepository;
import ma.nafura.finance.service.ComptabiliteSeedService;
import ma.nafura.finance.service.JournalEntryService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FactureFournisseurService {

    private static final String ACCOUNT_SUPPLIER = "4411";
    private static final String ACCOUNT_TVA = "3455";

    private final FactureFournisseurRepository repository;
    private final BonCommandeAchatService bonCommandeService;
    private final ReceptionAchatService receptionService;
    private final MatchingThreeWayService matchingService;
    private final AccountingJournalRepository journalRepository;
    private final JournalEntryService journalEntryService;
    private final ComptabiliteSeedService seedService;

    public FactureFournisseurService(
            FactureFournisseurRepository repository,
            BonCommandeAchatService bonCommandeService,
            ReceptionAchatService receptionService,
            MatchingThreeWayService matchingService,
            AccountingJournalRepository journalRepository,
            JournalEntryService journalEntryService,
            ComptabiliteSeedService seedService) {
        this.repository = repository;
        this.bonCommandeService = bonCommandeService;
        this.receptionService = receptionService;
        this.matchingService = matchingService;
        this.journalRepository = journalRepository;
        this.journalEntryService = journalEntryService;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<FactureFournisseur> list(String status, UUID bcId, String fournisseurId) {
        UUID tenantId = tenantId();
        List<FactureFournisseur> rows;
        if (bcId != null) {
            rows = repository.findByTenantIdAndBcIdOrderByCreatedAtDesc(tenantId, bcId);
        } else {
            rows = loadRows(tenantId, status, fournisseurId);
        }
        rows.forEach(this::attachLigneFactureIds);
        return rows;
    }

    private List<FactureFournisseur> loadRows(UUID tenantId, String status, String fournisseurId) {
        boolean hasStatus = StringUtils.hasText(status);
        boolean hasFournisseur = StringUtils.hasText(fournisseurId);
        if (hasStatus && hasFournisseur) {
            return repository.findByTenantIdAndStatusAndFournisseurIdOrderByCreatedAtDesc(
                    tenantId, status.trim(), fournisseurId.trim());
        }
        if (hasStatus) {
            return repository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status.trim());
        }
        if (hasFournisseur) {
            return repository.findByTenantIdAndFournisseurIdOrderByCreatedAtDesc(
                    tenantId, fournisseurId.trim());
        }
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public FactureFournisseur getById(UUID id) {
        FactureFournisseur entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Facture fournisseur not found"));
        attachLigneFactureIds(entity);
        return entity;
    }

    @Transactional
    public FactureFournisseur create(FactureFournisseurCreateDto request) {
        UUID tenantId = tenantId();
        String bcNumero = trimOrNull(request.getBcNumero());

        FactureFournisseur entity = FactureFournisseur.builder()
                .tenantId(tenantId)
                .numeroInterne(nextNumero(tenantId))
                .numeroFournisseur(trimOrNull(request.getNumeroFournisseur()))
                .fournisseurId(request.getFournisseurId().trim())
                .fournisseurName(trimOrNull(request.getFournisseurName()))
                .bcId(request.getBcId())
                .bcNumero(bcNumero)
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierName(trimOrNull(request.getChantierName()))
                .rubrique(trimOrNull(request.getRubrique()))
                .dateFacture(request.getDateFacture())
                .dateReception(request.getDateReception())
                .dateEcheance(request.getDateEcheance())
                .status(resolveStatus(request.getStatus(), FactureFournisseur.STATUS_BROUILLON))
                .notes(trimOrNull(request.getNotes()))
                .lignes(new ArrayList<>())
                .build();

        applyLignes(entity, request.getLignes(), tenantId);
        recomputeTotals(entity);

        FactureFournisseur saved = repository.save(entity);
        attachLigneFactureIds(saved);
        return saved;
    }

    @Transactional
    public FactureFournisseur update(UUID id, FactureFournisseurCreateDto request) {
        FactureFournisseur entity = getById(id);
        if (!FactureFournisseur.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft supplier invoices can be updated");
        }
        BonCommandeAchat bc = null;
        if (request.getBcId() != null) {
            bc = bonCommandeService.getById(request.getBcId());
        }

        entity.setNumeroFournisseur(trimOrNull(request.getNumeroFournisseur()));
        entity.setFournisseurId(request.getFournisseurId().trim());
        entity.setFournisseurName(trimOrNull(request.getFournisseurName()));
        entity.setBcId(request.getBcId());
        entity.setBcNumero(bc != null ? bc.getNumero() : trimOrNull(request.getBcNumero()));
        entity.setChantierId(trimOrNull(request.getChantierId()));
        entity.setChantierName(trimOrNull(request.getChantierName()));
        entity.setRubrique(trimOrNull(request.getRubrique()));
        entity.setDateFacture(request.getDateFacture());
        entity.setDateReception(request.getDateReception());
        entity.setDateEcheance(request.getDateEcheance());
        entity.setNotes(trimOrNull(request.getNotes()));

        entity.getLignes().clear();
        applyLignes(entity, request.getLignes(), tenantId());
        recomputeTotals(entity);

        if (entity.getBcId() != null) {
            MatchingReceptionDto matching = computeMatching(entity);
            entity.setMatchingStatus(matching.getStatus());
        } else {
            entity.setMatchingStatus(null);
        }
        entity.setUpdatedAt(OffsetDateTime.now());

        FactureFournisseur saved = repository.save(entity);
        attachLigneFactureIds(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public MatchingReceptionDto getMatching(UUID id, MatchingToleranceDto tolerance) {
        return computeMatching(getById(id), tolerance);
    }

    @Transactional
    public MatchingReceptionDto recomputeMatching(UUID id, MatchingToleranceDto tolerance) {
        FactureFournisseur entity = getById(id);
        MatchingReceptionDto matching = computeMatching(entity, tolerance);
        entity.setMatchingStatus(matching.getStatus());
        entity.setUpdatedAt(OffsetDateTime.now());
        repository.save(entity);
        return matching;
    }

    @Transactional
    public FactureFournisseur validate(UUID id) {
        FactureFournisseur entity = getById(id);
        MatchingReceptionDto matching = computeMatching(entity);
        if ("ECART_BLOQUE".equals(matching.getStatus())) {
            throw new IllegalStateException("Validation refused: matching status ECART_BLOQUE");
        }
        if (!FactureFournisseur.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft supplier invoices can be validated");
        }
        entity.setStatus(FactureFournisseur.STATUS_VALIDEE);
        entity.setMatchingStatus(matching.getStatus());
        entity.setUpdatedAt(OffsetDateTime.now());
        FactureFournisseur saved = repository.save(entity);
        attachLigneFactureIds(saved);
        return saved;
    }

    @Transactional
    public FactureFournisseur comptabiliser(UUID id) {
        seedService.seedIfEmpty();
        FactureFournisseur entity = getById(id);
        if (entity.getJournalEntryId() != null) {
            throw new IllegalStateException("Supplier invoice is already posted to accounting");
        }
        if (!FactureFournisseur.STATUS_VALIDEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only validated supplier invoices can be posted");
        }
        if (entity.getLignes() == null || entity.getLignes().isEmpty()) {
            throw new IllegalStateException("Supplier invoice has no lines");
        }

        AccountingJournal journal = resolveAchatJournal();
        List<JournalEntryLineDto> lines = buildAccountingLines(entity);
        JournalEntryCreateDto entryRequest = new JournalEntryCreateDto();
        entryRequest.setJournalId(journal.getId());
        entryRequest.setJournalCode(journal.getCode());
        entryRequest.setEntryDate(entity.getDateFacture());
        entryRequest.setFiscalYear(entity.getDateFacture().getYear());
        entryRequest.setPeriod(entity.getDateFacture().getMonthValue());
        entryRequest.setReference(entity.getNumeroInterne());
        entryRequest.setLabel(buildEntryLabel(entity));
        entryRequest.setOrigin("AUTO_FACTURE_FOURN");
        entryRequest.setOriginId(entity.getId().toString());
        entryRequest.setLines(lines);

        var entry = journalEntryService.create(entryRequest);
        var posted = journalEntryService.post(entry.getId());

        entity.setStatus(FactureFournisseur.STATUS_COMPTABILISEE);
        entity.setJournalEntryId(posted.getId());
        entity.setUpdatedAt(OffsetDateTime.now());
        FactureFournisseur saved = repository.save(entity);
        attachLigneFactureIds(saved);
        return saved;
    }

    @Transactional
    public FactureFournisseur litige(UUID id, String motif) {
        FactureFournisseur entity = getById(id);
        String status = entity.getStatus();
        if (!FactureFournisseur.STATUS_VALIDEE.equals(status)
                && !FactureFournisseur.STATUS_COMPTABILISEE.equals(status)
                && !FactureFournisseur.STATUS_PARTIELLEMENT_PAYEE.equals(status)) {
            throw new IllegalStateException("Supplier invoice cannot be marked as disputed in current status");
        }
        entity.setStatus(FactureFournisseur.STATUS_EN_LITIGE);
        entity.setMotifLitige(motif.trim());
        entity.setUpdatedAt(OffsetDateTime.now());
        FactureFournisseur saved = repository.save(entity);
        attachLigneFactureIds(saved);
        return saved;
    }

    @Transactional
    public FactureFournisseur cancel(UUID id) {
        FactureFournisseur entity = getById(id);
        String status = entity.getStatus();
        if (!FactureFournisseur.STATUS_VALIDEE.equals(status)
                && !FactureFournisseur.STATUS_COMPTABILISEE.equals(status)
                && !FactureFournisseur.STATUS_PARTIELLEMENT_PAYEE.equals(status)) {
            throw new IllegalStateException("Supplier invoice cannot be cancelled in current status");
        }
        entity.setStatus(FactureFournisseur.STATUS_ANNULEE);
        entity.setUpdatedAt(OffsetDateTime.now());
        FactureFournisseur saved = repository.save(entity);
        attachLigneFactureIds(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public MatchingReceptionDto computeMatchingForBc(UUID bcId, MatchingToleranceDto tolerance) {
        BonCommandeAchat bc = bonCommandeService.getById(bcId);
        FactureFournisseur facture = findPreferredForBc(bcId);
        List<ReceptionAchat> receptions = receptionService.listByBonCommande(bcId);
        return matchingService.compute(bc, receptions, facture, tolerance);
    }

    private FactureFournisseur findPreferredForBc(UUID bcId) {
        List<FactureFournisseur> hits = repository.findByTenantIdAndBcIdOrderByCreatedAtDesc(tenantId(), bcId);
        if (hits.isEmpty()) {
            return null;
        }
        return hits.stream()
                .filter(f -> FactureFournisseur.STATUS_BROUILLON.equals(f.getStatus()))
                .findFirst()
                .orElse(hits.get(0));
    }

    private MatchingReceptionDto computeMatching(FactureFournisseur facture) {
        return computeMatching(facture, null);
    }

    private MatchingReceptionDto computeMatching(FactureFournisseur facture, MatchingToleranceDto tolerance) {
        if (facture.getBcId() == null) {
            throw new IllegalStateException("Supplier invoice is not linked to a purchase order");
        }
        BonCommandeAchat bc = bonCommandeService.getById(facture.getBcId());
        List<ReceptionAchat> receptions = receptionService.listByBonCommande(bc.getId());
        return matchingService.compute(bc, receptions, facture, tolerance);
    }

    private void applyLignes(
            FactureFournisseur entity, List<FactureFournisseurLigneInputDto> inputs, UUID tenantId) {
        int ordre = 1;
        for (FactureFournisseurLigneInputDto input : inputs) {
            FactureFournisseurLigne ligne = FactureFournisseurLigne.builder()
                    .tenantId(tenantId)
                    .facture(entity)
                    .ordre(input.getOrdre() != null ? input.getOrdre() : ordre++)
                    .designation(input.getDesignation().trim())
                    .bcLigneId(input.getBcLigneId())
                    .compteCode(input.getCompteCode().trim())
                    .axeAnalytique(trimOrNull(input.getAxeAnalytique()))
                    .axeAnalytiqueLibelle(trimOrNull(input.getAxeAnalytiqueLibelle()))
                    .quantite(input.getQuantite())
                    .prixUnitaireHt(input.getPrixUnitaireHt())
                    .totalHt(input.getTotalHt())
                    .tvaTaux(input.getTvaTaux() != null ? input.getTvaTaux() : new BigDecimal("20"))
                    .build();
            entity.getLignes().add(ligne);
        }
    }

    private void recomputeTotals(FactureFournisseur entity) {
        BigDecimal totalHt = entity.getLignes().stream()
                .map(l -> l.getTotalHt() != null ? l.getTotalHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTva = entity.getLignes().stream()
                .map(l -> {
                    BigDecimal ht = l.getTotalHt() != null ? l.getTotalHt() : BigDecimal.ZERO;
                    BigDecimal rate = l.getTvaTaux() != null ? l.getTvaTaux() : BigDecimal.ZERO;
                    return ht.multiply(rate.divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal totalTtc = totalHt.add(totalTva).setScale(4, RoundingMode.HALF_UP);
        entity.setTotalHt(totalHt);
        entity.setTotalTva(totalTva);
        entity.setTotalTtc(totalTtc);
        entity.setNetAPayerTtc(totalTtc);
        entity.setResteARegler(totalTtc.subtract(
                entity.getCumulRegleTtc() != null ? entity.getCumulRegleTtc() : BigDecimal.ZERO));
    }

    private String nextNumero(UUID tenantId) {
        long count = repository.countByTenantId(tenantId) + 1;
        return "FF-" + Year.now().getValue() + "-" + String.format("%05d", count);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case FactureFournisseur.STATUS_BROUILLON,
                    FactureFournisseur.STATUS_VALIDEE,
                    FactureFournisseur.STATUS_COMPTABILISEE,
                    FactureFournisseur.STATUS_PARTIELLEMENT_PAYEE,
                    FactureFournisseur.STATUS_PAYEE,
                    FactureFournisseur.STATUS_EN_LITIGE,
                    FactureFournisseur.STATUS_AVOIRISEE,
                    FactureFournisseur.STATUS_ANNULEE -> normalized;
            default -> fallback;
        };
    }

    private void attachLigneFactureIds(FactureFournisseur entity) {
        if (entity.getLignes() == null) {
            return;
        }
        for (FactureFournisseurLigne ligne : entity.getLignes()) {
            ligne.setFacture(entity);
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

    private List<JournalEntryLineDto> buildAccountingLines(FactureFournisseur entity) {
        List<JournalEntryLineDto> lines = new ArrayList<>();
        String partnerLabel =
                entity.getFournisseurName() != null ? entity.getFournisseurName() : entity.getFournisseurId();

        for (FactureFournisseurLigne ligne : entity.getLignes()) {
            BigDecimal ht = ligne.getTotalHt() != null ? ligne.getTotalHt() : BigDecimal.ZERO;
            if (ht.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }
            JournalEntryLineDto chargeLine =
                    line(ligne.getCompteCode(), ht, BigDecimal.ZERO, ligne.getDesignation());
            chargeLine.setAnalyticalAxis(ligne.getAxeAnalytique());
            lines.add(chargeLine);
        }

        BigDecimal totalTva = entity.getTotalTva() != null ? entity.getTotalTva() : BigDecimal.ZERO;
        if (totalTva.compareTo(BigDecimal.ZERO) > 0) {
            lines.add(line(ACCOUNT_TVA, totalTva, BigDecimal.ZERO, "TVA sur " + entity.getNumeroInterne()));
        }

        BigDecimal totalTtc = entity.getTotalTtc() != null ? entity.getTotalTtc() : BigDecimal.ZERO;
        JournalEntryLineDto supplierLine = line(
                ACCOUNT_SUPPLIER,
                BigDecimal.ZERO,
                totalTtc,
                "Facture " + entity.getNumeroInterne() + " " + partnerLabel,
                partnerLabel);
        supplierLine.setDueDate(entity.getDateEcheance());
        lines.add(supplierLine);
        return lines;
    }

    private AccountingJournal resolveAchatJournal() {
        return journalRepository.findByTenantIdOrderByCodeAsc(tenantId()).stream()
                .filter(j -> "ACHAT".equals(j.getJournalType()) && Boolean.TRUE.equals(j.getIsActive()))
                .findFirst()
                .orElseGet(() -> journalRepository
                        .findByTenantIdAndCode(tenantId(), "AC")
                        .orElseThrow(() -> new IllegalStateException("No purchase journal configured")));
    }

    private static String buildEntryLabel(FactureFournisseur entity) {
        String partner = entity.getFournisseurName() != null ? entity.getFournisseurName() : entity.getFournisseurId();
        return "Facture " + entity.getNumeroInterne() + " " + partner;
    }

    private static JournalEntryLineDto line(
            String accountCode, BigDecimal debit, BigDecimal credit, String label) {
        return line(accountCode, debit, credit, label, null);
    }

    private static JournalEntryLineDto line(
            String accountCode, BigDecimal debit, BigDecimal credit, String label, String thirdParty) {
        JournalEntryLineDto dto = new JournalEntryLineDto();
        dto.setAccountCode(accountCode);
        dto.setDebit(debit);
        dto.setCredit(credit);
        dto.setLabel(label);
        dto.setThirdPartyName(thirdParty);
        return dto;
    }
}
