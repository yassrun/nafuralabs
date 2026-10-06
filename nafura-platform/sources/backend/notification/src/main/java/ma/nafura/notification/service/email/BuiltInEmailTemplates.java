package ma.nafura.platform.collaboration.notification.service.email;

/**
 * Fallback HTML/text bodies when DB email templates are unavailable.
 * Same variables as system seeds: product.name, tenant.name, brand.*, inviter, inviteLink, message, expiryDays.
 */
final class BuiltInEmailTemplates {

    private BuiltInEmailTemplates() {}

    static String invitationHtml(
            String productName,
            String tenantName,
            String inviteLink,
            String inviterName,
            String message,
            int expiryDays,
            String primaryColor) {
        String product = blankToDefault(productName, "Nafura");
        String tenant = blankToDefault(tenantName, "Organization");
        String inviterText = blankToDefault(inviterName, "Un administrateur");
        String link = inviteLink != null ? inviteLink : "";
        String primary = blankToDefault(primaryColor, "#1d4ed8");
        String messageHtml = message != null && !message.isBlank()
            ? String.format(
                "<div style=\"margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-left: 4px solid %s; font-style: italic;\">%s</div>",
                primary,
                escapeHtml(message))
            : "";

        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                    .header { color: white; padding: 30px 20px; text-align: center; }
                    .content { padding: 30px 20px; }
                    .button { display: inline-block; padding: 14px 28px; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
                    .link-text { word-break: break-all; font-size: 12px; }
                    .expiry-notice { margin-top: 20px; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107; font-size: 14px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header" style="background-color: %s;"><h1>%s</h1></div>
                    <div class="content">
                        <h2 style="color: %s;">Vous êtes invité(e) à rejoindre %s</h2>
                        <p>Bonjour,</p>
                        <p><strong>%s</strong> vous a invité(e) à rejoindre <strong>%s</strong> sur %s.</p>
                        %s
                        <p style="text-align: center;"><a href="%s" class="button" style="background-color: %s;">Accepter l'invitation</a></p>
                        <p style="text-align: center; color: #666; font-size: 14px;">Ou copiez ce lien dans votre navigateur:</p>
                        <p class="link-text" style="color: %s;">%s</p>
                        <div class="expiry-notice"><strong>Cette invitation expire dans %d jours.</strong></div>
                    </div>
                    <div class="footer"><p>Cet email a été envoyé par %s.</p></div>
                </div>
            </body>
            </html>
            """,
            primary,
            escapeHtml(product),
            primary,
            escapeHtml(tenant),
            escapeHtml(inviterText),
            escapeHtml(tenant),
            escapeHtml(product),
            messageHtml,
            link,
            primary,
            primary,
            link,
            expiryDays,
            escapeHtml(product));
    }

    static String invitationText(
            String productName,
            String tenantName,
            String inviteLink,
            String inviterName,
            String message,
            int expiryDays) {
        String product = blankToDefault(productName, "Nafura");
        String tenant = blankToDefault(tenantName, "Organization");
        String inviterText = blankToDefault(inviterName, "Un administrateur");
        String link = inviteLink != null ? inviteLink : "";
        String messageText = message != null && !message.isBlank() ? String.format("\n\nMessage:\n%s\n", message) : "";
        return String.format("""
            Vous êtes invité(e) à rejoindre %s

            %s vous a invité(e) à rejoindre %s sur %s.%s

            Pour accepter cette invitation, cliquez sur le lien suivant ou copiez-le dans votre navigateur:

            %s

            Cette invitation expire dans %d jours.

            ---
            Cet email a été envoyé par %s.
            """, tenant, inviterText, tenant, product, messageText, link, expiryDays, product);
    }

    static String invitationSubject(String productName, String tenantName) {
        return String.format(
            "Invitation à rejoindre %s sur %s",
            blankToDefault(tenantName, "Organization"),
            blankToDefault(productName, "Nafura"));
    }

    static String welcomeHtml(
            String productName,
            String tenantName,
            String userName,
            String primaryColor) {
        String product = blankToDefault(productName, "Nafura");
        String tenant = blankToDefault(tenantName, "Organization");
        String user = blankToDefault(userName, "User");
        String primary = blankToDefault(primaryColor, "#1d4ed8");
        return String.format("""
            <!DOCTYPE html>
            <html><body style="font-family: Arial, sans-serif;">
            <div style="background-color: %s; color: white; padding: 20px; text-align: center;">
            <h2 style="margin:0;">Bienvenue sur %s</h2>
            </div>
            <p>Bienvenue %s !</p>
            <p>Votre compte a été activé dans <strong>%s</strong>.</p>
            </body></html>
            """, primary, escapeHtml(product), escapeHtml(user), escapeHtml(tenant));
    }

    static String welcomeText(String productName, String tenantName, String userName) {
        return String.format(
            "Bienvenue sur %s — %s, votre compte est actif dans %s.",
            blankToDefault(productName, "Nafura"),
            blankToDefault(userName, "User"),
            blankToDefault(tenantName, "Organization"));
    }

    static String welcomeSubject(String productName, String tenantName) {
        return String.format(
            "Bienvenue dans %s sur %s",
            blankToDefault(tenantName, "Organization"),
            blankToDefault(productName, "Nafura"));
    }

    private static String blankToDefault(String value, String fallback) {
        return value != null && !value.isBlank() ? value.trim() : fallback;
    }

    private static String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
