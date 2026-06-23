package ma.nafura.platform.authorization.security.config;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.PublicEndpointRegistry;
import ma.nafura.platform.authorization.security.properties.SecurityProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Centralized Spring Security configuration.
 * 
 * <p>Features:
 * <ul>
 *   <li>OAuth2 Resource Server with JWT validation</li>
 *   <li>Stateless session management</li>
 *   <li>CSRF disabled for API usage</li>
 *   <li>Configurable CORS</li>
 *   <li>Configurable public endpoints</li>
 * </ul>
 * 
 * @see SecurityProperties for configuration options
 */
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final SecurityProperties securityProperties;
    private final PublicEndpointRegistry publicEndpointRegistry;

    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        return new SkipBearerWhenAuthenticatedResolver(
            new PublicAwareBearerTokenResolver(publicEndpointRegistry, securityProperties)
        );
    }
    
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            BearerTokenResolver bearerTokenResolver,
            @Qualifier("jwtDecoder") JwtDecoder jwtDecoder,
            @Autowired(required = false) @Qualifier("devOnboardingJwtFilter") OncePerRequestFilter devOnboardingJwtFilter
    ) throws Exception {
        if (devOnboardingJwtFilter != null) {
            http.addFilterBefore(devOnboardingJwtFilter, BearerTokenAuthenticationFilter.class);
        }

        http
            // Enable CORS with our configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Disable CSRF for API
            .csrf(csrf -> csrf.disable())
            
            // Stateless session
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Authorization rules
            .authorizeHttpRequests(auth -> {
                // Public endpoints declared in controllers via @PublicEndpoint
                for (PublicEndpointRegistry.PublicEndpointRule rule : publicEndpointRegistry.getRules()) {
                    if (rule.httpMethods().isEmpty()) {
                        for (String pattern : rule.patterns()) {
                            auth.requestMatchers(pattern).permitAll();
                        }
                    } else {
                        for (HttpMethod method : rule.httpMethods()) {
                            for (String pattern : rule.patterns()) {
                                auth.requestMatchers(method, pattern).permitAll();
                            }
                        }
                    }
                }

                // Configure public endpoints from properties
                for (String endpoint : securityProperties.getPublicEndpoints()) {
                    auth.requestMatchers(endpoint).permitAll();
                }
                // All other endpoints require authentication
                auth.anyRequest().authenticated();
            })
            
            // OAuth2 Resource Server (Keycloak + optional app onboarding HS256 decoder)
            .oauth2ResourceServer(oauth2 -> oauth2
                .bearerTokenResolver(bearerTokenResolver)
                .jwt(jwt -> jwt.decoder(jwtDecoder))
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        SecurityProperties.CorsProperties corsProps = securityProperties.getCors();
        
        CorsConfiguration config = new CorsConfiguration();
        
        // Allow credentials
        config.setAllowCredentials(corsProps.isAllowCredentials());
        
        // Allow specific origins (frontend) - using patterns for better compatibility with credentials
        config.setAllowedOriginPatterns(corsProps.getAllowedOriginPatterns());
        
        // Allow all headers
        config.setAllowedHeaders(corsProps.getAllowedHeaders());
        
        // Allow HTTP methods
        config.setAllowedMethods(corsProps.getAllowedMethods());
        
        // Expose headers that the frontend might need
        config.setExposedHeaders(corsProps.getExposedHeaders());
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return source;
    }
}

