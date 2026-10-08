package ma.nafura.platform.configuration.sysconfig.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.configuration.sysconfig.domain.model.NumberingSequence;
import ma.nafura.platform.configuration.sysconfig.repository.NumberingSequenceRepository;
import ma.nafura.platform.framework.autonumber.NumberSequenceGenerator;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Allocates the next value of a numbering sequence (by id or by code for {@link NumberSequenceGenerator}).
 */
@Service
public class NumberingSequenceService implements NumberSequenceGenerator {

    private final NumberingSequenceRepository repository;

    public NumberingSequenceService(NumberingSequenceRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<String> generateNextNumber(String sequenceCode, UUID tenantId) {
        return repository.findByCodeAndTenantIdForUpdate(sequenceCode, tenantId)
            .map(this::generateNextFromSequence);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNext(UUID id) {
        NumberingSequence sequence = repository.findById(id)
            .filter(s -> TenantContext.getTenantId().equals(s.getTenantId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "NumberingSequence not found: " + id));
        NumberingSequence locked = repository
            .findByCodeAndTenantIdForUpdate(sequence.getCode(), TenantContext.getTenantId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "NumberingSequence not found for tenant"));
        return generateNextFromSequence(locked);
    }

    public String preview(
        String prefix,
        String separator,
        String yearFormat,
        Integer padLength,
        Long currentNumber
    ) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        long number = currentNumber != null ? currentNumber : 0L;
        int pad = padLength != null ? padLength : 0;
        return formatNumber(prefix, separator, yearFormat, pad, number, now);
    }

    private String generateNextFromSequence(NumberingSequence lockedSequence) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        String resetPolicy = lockedSequence.getResetPolicy() != null
            ? lockedSequence.getResetPolicy().toUpperCase(Locale.ROOT)
            : "NEVER";

        boolean shouldReset = false;
        OffsetDateTime lastResetAt = lockedSequence.getLastResetAt();

        switch (resetPolicy) {
            case "YEARLY":
                shouldReset = lastResetAt == null || lastResetAt.getYear() != now.getYear();
                break;
            case "MONTHLY":
                shouldReset = lastResetAt == null
                    || lastResetAt.getYear() != now.getYear()
                    || lastResetAt.getMonthValue() != now.getMonthValue();
                break;
            default:
                shouldReset = false;
        }

        if (shouldReset) {
            lockedSequence.setCurrentNumber(0L);
            lockedSequence.setLastResetAt(now);
        }

        long current = lockedSequence.getCurrentNumber() != null ? lockedSequence.getCurrentNumber() : 0L;
        int incrementBy = lockedSequence.getIncrementBy() != null ? lockedSequence.getIncrementBy() : 1;
        long next = current + incrementBy;

        lockedSequence.setCurrentNumber(next);

        String formatted = formatNumber(
            lockedSequence.getPrefix(),
            lockedSequence.getSeparator(),
            lockedSequence.getYearFormat(),
            lockedSequence.getPadLength(),
            next,
            now
        );

        repository.save(lockedSequence);
        return formatted;
    }

    private String formatNumber(
        String prefix,
        String separator,
        String yearFormat,
        Integer padLength,
        long number,
        OffsetDateTime now
    ) {
        String effectivePrefix = prefix != null ? prefix : "";
        String effectiveSeparator = separator != null ? separator : "";
        String effectiveYearFormat = yearFormat != null ? yearFormat : "";

        StringBuilder sb = new StringBuilder();
        sb.append(effectivePrefix);

        String yearPart = "";
        if (!effectiveYearFormat.isBlank()) {
            int year = now.getYear();
            if ("YY".equalsIgnoreCase(effectiveYearFormat)) {
                yearPart = String.format("%02d", year % 100);
            } else {
                yearPart = String.valueOf(year);
            }
        }

        String paddedSeq = padLength != null && padLength > 0
            ? String.format("%0" + padLength + "d", number)
            : Long.toString(number);

        if (!yearPart.isBlank()) {
            if (!effectiveSeparator.isBlank()) {
                sb.append(effectiveSeparator);
            }
            sb.append(yearPart);
        }

        if (!effectiveSeparator.isBlank()) {
            sb.append(effectiveSeparator);
        }

        sb.append(paddedSeq);

        return sb.toString();
    }
}
