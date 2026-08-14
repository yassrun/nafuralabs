package ma.nafura.rh.api.controller;

import java.util.List;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.domain.model.FichePaie;
import ma.nafura.rh.service.FichePaieService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rh/fiches-paie")
@SecuredResource(domain = "rh", feature = "paie", resource = "fiche-paie")
public class FichePaieController {

    private final FichePaieService service;

    public FichePaieController(FichePaieService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.paie.read")
    public ResponseEntity<List<FichePaie>> list(
            @RequestParam(required = false) String employeId,
            @RequestParam(required = false) String mois,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(employeId, mois, status, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("rh.paie.read")
    public ResponseEntity<FichePaie> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping("/generate")
    @RequirePermission("rh.paie.create")
    public ResponseEntity<List<FichePaie>> generate(@RequestParam String mois) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.generate(mois));
    }

    @PostMapping("/{id}/valider")
    @RequirePermission("rh.paie.valider")
    public ResponseEntity<FichePaie> valider(@PathVariable String id) {
        return ResponseEntity.ok(service.valider(id));
    }

    @PostMapping("/{id}/payer")
    @RequirePermission("rh.paie.payer")
    public ResponseEntity<FichePaie> payer(@PathVariable String id) {
        return ResponseEntity.ok(service.payer(id));
    }

    @GetMapping("/{id}/pdf")
    @RequirePermission("rh.paie.read")
    public ResponseEntity<byte[]> pdf(@PathVariable String id) {
        byte[] body = service.generatePdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"bulletin-" + id + ".pdf\"")
                .body(body);
    }
}
