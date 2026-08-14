package ma.nafura.platform.collaboration.docmanager.template;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class AmountInWordsTest {

    private static String dh(String amount) {
        return AmountInWords.spellDirhams(new BigDecimal(amount));
    }

    @Test
    void spellsSmallAmounts() {
        assertThat(dh("0")).isEqualTo("zéro dirham");
        assertThat(dh("1")).isEqualTo("un dirham");
        assertThat(dh("2")).isEqualTo("deux dirhams");
        assertThat(dh("16")).isEqualTo("seize dirhams");
    }

    @Test
    void appliesFrenchTensIrregularities() {
        assertThat(dh("21")).isEqualTo("vingt et un dirhams");
        assertThat(dh("71")).isEqualTo("soixante et onze dirhams");
        assertThat(dh("80")).isEqualTo("quatre-vingts dirhams");
        assertThat(dh("81")).isEqualTo("quatre-vingt-un dirhams");
        assertThat(dh("91")).isEqualTo("quatre-vingt-onze dirhams");
        assertThat(dh("99")).isEqualTo("quatre-vingt-dix-neuf dirhams");
    }

    @Test
    void appliesHundredAndThousandRules() {
        assertThat(dh("100")).isEqualTo("cent dirhams");
        assertThat(dh("200")).isEqualTo("deux cents dirhams");
        assertThat(dh("201")).isEqualTo("deux cent un dirhams");
        assertThat(dh("1000")).isEqualTo("mille dirhams");
        assertThat(dh("2000")).isEqualTo("deux mille dirhams");
        assertThat(dh("120000")).isEqualTo("cent vingt mille dirhams");
    }

    @Test
    void spellsSeventeenToNineteen() {
        assertThat(dh("17")).isEqualTo("dix-sept dirhams");
        assertThat(dh("79")).isEqualTo("soixante-dix-neuf dirhams");
    }

    /** million/milliard are nouns: "de" appears only when they end the number. */
    @Test
    void spellsMillionsAndBillions() {
        assertThat(dh("1000000")).isEqualTo("un million de dirhams");
        assertThat(dh("2000000")).isEqualTo("deux millions de dirhams");
        assertThat(dh("2500000")).isEqualTo("deux millions cinq cent mille dirhams");
        assertThat(dh("1000000000")).isEqualTo("un milliard de dirhams");
    }

    /** vingt and cent lose their -s before mille. */
    @Test
    void keepsMultipliersInvariableBeforeScaleWords() {
        assertThat(dh("80000")).isEqualTo("quatre-vingt mille dirhams");
        assertThat(dh("500000")).isEqualTo("cinq cent mille dirhams");
        assertThat(dh("80")).isEqualTo("quatre-vingts dirhams");
        assertThat(dh("500")).isEqualTo("cinq cents dirhams");
    }

    @Test
    void spellsCentimes() {
        assertThat(dh("120000.50")).isEqualTo("cent vingt mille dirhams et cinquante centimes");
        assertThat(dh("1.01")).isEqualTo("un dirham et un centime");
    }

    @Test
    void roundsToTwoDecimalsHalfUp() {
        assertThat(dh("1.005")).isEqualTo("un dirham et un centime");
        assertThat(dh("0.994")).isEqualTo("zéro dirham et quatre-vingt-dix-neuf centimes");
    }

    @Test
    void handlesNegativeAndNull() {
        assertThat(dh("-5")).isEqualTo("moins cinq dirhams");
        assertThat(AmountInWords.spellDirhams(null)).isEmpty();
    }

    @Test
    void honoursCustomCurrencyWords() {
        assertThat(AmountInWords.spell(new BigDecimal("3.20"), "euro", "cent"))
                .isEqualTo("trois euros et vingt cents");
    }
}
