package ma.nafura.socle.chrome.api;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.socle.chrome.api.dto.ErpChromeDtos.ChromeSnapshotResponse;
import ma.nafura.socle.chrome.service.ErpChromeSnapshotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/erp/chrome")
@SecuredResource(domain = "collaboration", feature = "collaboration", resource = "notification")
@RequiredArgsConstructor
public class ErpChromeController {

    private final ErpChromeSnapshotService snapshotService;

    @GetMapping
    public ResponseEntity<ChromeSnapshotResponse> snapshot() {
        return ResponseEntity.ok(snapshotService.snapshot());
    }
}
