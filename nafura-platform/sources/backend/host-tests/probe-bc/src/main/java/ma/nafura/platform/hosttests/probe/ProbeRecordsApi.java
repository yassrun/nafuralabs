package ma.nafura.platform.hosttests.probe;

import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
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
}
