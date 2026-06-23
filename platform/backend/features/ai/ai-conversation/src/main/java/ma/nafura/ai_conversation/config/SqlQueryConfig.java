package ma.nafura.platform.ai.conversation.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "nafura.ai.sql")
public class SqlQueryConfig {
    private boolean enabled = true;
    private int maxRows = 100;
    private int timeoutSeconds = 5;
    private int maxSqlLength = 5000;
    private String schemaPath;
    private ReadOnlyDatasource readOnlyDatasource = new ReadOnlyDatasource();

    @Data
    public static class ReadOnlyDatasource {
        private String url;
        private String username = "nafura_ai_reader";
        private String password = "changeme";
        private int maximumPoolSize = 3;
        private long connectionTimeout = 5000;
    }
}
