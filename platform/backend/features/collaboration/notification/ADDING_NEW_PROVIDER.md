# Guide : Ajouter un Nouveau Provider Email

Ce guide montre comment ajouter un nouveau provider (ex: Mailgun) au module notification.

## Étapes

### 1. Ajouter la Dépendance

Dans `notification/build.gradle`:

```gradle
dependencies {
    // ... existing dependencies ...
    
    // Nouveau provider
    implementation 'net.sargue:mailgun:1.10.0'
    // ou pour AWS SES:
    // implementation 'com.amazonaws:aws-java-sdk-ses:1.12.x'
}
```

### 2. Créer l'Implémentation

Créer `MailgunEmailService.java` dans `service/email/`:

```java
package ma.nafura.platform.collaboration.notification.service.email;

import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.collaboration.notification.service.EmailException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
// ... imports Mailgun

@Slf4j
public class MailgunEmailService implements EmailService {
    
    private final MailgunClient mailgun;
    private final String fromAddress;
    private final String fromName;
    
    public MailgunEmailService(MailgunClient mailgun, String fromAddress, String fromName) {
        this.mailgun = mailgun;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }
    
    @Override
    public void sendInvitationEmail(
        String toEmail,
        String tenantName,
        String inviteLink,
        String inviterName,
        String message
    ) {
        try {
            // Implémentation Mailgun
            // ...
        } catch (Exception e) {
            log.error("Error sending invitation email to {}", toEmail, e);
            throw new EmailException("Failed to send email", e);
        }
    }
    
    @Override
    public void sendWelcomeEmail(String toEmail, String tenantName, String userName) {
        // Implémentation
    }
    
    @Override
    public void sendEmail(String toEmail, String subject, String htmlContent, String textContent) {
        // Implémentation
    }
}
```

### 3. Mettre à jour EmailConfig

Dans `EmailConfig.java`, ajouter le case:

```java
@Bean
@ConditionalOnMissingBean(EmailService.class)
public EmailService emailService(
    @Value("${sendgrid.api-key:}") String sendGridApiKey,
    @Value("${mailgun.api-key:}") String mailgunApiKey,
    @Value("${mailgun.domain:}") String mailgunDomain
) {
    log.info("Configuring email provider: {}", emailProvider);
    
    switch (emailProvider.toLowerCase()) {
        case "sendgrid":
            SendGrid sendGrid = createSendGridClient(sendGridApiKey);
            return new SendGridEmailService(sendGrid, fromAddress, fromName);
        
        case "mailgun":  // NOUVEAU
            MailgunClient mailgun = createMailgunClient(mailgunApiKey, mailgunDomain);
            return new MailgunEmailService(mailgun, fromAddress, fromName);
        
        default:
            throw new IllegalStateException(
                String.format("Unsupported email provider: %s. Supported: sendgrid, mailgun", emailProvider)
            );
    }
}

// Ajouter la méthode helper
private MailgunClient createMailgunClient(String apiKey, String domain) {
    if (apiKey == null || apiKey.isBlank() || domain == null || domain.isBlank()) {
        throw new IllegalStateException(
            "Mailgun API key and domain are required. Set mailgun.api-key and mailgun.domain"
        );
    }
    log.info("Creating Mailgun client");
    return new MailgunClient(apiKey, domain);
}
```

### 4. Ajouter la Configuration

Dans `application.yml`:

```yaml
app:
  email:
    provider: mailgun  # Changer ici !

# Mailgun Configuration
mailgun:
  api-key: ${MAILGUN_API_KEY:}
  domain: ${MAILGUN_DOMAIN:}
  api-url: ${MAILGUN_API_URL:https://api.mailgun.net/v3}
```

### 5. C'est Tout !

**Aucun autre code à modifier !** Tous les services qui utilisent `EmailService` continueront de fonctionner sans changement.

## Exemple Complet : Mailgun

Voir le fichier `EXAMPLES/MailgunEmailService.java` pour un exemple complet d'implémentation.

## Avantages de cette Architecture

✅ **Séparation des responsabilités** : Chaque provider dans sa propre classe  
✅ **Configuration centralisée** : Un seul endroit pour changer de provider  
✅ **Code existant inchangé** : L'interface `EmailService` reste la même  
✅ **Testable** : Facile de mocker `EmailService` dans les tests  
✅ **Extensible** : Ajouter un provider = ajouter un case dans le switch

