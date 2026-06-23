package ma.nafura.platform.authorization.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Cache configuration for authorization.
 */
@Configuration
@EnableCaching
public class CacheConfig {
    
    /**
     * Configure cache manager for role permissions.
     */
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        cacheManager.setCacheNames(List.of("rolePermissions"));
        return cacheManager;
    }
}



