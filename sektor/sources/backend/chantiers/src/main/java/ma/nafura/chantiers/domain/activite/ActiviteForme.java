package ma.nafura.chantiers.domain.activite;

import java.util.Locale;

/**
 * Forme d'une ligne de planning — gel 08/09 L1 (D06). Une phase groupe, une activité
 * travaille, un jalon marque un instant. Un parent déjà productif n'est pas converti
 * automatiquement en phase.
 */
public enum ActiviteForme {
    PHASE,
    ACTIVITE,
    JALON;

    public static final ActiviteForme DEFAUT_MIGRATION = ACTIVITE;

    public static ActiviteForme parse(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        for (ActiviteForme forme : values()) {
            if (forme.name().equals(normalized)) {
                return forme;
            }
        }
        throw new IllegalArgumentException("chantiers.activite.forme_inconnue: " + value);
    }

    public static ActiviteForme orDefault(ActiviteForme forme) {
        return forme != null ? forme : DEFAUT_MIGRATION;
    }

    public boolean estPhase() {
        return this == PHASE;
    }

    public boolean estJalon() {
        return this == JALON;
    }

    public boolean porteQuantite() {
        return this == ACTIVITE;
    }
}
