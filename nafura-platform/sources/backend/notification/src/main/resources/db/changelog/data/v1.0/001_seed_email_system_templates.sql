-- Seed system email templates (invitation, welcome)
-- tenant_id NULL = system template

INSERT INTO email_templates (id, tenant_id, code, name, subject, html_body, text_body, entity_type, is_system, created_at, updated_at)
SELECT gen_random_uuid(), NULL, 'invitation', 'Member Invitation', 'Invitation à rejoindre [(${tenant.name})] sur Seyrura',
    '<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
.container { max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; }
.header { background-color: #1976d2; color: white; padding: 30px 20px; text-align: center; }
.header h1 { margin: 0; font-size: 28px; font-weight: 600; }
.content { padding: 30px 20px; background-color: #ffffff; }
.content h2 { color: #1976d2; margin-top: 0; font-size: 24px; }
.button { display: inline-block; padding: 14px 28px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; font-size: 16px; }
.link-text { word-break: break-all; color: #1976d2; font-size: 12px; margin-top: 10px; }
.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0; }
.expiry-notice { margin-top: 20px; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107; font-size: 14px; }
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>Seyrura</h1></div>
<div class="content">
<h2>Vous êtes invité(e) à rejoindre <span th:text="${tenant.name}">Tenant</span></h2>
<p>Bonjour,</p>
<p><strong th:text="${inviter.name}">Inviter</strong> vous a invité(e) à rejoindre <strong th:text="${tenant.name}">Tenant</strong> sur Seyrura.</p>
<div th:if="${message}" style="margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-left: 4px solid #1976d2; font-style: italic;" th:utext="${message}">Message</div>
<div style="text-align: center; margin: 30px 0;">
<a th:href="${inviteLink}" class="button">Accepter l''invitation</a>
</div>
<p style="text-align: center; color: #666; font-size: 14px;">Ou copiez ce lien dans votre navigateur:</p>
<p class="link-text" th:text="${inviteLink}">Link</p>
<div class="expiry-notice"><strong>Cette invitation expire dans 7 jours.</strong></div>
</div>
<div class="footer">
<p>Cet email a été envoyé par Seyrura.</p>
</div>
</div>
</body>
</html>',
    'Vous êtes invité(e) à rejoindre [(${tenant.name})]

Bonjour,

[(${inviter.name})] vous a invité(e) à rejoindre [(${tenant.name})] sur Seyrura.

Pour accepter cette invitation, cliquez sur le lien suivant ou copiez-le dans votre navigateur:

[(${inviteLink})]

Cette invitation expire dans 7 jours.

---
Cet email a été envoyé par Seyrura.',
    NULL, true, now(), now()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE code = 'invitation' AND tenant_id IS NULL);

INSERT INTO email_templates (id, tenant_id, code, name, subject, html_body, text_body, entity_type, is_system, created_at, updated_at)
SELECT gen_random_uuid(), NULL, 'welcome', 'Welcome Email', 'Bienvenue dans [(${tenant.name})] sur Seyrura',
'<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
.content { padding: 20px; background-color: #f9f9f9; }
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>Bienvenue sur Seyrura</h1></div>
<div class="content">
<h2>Bienvenue <span th:text="${user.firstName}">User</span> !</h2>
<p>Votre compte a été activé avec succès dans <strong th:text="${tenant.name}">Tenant</strong>.</p>
<p>Vous pouvez maintenant accéder à toutes les fonctionnalités de votre organisation.</p>
</div>
</div>
</body>
</html>',
'Bienvenue sur Seyrura

Bonjour [(${user.firstName})],

Votre compte a été activé avec succès dans [(${tenant.name})].
Vous pouvez maintenant accéder à toutes les fonctionnalités de votre organisation.',
NULL, true, now(), now()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE code = 'welcome' AND tenant_id IS NULL);
