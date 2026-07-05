# Notification Module

Emails transactionnels via **Brevo** (API REST). Clé : Vault `platform/integrations/email/brevo` → `BREVO_API_KEY`.

## Configuration

```yaml
app:
  email:
    provider: brevo   # alias: sendinblue
    from-address: noreply@nafuralabs.com
    from-name: Nafura

brevo:
  api-key: ${BREVO_API_KEY:}
```

Sans clé API → no-op (logs warning, pas d'envoi).

## Structure

```
notification/
├── config/EmailConfig.java
├── service/EmailService.java
└── service/email/BrevoEmailService.java
```

## Utilisation

```java
@RequiredArgsConstructor
public class InvitationService {
    private final EmailService emailService;

    public void inviteMember(String email, String tenantName, String inviteLink) {
        emailService.sendInvitationEmail(email, tenantName, inviteLink, "Admin", null);
    }
}
```

## Ajouter un autre provider

Voir [ADDING_NEW_PROVIDER.md](ADDING_NEW_PROVIDER.md).

## Vault (prod / staging)

```bash
vault kv put secret/nafura/prod/platform/integrations/email/brevo api_key="xkeysib-..."
```

Détail : [docs/VAULT_SECRETS.md](../../../../../docs/VAULT_SECRETS.md).
