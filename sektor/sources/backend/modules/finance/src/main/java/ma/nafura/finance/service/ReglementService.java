package ma.nafura.finance.service;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.ReglementDetailDto;
import ma.nafura.finance.api.dto.ReglementImputationDetailDto;
import ma.nafura.finance.api.request.JournalEntryCreateDto;
import ma.nafura.finance.api.request.JournalEntryLineDto;
import ma.nafura.finance.api.request.ReglementCreateDto;
import ma.nafura.finance.api.request.ReglementImputationDto;
import ma.nafura.finance.api.request.ReglementUpdateDto;
import ma.nafura.finance.domain.model.AccountingJournal;
import ma.nafura.finance.domain.model.Reglement;
import ma.nafura.finance.domain.model.ReglementImputation;
import ma.nafura.finance.repository.AccountingJournalRepository;
import ma.nafura.finance.repository.ReglementImputationRepository;
import ma.nafura.finance.repository.ReglementRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ReglementService {

    private static final String ACCOUNT_BANK = "5141";
    private static final String ACCOUNT_CLIENT = "3421";
    private static final String ACCOUNT_SUPPLIER = "4411";

    private final ReglementRepository reglementRepository;
    private final ReglementImputationRepository imputationRepository;
    private final AccountingJournalRepository journalRepository;
    private final JournalEntryService journalEntryService;
    private final ComptabiliteSeedService seedService;

    public ReglementService(
            ReglementRepository reglementRepository,
            ReglementImputationRepository imputationRepository,
            AccountingJournalRepository journalRepository,
            JournalEntryService journalEntryService,
            ComptabiliteSeedService seedService) {
        this.reglementRepository = reglementRepository;
        this.imputationRepository = imputationRepository;
        this.journalRepository = journalRepository;
        this.journalEntryService = journalEntryService;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<ReglementDetailDto> list(String type, String partnerId, String status) {
        UUID tenantId = tenantId();
        Specification<Reglement> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));
            if (StringUtils.hasText(type)) {
                predicates.add(cb.equal(root.get("reglementType"), mapTypeFromUi(type.trim())));
            }
            if (StringUtils.hasText(partnerId)) {
                predicates.add(cb.equal(root.get("partnerId"), partnerId.trim()));
            }
            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), status.trim()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return reglementRepository.findAll(spec).stream()
                .sorted((a, b) -> b.getReglementDate().compareTo(a.getReglementDate()))
                .map(this::toDetailDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReglementDetailDto getById(UUID id) {
        return toDetailDto(getReglement(id), loadImputations(id));
    }

    @Transactional
    public ReglementDetailDto create(ReglementCreateDto request) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        validateImputations(request.getReglementType(), request.getImputations());

        Reglement entity = Reglement.builder()
                .tenantId(tenantId)
                .numero(nextNumero(request.getReglementDate()))
                .reglementType(mapTypeFromUi(request.getReglementType()))
                .reglementDate(request.getReglementDate())
                .paymentModeCode(request.getPaymentModeCode().trim())
                .reference(request.getReference())
                .issuingBank(request.getIssuingBank())
                .partnerId(request.getPartnerId().trim())
                .partnerName(request.getPartnerName())
                .financialAccountId(request.getFinancialAccountId().trim())
                .financialAccountLabel(request.getFinancialAccountLabel())
                .totalAmount(request.getTotalAmount())
                .status(resolveStatus(request.getStatus()))
                .notes(request.getNotes())
                .build();
        entity = reglementRepository.save(entity);
        List<ReglementImputation> imputations = saveImputations(tenantId, entity.getId(), request.getImputations());
        return toDetailDto(entity, imputations);
    }

    @Transactional
    public ReglementDetailDto update(UUID id, ReglementUpdateDto request) {
        Reglement entity = getReglement(id);
        assertEditable(entity);
        if (request.getReglementDate() != null) {
            entity.setReglementDate(request.getReglementDate());
        }
        if (StringUtils.hasText(request.getPaymentModeCode())) {
            entity.setPaymentModeCode(request.getPaymentModeCode().trim());
        }
        if (request.getReference() != null) {
            entity.setReference(request.getReference());
        }
        if (request.getIssuingBank() != null) {
            entity.setIssuingBank(request.getIssuingBank());
        }
        if (request.getPartnerName() != null) {
            entity.setPartnerName(request.getPartnerName());
        }
        if (StringUtils.hasText(request.getFinancialAccountId())) {
            entity.setFinancialAccountId(request.getFinancialAccountId().trim());
        }
        if (request.getFinancialAccountLabel() != null) {
            entity.setFinancialAccountLabel(request.getFinancialAccountLabel());
        }
        if (request.getTotalAmount() != null) {
            entity.setTotalAmount(request.getTotalAmount());
        }
        if (request.getNotes() != null) {
            entity.setNotes(request.getNotes());
        }
        List<ReglementImputation> imputations = loadImputations(id);
        if (request.getImputations() != null) {
            validateImputations(entity.getReglementType(), request.getImputations());
            imputationRepository.deleteByTenantIdAndReglementId(tenantId(), id);
            imputations = saveImputations(tenantId(), id, request.getImputations());
        }
        entity = reglementRepository.save(entity);
        return toDetailDto(entity, imputations);
    }

    @Transactional
    public void delete(UUID id) {
        Reglement entity = getReglement(id);
        if (entity.getJournalEntryId() != null) {
            throw new IllegalArgumentException("Posted reglement cannot be deleted");
        }
        if (!Reglement.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalArgumentException("Only draft reglements can be deleted");
        }
        imputationRepository.deleteByTenantIdAndReglementId(tenantId(), id);
        reglementRepository.delete(entity);
    }

    @Transactional
    public ReglementDetailDto annuler(UUID id) {
        Reglement entity = getReglement(id);
        if (entity.getJournalEntryId() != null) {
            throw new IllegalArgumentException("Posted reglement cannot be cancelled");
        }
        entity.setStatus(Reglement.STATUS_ANNULE);
        entity = reglementRepository.save(entity);
        return toDetailDto(entity, loadImputations(id));
    }

    @Transactional
    public ReglementDetailDto comptabiliser(UUID id) {
        seedService.seedIfEmpty();
        Reglement entity = getReglement(id);
        if (entity.getJournalEntryId() != null) {
            throw new IllegalArgumentException("Reglement is already posted to accounting");
        }
        if (Reglement.STATUS_ANNULE.equals(entity.getStatus())) {
            throw new IllegalArgumentException("Cancelled reglement cannot be posted");
        }

        AccountingJournal journal = resolveBankJournal();
        List<JournalEntryLineDto> lines = buildAccountingLines(entity);
        JournalEntryCreateDto entryRequest = new JournalEntryCreateDto();
        entryRequest.setJournalId(journal.getId());
        entryRequest.setJournalCode(journal.getCode());
        entryRequest.setEntryDate(entity.getReglementDate());
        entryRequest.setFiscalYear(entity.getReglementDate().getYear());
        entryRequest.setPeriod(entity.getReglementDate().getMonthValue());
        entryRequest.setReference(entity.getNumero());
        entryRequest.setLabel(buildEntryLabel(entity));
        entryRequest.setOrigin("AUTO_REGLEMENT");
        entryRequest.setOriginId(entity.getId().toString());
        entryRequest.setLines(lines);

        var entry = journalEntryService.create(entryRequest);
        var posted = journalEntryService.post(entry.getId());

        entity.setStatus(Reglement.STATUS_VALIDE);
        entity.setJournalEntryId(posted.getId());
        entity = reglementRepository.save(entity);
        return toDetailDto(entity, loadImputations(id));
    }

    private List<JournalEntryLineDto> buildAccountingLines(Reglement entity) {
        BigDecimal amount = entity.getTotalAmount();
        String partnerLabel = entity.getPartnerName() != null ? entity.getPartnerName() : entity.getPartnerId();
        List<JournalEntryLineDto> lines = new ArrayList<>();

        if (Reglement.TYPE_ENCAISSEMENT_CLIENT.equals(entity.getReglementType())) {
            lines.add(line(ACCOUNT_BANK, amount, BigDecimal.ZERO, "Encaissement " + partnerLabel));
            lines.add(line(ACCOUNT_CLIENT, BigDecimal.ZERO, amount, "Encaissement " + partnerLabel, partnerLabel));
        } else if (Reglement.TYPE_PAIEMENT_FOURNISSEUR.equals(entity.getReglementType())) {
            lines.add(line(ACCOUNT_SUPPLIER, amount, BigDecimal.ZERO, "Paiement " + partnerLabel, partnerLabel));
            lines.add(line(ACCOUNT_BANK, BigDecimal.ZERO, amount, "Paiement " + partnerLabel));
        } else {
            lines.add(line("4441", amount, BigDecimal.ZERO, "Paie " + partnerLabel));
            lines.add(line(ACCOUNT_BANK, BigDecimal.ZERO, amount, "Paie " + partnerLabel));
        }
        return lines;
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

    private AccountingJournal resolveBankJournal() {
        return journalRepository.findByTenantIdOrderByCodeAsc(tenantId()).stream()
                .filter(j -> "BANQUE".equals(j.getJournalType()) && Boolean.TRUE.equals(j.getIsActive()))
                .findFirst()
                .orElseGet(() -> journalRepository
                        .findByTenantIdAndCode(tenantId(), "OD")
                        .orElseThrow(() -> new IllegalStateException("No bank journal configured")));
    }

    private static String buildEntryLabel(Reglement entity) {
        return switch (entity.getReglementType()) {
            case Reglement.TYPE_ENCAISSEMENT_CLIENT -> "Encaissement client " + entity.getNumero();
            case Reglement.TYPE_PAIEMENT_FOURNISSEUR -> "Paiement fournisseur " + entity.getNumero();
            default -> "Règlement " + entity.getNumero();
        };
    }

    private List<ReglementImputation> saveImputations(
            UUID tenantId, UUID reglementId, List<ReglementImputationDto> imputations) {
        if (imputations == null || imputations.isEmpty()) {
            return List.of();
        }
        List<ReglementImputation> saved = new ArrayList<>();
        for (ReglementImputationDto dto : imputations) {
            saved.add(imputationRepository.save(ReglementImputation.builder()
                    .tenantId(tenantId)
                    .reglementId(reglementId)
                    .factureId(dto.getFactureId().trim())
                    .factureNumero(dto.getFactureNumero())
                    .factureDate(dto.getFactureDate())
                    .factureDueDate(dto.getFactureDueDate())
                    .factureRemaining(dto.getFactureRemaining())
                    .allocatedAmount(dto.getAllocatedAmount())
                    .build()));
        }
        return saved;
    }

    private void validateImputations(String reglementType, List<ReglementImputationDto> imputations) {
        String type = mapTypeFromUi(reglementType);
        if (Reglement.TYPE_PAIEMENT_EMPLOYE.equals(type)) {
            return;
        }
        if (imputations == null || imputations.isEmpty()) {
            throw new IllegalArgumentException("At least one invoice allocation is required");
        }
        BigDecimal total = imputations.stream()
                .map(ReglementImputationDto::getAllocatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Allocated amount must be positive");
        }
    }

    private String nextNumero(LocalDate date) {
        LocalDate start = LocalDate.of(date.getYear(), 1, 1);
        LocalDate end = LocalDate.of(date.getYear(), 12, 31);
        long count = reglementRepository.countByTenantIdAndReglementDateBetween(tenantId(), start, end);
        return "RG-" + date.getYear() + "-" + String.format("%05d", count + 1);
    }

    private static void assertEditable(Reglement entity) {
        if (entity.getJournalEntryId() != null) {
            throw new IllegalArgumentException("Posted reglement cannot be modified");
        }
        if (!Reglement.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalArgumentException("Only draft reglements can be modified");
        }
    }

    private static String resolveStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return Reglement.STATUS_BROUILLON;
        }
        return status.trim();
    }

    static String mapTypeFromUi(String type) {
        return switch (type) {
            case "CLIENT", "ENCAISSEMENT_CLIENT" -> Reglement.TYPE_ENCAISSEMENT_CLIENT;
            case "FOURNISSEUR", "PAIEMENT_FOURNISSEUR" -> Reglement.TYPE_PAIEMENT_FOURNISSEUR;
            case "EMPLOYE", "PAIEMENT_EMPLOYE" -> Reglement.TYPE_PAIEMENT_EMPLOYE;
            default -> type;
        };
    }

    static String mapTypeToUi(String type) {
        return switch (type) {
            case Reglement.TYPE_ENCAISSEMENT_CLIENT -> "CLIENT";
            case Reglement.TYPE_PAIEMENT_FOURNISSEUR -> "FOURNISSEUR";
            case Reglement.TYPE_PAIEMENT_EMPLOYE -> "EMPLOYE";
            default -> type;
        };
    }

    private Reglement getReglement(UUID id) {
        return reglementRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Reglement not found"));
    }

    private List<ReglementImputation> loadImputations(UUID reglementId) {
        return imputationRepository.findByTenantIdAndReglementIdOrderByFactureDateAsc(tenantId(), reglementId);
    }

    private ReglementDetailDto toDetailDto(Reglement entity) {
        return toDetailDto(entity, loadImputations(entity.getId()));
    }

    private ReglementDetailDto toDetailDto(Reglement entity, List<ReglementImputation> imputations) {
        return ReglementDetailDto.builder()
                .id(entity.getId())
                .numero(entity.getNumero())
                .reglementType(mapTypeToUi(entity.getReglementType()))
                .reglementDate(entity.getReglementDate())
                .paymentModeCode(entity.getPaymentModeCode())
                .reference(entity.getReference())
                .issuingBank(entity.getIssuingBank())
                .partnerId(entity.getPartnerId())
                .partnerName(entity.getPartnerName())
                .financialAccountId(entity.getFinancialAccountId())
                .financialAccountLabel(entity.getFinancialAccountLabel())
                .totalAmount(entity.getTotalAmount())
                .status(entity.getStatus())
                .journalEntryId(entity.getJournalEntryId())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .imputations(imputations.stream().map(this::toImputationDto).toList())
                .build();
    }

    private ReglementImputationDetailDto toImputationDto(ReglementImputation row) {
        return ReglementImputationDetailDto.builder()
                .id(row.getId())
                .factureId(row.getFactureId())
                .factureNumero(row.getFactureNumero())
                .factureDate(row.getFactureDate())
                .factureDueDate(row.getFactureDueDate())
                .factureRemaining(row.getFactureRemaining())
                .allocatedAmount(row.getAllocatedAmount())
                .build();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
