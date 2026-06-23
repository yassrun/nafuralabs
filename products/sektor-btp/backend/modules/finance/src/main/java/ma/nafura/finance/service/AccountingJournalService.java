package ma.nafura.finance.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.JournalSummaryDto;
import ma.nafura.finance.api.request.AccountingJournalCreateDto;
import ma.nafura.finance.api.request.AccountingJournalUpdateDto;
import ma.nafura.finance.domain.model.AccountingJournal;
import ma.nafura.finance.domain.model.JournalEntry;
import ma.nafura.finance.repository.AccountingJournalRepository;
import ma.nafura.finance.repository.JournalEntryRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AccountingJournalService {

    private final AccountingJournalRepository repository;
    private final JournalEntryRepository journalEntryRepository;
    private final ComptabiliteSeedService seedService;

    public AccountingJournalService(
            AccountingJournalRepository repository,
            JournalEntryRepository journalEntryRepository,
            ComptabiliteSeedService seedService) {
        this.repository = repository;
        this.journalEntryRepository = journalEntryRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<AccountingJournal> list() {
        seedService.seedIfEmpty();
        return repository.findByTenantIdOrderByCodeAsc(tenantId());
    }

    @Transactional(readOnly = true)
    public AccountingJournal getById(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Journal not found"));
    }

    @Transactional
    public AccountingJournal create(AccountingJournalCreateDto request) {
        UUID tenantId = tenantId();
        String code = request.getCode().trim();
        if (repository.existsByTenantIdAndCode(tenantId, code)) {
            throw new IllegalArgumentException("Journal code already exists");
        }
        return repository.save(AccountingJournal.builder()
                .tenantId(tenantId)
                .code(code)
                .name(request.getName().trim())
                .journalType(request.getJournalType().trim())
                .defaultCounterpartCode(request.getDefaultCounterpartCode())
                .isActive(request.getIsActive() == null || request.getIsActive())
                .build());
    }

    @Transactional
    public AccountingJournal update(UUID id, AccountingJournalUpdateDto request) {
        AccountingJournal entity = getById(id);
        if (StringUtils.hasText(request.getName())) {
            entity.setName(request.getName().trim());
        }
        if (StringUtils.hasText(request.getJournalType())) {
            entity.setJournalType(request.getJournalType().trim());
        }
        if (request.getDefaultCounterpartCode() != null) {
            entity.setDefaultCounterpartCode(request.getDefaultCounterpartCode());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(getById(id));
    }

    @Transactional(readOnly = true)
    public List<JournalSummaryDto> summaries(LocalDate from, LocalDate to) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<AccountingJournal> journals = repository.findByTenantIdOrderByCodeAsc(tenantId);
        List<JournalEntry> entries = journalEntryRepository.findAll().stream()
                .filter(e -> tenantId.equals(e.getTenantId()))
                .filter(e -> !JournalEntry.STATUS_BROUILLON.equals(e.getStatus()))
                .filter(e -> from == null || !e.getEntryDate().isBefore(from))
                .filter(e -> to == null || !e.getEntryDate().isAfter(to))
                .toList();

        List<JournalSummaryDto> result = new ArrayList<>();
        for (AccountingJournal journal : journals) {
            List<JournalEntry> subset =
                    entries.stream().filter(e -> journal.getCode().equals(e.getJournalCode())).toList();
            BigDecimal totalDebit = subset.stream()
                    .map(JournalEntry::getTotalDebit)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalCredit = subset.stream()
                    .map(JournalEntry::getTotalCredit)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            result.add(JournalSummaryDto.builder()
                    .journalCode(journal.getCode())
                    .journalName(journal.getName())
                    .journalType(journal.getJournalType())
                    .totalDebit(totalDebit)
                    .totalCredit(totalCredit)
                    .balance(totalDebit.subtract(totalCredit))
                    .entryCount(subset.size())
                    .build());
        }
        return result;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
