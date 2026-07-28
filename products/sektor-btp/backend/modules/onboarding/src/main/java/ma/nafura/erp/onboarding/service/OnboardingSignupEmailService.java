package ma.nafura.erp.onboarding.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingSignupEmailService {

    private final EmailService emailService;

    @Value("${app.frontend-base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    public void sendVerificationEmail(String toEmail, String displayName, String token) {
        String verifyLink = frontendBaseUrl.replaceAll("/$", "") + "/signup/verify?token=" + token;
        String name = displayName != null && !displayName.isBlank() ? displayName : toEmail;
        String subject = "Confirmez votre adresse email — Nafura";
        String html = """
            <p>Bonjour %s,</p>
            <p>Merci de vous inscrire sur Nafura. Cliquez sur le lien ci-dessous pour activer votre compte :</p>
            <p><a href="%s">Confirmer mon email</a></p>
            <p>Ce lien expire dans 48 heures.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
            """.formatted(name, verifyLink);
        String text = """
            Bonjour %s,

            Confirmez votre email Nafura : %s

            Ce lien expire dans 48 heures.
            """.formatted(name, verifyLink);
        try {
            emailService.sendEmail(toEmail, subject, html, text);
            log.info("Signup verification email queued for {}", toEmail);
        } catch (Exception ex) {
            log.error("Failed to send signup verification email to {}: {}", toEmail, ex.getMessage());
            throw new IllegalStateException("VERIFICATION_EMAIL_FAILED", ex);
        }
    }
}
