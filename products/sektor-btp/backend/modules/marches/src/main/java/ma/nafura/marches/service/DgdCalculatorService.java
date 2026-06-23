package ma.nafura.marches.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;

/**
 * B-MAR-04 — net à payer DGD :
 * cumul_situations + cumul_revisions − cumul_rg − cumul_penalites + reprises_rg
 * (reprises RG créditées au titulaire).
 */
@Service
public class DgdCalculatorService {

    private static final int SCALE = 4;

    public BigDecimal computeMontantNetAPayer(
            BigDecimal cumulSituationsTtc,
            BigDecimal cumulRetenueGarantie,
            BigDecimal cumulRevisionK,
            BigDecimal cumulPenalites,
            BigDecimal reprisesRg) {
        BigDecimal situations = nz(cumulSituationsTtc);
        BigDecimal rg = nz(cumulRetenueGarantie);
        BigDecimal revision = nz(cumulRevisionK);
        BigDecimal penalites = nz(cumulPenalites);
        BigDecimal reprises = nz(reprisesRg);
        return situations
                .add(revision)
                .subtract(rg)
                .subtract(penalites)
                .add(reprises)
                .setScale(SCALE, RoundingMode.HALF_UP);
    }

    public void applyComputedNet(DgdMarcheFields target) {
        target.setMontantNetAPayer(computeMontantNetAPayer(
                target.getCumulSituationsTtc(),
                target.getCumulRetenueGarantie(),
                target.getCumulRevisionK(),
                target.getCumulPenalites(),
                target.getReprisesRg()));
    }

    public interface DgdMarcheFields {
        BigDecimal getCumulSituationsTtc();

        BigDecimal getCumulRetenueGarantie();

        BigDecimal getCumulRevisionK();

        BigDecimal getCumulPenalites();

        BigDecimal getReprisesRg();

        void setMontantNetAPayer(BigDecimal montantNetAPayer);
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
