package ma.nafura.finance.service.bank;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class BankStatementImportParser {

    private static final Pattern OFX_BLOCK = Pattern.compile("<STMTTRN>([\\s\\S]*?)</STMTTRN>", Pattern.CASE_INSENSITIVE);
    private static final Pattern TAG = Pattern.compile("<([A-Z]+)>([^<\\n]+)</\\1>", Pattern.CASE_INSENSITIVE);

    public List<ImportedStatementLine> parse(String fileName, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Import file is empty");
        }
        String lower = fileName == null ? "" : fileName.toLowerCase();
        if (lower.endsWith(".ofx") || lower.endsWith(".qfx") || content.contains("<OFX") || content.contains("OFXHEADER")) {
            return parseOfx(content);
        }
        return parseCsv(content);
    }

    public List<ImportedStatementLine> parseCsv(String content) {
        String[] lines = content.split("\\r?\\n");
        if (lines.length < 2) {
            return List.of();
        }
        String header = lines[0].toLowerCase();
        char sep = header.contains(";") ? ';' : ',';
        List<ImportedStatementLine> rows = new ArrayList<>();
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            String[] cols = line.split(String.valueOf(sep), -1);
            if (cols.length < 3) continue;
            LocalDate date = parseDate(cols[0].trim());
            String libelle = cols.length > 1 ? cols[1].trim() : "Opération";
            String reference = cols.length > 4 ? cols[4].trim() : null;
            BigDecimal recette = BigDecimal.ZERO;
            BigDecimal depense = BigDecimal.ZERO;
            if (cols.length >= 4) {
                BigDecimal debit = parseAmount(cols[2]);
                BigDecimal credit = parseAmount(cols[3]);
                recette = credit;
                depense = debit;
            } else {
                BigDecimal amt = parseAmount(cols[2]);
                if (amt.signum() >= 0) {
                    recette = amt;
                } else {
                    depense = amt.abs();
                }
            }
            if (recette.signum() == 0 && depense.signum() == 0) continue;
            rows.add(new ImportedStatementLine(date, libelle, reference, recette, depense));
        }
        return rows;
    }

    public List<ImportedStatementLine> parseOfx(String content) {
        List<ImportedStatementLine> rows = new ArrayList<>();
        Matcher matcher = OFX_BLOCK.matcher(content);
        while (matcher.find()) {
            String block = matcher.group(1);
            String dt = pickTag(block, "DTPOSTED");
            if (dt == null) {
                dt = pickTag(block, "DTUSER");
            }
            String amtStr = pickTag(block, "TRNAMT");
            if (dt == null || amtStr == null) continue;
            BigDecimal amt = new BigDecimal(amtStr.replace(',', '.'));
            String trnType = pickTag(block, "TRNTYPE");
            String name = pickTag(block, "NAME");
            String memo = pickTag(block, "MEMO");
            String libelle = join(name, memo);
            BigDecimal recette = BigDecimal.ZERO;
            BigDecimal depense = BigDecimal.ZERO;
            if (amt.signum() >= 0) {
                if (isDebitType(trnType)) {
                    depense = amt;
                } else {
                    recette = amt;
                }
            } else {
                depense = amt.abs();
            }
            if (recette.signum() == 0 && depense.signum() == 0) continue;
            rows.add(new ImportedStatementLine(
                    ofxDateToLocalDate(dt),
                    libelle,
                    pickTag(block, "FITID"),
                    round(recette),
                    round(depense)));
        }
        return rows;
    }

    private static boolean isDebitType(String trnType) {
        if (trnType == null) return false;
        String t = trnType.toUpperCase();
        return t.equals("DEBIT") || t.equals("WITHDRAWAL") || t.equals("POS");
    }

    private static String pickTag(String block, String tag) {
        Matcher m = Pattern.compile("<" + tag + ">([^<\\n]+)</" + tag + ">", Pattern.CASE_INSENSITIVE)
                .matcher(block);
        return m.find() ? m.group(1).trim() : null;
    }

    private static LocalDate ofxDateToLocalDate(String ofxDt) {
        String d = ofxDt.replaceAll("\\[.*$", "").trim();
        if (d.length() >= 8) {
            return LocalDate.of(
                    Integer.parseInt(d.substring(0, 4)),
                    Integer.parseInt(d.substring(4, 6)),
                    Integer.parseInt(d.substring(6, 8)));
        }
        return LocalDate.now();
    }

    private static LocalDate parseDate(String raw) {
        if (raw.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return LocalDate.parse(raw);
        }
        if (raw.matches("\\d{2}/\\d{2}/\\d{4}")) {
            String[] p = raw.split("/");
            return LocalDate.of(Integer.parseInt(p[2]), Integer.parseInt(p[1]), Integer.parseInt(p[0]));
        }
        return LocalDate.now();
    }

    private static BigDecimal parseAmount(String raw) {
        if (raw == null || raw.isBlank()) return BigDecimal.ZERO;
        return new BigDecimal(raw.replace(" ", "").replace(',', '.'));
    }

    private static BigDecimal round(BigDecimal v) {
        return v.setScale(4, RoundingMode.HALF_UP);
    }

    private static String join(String a, String b) {
        if (a == null || a.isBlank()) return b != null ? b : "Opération";
        if (b == null || b.isBlank()) return a;
        return a + " — " + b;
    }
}
