# Guide : ajouter un provider email

Provider actuel : **Brevo** (`BrevoEmailService` + `app.email.provider=brevo`).

## Étapes

### 1. Dépendance dans `notification/build.gradle`

### 2. Implémentation `XxxEmailService implements EmailService` dans `service/email/`

### 3. Case dans `EmailConfig.java`

```java
switch (emailProvider.toLowerCase()) {
    case "brevo":
    case "sendinblue":
        return new BrevoEmailService(brevoApiKey.trim(), fromAddress, fromName, templateService);
    case "mailgun":  // exemple futur
        return new MailgunEmailService(...);
    default:
        throw new IllegalStateException("Unsupported email provider: " + emailProvider);
}
```

### 4. Vault (si secrets centralisés)

```
secret/nafura/{env}/platform/integrations/email/{provider}
```

Policy backend : ajouter le path read dans `vault-init-job.yaml` / `vault-sync-job.yaml`.

### 5. `application.yml` du produit

```yaml
app:
  email:
    provider: mailgun
```

Aucun changement dans le code métier qui injecte `EmailService`.
