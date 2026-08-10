package ma.nafura.catalogue.service;

import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

/** Métriques L16 — taux d'appel LLM sur rapprochement. */
@Component
public class RapprochementLlmMetrics {

    private final AtomicLong recherches = new AtomicLong();
    private final AtomicLong llmAppels = new AtomicLong();
    private final AtomicLong llmSkipsDeterministe = new AtomicLong();

    public void incrementRecherche() {
        recherches.incrementAndGet();
    }

    public void incrementLlmAppel() {
        llmAppels.incrementAndGet();
    }

    public void incrementSkipDeterministe() {
        llmSkipsDeterministe.incrementAndGet();
    }

    public long recherches() {
        return recherches.get();
    }

    public long llmAppels() {
        return llmAppels.get();
    }

    public long llmSkipsDeterministe() {
        return llmSkipsDeterministe.get();
    }

    /** Ratio appels LLM / recherches (0 si aucune recherche). */
    public double tauxAppelLlm() {
        long r = recherches.get();
        if (r == 0) {
            return 0.0;
        }
        return (double) llmAppels.get() / (double) r;
    }

    public void reset() {
        recherches.set(0);
        llmAppels.set(0);
        llmSkipsDeterministe.set(0);
    }
}
