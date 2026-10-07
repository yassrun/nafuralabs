package ma.nafura.platform.hosttests.probe;

import java.util.Map;
import java.util.Set;

import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import ma.nafura.platform.framework.record.RecordRuleException;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

interface ProbeGroupRepository extends RecordRepository<ProbeGroup> {
}

interface ProbeRecordRepository extends RecordRepository<ProbeRecord> {
}

@RestController
@RequestMapping("/api/v1/probe/groups")
@SecuredResource(domain = "probe", feature = "records", resource = "group")
class ProbeGroupController extends RecordController<ProbeGroup> {
    private final ProbeGroupRepository repository;

    ProbeGroupController(ProbeGroupRepository repository) {
        this.repository = repository;
    }

    @Override protected RecordRepository<ProbeGroup> repository() { return repository; }
    @Override protected String recordResource() { return "records/probe-group.json"; }
}

@RestController
@RequestMapping("/api/v1/probe/records")
@SecuredResource(domain = "probe", feature = "records", resource = "record")
class ProbeRecordController extends RecordController<ProbeRecord> {
    private final ProbeRecordRepository repository;

    ProbeRecordController(ProbeRecordRepository repository) {
        this.repository = repository;
    }

    @Override protected RecordRepository<ProbeRecord> repository() { return repository; }
    @Override protected String recordResource() { return "records/probe-record.json"; }

    /** Rules exercised by RecordRulesHostTest: a code without spaces, never lowered below the stored amount. */
    @Override
    protected Map<String, String> validate(ProbeRecord record, ProbeRecord previous) {
        if (record.getCode() != null && record.getCode().contains(" ")) {
            return Map.of("code", "Sans espace");
        }
        if (previous != null && previous.getAmount() != null && record.getAmount() != null
                && record.getAmount().compareTo(previous.getAmount()) < 0) {
            return Map.of("amount", "Ne peut pas baisser");
        }
        return Map.of();
    }

    @Override
    protected void beforeSave(ProbeRecord record, ProbeRecord previous) {
        record.setCode(record.getCode().toUpperCase());
        record.setReference("REF-" + record.getCode());
    }

    @Override
    protected void afterSave(ProbeRecord saved, ProbeRecord previous) {
        if (saved.getCode().startsWith("FAIL-AFTER")) {
            throw RecordRuleException.refused("afterSave a échoué");
        }
    }

    @Override
    protected void beforeDelete(ProbeRecord record) {
        if (record.getCode().startsWith("KEEP-")) {
            throw RecordRuleException.refused("Enregistrement protégé");
        }
    }

    @Override
    protected Set<String> readOnlyFields() {
        return Set.of("reference");
    }
}
