package ma.nafura.platform.documents.docextractor.plan;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PlanConfig {

    @Bean
    public PlanValidator planValidator() {
        return new PlanValidator();
    }

    @Bean
    public GridProbe gridProbe() {
        return new GridProbe();
    }

    @Bean
    public GridPlanExecutor gridPlanExecutor(com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        return new GridPlanExecutor(objectMapper);
    }
}
