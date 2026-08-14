package ma.nafura.sektor.socle.port;

import java.util.UUID;

/** Port socle : plan comptable. Impl dans finance. */
public interface FinanceOnboardingPort {

    void resetChartToSeed();

    boolean hasChart(UUID tenantId);
}
