package ma.nafura.platform.appsettings.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.appsettings.api.request.UpdateBrandingRequest;
import ma.nafura.platform.appsettings.api.request.UpdateGeneralRequest;
import ma.nafura.platform.appsettings.api.request.UpdateLocalizationRequest;
import ma.nafura.platform.appsettings.api.response.AppBrandingSettingsResponse;
import ma.nafura.platform.appsettings.api.response.AppGeneralSettingsResponse;
import ma.nafura.platform.appsettings.api.response.AppLocalizationSettingsResponse;
import ma.nafura.platform.appsettings.service.AppSettingsService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/app-settings")
@RequiredArgsConstructor
public class AppSettingsController {

    private final AppSettingsService appSettingsService;

    @GetMapping("/general")
    @RequirePermission(value = "tenant.settings.read", fullPermission = true)
    public ResponseEntity<AppGeneralSettingsResponse> getGeneral() {
        return ResponseEntity.ok(appSettingsService.getGeneral());
    }

    @PutMapping("/general")
    @RequirePermission(value = "tenant.settings.write", fullPermission = true)
    public ResponseEntity<AppGeneralSettingsResponse> updateGeneral(
            @Valid @RequestBody UpdateGeneralRequest request) {
        return ResponseEntity.ok(appSettingsService.updateGeneral(request));
    }

    @GetMapping("/localization")
    @RequirePermission(value = "tenant.settings.read", fullPermission = true)
    public ResponseEntity<AppLocalizationSettingsResponse> getLocalization() {
        return ResponseEntity.ok(appSettingsService.getLocalization());
    }

    @PutMapping("/localization")
    @RequirePermission(value = "tenant.settings.write", fullPermission = true)
    public ResponseEntity<AppLocalizationSettingsResponse> updateLocalization(
            @Valid @RequestBody UpdateLocalizationRequest request) {
        return ResponseEntity.ok(appSettingsService.updateLocalization(request));
    }

    @GetMapping("/branding")
    @RequirePermission(value = "tenant.settings.read", fullPermission = true)
    public ResponseEntity<AppBrandingSettingsResponse> getBranding() {
        return ResponseEntity.ok(appSettingsService.getBranding());
    }

    @PutMapping("/branding")
    @RequirePermission(value = "tenant.settings.write", fullPermission = true)
    public ResponseEntity<AppBrandingSettingsResponse> updateBranding(
            @Valid @RequestBody UpdateBrandingRequest request) {
        return ResponseEntity.ok(appSettingsService.updateBranding(request));
    }

    @PostMapping(value = "/branding/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequirePermission(value = "tenant.settings.write", fullPermission = true)
    public ResponseEntity<Map<String, String>> uploadLogo(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(appSettingsService.uploadLogo(file));
    }

    @PostMapping(value = "/branding/favicon", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequirePermission(value = "tenant.settings.write", fullPermission = true)
    public ResponseEntity<Map<String, String>> uploadFavicon(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(appSettingsService.uploadFavicon(file));
    }

    @GetMapping(value = "/branding/assets/{assetType}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @RequirePermission(value = "tenant.settings.read", fullPermission = true)
    public ResponseEntity<byte[]> getBrandingAsset(@PathVariable String assetType) {
        return appSettingsService.getBrandingAsset(assetType)
                .map(body -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(body.contentType()))
                        .body(body.data()))
                .orElse(ResponseEntity.notFound().build());
    }
}



