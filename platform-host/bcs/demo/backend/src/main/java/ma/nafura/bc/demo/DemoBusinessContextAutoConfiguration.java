package ma.nafura.bc.demo;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/** The host composes the business context without code: this registers its beans, entities and repositories. */
@AutoConfiguration
@ComponentScan
@EntityScan
@EnableJpaRepositories
public class DemoBusinessContextAutoConfiguration {
}
