package ma.nafura.platform.configuration.sysconfig.api.controller;

import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.configuration.sysconfig.domain.model.NumberingSequence;
import ma.nafura.platform.configuration.sysconfig.repository.NumberingSequenceRepository;
import ma.nafura.platform.configuration.sysconfig.service.NumberingSequenceService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Numbering sequences of the organization. Permissions:
 * {@code settings.sysconfig.numbering-sequence.{read,create,update,delete}}.
 */
@RestController
@RequestMapping("/api/v1/numbering-sequences")
@SecuredResource(domain = "settings", feature = "sysconfig", resource = "numbering-sequence")
public class NumberingSequenceController extends RecordController<NumberingSequence> {

    private final NumberingSequenceRepository repository;
    private final NumberingSequenceService sequences;

    public NumberingSequenceController(NumberingSequenceRepository repository, NumberingSequenceService sequences) {
        this.repository = repository;
        this.sequences = sequences;
    }

    @Override protected RecordRepository<NumberingSequence> repository() { return repository; }
    @Override protected String recordResource() { return "records/numbering-sequence.json"; }
    @Override protected String labelField() { return "name"; }
    @Override protected Sort defaultSort() { return Sort.by(Sort.Direction.ASC, "code"); }

    @Override
    protected Map<String, String> validate(NumberingSequence sequence, NumberingSequence previous) {
        UUID tenantId = TenantContext.getTenantId();
        String code = sequence.getCode() == null ? "" : sequence.getCode().trim();
        boolean taken = previous == null
                ? repository.existsByTenantIdAndCodeIgnoreCase(tenantId, code)
                : repository.existsByTenantIdAndCodeIgnoreCaseAndIdNot(tenantId, code, previous.getId());
        if (taken) {
            return Map.of("code", "Ce code existe déjà");
        }
        return Map.of();
    }

    @Override
    protected void beforeSave(NumberingSequence sequence, NumberingSequence previous) {
        if (sequence.getCode() != null) {
            sequence.setCode(sequence.getCode().trim());
        }
        if (sequence.getName() != null) {
            sequence.setName(sequence.getName().trim());
        }
        if (sequence.getCurrentNumber() == null) {
            sequence.setCurrentNumber(0L);
        }
        if (sequence.getIncrementBy() == null) {
            sequence.setIncrementBy(1);
        }
        if (sequence.getPadLength() == null) {
            sequence.setPadLength(6);
        }
        if (sequence.getResetPolicy() == null || sequence.getResetPolicy().isBlank()) {
            sequence.setResetPolicy("NEVER");
        }
    }

    @GetMapping("/preview")
    @RequirePermission("read")
    public Map<String, String> preview(
            @RequestParam String prefix,
            @RequestParam(required = false) String separator,
            @RequestParam(required = false) String yearFormat,
            @RequestParam Integer padLength,
            @RequestParam Long currentNumber) {
        return Map.of("preview", sequences.preview(prefix, separator, yearFormat, padLength, currentNumber));
    }

    /** Allocates and returns the next formatted number for this sequence. */
    @PostMapping("/{id}/next")
    @RequirePermission("update")
    public Map<String, String> next(@PathVariable UUID id) {
        return Map.of("number", sequences.generateNext(id));
    }
}
