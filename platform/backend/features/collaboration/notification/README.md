# Notification Module

Module de gestion des notifications pour Nafura. Supporte actuellement l'envoi d'emails via SendGrid, avec une architecture extensible pour ajouter d'autres providers.

## Architecture Extensible

✅ **Oui, vous pouvez facilement changer de provider !**

Le module utilise le pattern **Strategy** avec configuration Spring :

- **Interface `EmailService`** : Abstraction indépendante du provider
- **Configuration basée sur propriété** : `app.email.provider=sendgrid|mailgun|ses|...`
- **Implémentations séparées** : Chaque provider dans son propre package

### Changer de Provider

Pour changer de SendGrid vers Mailgun (ou autre), il suffit de :

1. **Ajouter la dépendance** dans `build.gradle`
2. **Créer l'implémentation** (ex: `MailgunEmailService`)
3. **Modifier la configuration** dans `EmailConfig.java`
4. **Changer la propriété** : `app.email.provider=mailgun`

**Aucun changement dans le code qui utilise `EmailService` !**

## Structure

```
notification/
├── config/
│   └── EmailConfig.java          # Configuration avec sélection de provider
├── service/
│   ├── EmailService.java         # Interface principale (abstraction)
│   ├── EmailException.java       # Exception personnalisée
│   └── email/
│       ├── SendGridEmailService.java  # Implémentation SendGrid
│       └── MailgunEmailService.java   # (futur) Implémentation Mailgun
```

## Configuration

### Variables d'environnement

```bash
# Sélectionner le provider (sendgrid par défaut)
EMAIL_PROVIDER=sendgrid  # ou mailgun, ses, etc.

# SendGrid (si provider=sendgrid)
SENDGRID_API_KEY=your-api-key-here

# Email sender configuration
EMAIL_FROM_ADDRESS=noreply@seyrura.com
EMAIL_FROM_NAME=Seyrura

# Frontend URL (pour les liens dans les emails)
FRONTEND_URL=http://localhost:4200
```

### application.yml

```yaml
app:
  email:
    provider: ${EMAIL_PROVIDER:sendgrid}  # sendgrid|mailgun|ses|...
    from-address: ${EMAIL_FROM_ADDRESS:noreply@seyrura.com}
    from-name: ${EMAIL_FROM_NAME:Seyrura}
  frontend:
    url: ${FRONTEND_URL:http://localhost:4200}

# SendGrid Configuration (only needed if provider=sendgrid)
sendgrid:
  api-key: ${SENDGRID_API_KEY:}

# Mailgun Configuration (for future use)
# mailgun:
#   api-key: ${MAILGUN_API_KEY:}
#   domain: ${MAILGUN_DOMAIN:}
```

## Utilisation

### Injection du service

```java
@Service
@RequiredArgsConstructor
public class InvitationService {
    
    // Injection de l'interface - le provider réel est transparent
    private final EmailService emailService;
    
    public void inviteMember(String email, String tenantName, String inviteLink) {
        // Le code reste identique, peu importe le provider !
        emailService.sendInvitationEmail(
            email,
            tenantName,
            inviteLink,
            "Admin User",
            "Bienvenue dans notre équipe!"
        );
    }
}
```

## Ajouter un Nouveau Provider

### Exemple : Ajouter Mailgun

1. **Ajouter la dépendance** dans `build.gradle`:
```gradle
dependencies {
    // Mailgun Java SDK
    implementation 'net.sargue:mailgun:1.10.0'
}
```

2. **Créer l'implémentation** `MailgunEmailService.java`:
```java
package ma.nafura.platform.collaboration.notification.service.email;

import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.collaboration.notification.service.EmailException;
// ... imports Mailgun

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
    public void sendInvitationEmail(...) {
        // Implémentation Mailgun
    }
    
    // ... autres méthodes
}
```

3. **Mettre à jour `EmailConfig.java`**:
```java
@Bean
@ConditionalOnMissingBean(EmailService.class)
public EmailService emailService(...) {
    switch (emailProvider.toLowerCase()) {
        case "sendgrid":
            // ... existing
        case "mailgun":
            MailgunClient mailgun = createMailgunClient();
            return new MailgunEmailService(mailgun, fromAddress, fromName);
        // ...
    }
}
```

4. **Changer la configuration**:
```yaml
app:
  email:
    provider: mailgun  # Au lieu de sendgrid
```

**C'est tout ! Aucun autre code à modifier.**

## Méthodes disponibles

### `sendInvitationEmail()`
Envoie un email d'invitation avec un lien d'acceptation.

```java
emailService.sendInvitationEmail(
    "user@example.com",      // toEmail
    "Mon Organisation",       // tenantName
    "https://app.nafura.com/invitations/accept?token=...",  // inviteLink
    "John Doe",              // inviterName
    "Message personnalisé"   // message (optional)
);
```

### `sendWelcomeEmail()`
Envoie un email de bienvenue à un nouveau membre.

```java
emailService.sendWelcomeEmail(
    "user@example.com",      // toEmail
    "Mon Organisation",       // tenantName
    "Jane Doe"               // userName
);
```

### `sendEmail()`
Méthode générique pour envoyer un email personnalisé.

```java
emailService.sendEmail(
    "user@example.com",      // toEmail
    "Sujet de l'email",      // subject
    "<h1>Contenu HTML</h1>", // htmlContent
    "Contenu texte"          // textContent (optional)
);
```

## Tests

Pour les tests, utilisez un mock de `EmailService`:

```java
@MockBean
private EmailService emailService;

@Test
void testInvitation() {
    // Le service sera mocké automatiquement
    // Vérifiez les appels avec Mockito
    verify(emailService).sendInvitationEmail(...);
}
```

## Providers Supportés

| Provider | Status | Configuration |
|----------|--------|---------------|
| **SendGrid** | ✅ Implémenté | `app.email.provider=sendgrid` |
| **Mailgun** | 🔜 À venir | `app.email.provider=mailgun` |
| **AWS SES** | 🔜 À venir | `app.email.provider=ses` |
| **Resend** | 🔜 À venir | `app.email.provider=resend` |

## Extensions futures

Le module est conçu pour être extensible:

- **SMS**: Ajouter `SmsService` interface et implémentations (Twilio, etc.)
- **Push Notifications**: Ajouter `PushNotificationService`
- **Webhooks**: Ajouter `WebhookService`
- **Templates externes**: Intégrer Thymeleaf ou autre moteur de templates

## Dependencies

- `com.sendgrid:sendgrid-java:4.10.1` - Client SendGrid
- Spring Boot Web (pour la configuration)

## Database Migration Note

Ce module suit la stratégie de migration **Liquibase** de la plateforme.
Actuellement, aucune migration dédiée n'est requise pour ce module.

