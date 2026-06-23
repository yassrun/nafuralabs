package ma.nafura.finance.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.request.ChartOfAccountCreateDto;
import ma.nafura.finance.api.request.ChartOfAccountUpdateDto;
import ma.nafura.finance.domain.model.ChartOfAccount;
import ma.nafura.finance.repository.AccountingJournalRepository;
import ma.nafura.finance.repository.ChartOfAccountRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ChartOfAccountService {

    private final ChartOfAccountRepository repository;
    private final AccountingJournalRepository journalRepository;
    private final ComptabiliteSeedService seedService;

    public ChartOfAccountService(
            ChartOfAccountRepository repository,
            AccountingJournalRepository journalRepository,
            ComptabiliteSeedService seedService) {
        this.repository = repository;
        this.journalRepository = journalRepository;
        this.seedService = seedService;
    }

    @Transactional
    public List<ChartOfAccount> list() {
        UUID tenantId = tenantId();
        if (repository.countByTenantId(tenantId) == 0) {
            seedService.seedFromClasspath();
        }
        return repository.findByTenantIdOrderByCodeAsc(tenantId);
    }

    @Transactional(readOnly = true)
    public ChartOfAccount getById(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Chart of account not found"));
    }

    @Transactional
    public ChartOfAccount create(ChartOfAccountCreateDto request) {
        UUID tenantId = tenantId();
        String code = request.getCode().trim();
        if (repository.existsByTenantIdAndCode(tenantId, code)) {
            throw new IllegalArgumentException("Account code already exists");
        }
        ChartOfAccount entity = ChartOfAccount.builder()
                .tenantId(tenantId)
                .code(code)
                .name(request.getName().trim())
                .accountClass(request.getAccountClass())
                .accountType(request.getAccountType().trim())
                .parentAccountCode(request.getParentAccountCode())
                .isCollectif(Boolean.TRUE.equals(request.getIsCollectif()))
                .isLettrable(Boolean.TRUE.equals(request.getIsLettrable()))
                .isAuxiliaire(Boolean.TRUE.equals(request.getIsAuxiliaire()))
                .axeAnalytiqueObligatoire(Boolean.TRUE.equals(request.getAxeAnalytiqueObligatoire()))
                .isActive(request.getIsActive() == null || request.getIsActive())
                .build();
        return repository.save(entity);
    }

    @Transactional
    public ChartOfAccount update(UUID id, ChartOfAccountUpdateDto request) {
        ChartOfAccount entity = getById(id);
        if (StringUtils.hasText(request.getName())) {
            entity.setName(request.getName().trim());
        }
        if (request.getAccountClass() != null) {
            entity.setAccountClass(request.getAccountClass());
        }
        if (StringUtils.hasText(request.getAccountType())) {
            entity.setAccountType(request.getAccountType().trim());
        }
        if (request.getParentAccountCode() != null) {
            entity.setParentAccountCode(request.getParentAccountCode());
        }
        if (request.getIsCollectif() != null) {
            entity.setIsCollectif(request.getIsCollectif());
        }
        if (request.getIsLettrable() != null) {
            entity.setIsLettrable(request.getIsLettrable());
        }
        if (request.getIsAuxiliaire() != null) {
            entity.setIsAuxiliaire(request.getIsAuxiliaire());
        }
        if (request.getAxeAnalytiqueObligatoire() != null) {
            entity.setAxeAnalytiqueObligatoire(request.getAxeAnalytiqueObligatoire());
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

    @Transactional
    public List<ChartOfAccount> resetToSeed() {
        UUID tenantId = tenantId();
        repository.findByTenantIdOrderByCodeAsc(tenantId).forEach(repository::delete);
        journalRepository.findByTenantIdOrderByCodeAsc(tenantId).forEach(journalRepository::delete);
        seedService.seedFromClasspath();
        return repository.findByTenantIdOrderByCodeAsc(tenantId);
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
