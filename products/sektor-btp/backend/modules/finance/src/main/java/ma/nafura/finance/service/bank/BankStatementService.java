package ma.nafura.finance.service.bank;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ma.nafura.finance.api.dto.BankAccountDto;
import ma.nafura.finance.api.dto.BankStatementDto;
import ma.nafura.finance.api.dto.BankStatementLineDto;
import ma.nafura.finance.api.dto.MovementCandidateDto;
import ma.nafura.finance.api.request.BankStatementLineMatchDto;
import ma.nafura.finance.api.request.BankStatementSaveDto;
import ma.nafura.finance.domain.model.BankAccount;
import ma.nafura.finance.domain.model.BankStatement;
import ma.nafura.finance.domain.model.BankStatementLine;
import ma.nafura.finance.domain.model.JournalEntry;
import ma.nafura.finance.domain.model.JournalEntryLine;
import ma.nafura.finance.repository.BankAccountRepository;
import ma.nafura.finance.repository.BankStatementLineRepository;
import ma.nafura.finance.repository.BankStatementRepository;
import ma.nafura.finance.repository.JournalEntryLineRepository;
import ma.nafura.finance.repository.JournalEntryRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class BankStatementService {

    public static final String MVT_REF_PREFIX = "jel:";

    private final BankAccountRepository bankAccountRepository;
    private final BankStatementRepository bankStatementRepository;
    private final BankStatementLineRepository bankStatementLineRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final JournalEntryLineRepository journalEntryLineRepository;
    private final BankAccountSeedService bankAccountSeedService;
    private final BankStatementImportParser importParser;
    private final BankAutoMatchService autoMatchService;

    public BankStatementService(
            BankAccountRepository bankAccountRepository,
            BankStatementRepository bankStatementRepository,
            BankStatementLineRepository bankStatementLineRepository,
            JournalEntryRepository journalEntryRepository,
            JournalEntryLineRepository journalEntryLineRepository,
            BankAccountSeedService bankAccountSeedService,
            BankStatementImportParser importParser,
            BankAutoMatchService autoMatchService) {
        this.bankAccountRepository = bankAccountRepository;
        this.bankStatementRepository = bankStatementRepository;
        this.bankStatementLineRepository = bankStatementLineRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.journalEntryLineRepository = journalEntryLineRepository;
        this.bankAccountSeedService = bankAccountSeedService;
        this.importParser = importParser;
        this.autoMatchService = autoMatchService;
    }

    @Transactional
    public List<BankAccountDto> listAccounts() {
        bankAccountSeedService.ensureTenantDefaults();
        return bankAccountRepository.findByTenantIdOrderByCodeAsc(tenantId()).stream()
                .map(this::toAccountDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BankStatementDto> listStatements(UUID bankAccountId) {
        bankAccountSeedService.ensureTenantDefaults();
        List<BankStatement> rows = bankAccountId == null
                ? bankStatementRepository.findByTenantIdOrderByPeriodEndDesc(tenantId())
                : bankStatementRepository.findByTenantIdAndBankAccountIdOrderByPeriodEndDesc(
                        tenantId(), bankAccountId);
        Map<UUID, String> names = accountNames();
        return rows.stream().map(s -> toSummaryDto(s, names.get(s.getBankAccountId()))).toList();
    }

    @Transactional(readOnly = true)
    public BankStatementDto getStatement(UUID id) {
        BankStatement statement = requireStatement(id);
        return toDetailDto(statement);
    }

    @Transactional(readOnly = true)
    public List<BankStatementLineDto> listLines(UUID statementId) {
        requireStatement(statementId);
        return bankStatementLineRepository
                .findByTenantIdAndBankStatementIdOrderByLineDateAsc(tenantId(), statementId)
                .stream()
                .map(this::toLineDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MovementCandidateDto> listMovementCandidates(
            UUID bankAccountId, LocalDate from, LocalDate to, UUID excludeStatementId) {
        BankAccount account = requireAccount(bankAccountId);
        String glCode = account.getGlAccountCode();
        if (!StringUtils.hasText(glCode)) {
            glCode = "5141";
        }
        Set<UUID> matchedElsewhere =
                bankStatementLineRepository.findMatchedJournalLineIds(tenantId(), excludeStatementId);
        List<MovementCandidateDto> candidates = new ArrayList<>();
        for (JournalEntry entry : journalEntryRepository.findByTenantIdAndStatusNotOrderByEntryDateDesc(
                tenantId(), JournalEntry.STATUS_BROUILLON)) {
            if (entry.getEntryDate().isBefore(from) || entry.getEntryDate().isAfter(to)) {
                continue;
            }
            List<JournalEntryLine> lines =
                    journalEntryLineRepository.findByTenantIdAndJournalEntryIdOrderByLineNumberAsc(
                            tenantId(), entry.getId());
            for (JournalEntryLine line : lines) {
                if (!line.getAccountCode().startsWith(glCode)) {
                    continue;
                }
                if (line.getDebit().signum() == 0 && line.getCredit().signum() == 0) {
                    continue;
                }
                if (matchedElsewhere.contains(line.getId())) {
                    continue;
                }
                candidates.add(toMovementCandidate(entry, line));
            }
        }
        candidates.sort((a, b) -> a.getDate().compareTo(b.getDate()));
        return candidates;
    }

    @Transactional(readOnly = true)
    public BigDecimal computeAccountingBalance(UUID bankAccountId, LocalDate atDate) {
        BankAccount account = requireAccount(bankAccountId);
        String glCode = StringUtils.hasText(account.getGlAccountCode()) ? account.getGlAccountCode() : "5141";
        BigDecimal balance = account.getOpeningBalance() != null ? account.getOpeningBalance() : BigDecimal.ZERO;
        for (JournalEntry entry : journalEntryRepository.findByTenantIdAndStatusNotOrderByEntryDateDesc(
                tenantId(), JournalEntry.STATUS_BROUILLON)) {
            if (entry.getEntryDate().isAfter(atDate)) {
                continue;
            }
            List<JournalEntryLine> lines =
                    journalEntryLineRepository.findByTenantIdAndJournalEntryIdOrderByLineNumberAsc(
                            tenantId(), entry.getId());
            for (JournalEntryLine line : lines) {
                if (!line.getAccountCode().startsWith(glCode)) {
                    continue;
                }
                balance = balance.add(line.getDebit()).subtract(line.getCredit());
            }
        }
        return round(balance);
    }

    @Transactional
    public BankStatementDto importStatement(
            UUID bankAccountId,
            LocalDate periodStart,
            LocalDate periodEnd,
            MultipartFile file)
            throws java.io.IOException {
        BankAccount account = requireAccount(bankAccountId);
        String content = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
        List<ImportedStatementLine> imported =
                importParser.parse(file.getOriginalFilename(), content);

        LocalDate start = periodStart != null ? periodStart : LocalDate.now().withDayOfMonth(1);
        LocalDate end = periodEnd != null ? periodEnd : LocalDate.now();
        BigDecimal opening = computeAccountingBalance(bankAccountId, start.minusDays(1));

        BankStatement statement = BankStatement.builder()
                .tenantId(tenantId())
                .bankAccountId(account.getId())
                .statementNumber(nextStatementNumber())
                .periodStart(start)
                .periodEnd(end)
                .openingBalanceAccounting(opening)
                .closingBalanceAccounting(computeAccountingBalance(bankAccountId, end))
                .closingBalanceStatement(BigDecimal.ZERO)
                .variance(opening)
                .status(BankStatement.STATUS_EN_COURS)
                .importedFileName(file.getOriginalFilename())
                .build();
        statement = bankStatementRepository.save(statement);

        for (ImportedStatementLine row : imported) {
            bankStatementLineRepository.save(BankStatementLine.builder()
                    .tenantId(tenantId())
                    .bankStatementId(statement.getId())
                    .lineDate(row.lineDate())
                    .label(row.label())
                    .reference(row.reference())
                    .receiptAmount(row.receiptAmount())
                    .paymentAmount(row.paymentAmount())
                    .matchStatus(BankStatementLine.MATCH_UNMATCHED)
                    .build());
        }
        return toDetailDto(statement);
    }

    @Transactional
    public BankStatementDto save(UUID id, BankStatementSaveDto request) {
        BankStatement statement = id == null ? createShell(request) : requireStatement(id);
        applySave(statement, request);
        statement = bankStatementRepository.save(statement);
        if (request.getLines() != null) {
            upsertLines(statement.getId(), request.getLines());
        }
        if (request.getLineMatches() != null) {
            applyLineMatches(statement.getId(), request.getLineMatches());
        }
        return toDetailDto(statement);
    }

    private void upsertLines(UUID statementId, List<BankStatementSaveDto.StatementLineInput> inputs) {
        Set<UUID> keepIds = new java.util.HashSet<>();
        for (BankStatementSaveDto.StatementLineInput input : inputs) {
            BankStatementLine line;
            if (input.getId() != null) {
                line = bankStatementLineRepository
                        .findByIdAndTenantId(input.getId(), tenantId())
                        .filter(l -> statementId.equals(l.getBankStatementId()))
                        .orElseGet(() -> newLine(statementId));
            } else {
                line = newLine(statementId);
            }
            line.setLineDate(input.getLineDate() != null ? input.getLineDate() : LocalDate.now());
            line.setLabel(input.getLabel() != null ? input.getLabel() : "Opération");
            line.setReference(input.getReference());
            line.setReceiptAmount(
                    input.getReceiptAmount() != null ? input.getReceiptAmount() : BigDecimal.ZERO);
            line.setPaymentAmount(
                    input.getPaymentAmount() != null ? input.getPaymentAmount() : BigDecimal.ZERO);
            if (input.getJournalEntryLineId() != null || StringUtils.hasText(input.getMouvementRef())) {
                BankStatementLineMatchDto match = new BankStatementLineMatchDto();
                match.setJournalEntryLineId(input.getJournalEntryLineId());
                match.setMouvementRef(input.getMouvementRef());
                line = bankStatementLineRepository.save(line);
                matchLine(line.getId(), match);
            } else {
                line.setMatchStatus(BankStatementLine.MATCH_UNMATCHED);
                line = bankStatementLineRepository.save(line);
            }
            keepIds.add(line.getId());
        }
        List<BankStatementLine> existing = bankStatementLineRepository.findByTenantIdAndBankStatementIdOrderByLineDateAsc(
                tenantId(), statementId);
        for (BankStatementLine row : existing) {
            if (!keepIds.contains(row.getId())) {
                bankStatementLineRepository.delete(row);
            }
        }
    }

    private BankStatementLine newLine(UUID statementId) {
        return BankStatementLine.builder()
                .tenantId(tenantId())
                .bankStatementId(statementId)
                .receiptAmount(BigDecimal.ZERO)
                .paymentAmount(BigDecimal.ZERO)
                .matchStatus(BankStatementLine.MATCH_UNMATCHED)
                .build();
    }

    @Transactional
    public BankStatementLineDto matchLine(UUID lineId, BankStatementLineMatchDto body) {
        BankStatementLine line = bankStatementLineRepository
                .findByIdAndTenantId(lineId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Statement line not found"));
        UUID journalLineId = body.getJournalEntryLineId();
        if (journalLineId == null && StringUtils.hasText(body.getMouvementRef())) {
            journalLineId = parseMouvementRef(body.getMouvementRef());
        }
        if (journalLineId == null) {
            clearMatch(line);
        } else {
            JournalEntryLine journalLine = journalEntryLineRepository
                    .findById(journalLineId)
                    .filter(l -> tenantId().equals(l.getTenantId()))
                    .orElseThrow(() -> new IllegalArgumentException("Journal line not found"));
            line.setMatchedJournalEntryLineId(journalLine.getId());
            line.setMatchedJournalEntryId(journalLine.getJournalEntryId());
            line.setMatchedMouvementRef(mouvementRef(journalLine.getId()));
            line.setMatchStatus(BankStatementLine.MATCH_MATCHED);
        }
        return toLineDto(bankStatementLineRepository.save(line));
    }

    @Transactional
    public BankStatementDto autoMatchStatement(UUID statementId) {
        BankStatement statement = requireStatement(statementId);
        List<BankStatementLineDto> lines = listLines(statementId);
        List<MovementCandidateDto> candidates = listMovementCandidates(
                statement.getBankAccountId(), statement.getPeriodStart(), statement.getPeriodEnd(), statementId);
        Set<UUID> matched = bankStatementLineRepository.findMatchedJournalLineIds(tenantId(), statementId);
        for (BankAutoMatchService.MatchSuggestion suggestion :
                autoMatchService.suggest(lines, candidates, matched)) {
            BankStatementLine line = bankStatementLineRepository
                    .findByIdAndTenantId(suggestion.lineId(), tenantId())
                    .orElseThrow();
            line.setMatchedJournalEntryLineId(suggestion.journalEntryLineId());
            line.setMatchedMouvementRef(suggestion.mouvementRef());
            journalEntryLineRepository
                    .findById(suggestion.journalEntryLineId())
                    .ifPresent(jl -> line.setMatchedJournalEntryId(jl.getJournalEntryId()));
            line.setMatchStatus(BankStatementLine.MATCH_MATCHED);
            bankStatementLineRepository.save(line);
        }
        return toDetailDto(statement);
    }

    @Transactional
    public BankStatementLineDto autoMatchLine(UUID lineId) {
        BankStatementLine line = bankStatementLineRepository
                .findByIdAndTenantId(lineId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Statement line not found"));
        BankStatement statement = requireStatement(line.getBankStatementId());
        BankStatementLineDto lineDto = toLineDto(line);
        List<MovementCandidateDto> candidates = listMovementCandidates(
                statement.getBankAccountId(), statement.getPeriodStart(), statement.getPeriodEnd(), statement.getId());
        List<BankAutoMatchService.MatchSuggestion> suggestions =
                autoMatchService.suggest(List.of(lineDto), candidates, Set.of());
        if (suggestions.isEmpty()) {
            return lineDto;
        }
        BankAutoMatchService.MatchSuggestion match = suggestions.get(0);
        line.setMatchedJournalEntryLineId(match.journalEntryLineId());
        line.setMatchedMouvementRef(match.mouvementRef());
        journalEntryLineRepository
                .findById(match.journalEntryLineId())
                .ifPresent(jl -> line.setMatchedJournalEntryId(jl.getJournalEntryId()));
        line.setMatchStatus(BankStatementLine.MATCH_MATCHED);
        return toLineDto(bankStatementLineRepository.save(line));
    }

    @Transactional
    public void deleteStatement(UUID id) {
        BankStatement statement = requireStatement(id);
        bankStatementLineRepository.deleteByTenantIdAndBankStatementId(tenantId(), statement.getId());
        bankStatementRepository.delete(statement);
    }

    private BankStatement createShell(BankStatementSaveDto request) {
        requireAccount(request.getBankAccountId());
        return BankStatement.builder()
                .tenantId(tenantId())
                .bankAccountId(request.getBankAccountId())
                .statementNumber(nextStatementNumber())
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .openingBalanceAccounting(
                        request.getOpeningBalanceAccounting() != null
                                ? request.getOpeningBalanceAccounting()
                                : BigDecimal.ZERO)
                .closingBalanceAccounting(
                        request.getClosingBalanceAccounting() != null
                                ? request.getClosingBalanceAccounting()
                                : BigDecimal.ZERO)
                .closingBalanceStatement(
                        request.getClosingBalanceStatement() != null
                                ? request.getClosingBalanceStatement()
                                : BigDecimal.ZERO)
                .variance(request.getVariance() != null ? request.getVariance() : BigDecimal.ZERO)
                .status(
                        request.getStatus() != null ? request.getStatus() : BankStatement.STATUS_EN_COURS)
                .notes(request.getNotes())
                .build();
    }

    private void applySave(BankStatement statement, BankStatementSaveDto request) {
        if (request.getBankAccountId() != null) {
            statement.setBankAccountId(request.getBankAccountId());
        }
        if (request.getPeriodStart() != null) {
            statement.setPeriodStart(request.getPeriodStart());
        }
        if (request.getPeriodEnd() != null) {
            statement.setPeriodEnd(request.getPeriodEnd());
        }
        if (request.getOpeningBalanceAccounting() != null) {
            statement.setOpeningBalanceAccounting(request.getOpeningBalanceAccounting());
        }
        if (request.getClosingBalanceAccounting() != null) {
            statement.setClosingBalanceAccounting(request.getClosingBalanceAccounting());
        }
        if (request.getClosingBalanceStatement() != null) {
            statement.setClosingBalanceStatement(request.getClosingBalanceStatement());
        }
        if (request.getVariance() != null) {
            statement.setVariance(request.getVariance());
        }
        if (request.getStatus() != null) {
            statement.setStatus(request.getStatus());
        }
        if (request.getNotes() != null) {
            statement.setNotes(request.getNotes());
        }
    }

    private void applyLineMatches(UUID statementId, List<BankStatementSaveDto.LineMatchInput> matches) {
        for (BankStatementSaveDto.LineMatchInput input : matches) {
            if (input.getLineId() == null) {
                continue;
            }
            BankStatementLineMatchDto body = new BankStatementLineMatchDto();
            body.setJournalEntryLineId(input.getJournalEntryLineId());
            body.setMouvementRef(input.getMouvementRef());
            matchLine(input.getLineId(), body);
        }
    }

    private void clearMatch(BankStatementLine line) {
        line.setMatchedJournalEntryId(null);
        line.setMatchedJournalEntryLineId(null);
        line.setMatchedMouvementRef(null);
        line.setMatchStatus(BankStatementLine.MATCH_UNMATCHED);
    }

    private BankAccountDto toAccountDto(BankAccount account) {
        BigDecimal current = computeAccountingBalance(account.getId(), LocalDate.now());
        return BankAccountDto.builder()
                .id(account.getId())
                .code(account.getCode())
                .name(account.getName())
                .accountType(account.getAccountType())
                .bankName(account.getBankName())
                .rib(account.getRib())
                .branch(account.getBranch())
                .currencyCode(account.getCurrencyCode())
                .glAccountCode(account.getGlAccountCode())
                .openingBalance(account.getOpeningBalance())
                .currentBalance(current)
                .isActive(account.getIsActive())
                .notes(account.getNotes())
                .build();
    }

    private BankStatementDto toSummaryDto(BankStatement statement, String accountName) {
        List<BankStatementLine> lines = bankStatementLineRepository.findByTenantIdAndBankStatementIdOrderByLineDateAsc(
                tenantId(), statement.getId());
        List<String> matchedRefs = lines.stream()
                .map(BankStatementLine::getMatchedMouvementRef)
                .filter(StringUtils::hasText)
                .toList();
        return BankStatementDto.builder()
                .id(statement.getId())
                .statementNumber(statement.getStatementNumber())
                .bankAccountId(statement.getBankAccountId())
                .bankAccountName(accountName)
                .periodStart(statement.getPeriodStart())
                .periodEnd(statement.getPeriodEnd())
                .openingBalanceAccounting(statement.getOpeningBalanceAccounting())
                .closingBalanceAccounting(statement.getClosingBalanceAccounting())
                .closingBalanceStatement(statement.getClosingBalanceStatement())
                .variance(statement.getVariance())
                .status(statement.getStatus())
                .importedFileName(statement.getImportedFileName())
                .notes(statement.getNotes())
                .createdAt(statement.getCreatedAt())
                .matchedMouvementRefs(matchedRefs)
                .build();
    }

    private BankStatementDto toDetailDto(BankStatement statement) {
        Map<UUID, String> names = accountNames();
        List<BankStatementLineDto> lines = bankStatementLineRepository
                .findByTenantIdAndBankStatementIdOrderByLineDateAsc(tenantId(), statement.getId())
                .stream()
                .map(this::toLineDto)
                .toList();
        List<String> matchedRefs = lines.stream()
                .map(BankStatementLineDto::getMatchedMouvementRef)
                .filter(StringUtils::hasText)
                .toList();
        return BankStatementDto.builder()
                .id(statement.getId())
                .statementNumber(statement.getStatementNumber())
                .bankAccountId(statement.getBankAccountId())
                .bankAccountName(names.get(statement.getBankAccountId()))
                .periodStart(statement.getPeriodStart())
                .periodEnd(statement.getPeriodEnd())
                .openingBalanceAccounting(statement.getOpeningBalanceAccounting())
                .closingBalanceAccounting(statement.getClosingBalanceAccounting())
                .closingBalanceStatement(statement.getClosingBalanceStatement())
                .variance(statement.getVariance())
                .status(statement.getStatus())
                .importedFileName(statement.getImportedFileName())
                .notes(statement.getNotes())
                .createdAt(statement.getCreatedAt())
                .lines(lines)
                .matchedMouvementRefs(matchedRefs)
                .build();
    }

    private BankStatementLineDto toLineDto(BankStatementLine line) {
        return BankStatementLineDto.builder()
                .id(line.getId())
                .bankStatementId(line.getBankStatementId())
                .lineDate(line.getLineDate())
                .label(line.getLabel())
                .reference(line.getReference())
                .receiptAmount(line.getReceiptAmount())
                .paymentAmount(line.getPaymentAmount())
                .matchedJournalEntryId(line.getMatchedJournalEntryId())
                .matchedJournalEntryLineId(line.getMatchedJournalEntryLineId())
                .matchedMouvementRef(line.getMatchedMouvementRef())
                .matchStatus(line.getMatchStatus())
                .build();
    }

    private MovementCandidateDto toMovementCandidate(JournalEntry entry, JournalEntryLine line) {
        BigDecimal recette = line.getDebit().signum() > 0 ? line.getDebit() : BigDecimal.ZERO;
        BigDecimal depense = line.getCredit().signum() > 0 ? line.getCredit() : BigDecimal.ZERO;
        return MovementCandidateDto.builder()
                .id(mouvementRef(line.getId()))
                .numero(entry.getEntryNumber())
                .date(entry.getEntryDate())
                .libelle(line.getLabel() != null ? line.getLabel() : entry.getLabel())
                .reference(entry.getReference())
                .recette(recette)
                .depense(depense)
                .journalEntryId(entry.getId())
                .journalEntryLineId(line.getId())
                .build();
    }

    private Map<UUID, String> accountNames() {
        Map<UUID, String> map = new HashMap<>();
        for (BankAccount account : bankAccountRepository.findByTenantIdOrderByCodeAsc(tenantId())) {
            map.put(account.getId(), account.getName());
        }
        return map;
    }

    private String nextStatementNumber() {
        int year = LocalDate.now().getYear();
        String prefix = "RAP-" + year + "-";
        String last = bankStatementRepository.findTopByTenantIdOrderByStatementNumberDesc(tenantId())
                .map(BankStatement::getStatementNumber)
                .orElse(null);
        int seq = 1;
        if (last != null && last.startsWith(prefix)) {
            try {
                seq = Integer.parseInt(last.substring(prefix.length())) + 1;
            } catch (NumberFormatException ignored) {
                seq = (int) bankStatementRepository.count() + 1;
            }
        }
        return prefix + String.format("%03d", seq);
    }

    static String mouvementRef(UUID journalEntryLineId) {
        return MVT_REF_PREFIX + journalEntryLineId;
    }

    static UUID parseMouvementRef(String ref) {
        if (ref == null) {
            return null;
        }
        if (ref.startsWith(MVT_REF_PREFIX)) {
            return UUID.fromString(ref.substring(MVT_REF_PREFIX.length()));
        }
        try {
            return UUID.fromString(ref);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private BankAccount requireAccount(UUID id) {
        return bankAccountRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Bank account not found"));
    }

    private BankStatement requireStatement(UUID id) {
        return bankStatementRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Bank statement not found"));
    }

    private static BigDecimal round(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
