package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import ma.nafura.chantiers.api.dto.PhotoChantierDto;
import ma.nafura.chantiers.api.request.PhotoChantierCreateDto;
import ma.nafura.chantiers.service.PhotoChantierService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/photos")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "photo-chantier")
public class PhotoChantierController {

    private final PhotoChantierService service;

    public PhotoChantierController(PhotoChantierService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<PhotoChantierDto>> list(
            @PathVariable String chantierId,
            @RequestParam(required = false) String zone,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.listByChantier(chantierId, zone, date));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @RequirePermission("chantiers.create")
    public ResponseEntity<PhotoChantierDto> createMetadata(
            @PathVariable String chantierId, @Valid @RequestBody PhotoChantierCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createFromMetadata(chantierId, body));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequirePermission("chantiers.create")
    public ResponseEntity<PhotoChantierDto> createMultipart(
            @PathVariable String chantierId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) String zone,
            @RequestParam(required = false) OffsetDateTime takenAt,
            @RequestParam(required = false) String exifJson,
            @RequestParam(required = false) String uploadedBy)
            throws java.io.IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createFromMultipart(chantierId, file, lat, lng, zone, takenAt, exifJson, uploadedBy));
    }
}
