package ma.nafura.platform.collaboration.docmanager.template;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Normalised view of any printable business document, exposed to templates as
 * {@code ${document.*}} alongside the type-specific {@code ${entity.*}}.
 *
 * <p>This is what makes a shared header, footer or line table work across devis, facture,
 * bordereau and whatever comes next: without it every type names its fields differently and no
 * fragment can be reused. Product modules map their entity into this shape; fields that do not
 * apply stay {@code null} and fragments guard them with {@code th:if}.
 */
public record PrintDocument(
        String type,
        String libelleType,
        String numero,
        LocalDate date,
        LocalDate dateEcheance,
        String reference,
        String objet,
        Party client,
        List<Line> lignes,
        Totals totaux,
        String mentions,
        String statut,
        Integer version,
        /** Type-specific extras that do not fit the contract, still reachable as document.extra.x */
        Map<String, Object> extra) {

    public PrintDocument {
        lignes = lignes != null ? List.copyOf(lignes) : List.of();
        extra = extra != null ? Map.copyOf(extra) : Map.of();
    }

    public static Builder builder() {
        return new Builder();
    }

    /** Counterparty of the document (client, and later supplier for purchase documents). */
    public record Party(
            String raisonSociale,
            String ice,
            String adresse,
            String ville,
            String contact,
            String telephone,
            String email) {}

    /** One priced line. {@code montantHt} is authoritative: never recomputed by templates. */
    public record Line(
            String code,
            String designation,
            String unite,
            BigDecimal quantite,
            BigDecimal prixUnitaire,
            BigDecimal montantHt,
            BigDecimal tauxTva) {}

    /**
     * Document totals. {@code enLettres} is produced server-side by {@link AmountInWords} —
     * spelling an amount is a legal requirement on invoices and must not be left to whoever
     * writes the template.
     */
    public record Totals(
            BigDecimal ht,
            BigDecimal tva,
            BigDecimal ttc,
            BigDecimal tauxTva,
            BigDecimal remise,
            String enLettres) {}

    public static final class Builder {
        private String type;
        private String libelleType;
        private String numero;
        private LocalDate date;
        private LocalDate dateEcheance;
        private String reference;
        private String objet;
        private Party client;
        private List<Line> lignes = List.of();
        private Totals totaux;
        private String mentions;
        private String statut;
        private Integer version;
        private Map<String, Object> extra = Map.of();

        public Builder type(String v) {
            this.type = v;
            return this;
        }

        public Builder libelleType(String v) {
            this.libelleType = v;
            return this;
        }

        public Builder numero(String v) {
            this.numero = v;
            return this;
        }

        public Builder date(LocalDate v) {
            this.date = v;
            return this;
        }

        public Builder dateEcheance(LocalDate v) {
            this.dateEcheance = v;
            return this;
        }

        public Builder reference(String v) {
            this.reference = v;
            return this;
        }

        public Builder objet(String v) {
            this.objet = v;
            return this;
        }

        public Builder client(Party v) {
            this.client = v;
            return this;
        }

        public Builder lignes(List<Line> v) {
            this.lignes = v;
            return this;
        }

        public Builder totaux(Totals v) {
            this.totaux = v;
            return this;
        }

        public Builder mentions(String v) {
            this.mentions = v;
            return this;
        }

        public Builder statut(String v) {
            this.statut = v;
            return this;
        }

        public Builder version(Integer v) {
            this.version = v;
            return this;
        }

        public Builder extra(Map<String, Object> v) {
            this.extra = v;
            return this;
        }

        public PrintDocument build() {
            return new PrintDocument(
                    type,
                    libelleType,
                    numero,
                    date,
                    dateEcheance,
                    reference,
                    objet,
                    client,
                    lignes,
                    totaux,
                    mentions,
                    statut,
                    version,
                    extra);
        }
    }
}
