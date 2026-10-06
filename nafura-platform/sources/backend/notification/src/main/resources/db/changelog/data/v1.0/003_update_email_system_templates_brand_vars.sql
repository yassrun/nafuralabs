-- Use brand.primary (org branding) instead of hardcoded #1976d2 in system templates.

UPDATE email_templates SET
  html_body = '<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
.container { max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; }
.header { color: white; padding: 30px 20px; text-align: center; }
.header h1 { margin: 0; font-size: 28px; font-weight: 600; }
.content { padding: 30px 20px; background-color: #ffffff; }
.content h2 { margin-top: 0; font-size: 24px; }
.button { display: inline-block; padding: 14px 28px; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; font-size: 16px; }
.link-text { word-break: break-all; font-size: 12px; margin-top: 10px; }
.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0; }
.expiry-notice { margin-top: 20px; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107; font-size: 14px; }
</style>
</head>
<body>
<div class="container">
<div class="header" th:style="|background-color: ${brand.primary};|"><h1 th:text="${product.name}">Product</h1></div>
<div class="content">
<h2 th:style="|color: ${brand.primary};|">Vous êtes invité(e) à rejoindre <span th:text="${tenant.name}">Tenant</span></h2>
<p>Bonjour,</p>
<p><strong th:text="${inviter.name}">Inviter</strong> vous a invité(e) à rejoindre <strong th:text="${tenant.name}">Tenant</strong> sur <span th:text="${product.name}">Product</span>.</p>
<div th:if="${message}" th:style="|margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-left: 4px solid ${brand.primary}; font-style: italic;|" th:utext="${message}">Message</div>
<div style="text-align: center; margin: 30px 0;">
<a th:href="${inviteLink}" class="button" th:style="|background-color: ${brand.primary};|">Accepter l''invitation</a>
</div>
<p style="text-align: center; color: #666; font-size: 14px;">Ou copiez ce lien dans votre navigateur:</p>
<p class="link-text" th:style="|color: ${brand.primary};|" th:text="${inviteLink}">Link</p>
<div class="expiry-notice"><strong>Cette invitation expire dans <span th:text="${expiryDays}">7</span> jours.</strong></div>
</div>
<div class="footer">
<p>Cet email a été envoyé par <span th:text="${product.name}">Product</span>.</p>
</div>
</div>
</body>
</html>',
  updated_at = now()
WHERE code = 'invitation' AND tenant_id IS NULL;

UPDATE email_templates SET
  html_body = '<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { color: white; padding: 20px; text-align: center; }
.content { padding: 20px; background-color: #f9f9f9; }
</style>
</head>
<body>
<div class="container">
<div class="header" th:style="|background-color: ${brand.primary};|"><h1>Bienvenue sur <span th:text="${product.name}">Product</span></h1></div>
<div class="content">
<h2>Bienvenue <span th:text="${user.firstName}">User</span> !</h2>
<p>Votre compte a été activé avec succès dans <strong th:text="${tenant.name}">Tenant</strong>.</p>
<p>Vous pouvez maintenant accéder à toutes les fonctionnalités de votre organisation.</p>
</div>
</div>
</body>
</html>',
  updated_at = now()
WHERE code = 'welcome' AND tenant_id IS NULL;
