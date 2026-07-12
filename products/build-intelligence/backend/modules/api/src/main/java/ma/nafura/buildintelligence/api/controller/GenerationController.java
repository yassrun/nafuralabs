package ma.nafura.buildintelligence.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.api.dto.BiDtos;
import ma.nafura.buildintelligence.api.security.BiReadAccess;
import ma.nafura.buildintelligence.api.security.BiWriteAccess;
import ma.nafura.buildintelligence.generation.domain.GenerationJob;
import ma.nafura.buildintelligence.generation.service.GenerationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/build-intelligence/generation")
@RequiredArgsConstructor
public class GenerationController {

    private final GenerationService generationService;

    @PostMapping("/bpu")
    @BiWriteAccess
    public ResponseEntity<GenerationJob> createBpu(
            @RequestBody BiDtos.GenerationRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(generationService.createBpuJob(request.workItemIds(), subject(jwt)));
    }

    @PostMapping("/dqe")
    @BiWriteAccess
    public ResponseEntity<GenerationJob> createDqe(
            @RequestBody BiDtos.GenerationRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(generationService.createDqeJob(request.workItemIds(), subject(jwt)));
    }

    @GetMapping("/jobs/{id}")
    @BiReadAccess
    public GenerationJob get(@PathVariable UUID id) {
        return generationService.get(id);
    }

    @PostMapping("/jobs/{id}/approve")
    @BiWriteAccess
    public GenerationJob approve(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return generationService.approve(id, subject(jwt));
    }

    @PostMapping("/jobs/{id}/export")
    @BiReadAccess
    public Map<String, Object> export(@PathVariable UUID id) {
        return generationService.export(id);
    }

    private static String subject(Jwt jwt) {
        return jwt != null && jwt.getSubject() != null ? jwt.getSubject() : "SYSTEM";
    }
}
