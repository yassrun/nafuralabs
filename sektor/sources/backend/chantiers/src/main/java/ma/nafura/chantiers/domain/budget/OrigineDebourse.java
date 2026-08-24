package ma.nafura.chantiers.domain.budget;

import java.util.Locale;

/**
 * D'où vient le déboursé prévu d'un nœud du chantier (AC-3, AC-6).
 *
 * <p>Les trois premières sont les {@code OrigineCout} de l'étude, reprises telles quelles à la
 * copie ; {@link #SAISI} n'existe que côté chantier, pour un nœud interne qui n'a aucun DPU
 * derrière lui.
 *
 * <p>L'origine ne dit pas si le déboursé est fiable : un coût déduit d'un prix de vente reste
 * {@code ESTIME} et porte en plus le drapeau « non fiable » du nœud (AC-3).
 */
public enum OrigineDebourse {
    /** Copié des composants du DPU, réparti sur les quatre rubriques (AC-2). */
    DECOMPOSE,
    /** Forfait de l'étude : tout le déboursé en sous-traitance (AC-3). */
    FORFAIT,
    /** Estimé : tout le déboursé en non ventilé (AC-3). */
    ESTIME,
    /** Saisi sur un nœud interne du chantier — aucune étude derrière (AC-6). */
    SAISI;

    public static OrigineDebourse parse(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        for (OrigineDebourse origine : values()) {
            if (origine.name().equals(normalized)) {
                return origine;
            }
        }
        throw new IllegalArgumentException("chantiers.debourse.origine_inconnue: " + value);
    }

    /** Un déboursé copié de l'étude ne se réécrit jamais après la conversion (AC-5, AC-7). */
    public boolean vientDeLEtude() {
        return this != SAISI;
    }
}
