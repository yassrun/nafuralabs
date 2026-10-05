package ma.nafura.bc.demo;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Permissions come from the platform: demo.notes.note.{read,create,delete} by HTTP method. */
@RestController
@RequestMapping("/api/v1/demo/notes")
@SecuredResource(domain = "demo", feature = "notes", resource = "note")
@RequiredArgsConstructor
public class NoteController extends RecordController<Note> {

    private final NoteRepository notes;

    @Override protected RecordRepository<Note> repository() { return notes; }
    @Override protected String recordResource() { return "records/note.json"; }
    @Override protected String labelField() { return "title"; }
}
