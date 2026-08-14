package ma.nafura.platform.ai.conversation.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
@ConditionalOnProperty(prefix = "nafura.ai.sql", name = "enabled", havingValue = "true")
public class AiReadOnlyDataSourceConfig {

    /**
     * When a second DataSource bean is registered, Boot auto-config backs off.
     * JPA must keep using the main writable datasource — not the AI read-only pool.
     */
    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder()
            .type(HikariDataSource.class)
            .build();
    }

    @Bean(name = "aiReadOnlyDataSource")
    public DataSource aiReadOnlyDataSource(SqlQueryConfig config) {
        SqlQueryConfig.ReadOnlyDatasource ds = config.getReadOnlyDatasource();
        String url = ds.getUrl();
        if (url == null || url.isBlank()) {
            throw new IllegalStateException("nafura.ai.sql.enabled is true but nafura.ai.sql.read-only-datasource.url is not set. Set it to the same DB URL (e.g. ${spring.datasource.url}) with user nafura_ai_reader.");
        }
        HikariConfig hikari = new HikariConfig();
        hikari.setJdbcUrl(url);
        hikari.setUsername(ds.getUsername());
        hikari.setPassword(ds.getPassword());
        hikari.setMaximumPoolSize(ds.getMaximumPoolSize());
        hikari.setConnectionTimeout(ds.getConnectionTimeout());
        hikari.setReadOnly(true);
        return new HikariDataSource(hikari);
    }

    @Bean(name = "aiReadOnlyJdbcTemplate")
    public JdbcTemplate aiReadOnlyJdbcTemplate(
        @Qualifier("aiReadOnlyDataSource") DataSource dataSource,
        SqlQueryConfig config
    ) {
        JdbcTemplate template = new JdbcTemplate(dataSource);
        template.setQueryTimeout(config.getTimeoutSeconds());
        return template;
    }
}
