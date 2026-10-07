package ma.nafura.lab;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

/** PostgreSQL for the lab without Docker or installs. Data survives restarts under {@code nafura.lab.data-dir}. */
@AutoConfiguration(before = DataSourceAutoConfiguration.class)
@ConditionalOnProperty(name = {"nafura.lab.enabled", "nafura.lab.embedded-postgres"}, havingValue = "true")
public class NafuraLabEmbeddedPostgresAutoConfiguration {

    @Bean(destroyMethod = "close")
    EmbeddedPostgres labEmbeddedPostgres(Environment environment) throws IOException {
        Path dataDir = Path.of(environment.getProperty("nafura.lab.data-dir", "./data/postgres")).toAbsolutePath();
        Files.createDirectories(dataDir);
        return EmbeddedPostgres.builder()
                .setDataDirectory(dataDir)
                .setCleanDataDirectory(false)
                .setPort(environment.getProperty("nafura.lab.postgres-port", Integer.class, 0))
                // A postmaster from a just-stopped run can still hold the data directory lock.
                .setPGStartupWait(environment.getProperty("nafura.lab.postgres-startup-wait", Duration.class, Duration.ofSeconds(60)))
                .setRegisterShutdownHook(true)
                .start();
    }

    /** Pooled: the embedded datasource opens a connection per call, and a PostgreSQL connection is a process on Windows. */
    @Bean(destroyMethod = "close")
    DataSource dataSource(EmbeddedPostgres labEmbeddedPostgres) {
        HikariConfig config = new HikariConfig();
        config.setDataSource(labEmbeddedPostgres.getPostgresDatabase());
        config.setPoolName("lab");
        config.setMaximumPoolSize(10);
        return new HikariDataSource(config);
    }
}
