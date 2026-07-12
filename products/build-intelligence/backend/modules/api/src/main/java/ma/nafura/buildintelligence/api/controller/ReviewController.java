package ma.nafura.buildintelligence.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.api.dto.BiDtos;
import ma.nafura.buildintelligence.api.security.BiReadAccess;
import ma.nafura.buildintelligence.api.security.BiWriteAccess;
import ma.nafura.buildintelligence.extraction.domain.ReviewItem;
import ma.nafura.buildintelligence.extraction.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/build-intelligence/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/items")
    @BiReadAccess
    public Page<ReviewItem> list(Pageable pageable) {
        return reviewService.listPending(pageable);
    }

    @GetMapping("/items/{id}")
    @BiReadAccess
    public ReviewItem get(@PathVariable UUID id) {
        return reviewService.get(id);
    }

    @PostMapping("/items/{id}/validate")
    @BiWriteAccess
    public ReviewItem validate(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return reviewService.validate(id, subject(jwt));
    }

    @PostMapping("/items/{id}/reject")
    @BiWriteAccess
    public ReviewItem reject(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return reviewService.reject(id, subject(jwt));
    }

    @PostMapping("/items/{id}/correct")
    @BiWriteAccess
    public ReviewItem correct(
            @PathVariable UUID id,
            @RequestBody BiDtos.ReviewActionRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return reviewService.correct(id, subject(jwt), request.correction());
    }

    private static String subject(Jwt jwt) {
        return jwt != null && jwt.getSubject() != null ? jwt.getSubject() : "SYSTEM";
    }
}
