package com.blanner.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(
            Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(5, TimeUnit.MINUTES) // Default for autocomplete
        );
        
        // Configure specific cache for place details (24 hours)
        cacheManager.registerCustomCache("placeDetails", 
            Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(24, TimeUnit.HOURS)
                .build()
        );
        
        // Configure cache for autocomplete (5 minutes)
        cacheManager.registerCustomCache("placeAutocomplete",
            Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .build()
        );
        
        return cacheManager;
    }
}

