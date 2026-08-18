package ma.nafura.platform.administration.iam.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.administration.iam.api.request.publicapi.AcceptInvitationRequest;
import ma.nafura.platform.administration.iam.api.response.publicapi.InvitationAcceptResponse;
import ma.nafura.platform.administration.iam.api.response.publicapi.InvitationPreviewResponse;
import ma.nafura.platform.administration.iam.service.InvitationAcceptService;
import ma.nafura.platform.authorization.security.authorization.PublicEndpoint;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/public/invitations")
@RequiredArgsConstructor
public class InvitationPublicController {

    private final InvitationAcceptService invitationAcceptService;

    @GetMapping("/preview")
    @PublicEndpoint(reason = "Invitation landing page metadata")
    public ResponseEntity<InvitationPreviewResponse> preview(@RequestParam String token) {
        return ResponseEntity.ok(invitationAcceptService.preview(token));
    }

    @PostMapping("/accept")
    @PublicEndpoint(reason = "Accept tenant invitation without prior login")
    public ResponseEntity<InvitationAcceptResponse> accept(@Valid @RequestBody AcceptInvitationRequest request) {
        return ResponseEntity.ok(invitationAcceptService.accept(request));
    }
}
