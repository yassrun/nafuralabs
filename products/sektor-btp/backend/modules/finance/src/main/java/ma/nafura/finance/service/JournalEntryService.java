package ma.nafura.finance.service;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.JournalEntryDetailDto;
import ma.nafura.finance.api.dto.JournalEntryLineDetailDto;
import ma.nafura.finance.api.request.JournalEntryCreateDto;
import ma.nafura.finance.api.request.JournalEntryLineDto;
import ma.nafura.finance.api.request.JournalEntryUpdateDto;
import ma.nafura.finance.domain.model.JournalEntry;
import ma.nafura.finance.domain.model.JournalEntryLine;
import ma.nafura.finance.repository.ChartOfAccountRepository;
import ma.nafura.finance.repository.JournalEntryLineRepository;
import ma.nafura.finance.repository.JournalEntryRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class JournalEntryService {

    private final JournalEntryRepository entryRepository;
    private final JournalEntryLineRepository lineRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;

    public JournalEntryService(
            JournalEntryRepository entryRepository,
            JournalEntryLineRepository lineRepository,
            ChartOfAccountRepository chartOfAccountRepository) {
        this.entryRepository = entryRepository;
        this.lineRepository = lineRepository;
        this.chartOfAccountRepository = chartOfAccountRepository;
    }

    @Transactional(readOnly = true)
    public List<JournalEntryDetailDto> list(
            String journalCode, LocalDate from, LocalDate to, String status, String search) {
        UUID tenantId = tenantId();
        Specification<JournalEntry> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));
            if (StringUtils.hasText(journalCode)) {
                predicates.add(cb.equal(root.get("journalCode"), journalCode.trim()));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("entryDate"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("entryDate"), to));
            }
            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), mapStatusFromUi(status.trim())));
            }
            if (StringUtils.hasText(search)) {
                String term = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("entryNumber")), term),
                        cb.like(cb.lower(root.get("label")), term),
                        cb.like(cb.lower(root.get("reference")), term)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return entryRepository.findAll(spec).stream()
                .sorted((a, b) -> b.getEntryDate().compareTo(a.getEntryDate()))
                .map(this::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public JournalEntryDetailDto getById(UUID id) {
        JournalEntry entry = getEntry(id);
        return toDetailDto(entry, loadLines(entry.getId()));
    }

    @Transactional
    public JournalEntryDetailDto create(JournalEntryCreateDto request) {
        JournalEntryEquilibre.assertBalanced(request.getLines());
        UUID tenantId = tenantId();
        int fiscalYear = request.getFiscalYear() != null
                ? request.getFiscalYear()
                : request.getEntryDate().getYear();
        int period = request.getPeriod() != null
                ? request.getPeriod()
                : request.getEntryDate().getMonthValue();
        String status = mapStatusFromUi(
                request.getStatus() != null ? request.getStatus() : JournalEntry.STATUS_BROUILLON);

        JournalEntry entry = JournalEntry.builder()
                .tenantId(tenantId)
                .entryNumber(nextEntryNumber(fiscalYear))
                .journalId(request.getJournalId())
                .journalCode(request.getJournalCode().trim())
                .entryDate(request.getEntryDate())
                .fiscalYear(fiscalYear)
                .period(period)
                .reference(request.getReference())
                .label(request.getLabel().trim())
                .status(status)
                .origin(request.getOrigin())
                .originId(request.getOriginId())
                .totalDebit(JournalEntryEquilibre.sumDebit(request.getLines()))
                .totalCredit(JournalEntryEquilibre.sumCredit(request.getLines()))
                .notes(request.getNotes())
                .build();
        if (JournalEntry.STATUS_POSTE.equals(status)) {
            entry.setValidatedAt(OffsetDateTime.now());
        }
        entry = entryRepository.save(entry);
        List<JournalEntryLine> lines = saveLines(tenantId, entry.getId(), request.getLines());
        return toDetailDto(entry, lines);
    }

    @Transactional
    public JournalEntryDetailDto update(UUID id, JournalEntryUpdateDto request) {
        JournalEntry entry = getEntry(id);
        if (JournalEntry.STATUS_POSTE.equals(entry.getStatus())) {
            throw new IllegalArgumentException("Posted journal entry cannot be modified");
        }
        if (request.getJournalId() != null) {
            entry.setJournalId(request.getJournalId());
        }
        if (StringUtils.hasText(request.getJournalCode())) {
            entry.setJournalCode(request.getJournalCode().trim());
        }
        if (request.getEntryDate() != null) {
            entry.setEntryDate(request.getEntryDate());
        }
        if (request.getFiscalYear() != null) {
            entry.setFiscalYear(request.getFiscalYear());
        }
        if (request.getPeriod() != null) {
            entry.setPeriod(request.getPeriod());
        }
        if (request.getReference() != null) {
            entry.setReference(request.getReference());
        }
        if (StringUtils.hasText(request.getLabel())) {
            entry.setLabel(request.getLabel().trim());
        }
        if (request.getNotes() != null) {
            entry.setNotes(request.getNotes());
        }
        List<JournalEntryLine> lines = loadLines(entry.getId());
        if (request.getLines() != null) {
            JournalEntryEquilibre.assertBalanced(request.getLines());
            lineRepository.deleteByTenantIdAndJournalEntryId(tenantId(), entry.getId());
            lines = saveLines(tenantId(), entry.getId(), request.getLines());
            entry.setTotalDebit(JournalEntryEquilibre.sumDebit(request.getLines()));
            entry.setTotalCredit(JournalEntryEquilibre.sumCredit(request.getLines()));
        }
        entry = entryRepository.save(entry);
        return toDetailDto(entry, lines);
    }

    @Transactional
    public void delete(UUID id) {
        JournalEntry entry = getEntry(id);
        if (!JournalEntry.STATUS_BROUILLON.equals(entry.getStatus())) {
            throw new IllegalArgumentException("Only draft journal entries can be deleted");
        }
        lineRepository.deleteByTenantIdAndJournalEntryId(tenantId(), entry.getId());
        entryRepository.delete(entry);
    }

    @Transactional
    public JournalEntryDetailDto post(UUID id) {
        JournalEntry entry = getEntry(id);
        if (JournalEntry.STATUS_POSTE.equals(entry.getStatus())) {
            throw new IllegalArgumentException("Journal entry is already posted");
        }
        List<JournalEntryLine> lines = loadLines(entry.getId());
        List<JournalEntryLineDto> lineDtos = lines.stream().map(this::toLineDto).toList();
        JournalEntryEquilibre.assertBalanced(lineDtos);
        entry.setStatus(JournalEntry.STATUS_POSTE);
        entry.setValidatedAt(OffsetDateTime.now());
        entry = entryRepository.save(entry);
        return toDetailDto(entry, lines);
    }

    private List<JournalEntryLine> saveLines(UUID tenantId, UUID entryId, List<JournalEntryLineDto> lines) {
        List<JournalEntryLine> saved = new ArrayList<>();
        int index = 0;
        for (JournalEntryLineDto lineDto : lines) {
            index++;
            String accountCode = lineDto.getAccountCode().trim();
            String accountLabel = lineDto.getAccountLabel();
            if (!StringUtils.hasText(accountLabel)) {
                accountLabel = chartOfAccountRepository
                        .findByTenantIdAndCode(tenantId, accountCode)
                        .map(a -> a.getName())
                        .orElse(null);
            }
            saved.add(lineRepository.save(JournalEntryLine.builder()
                    .tenantId(tenantId)
                    .journalEntryId(entryId)
                    .lineNumber(lineDto.getLineNumber() != null ? lineDto.getLineNumber() : index)
                    .accountCode(accountCode)
                    .accountLabel(accountLabel)
                    .debit(JournalEntryEquilibre.round(lineDto.getDebit()))
                    .credit(JournalEntryEquilibre.round(lineDto.getCredit()))
                    .label(lineDto.getLabel())
                    .analyticalAxis(lineDto.getAnalyticalAxis())
                    .thirdPartyName(lineDto.getThirdPartyName())
                    .dueDate(lineDto.getDueDate())
                    .build()));
        }
        return saved;
    }

    private String nextEntryNumber(int fiscalYear) {
        List<JournalEntry> sameYear =
                entryRepository.findByTenantIdAndFiscalYearOrderByEntryNumberDesc(tenantId(), fiscalYear);
        int seq = sameYear.size() + 1;
        return "EC-" + fiscalYear + "-" + String.format("%05d", seq);
    }

    private JournalEntry getEntry(UUID id) {
        return entryRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Journal entry not found"));
    }

    private List<JournalEntryLine> loadLines(UUID entryId) {
        return lineRepository.findByTenantIdAndJournalEntryIdOrderByLineNumberAsc(tenantId(), entryId);
    }

    private JournalEntryDetailDto toSummaryDto(JournalEntry entry) {
        return JournalEntryDetailDto.builder()
                .id(entry.getId())
                .entryNumber(entry.getEntryNumber())
                .journalId(entry.getJournalId())
                .journalCode(entry.getJournalCode())
                .entryDate(entry.getEntryDate())
                .fiscalYear(entry.getFiscalYear())
                .period(entry.getPeriod())
                .reference(entry.getReference())
                .label(entry.getLabel())
                .status(mapStatusToUi(entry.getStatus()))
                .origin(entry.getOrigin())
                .originId(entry.getOriginId())
                .totalDebit(entry.getTotalDebit())
                .totalCredit(entry.getTotalCredit())
                .validatedAt(entry.getValidatedAt())
                .notes(entry.getNotes())
                .build();
    }

    private JournalEntryDetailDto toDetailDto(JournalEntry entry, List<JournalEntryLine> lines) {
        JournalEntryDetailDto dto = toSummaryDto(entry);
        dto.setLines(lines.stream().map(this::toLineDetail).toList());
        return dto;
    }

    private JournalEntryLineDetailDto toLineDetail(JournalEntryLine line) {
        return JournalEntryLineDetailDto.builder()
                .id(line.getId())
                .lineNumber(line.getLineNumber())
                .accountCode(line.getAccountCode())
                .accountLabel(line.getAccountLabel())
                .debit(line.getDebit())
                .credit(line.getCredit())
                .label(line.getLabel())
                .analyticalAxis(line.getAnalyticalAxis())
                .thirdPartyName(line.getThirdPartyName())
                .dueDate(line.getDueDate())
                .build();
    }

    private JournalEntryLineDto toLineDto(JournalEntryLine line) {
        JournalEntryLineDto dto = new JournalEntryLineDto();
        dto.setLineNumber(line.getLineNumber());
        dto.setAccountCode(line.getAccountCode());
        dto.setAccountLabel(line.getAccountLabel());
        dto.setDebit(line.getDebit());
        dto.setCredit(line.getCredit());
        dto.setLabel(line.getLabel());
        dto.setAnalyticalAxis(line.getAnalyticalAxis());
        dto.setThirdPartyName(line.getThirdPartyName());
        dto.setDueDate(line.getDueDate());
        return dto;
    }

    static String mapStatusFromUi(String status) {
        if ("VALIDEE".equalsIgnoreCase(status) || "CLOTUREE".equalsIgnoreCase(status)) {
            return JournalEntry.STATUS_POSTE;
        }
        return JournalEntry.STATUS_BROUILLON;
    }

    static String mapStatusToUi(String status) {
        if (JournalEntry.STATUS_POSTE.equals(status)) {
            return "VALIDEE";
        }
        return JournalEntry.STATUS_BROUILLON;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
