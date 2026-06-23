package ma.nafura.chantiers.api.controller;

import ma.nafura.chantiers.api.dto.PhotoChantierUrlDto;
import ma.nafura.chantiers.service.PhotoChantierService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/photos")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "photo-chantier")
public class PhotoChantierItemController {

    private final PhotoChantierService service;

    public PhotoChantierItemController(PhotoChantierService service) {
        this.service = service;
    }

    @DeleteMapping("/{id}")
    @RequirePermission("chantiers.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/url")
    @RequirePermission("chantiers.read")
    public ResponseEntity<PhotoChantierUrlDto> url(@PathVariable String id) {
        return ResponseEntity.ok(service.getContentUrl(id));
    }

    @GetMapping("/{id}/content")
    @RequirePermission("chantiers.read")
    public ResponseEntity<Void> content(@PathVariable String id) {
        PhotoChantierUrlDto dto = service.getContentUrl(id);
        if (!org.springframework.util.StringUtils.hasText(dto.getUrl())) {
            return ResponseEntity.notFound().build();
        }
        if (dto.getUrl().startsWith("http")) {
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(dto.getUrl())).build();
        }
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(dto.getUrl())).build();
    }
}
