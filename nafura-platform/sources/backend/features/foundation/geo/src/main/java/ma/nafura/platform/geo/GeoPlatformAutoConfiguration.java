package ma.nafura.platform.geo;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.geo.district.ClasspathGeoDistrictCatalog;
import ma.nafura.platform.geo.district.DistrictResolver;
import ma.nafura.platform.geo.district.JtsDistrictResolver;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
public class GeoPlatformAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    ClasspathGeoDistrictCatalog classpathGeoDistrictCatalog(ObjectMapper objectMapper) {
        return new ClasspathGeoDistrictCatalog(objectMapper);
    }

    @Bean
    @ConditionalOnMissingBean
    DistrictResolver districtResolver(ClasspathGeoDistrictCatalog catalog) {
        return new JtsDistrictResolver(catalog);
    }
}
