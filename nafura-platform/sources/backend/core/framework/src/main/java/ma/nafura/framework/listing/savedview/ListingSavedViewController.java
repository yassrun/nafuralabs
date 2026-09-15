package ma.nafura.platform.framework.listing.savedview;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/listing-views")
public class ListingSavedViewController {

    private final ListingSavedViewService service;

    public ListingSavedViewController(ListingSavedViewService service) {
        this.service = service;
    }

    @GetMapping
    public List<ListingSavedViewDto> list(@RequestParam String resourceKey) {
        return service.listForCurrentUser(resourceKey);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ListingSavedViewDto create(@Valid @RequestBody ListingSavedViewCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public ListingSavedViewDto update(
            @PathVariable UUID id, @Valid @RequestBody ListingSavedViewUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
