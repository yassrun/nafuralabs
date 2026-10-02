package ma.nafura.platform.framework.record;

import java.math.BigDecimal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.BeanWrapperImpl;

/** {@code field op value} on a record, e.g. {@code amount > 10000} or {@code category == 'IT'}. Empty: true. */
final class Condition {

    private static final Pattern EXPRESSION = Pattern.compile("^\\s*(\\w+)\\s*(>=|<=|==|!=|>|<)\\s*(.+?)\\s*$");

    private Condition() {
    }

    static boolean holds(String expression, Object record) {
        if (expression == null || expression.isBlank()) {
            return true;
        }
        Matcher m = EXPRESSION.matcher(expression);
        if (!m.matches()) {
            throw new IllegalStateException("Unreadable condition: " + expression);
        }
        Object actual = new BeanWrapperImpl(record).getPropertyValue(m.group(1));
        String expected = m.group(3).replaceAll("^'(.*)'$", "$1");
        int comparison;
        if (actual instanceof Number number) {
            comparison = new BigDecimal(number.toString()).compareTo(new BigDecimal(expected));
        } else if (actual == null) {
            return "!=".equals(m.group(2)) != "null".equals(expected);
        } else {
            comparison = actual.toString().compareTo(expected);
        }
        return switch (m.group(2)) {
            case ">" -> comparison > 0;
            case ">=" -> comparison >= 0;
            case "<" -> comparison < 0;
            case "<=" -> comparison <= 0;
            case "==" -> comparison == 0;
            default -> comparison != 0;
        };
    }
}
