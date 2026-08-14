package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Simplified Moroccan payroll calculation aligned with frontend {@code computePaieFields}.
 */
public final class FichePaieCalculator {

    private static final BigDecimal CNSS_RATE = new BigDecimal("0.0448");
    private static final BigDecimal AMO_RATE = new BigDecimal("0.0226");
    private static final BigDecimal CNSS_PLAFOND = new BigDecimal("6000");
    private static final int SCALE = 2;

    private FichePaieCalculator() {}

    public record PaieComputed(
            BigDecimal salaireBrut,
            BigDecimal cotisationCnss,
            BigDecimal cotisationAmo,
            BigDecimal totalRetenues,
            BigDecimal salaireNetImposable,
            BigDecimal igr,
            BigDecimal salaireNetAPayer) {}

    public static PaieComputed compute(
            BigDecimal salaireBase,
            BigDecimal indemniteRepresentation,
            BigDecimal indemniteTransport,
            BigDecimal montantHeuresSup) {
        BigDecimal base = nz(salaireBase);
        BigDecimal rep = nz(indemniteRepresentation);
        BigDecimal transport = nz(indemniteTransport);
        BigDecimal heuresSup = nz(montantHeuresSup);

        BigDecimal salaireBrut = round2(base.add(rep).add(transport).add(heuresSup));
        BigDecimal cotisationCnss = round2(base.min(CNSS_PLAFOND).multiply(CNSS_RATE));
        BigDecimal cotisationAmo = round2(salaireBrut.multiply(AMO_RATE));
        BigDecimal totalRetenues = round2(cotisationCnss.add(cotisationAmo));
        BigDecimal salaireNetImposable = round2(salaireBrut.subtract(totalRetenues));
        BigDecimal igr = round2(computeIgrMensuel(salaireNetImposable));
        BigDecimal salaireNetAPayer = round2(salaireNetImposable.subtract(igr));

        return new PaieComputed(
                salaireBrut,
                cotisationCnss,
                cotisationAmo,
                totalRetenues,
                salaireNetImposable,
                igr,
                salaireNetAPayer);
    }

    static BigDecimal computeIgrMensuel(BigDecimal salaireNetImposable) {
        BigDecimal annual = salaireNetImposable.multiply(new BigDecimal("12"));
        BigDecimal igrAnnual;
        if (annual.compareTo(new BigDecimal("30000")) <= 0) {
            igrAnnual = BigDecimal.ZERO;
        } else if (annual.compareTo(new BigDecimal("50000")) <= 0) {
            igrAnnual = annual.multiply(new BigDecimal("0.10")).subtract(new BigDecimal("3000"));
        } else if (annual.compareTo(new BigDecimal("60000")) <= 0) {
            igrAnnual = annual.multiply(new BigDecimal("0.20")).subtract(new BigDecimal("8000"));
        } else if (annual.compareTo(new BigDecimal("80000")) <= 0) {
            igrAnnual = annual.multiply(new BigDecimal("0.30")).subtract(new BigDecimal("14000"));
        } else if (annual.compareTo(new BigDecimal("180000")) <= 0) {
            igrAnnual = annual.multiply(new BigDecimal("0.34")).subtract(new BigDecimal("17200"));
        } else {
            igrAnnual = annual.multiply(new BigDecimal("0.38")).subtract(new BigDecimal("24400"));
        }
        if (igrAnnual.compareTo(BigDecimal.ZERO) < 0) {
            igrAnnual = BigDecimal.ZERO;
        }
        return igrAnnual.divide(new BigDecimal("12"), SCALE, RoundingMode.HALF_UP);
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static BigDecimal round2(BigDecimal value) {
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }
}
