package ma.nafura.usageops.federation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "usage-ops")
public class UsageOpsProperties {

    private List<ProductSource> products = new ArrayList<>();
    private AlertProperties alert = new AlertProperties();

    public List<ProductSource> getProducts() {
        return products;
    }

    public void setProducts(List<ProductSource> products) {
        this.products = products;
    }

    public AlertProperties getAlert() {
        return alert;
    }

    public void setAlert(AlertProperties alert) {
        this.alert = alert;
    }

    public static class ProductSource {
        private String id;
        private String baseUrl;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }
    }

    public static class AlertProperties {
        private String recipients = "";
        private String cron = "0 0 * * * *";

        public String getRecipients() {
            return recipients;
        }

        public void setRecipients(String recipients) {
            this.recipients = recipients;
        }

        public String getCron() {
            return cron;
        }

        public void setCron(String cron) {
            this.cron = cron;
        }
    }
}
