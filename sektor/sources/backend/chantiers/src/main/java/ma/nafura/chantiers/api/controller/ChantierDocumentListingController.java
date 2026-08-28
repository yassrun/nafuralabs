package ma.nafura.chantiers.api.controller;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import ma.nafura.chantiers.api.dto.DocumentChantierDto;
import ma.nafura.chantiers.service.DocumentChantierService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "document-chantier")
public class ChantierDocumentListingController {

    private final DocumentChantierService service;

    public ChantierDocumentListingController(DocumentChantierService service) {
        this.service = service;
    }

    @GetMapping("/documents")
    @RequirePermission("read")
    public ResponseEntity<Page<DocumentChantierDto>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "48") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String chantierId,
            @RequestParam(required = false) String types,
            @RequestParam(required = false) String uploadedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate dateTo) {
        List<String> requestedTypes =
                types == null ? List.of() : Arrays.stream(types.split(",")).map(String::trim).toList();
        return ResponseEntity.ok(service.listAll(
                page, size, search, chantierId, requestedTypes, uploadedBy, dateFrom, dateTo));
    }
}
