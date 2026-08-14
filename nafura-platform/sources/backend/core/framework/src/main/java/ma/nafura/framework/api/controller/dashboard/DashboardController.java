package ma.nafura.platform.framework.api.controller.dashboard;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Cross-domain home dashboard aggregation.
 * Returns KPIs and chart data; only includes data for activated domains.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        // Stub: when finance/other domains are implemented, aggregate from activated domains only.
        Map<String, Object> body = Map.of(
            "totalRevenue", 0,
            "revenueTrend", 0,
            "invoiceCount", 0,
            "overdueCount", 0,
            "totalExpenses", 0,
            "memberCount", 0,
            "activeDomainsCount", 0
        );
        return ResponseEntity.ok(body);
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<Map<String, Object>> getRevenueTrend() {
        List<String> labels = List.of("Jan", "Feb", "Mar", "Apr", "May", "Jun");
        List<Map<String, Object>> datasets = List.of(
            Map.<String, Object>of("label", "Revenue", "data", List.of(0, 0, 0, 0, 0, 0))
        );
        return ResponseEntity.ok(Map.of("labels", labels, "datasets", datasets));
    }

    @GetMapping("/expense-breakdown")
    public ResponseEntity<Map<String, Object>> getExpenseBreakdown() {
        List<String> labels = List.of("Category A", "Category B", "Category C");
        List<Map<String, Object>> datasets = List.of(
            Map.<String, Object>of("label", "Expenses", "data", List.of(0, 0, 0))
        );
        return ResponseEntity.ok(Map.of("labels", labels, "datasets", datasets));
    }

    @GetMapping("/recent-invoices")
    public ResponseEntity<Map<String, Object>> getRecentInvoices(
            @RequestParam(defaultValue = "5") int size) {
        // Stub: when finance domain exists, return recent invoices for activated tenant.
        return ResponseEntity.ok(Map.of("items", List.of()));
    }
}
