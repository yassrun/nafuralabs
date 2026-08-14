package ma.nafura.platform.collaboration.docmanager.api.request;

import java.util.List;

/**
 * What a tenant administrator can change about their documents, without writing any markup.
 *
 * <p>Everything here is structured data. Free text fields are plain text with {@code {{token}}}
 * placeholders drawn from a closed list — never HTML, never a template expression. The server
 * escapes the text and generates the header and footer fragments from these values.
 */
public record DocumentSettingsPayload(
        Header header, Footer footer, Appearance appearance, Lines lines, Page page) {

    public DocumentSettingsPayload {
        header = header != null ? header : Header.defaults();
        footer = footer != null ? footer : Footer.defaults();
        appearance = appearance != null ? appearance : Appearance.defaults();
        lines = lines != null ? lines : Lines.defaults();
        page = page != null ? page : Page.defaults();
    }

    public static DocumentSettingsPayload defaults() {
        return new DocumentSettingsPayload(null, null, null, null, null);
    }

    /** Where the logo sits and which identifiers appear next to it. */
    public record Header(String layout, boolean showLogo, List<String> fields) {

        public static final String LAYOUT_LOGO_LEFT = "LOGO_LEFT";
        public static final String LAYOUT_LOGO_CENTER = "LOGO_CENTER";
        public static final String LAYOUT_LOGO_RIGHT = "LOGO_RIGHT";

        public Header {
            layout = layout != null ? layout : LAYOUT_LOGO_LEFT;
            fields = fields != null ? List.copyOf(fields) : List.of();
        }

        public static Header defaults() {
            return new Header(
                    LAYOUT_LOGO_LEFT, true, List.of("adresse", "ville", "telephone", "email"));
        }
    }

    /**
     * @param text plain text with {@code {{token}}} placeholders; escaped before rendering
     */
    public record Footer(String text, boolean showPageNumber, boolean showLegalIdentifiers) {

        public static Footer defaults() {
            return new Footer("", true, true);
        }
    }

    /** Font family is a closed list: the PDF renderer only has the embedded families. */
    public record Appearance(String accentColor, String fontFamily, Integer baseFontSizePt) {

        public Appearance {
            accentColor = accentColor != null ? accentColor : "#1a1a1a";
            fontFamily = fontFamily != null ? fontFamily : "sans-serif";
            baseFontSizePt = baseFontSizePt != null ? baseFontSizePt : 10;
        }

        public static Appearance defaults() {
            return new Appearance(null, null, null);
        }
    }

    /** Which columns the line table shows, in order. */
    public record Lines(List<String> columns, boolean showRemise, boolean showTva) {

        public Lines {
            columns = columns != null ? List.copyOf(columns) : List.of();
        }

        public static Lines defaults() {
            return new Lines(
                    List.of("code", "designation", "unite", "quantite", "prixUnitaire", "montantHt"),
                    false,
                    true);
        }
    }

    public record Page(
            String paperSize,
            String orientation,
            Integer marginTop,
            Integer marginRight,
            Integer marginBottom,
            Integer marginLeft) {

        public Page {
            paperSize = paperSize != null ? paperSize : "A4";
            orientation = orientation != null ? orientation : "portrait";
            marginTop = marginTop != null ? marginTop : 15;
            marginRight = marginRight != null ? marginRight : 12;
            marginBottom = marginBottom != null ? marginBottom : 15;
            marginLeft = marginLeft != null ? marginLeft : 12;
        }

        public static Page defaults() {
            return new Page(null, null, null, null, null, null);
        }

        public String toMarginsCss() {
            return marginTop + "mm " + marginRight + "mm " + marginBottom + "mm " + marginLeft + "mm";
        }
    }
}
