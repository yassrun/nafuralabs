package ma.nafura.platform.collaboration.notification.service.email;

/**
 * Fallback HTML/text bodies when DB email templates are unavailable.
 */
final class BuiltInEmailTemplates {

    private BuiltInEmailTemplates() {}

    static String invitationHtml(String tenantName, String inviteLink, String inviterName, String message) {
        String inviterText = inviterName != null && !inviterName.isBlank() ? inviterName : "Un administrateur";
        String messageHtml = message != null && !message.isBlank()
            ? String.format(
                "<p style=\"margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-left: 4px solid #1976d2; font-style: italic;\">%s</p>",
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
                    .header { background-color: #1976d2; color: white; padding: 30px 20px; text-align: center; }
                    .content { padding: 30px 20px; }
                    .button { display: inline-block; padding: 14px 28px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h1>Nafura</h1></div>
                    <div class="content">
                        <h2>Vous êtes invité(e) à rejoindre %s</h2>
                        <p><strong>%s</strong> vous a invité(e) à rejoindre <strong>%s</strong>.</p>
                        %s
                        <p style="text-align: center;"><a href="%s" class="button">Accepter l'invitation</a></p>
                        <p style="word-break: break-all; font-size: 12px;">%s</p>
                    </div>
                    <div class="footer"><p>Cet email a été envoyé par Nafura.</p></div>
                </div>
            </body>
            </html>
            """, tenantName, inviterText, tenantName, messageHtml, inviteLink, inviteLink);
    }

    static String invitationText(String tenantName, String inviteLink, String inviterName, String message) {
        String inviterText = inviterName != null && !inviterName.isBlank() ? inviterName : "Un administrateur";
        String messageText = message != null && !message.isBlank() ? String.format("\n\nMessage:\n%s\n", message) : "";
        return String.format("""
            Vous êtes invité(e) à rejoindre %s

            %s vous a invité(e) à rejoindre %s sur Nafura.%s

            %s
            """, tenantName, inviterText, tenantName, messageText, inviteLink);
    }

    static String welcomeHtml(String tenantName, String userName) {
        return String.format("""
            <!DOCTYPE html>
            <html><body style="font-family: Arial, sans-serif;">
            <h2>Bienvenue %s !</h2>
            <p>Votre compte a été activé dans <strong>%s</strong>.</p>
            </body></html>
            """, userName, tenantName);
    }

    static String welcomeText(String tenantName, String userName) {
        return String.format("Bienvenue %s — votre compte est actif dans %s.", userName, tenantName);
    }

    private static String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
