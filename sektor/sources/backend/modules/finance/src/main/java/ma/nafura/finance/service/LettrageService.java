package ma.nafura.finance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ma.nafura.finance.api.dto.LettrageAutoMatchDto;
import ma.nafura.finance.api.dto.LettrageCandidateDto;
import ma.nafura.finance.api.dto.LettrageDetailDto;
import ma.nafura.finance.api.request.LettrageAutoMatchRequestDto;
import ma.nafura.finance.api.request.LettrageCreateDto;
import ma.nafura.finance.domain.model.JournalEntry;
import ma.nafura.finance.domain.model.JournalEntryLine;
import ma.nafura.finance.domain.model.Lettrage;
import ma.nafura.finance.domain.model.LettrageLine;
import ma.nafura.finance.repository.JournalEntryLineRepository;
import ma.nafura.finance.repository.JournalEntryRepository;
import ma.nafura.finance.repository.LettrageLineRepository;
import ma.nafura.finance.repository.LettrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class LettrageService {

    private static final BigDecimal DEFAULT_TOLERANCE = new BigDecimal("0.01");

    private final LettrageRepository lettrageRepository;
    private final LettrageLineRepository lettrageLineRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final JournalEntryLineRepository journalEntryLineRepository;

    public LettrageService(
            LettrageRepository lettrageRepository,
            LettrageLineRepository lettrageLineRepository,
            JournalEntryRepository journalEntryRepository,
            JournalEntryLineRepository journalEntryLineRepository) {
        this.lettrageRepository = lettrageRepository;
        this.lettrageLineRepository = lettrageLineRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.journalEntryLineRepository = journalEntryLineRepository;
    }

    @Transactional(readOnly = true)
    public List<LettrageDetailDto> list() {
        return lettrageRepository.findByTenantIdOrderByCreatedAtDesc(tenantId()).stream()
                .map(this::toDetailDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LettrageCandidateDto> listNonLettrees(String accountRadical, String partnerId) {
        String radical = normalizeRadical(accountRadical);
        Set<String> usedKeys = lettrageLineRepository.findAllLigneKeys(tenantId());
        List<JournalEntry> entries = journalEntryRepository.findByTenantIdAndStatusNotOrderByEntryDateDesc(
                tenantId(), JournalEntry.STATUS_BROUILLON);

        List<LettrageCandidateDto> candidates = new ArrayList<>();
        for (JournalEntry entry : entries) {
            List<JournalEntryLine> lines =
                    journalEntryLineRepository.findByTenantIdAndJournalEntryIdOrderByLineNumberAsc(
                            tenantId(), entry.getId());
            for (JournalEntryLine line : lines) {
                if (!line.getAccountCode().startsWith(radical)) {
                    continue;
                }
                if (line.getDebit().compareTo(BigDecimal.ZERO) <= 0
                        && line.getCredit().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                if (StringUtils.hasText(partnerId)
                        && line.getThirdPartyName() != null
                        && !line.getThirdPartyName().toLowerCase().contains(partnerId.toLowerCase())
                        && !partnerId.equalsIgnoreCase(line.getThirdPartyName())) {
                    continue;
                }
                String ligneKey = ligneKey(entry.getId(), line.getId());
                if (usedKeys.contains(ligneKey)) {
                    continue;
                }
                candidates.add(LettrageCandidateDto.builder()
                        .ligneKey(ligneKey)
                        .ecritureId(entry.getId())
                        .ligneId(line.getId())
                        .date(entry.getEntryDate())
                        .piece(entry.getReference() != null ? entry.getReference() : entry.getEntryNumber())
                        .libelle(line.getLabel() != null ? line.getLabel() : entry.getLabel())
                        .debit(line.getDebit())
                        .credit(line.getCredit())
                        .build());
            }
        }
        candidates.sort(Comparator.comparing(LettrageCandidateDto::getDate));
        return candidates;
    }

    @Transactional
    public LettrageDetailDto create(LettrageCreateDto request) {
        String radical = normalizeRadical(request.getAccountRadical());
        BigDecimal tolerance = request.getTolerance() != null ? request.getTolerance() : DEFAULT_TOLERANCE;
        boolean allowPartial = Boolean.TRUE.equals(request.getAllowPartial());

        Set<String> keys = new HashSet<>(request.getLigneKeys());
        if (keys.isEmpty()) {
            throw new IllegalArgumentException("No lines selected");
        }

        Totals totals = resolveLines(keys, radical);
        String status = resolveStatus(totals.difference, tolerance, allowPartial);

        Lettrage entity = Lettrage.builder()
                .tenantId(tenantId())
                .code(nextCode())
                .accountRadical(radical)
                .status(status)
                .totalDebit(totals.debit)
                .totalCredit(totals.credit)
                .difference(totals.difference)
                .allowPartial(allowPartial)
                .build();
        entity = lettrageRepository.save(entity);

        for (ResolvedLine line : totals.lines) {
            if (lettrageLineRepository.existsByTenantIdAndJournalEntryIdAndJournalEntryLineId(
                    tenantId(), line.entryId(), line.lineId())) {
                throw new IllegalArgumentException("Line already lettered: " + line.ligneKey());
            }
            lettrageLineRepository.save(LettrageLine.builder()
                    .tenantId(tenantId())
                    .lettrageId(entity.getId())
                    .journalEntryId(line.entryId())
                    .journalEntryLineId(line.lineId())
                    .debit(line.debit())
                    .credit(line.credit())
                    .build());
        }
        return toDetailDto(entity);
    }

    @Transactional(readOnly = true)
    public LettrageAutoMatchDto autoMatch(LettrageAutoMatchRequestDto request) {
        List<LettrageCandidateDto> candidates =
                listNonLettrees(request.getAccountRadical(), request.getPartnerId());
        List<String> keys = suggestPair(candidates);
        return LettrageAutoMatchDto.builder().ligneKeys(keys).build();
    }

    @Transactional
    public void deleteByCode(String code) {
        Lettrage entity = lettrageRepository
                .findByTenantIdAndCode(tenantId(), code.trim())
                .orElseThrow(() -> new IllegalArgumentException("Lettrage not found: " + code));
        lettrageLineRepository.deleteByTenantIdAndLettrageId(tenantId(), entity.getId());
        lettrageRepository.delete(entity);
    }

    @Transactional(readOnly = true)
    public String exportCsv(String code) {
        Lettrage entity = lettrageRepository
                .findByTenantIdAndCode(tenantId(), code.trim())
                .orElseThrow(() -> new IllegalArgumentException("Lettrage not found: " + code));
        List<LettrageLine> lines =
                lettrageLineRepository.findByTenantIdAndLettrageId(tenantId(), entity.getId());
        StringBuilder sb = new StringBuilder();
        sb.append("codeLettrage;comptePcg;status;totalDebit;totalCredit;difference;createdAt\n");
        sb.append(entity.getCode())
                .append(';')
                .append(entity.getAccountRadical())
                .append(';')
                .append(entity.getStatus())
                .append(';')
                .append(entity.getTotalDebit())
                .append(';')
                .append(entity.getTotalCredit())
                .append(';')
                .append(entity.getDifference())
                .append(';')
                .append(entity.getCreatedAt())
                .append('\n');
        sb.append("ligneKey;journalEntryId;journalEntryLineId;debit;credit\n");
        for (LettrageLine line : lines) {
            sb.append(ligneKey(line.getJournalEntryId(), line.getJournalEntryLineId()))
                    .append(';')
                    .append(line.getJournalEntryId())
                    .append(';')
                    .append(line.getJournalEntryLineId())
                    .append(';')
                    .append(line.getDebit())
                    .append(';')
                    .append(line.getCredit())
                    .append('\n');
        }
        return sb.toString();
    }

    static List<String> suggestPair(List<LettrageCandidateDto> rows) {
        if (rows.size() < 2) {
            return List.of();
        }
        Map<String, List<LettrageCandidateDto>> byPiece = new HashMap<>();
        for (LettrageCandidateDto row : rows) {
            String piece = row.getPiece() != null ? row.getPiece() : "";
            byPiece.computeIfAbsent(piece, k -> new ArrayList<>()).add(row);
        }
        for (List<LettrageCandidateDto> group : byPiece.values()) {
            if (group.size() < 2) {
                continue;
            }
            List<LettrageCandidateDto> debitLines = group.stream()
                    .filter(g -> g.getDebit().compareTo(BigDecimal.ZERO) > 0
                            && g.getCredit().compareTo(BigDecimal.ZERO) == 0)
                    .toList();
            List<LettrageCandidateDto> creditLines = group.stream()
                    .filter(g -> g.getCredit().compareTo(BigDecimal.ZERO) > 0
                            && g.getDebit().compareTo(BigDecimal.ZERO) == 0)
                    .toList();
            for (LettrageCandidateDto debit : debitLines) {
                for (LettrageCandidateDto credit : creditLines) {
                    if (debit.getDebit().compareTo(credit.getCredit()) == 0) {
                        return List.of(debit.getLigneKey(), credit.getLigneKey());
                    }
                }
            }
        }
        return List.of();
    }

    private Totals resolveLines(Set<String> keys, String radical) {
        BigDecimal debit = BigDecimal.ZERO;
        BigDecimal credit = BigDecimal.ZERO;
        List<ResolvedLine> lines = new ArrayList<>();
        for (String key : keys) {
            UUID[] ids = parseLigneKey(key);
            JournalEntry entry = journalEntryRepository
                    .findByIdAndTenantId(ids[0], tenantId())
                    .orElseThrow(() -> new IllegalArgumentException("Entry not found for " + key));
            if (JournalEntry.STATUS_BROUILLON.equals(entry.getStatus())) {
                throw new IllegalArgumentException("Draft entry cannot be lettered: " + key);
            }
            JournalEntryLine line = journalEntryLineRepository
                    .findById(ids[1])
                    .filter(l -> tenantId().equals(l.getTenantId()) && entry.getId().equals(l.getJournalEntryId()))
                    .orElseThrow(() -> new IllegalArgumentException("Line not found for " + key));
            if (!line.getAccountCode().startsWith(radical)) {
                throw new IllegalArgumentException("Line account does not match radical " + radical + ": " + key);
            }
            debit = debit.add(line.getDebit());
            credit = credit.add(line.getCredit());
            lines.add(new ResolvedLine(key, entry.getId(), line.getId(), line.getDebit(), line.getCredit()));
        }
        debit = round(debit);
        credit = round(credit);
        return new Totals(debit, credit, round(debit.subtract(credit)), lines);
    }

    private String resolveStatus(BigDecimal difference, BigDecimal tolerance, boolean allowPartial) {
        BigDecimal abs = difference.abs();
        if (abs.compareTo(tolerance) <= 0) {
            return Lettrage.STATUS_EQUILIBRE;
        }
        if (allowPartial) {
            return Lettrage.STATUS_PARTIEL;
        }
        throw new IllegalArgumentException(
                "Lettrage refused: imbalance " + difference + " (tolerance " + tolerance + ")");
    }

    private String nextCode() {
        String last = lettrageRepository.findByTenantIdOrderByCreatedAtDesc(tenantId()).stream()
                .map(Lettrage::getCode)
                .findFirst()
                .orElse(null);
        return LettrageCodeGenerator.nextCode(last);
    }

    private LettrageDetailDto toDetailDto(Lettrage entity) {
        List<LettrageLine> lines =
                lettrageLineRepository.findByTenantIdAndLettrageId(tenantId(), entity.getId());
        List<String> keys = lines.stream()
                .map(l -> ligneKey(l.getJournalEntryId(), l.getJournalEntryLineId()))
                .toList();
        return LettrageDetailDto.builder()
                .id(entity.getId())
                .codeLettrage(entity.getCode())
                .comptePcg(entity.getAccountRadical())
                .ligneKeys(keys)
                .status(entity.getStatus())
                .totalDebit(entity.getTotalDebit())
                .totalCredit(entity.getTotalCredit())
                .difference(entity.getDifference())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private static String normalizeRadical(String account) {
        if (!StringUtils.hasText(account)) {
            throw new IllegalArgumentException("Account radical is required");
        }
        String radical = account.trim();
        if (!radical.equals("3421") && !radical.equals("4411")) {
            throw new IllegalArgumentException("Account radical must be 3421 or 4411");
        }
        return radical;
    }

    private static String ligneKey(UUID entryId, UUID lineId) {
        return entryId + "::" + lineId;
    }

    private static UUID[] parseLigneKey(String key) {
        String[] parts = key.split("::", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid ligne key: " + key);
        }
        return new UUID[] {UUID.fromString(parts[0]), UUID.fromString(parts[1])};
    }

    private static BigDecimal round(BigDecimal value) {
        return value.setScale(4, RoundingMode.HALF_UP);
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private record ResolvedLine(String ligneKey, UUID entryId, UUID lineId, BigDecimal debit, BigDecimal credit) {}

    private record Totals(BigDecimal debit, BigDecimal credit, BigDecimal difference, List<ResolvedLine> lines) {}
}
