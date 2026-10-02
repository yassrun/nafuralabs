package ma.nafura.bc.demo.projects;

import java.util.List;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/demo/projects")
@SecuredResource(domain = "demo", feature = "projects", resource = "project")
@RequiredArgsConstructor
class ProjectController extends RecordController<Project> {
    private final ProjectRepository repository;

    @Override protected RecordRepository<Project> repository() { return repository; }
    @Override protected List<String> searchFields() { return List.of("name", "client", "city"); }
    @Override protected Set<String> filterFields() { return Set.of("status"); }
    @Override protected String labelField() { return "name"; }
    @Override protected String lifecycleResource() { return "lifecycle/project.json"; }
}
