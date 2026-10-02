package ma.nafura.bc.demo;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Permissions come from the platform: demo.notes.note.{read,create,delete} by HTTP method. */
@RestController
@RequestMapping("/api/v1/demo/notes")
@SecuredResource(domain = "demo", feature = "notes", resource = "note")
@RequiredArgsConstructor
public class NoteController {

    private final NoteRepository notes;

    public record NoteView(UUID id, String title) {
        static NoteView of(Note note) {
            return new NoteView(note.getId(), note.getTitle());
        }
    }

    public record CreateNote(@NotBlank @Size(max = 200) String title) {
    }

    @GetMapping
    public List<NoteView> list() {
        return notes.findByTenantIdOrderByCreatedAtDesc(TenantContext.getTenantId()).stream().map(NoteView::of).toList();
    }

    @PostMapping
    public ResponseEntity<NoteView> create(@Valid @RequestBody CreateNote request) {
        Note note = notes.save(new Note(TenantContext.getTenantId(), request.title()));
        return ResponseEntity.status(HttpStatus.CREATED).body(NoteView.of(note));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        notes.findByIdAndTenantId(id, TenantContext.getTenantId()).ifPresent(notes::delete);
        return ResponseEntity.noContent().build();
    }
}
